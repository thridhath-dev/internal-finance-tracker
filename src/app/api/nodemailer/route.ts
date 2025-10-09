import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { addDays, startOfDay, endOfDay, startOfMonth, endOfMonth, format, isAfter, isBefore } from "date-fns";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const {
  SMTP_HOST = "smtp.gmail.com",
  SMTP_PORT = "587",
  SMTP_USER = "thridhath@wigoh.ai",
  SMTP_PASS = "cslfotlzajgpotrc",
  MAIL_FROM = 'Alert Email <thridhath@wigoh.ai>',
  MAIL_TO = 'gpthridhath@gmail.com',
  REVENUE_GOAL_MONTH = "0",
  REVENUE_ALERT_THRESHOLD = "0.8",
} = process.env;

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS
  }
});

type FinanceSnapshot = {
  recentExpenses: Array<{
    id: number;
    amount: number;
    date: string;
    category: string;
    description: string;
    isPaid: boolean;
  }>;
  dueExpenses: Array<{
    id: number;
    amount: number;
    date: string;
    category: string;
    description: string;
    daysUntilDue: number;
    isPaid: boolean;
  }>;
  recurringEntries: Array<{
    id: number;
    type: string;
    amount: number;
    category: string;
    description: string;
    recurrence: string | null;
    isPaid: boolean;
    nextDue?: string;
  }>;
  unpaidTransactions: Array<{
    id: number;
    amount: number;
    date: string;
    category: string;
    description: string;
    type: string;
    daysOverdue: number;
  }>;
  overdueExpenses: Array<{
    id: number;
    amount: number;
    category: string;
    description: string;
    date: string;
    isPaid: boolean;
  }>;
  categoryBreaches: Array<{
    category: string;
    spent: number;
    target: number;
    percent: number;
  }>;
  revenue: {
    monthGoal: number;
    monthActual: number;
    belowThreshold: boolean;
    thresholdPct: number;
  };
};

/** Format INR; change currency if needed */
function currency(n: number | string): string {
  const val = typeof n === "string" ? Number(n) : n;
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val || 0);
}

async function buildSnapshot(): Promise<FinanceSnapshot> {
  const now = new Date();
  const startMonth = startOfMonth(now);
  const endMonth = endOfMonth(now);
  const threeDaysAgo = addDays(startOfDay(now), -3);
  const sevenDaysAgo = addDays(startOfDay(now), -7);
  const threeDaysFromNow = addDays(endOfDay(now), 3);

  // 1) Recent expenses (last 3 days)
  const recentExpensesRaw = await prisma.transaction.findMany({
    where: {
      type: "expense",
      date: { gte: threeDaysAgo, lte: endOfDay(now) },
    },
    include: { category: true },
    orderBy: [{ date: "desc" }],
  });

  const recentExpenses = recentExpensesRaw.map(tx => ({
    id: tx.id,
    amount: Number(tx.amount),
    date: format(tx.date, "dd MMM yyyy"),
    category: tx.category?.name ?? "Uncategorized",
    description: tx.description ?? "",
    isPaid: tx.isPaid,
  }));

  // 2) Due expenses (next 3 days) - expenses that are due soon
  const dueExpensesRaw = await prisma.transaction.findMany({
    where: {
      type: "expense",
      date: { gte: startOfDay(now), lte: threeDaysFromNow },
      isPaid: false,
    },
    include: { category: true },
    orderBy: [{ date: "asc" }],
  });

  const dueExpenses = dueExpensesRaw.map(tx => {
    const txDate = startOfDay(tx.date);
    const today = startOfDay(now);
    const daysUntilDue = Math.ceil((txDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      id: tx.id,
      amount: Number(tx.amount),
      date: format(tx.date, "dd MMM yyyy"),
      category: tx.category?.name ?? "Uncategorized",
      description: tx.description ?? "",
      daysUntilDue,
      isPaid: tx.isPaid,
    };
  });

  // 3) Recurring entries (this month) with enhanced highlighting
  const recurringRaw = await prisma.transaction.findMany({
    where: { 
      recurrence: { not: null },
      date: { gte: startMonth, lte: endMonth } 
    },
    include: { category: true },
    orderBy: [{ date: "desc" }],
  });

  const recurringEntries = recurringRaw.map(tx => {
    let nextDue: string | undefined;
    
    // Calculate next due date based on recurrence
    if (tx.recurrence === "weekly") {
      nextDue = format(addDays(tx.date, 7), "dd MMM yyyy");
    } else if (tx.recurrence === "monthly") {
      nextDue = format(addDays(tx.date, 30), "dd MMM yyyy");
    } else if (tx.recurrence === "yearly") {
      nextDue = format(addDays(tx.date, 365), "dd MMM yyyy");
    }

    return {
      id: tx.id,
      type: tx.type,
      amount: Number(tx.amount),
      category: tx.category?.name ?? "Uncategorized",
      description: tx.description ?? "",
      recurrence: tx.recurrence,
      isPaid: tx.isPaid,
      nextDue,
    };
  });

  // 4) Unpaid transactions (transactions marked as not paid)
  const unpaidTransactionsRaw = await prisma.transaction.findMany({
    where: {
      isPaid: false,
      date: { lte: endOfDay(now) },
    },
    include: { category: true },
    orderBy: [{ date: "asc" }],
  });

  const unpaidTransactions = unpaidTransactionsRaw.map(tx => {
    const txDate = startOfDay(tx.date);
    const today = startOfDay(now);
    const daysOverdue = Math.ceil((today.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      id: tx.id,
      amount: Number(tx.amount),
      date: format(tx.date, "dd MMM yyyy"),
      category: tx.category?.name ?? "Uncategorized",
      description: tx.description ?? "",
      type: tx.type,
      daysOverdue: Math.max(0, daysOverdue),
    };
  });

  // 5) Overdue expenses (older than 7 days)
  const overdueExpensesRaw = await prisma.transaction.findMany({
    where: {
      type: "expense",
      date: { lte: sevenDaysAgo },
      isPaid: false,
    },
    include: { category: true },
    orderBy: [{ date: "asc" }],
  });

  const overdueExpenses = overdueExpensesRaw.map(tx => ({
    id: tx.id,
    amount: Number(tx.amount),
    category: tx.category?.name ?? "Uncategorized",
    description: tx.description ?? "",
    date: format(tx.date, "dd MMM yyyy"),
    isPaid: tx.isPaid,
  }));

  // 6) Category budget breaches (Month-to-date)
  const categories = await prisma.category.findMany({
    include: {
      transactions: {
        where: { type: "expense", date: { gte: startMonth, lte: endMonth } },
      },
    },
  });

  const categoryBreaches = categories
    .map(cat => {
      const spent = cat.transactions.reduce((sum: number, t) => sum + Number(t.amount), 0);
      const target = cat.monthlyTarget ? Number(cat.monthlyTarget) : 0;
      const percent = target > 0 ? (spent / target) * 100 : 0;
      return { category: cat.name, spent, target, percent };
    })
    .filter(c => c.target > 0 && c.spent > c.target)
    .sort((a, b) => b.percent - a.percent);

  // 7) Revenue threshold (Month-to-date)
  const revenueGoal = Number(REVENUE_GOAL_MONTH || 0);
  const thresholdPct = Number(REVENUE_ALERT_THRESHOLD || 0.8);

  const revenueTx = await prisma.transaction.findMany({
    where: { type: "revenue", date: { gte: startMonth, lte: endMonth } },
  });

  const revenueActual = revenueTx.reduce((sum: number, t) => sum + Number(t.amount), 0);
  const revenueBelow = revenueGoal > 0 ? revenueActual < revenueGoal * thresholdPct : false;

  return {
    recentExpenses,
    dueExpenses,
    recurringEntries,
    unpaidTransactions,
    overdueExpenses,
    categoryBreaches,
    revenue: {
      monthGoal: revenueGoal,
      monthActual: revenueActual,
      belowThreshold: revenueBelow,
      thresholdPct,
    },
  };
}

function buildEmailHTML(s: FinanceSnapshot): string {
  const li = (arr: string[]): string =>
    arr.length
      ? arr.map(x => `<li>${x}</li>`).join("")
      : "<li>None</li>";

  const recent = li(
    s.recentExpenses.map(d => {
      const status = d.isPaid ? "✅ Paid" : "❌ Unpaid";
      return `#${d.id} — ${d.category} — ${currency(d.amount)} — ${d.date} — ${status}${d.description ? ` — ${d.description}` : ""}`;
    })
  );

  const due = li(
    s.dueExpenses.map(d => {
      const urgency = d.daysUntilDue === 0 ? "🔴 TODAY" : d.daysUntilDue === 1 ? "🟡 Tomorrow" : `⏰ ${d.daysUntilDue} days`;
      const status = d.isPaid ? "✅ Paid" : "❌ Unpaid";
      return `#${d.id} — ${d.category} — ${currency(d.amount)} — ${d.date} — ${urgency} — ${status}${d.description ? ` — ${d.description}` : ""}`;
    })
  );

  const rec = li(
    s.recurringEntries.map(r => {
      const status = r.isPaid ? "✅ Paid" : "❌ Unpaid";
      const nextDue = r.nextDue ? ` (Next: ${r.nextDue})` : "";
      return `#${r.id} [${r.type}] — ${r.category} — ${currency(r.amount)} (${r.recurrence})${nextDue} — ${status}${r.description ? ` — ${r.description}` : ""}`;
    })
  );

  const unpaid = li(
    s.unpaidTransactions.map(u => {
      const overdue = u.daysOverdue > 0 ? ` — ${u.daysOverdue} days overdue` : "";
      return `#${u.id} [${u.type}] — ${u.category} — ${currency(u.amount)} — ${u.date}${overdue}${u.description ? ` — ${u.description}` : ""}`;
    })
  );

  const overdue = li(
    s.overdueExpenses.map(u => `#${u.id} — ${u.category} — ${currency(u.amount)} — ${u.date} — ❌ Unpaid${u.description ? ` — ${u.description}` : ""}`)
  );

  const breaches = li(
    s.categoryBreaches.map(b => `${b.category}: Spent ${currency(b.spent)} / Target ${currency(b.target)} (${b.percent.toFixed(0)}%)`)
  );

  const revBlock = `
    <p><strong>Revenue MTD:</strong> ${currency(s.revenue.monthActual)} / Goal ${currency(s.revenue.monthGoal)}
    ${s.revenue.monthGoal ? ` (${((s.revenue.monthActual / s.revenue.monthGoal) * 100).toFixed(0)}%)` : ""}</p>
    ${s.revenue.belowThreshold ? `<p style="color:#b91c1c;"><strong>Alert:</strong> Revenue is below ${(s.revenue.thresholdPct * 100).toFixed(0)}% of goal.</p>` : ""}
  `;

  // Calculate summary stats
  const totalUnpaid = s.unpaidTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalDue = s.dueExpenses.reduce((sum, t) => sum + t.amount, 0);
  const totalOverdue = s.overdueExpenses.reduce((sum, t) => sum + t.amount, 0);

  const summaryBlock = `
    <div style="background:#f3f4f6;padding:15px;border-radius:8px;margin:15px 0;">
      <h4 style="margin:0 0 10px 0;color:#374151;">📊 Quick Summary</h4>
      <p style="margin:5px 0;"><strong>Total Unpaid:</strong> ${currency(totalUnpaid)} (${s.unpaidTransactions.length} transactions)</p>
      <p style="margin:5px 0;"><strong>Due Soon:</strong> ${currency(totalDue)} (${s.dueExpenses.length} transactions)</p>
      <p style="margin:5px 0;"><strong>Overdue:</strong> ${currency(totalOverdue)} (${s.overdueExpenses.length} transactions)</p>
    </div>
  `;

  return `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;line-height:1.5;">
    <h2>📧 Daily Finance Summary — ${format(new Date(), "dd MMM yyyy")}</h2>
    
    ${summaryBlock}
    
    <h3>🚨 Due Expenses (Next 3 Days)</h3>
    <ul>${due}</ul>
    
    <h3>💳 Recent Expenses (Last 3 Days)</h3>
    <ul>${recent}</ul>
    
    <h3>🔄 Recurring Entries (This Month)</h3>
    <ul>${rec}</ul>
    
    <h3>⚠️ Unpaid Transactions Alert</h3>
    <ul>${unpaid}</ul>
    
    <h3>📅 Overdue Expenses (Older than 7 days)</h3>
    <ul>${overdue}</ul>
    
    <h3>💰 Budget/Target Breaches (Month-to-date)</h3>
    <ul>${breaches}</ul>
    
    <h3>📈 Revenue Check</h3>
    ${revBlock}
    
    <hr style="margin:20px 0;" />
    <p style="color:#6b7280;font-size:14px;">— Auto-generated by Finance Bot • Windows Cron Job</p>
  </div>`;
}

async function sendEmail(html: string): Promise<void> {
  try {
    // Verify connection first
    console.log("Verifying SMTP connection...");
    await transporter.verify();
    console.log("SMTP connection verified successfully");
    
    const info = await transporter.sendMail({
      from: MAIL_FROM,
      to: MAIL_TO,
      subject: `Finance Summary — ${format(new Date(), "dd MMM yyyy")}`,
      html,
    });
    console.log("Email sent successfully:", info.messageId);
    console.log("Email sent to:", MAIL_TO);
  } catch (error) {
    console.error("Email sending failed:", error);
    console.error("SMTP Config:", {
      host: SMTP_HOST,
      port: SMTP_PORT,
      user: SMTP_USER,
      from: MAIL_FROM,
      to: MAIL_TO
    });
    throw error;
  }
}

export async function runFinanceReport(): Promise<{ success: boolean; message: string; data?: any }> {
  try {
    const snapshot = await buildSnapshot();

    // Always send the report, but with different messaging based on content
    const hasAlerts = 
      snapshot.dueExpenses.length ||
      snapshot.unpaidTransactions.length ||
      snapshot.overdueExpenses.length ||
      snapshot.categoryBreaches.length ||
      snapshot.revenue.belowThreshold;

    const html = buildEmailHTML(snapshot);

    await sendEmail(html);

    const message = hasAlerts 
      ? `Finance report sent with ${snapshot.dueExpenses.length + snapshot.unpaidTransactions.length + snapshot.overdueExpenses.length} alerts`
      : "Finance report sent - no urgent alerts";

    return {
      success: true,
      message,
      data: {
        dueExpenses: snapshot.dueExpenses.length,
        unpaidTransactions: snapshot.unpaidTransactions.length,
        overdueExpenses: snapshot.overdueExpenses.length,
        categoryBreaches: snapshot.categoryBreaches.length,
        hasRevenueAlert: snapshot.revenue.belowThreshold,
      }
    };
  } catch (e) {
    console.error("Finance report error:", e);
    return {
      success: false,
      message: `Error generating finance report: ${e instanceof Error ? e.message : 'Unknown error'}`
    };
  }
}

// API Route Handler
export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    
    if (action === "send-report") {
      const result = await runFinanceReport();
      return NextResponse.json(result);
    }
    
    return NextResponse.json(
      { success: false, message: "Invalid action. Use 'send-report'" },
      { status: 400 }
    );
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const testMode = url.searchParams.get('test') === 'true';
  
  if (testMode) {
    // Test mode - build snapshot but don't send email
    try {
      const snapshot = await buildSnapshot();
      const hasAlerts = 
        snapshot.dueExpenses.length ||
        snapshot.unpaidTransactions.length ||
        snapshot.overdueExpenses.length ||
        snapshot.categoryBreaches.length ||
        snapshot.revenue.belowThreshold;

      return NextResponse.json({
        success: true,
        message: "Test mode - no email sent",
        data: {
          dueExpenses: snapshot.dueExpenses.length,
          unpaidTransactions: snapshot.unpaidTransactions.length,
          overdueExpenses: snapshot.overdueExpenses.length,
          categoryBreaches: snapshot.categoryBreaches.length,
          hasRevenueAlert: snapshot.revenue.belowThreshold,
          hasAlerts,
          snapshot: {
            recentExpenses: snapshot.recentExpenses.slice(0, 3), // Show first 3 for testing
            dueExpenses: snapshot.dueExpenses.slice(0, 3),
            recurringEntries: snapshot.recurringEntries.slice(0, 3),
            unpaidTransactions: snapshot.unpaidTransactions.slice(0, 3),
          }
        }
      });
    } catch (error) {
      return NextResponse.json({
        success: false,
        message: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }, { status: 500 });
    }
  }
  
  // Normal mode - trigger the report and send email
  const result = await runFinanceReport();
  return NextResponse.json(result);
}