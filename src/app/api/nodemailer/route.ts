import cron from "node-cron";
import nodemailer from "nodemailer";
import { addDays, startOfDay, endOfDay, startOfMonth, endOfMonth, format } from "date-fns";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const {
  SMTP_HOST = "smtp.gmail.com",
  SMTP_PORT = "587",
  SMTP_USER = "thridhath@wigoh.ai",
  SMTP_PASS = "cslfotlzajgpotrc",
  MAIL_FROM = 'Finance Bot <thridhath@wigoh.ai>',
  MAIL_TO = 'gpthridhath@gmail.com',
  REVENUE_GOAL_MONTH = "0",
  REVENUE_ALERT_THRESHOLD = "0.8",
} = process.env;

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT),
  secure: false,
  auth: { user: SMTP_USER, pass: SMTP_PASS },
});

type FinanceSnapshot = {
  recentExpenses: Array<{
    id: number;
    amount: number;
    date: string;
    category: string;
    description: string;
  }>;
  recurringEntries: Array<{
    id: number;
    type: string;
    amount: number;
    category: string;
    description: string;
    recurrence: string | null;
  }>;
  overdueExpenses: Array<{
    id: number;
    amount: number;
    category: string;
    description: string;
    date: string;
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
  }));

  // 2) Recurring entries (this month)
  const recurringRaw = await prisma.transaction.findMany({
    where: { 
      recurrence: { not: null },
      date: { gte: startMonth, lte: endMonth } 
    },
    include: { category: true },
    orderBy: [{ date: "desc" }],
  });

  const recurringEntries = recurringRaw.map(tx => ({
    id: tx.id,
    type: tx.type,
    amount: Number(tx.amount),
    category: tx.category?.name ?? "Uncategorized",
    description: tx.description ?? "",
    recurrence: tx.recurrence,
  }));

  // 3) Overdue expenses (older than 7 days)
  const overdueExpensesRaw = await prisma.transaction.findMany({
    where: {
      type: "expense",
      date: { lte: sevenDaysAgo },
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
  }));

  // 4) Category budget breaches (Month-to-date)
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

  // 5) Revenue threshold (Month-to-date)
  const revenueGoal = Number(REVENUE_GOAL_MONTH || 0);
  const thresholdPct = Number(REVENUE_ALERT_THRESHOLD || 0.8);

  const revenueTx = await prisma.transaction.findMany({
    where: { type: "revenue", date: { gte: startMonth, lte: endMonth } },
  });

  const revenueActual = revenueTx.reduce((sum: number, t) => sum + Number(t.amount), 0);
  const revenueBelow = revenueGoal > 0 ? revenueActual < revenueGoal * thresholdPct : false;

  return {
    recentExpenses,
    recurringEntries,
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
    s.recentExpenses.map(d => `#${d.id} — ${d.category} — ${currency(d.amount)} — ${d.date}${d.description ? ` — ${d.description}` : ""}`)
  );

  const rec = li(
    s.recurringEntries.map(r => `#${r.id} [${r.type}] — ${r.category} — ${currency(r.amount)} (${r.recurrence})${r.description ? ` — ${r.description}` : ""}`)
  );

  const overdue = li(
    s.overdueExpenses.map(u => `#${u.id} — ${u.category} — ${currency(u.amount)} — ${u.date}${u.description ? ` — ${u.description}` : ""}`)
  );

  const breaches = li(
    s.categoryBreaches.map(b => `${b.category}: Spent ${currency(b.spent)} / Target ${currency(b.target)} (${b.percent.toFixed(0)}%)`)
  );

  const revBlock = `
    <p><strong>Revenue MTD:</strong> ${currency(s.revenue.monthActual)} / Goal ${currency(s.revenue.monthGoal)}
    ${s.revenue.monthGoal ? ` (${((s.revenue.monthActual / s.revenue.monthGoal) * 100).toFixed(0)}%)` : ""}</p>
    ${s.revenue.belowThreshold ? `<p style="color:#b91c1c;"><strong>Alert:</strong> Revenue is below ${(s.revenue.thresholdPct * 100).toFixed(0)}% of goal.</p>` : ""}
  `;

  return `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;line-height:1.5;">
    <h2>Daily Finance Summary</h2>
    <h3>Recent Expenses (last 3 days)</h3>
    <ul>${recent}</ul>
    <h3>Recurring Entries (this month)</h3>
    <ul>${rec}</ul>
    <h3>Overdue Expenses (older than 7 days)</h3>
    <ul>${overdue}</ul>
    <h3>Budget/Target Breaches (Month-to-date)</h3>
    <ul>${breaches}</ul>
    <h3>Revenue Check</h3>
    ${revBlock}
    <hr />
    <p>— Auto-generated by Finance Script</p>
  </div>`;
}

async function sendEmail(html: string): Promise<void> {
  const info = await transporter.sendMail({
    from: MAIL_FROM,
    to: MAIL_TO,
    subject: `Finance Summary — ${format(new Date(), "dd MMM yyyy")}`,
    html,
  });
  console.log("Email sent:", info.messageId);
}

async function runOnce(): Promise<void> {
  try {
    const snapshot = await buildSnapshot();

    // Only send if anything noteworthy
    const shouldSend =
      snapshot.recentExpenses.length ||
      snapshot.recurringEntries.length ||
      snapshot.overdueExpenses.length ||
      snapshot.categoryBreaches.length ||
      snapshot.revenue.belowThreshold;

    const html = buildEmailHTML(snapshot);

    if (shouldSend) {
      await sendEmail(html);
    } else {
      console.log("No alerts today — skipping email.");
    }
  } catch (e) {
    console.error("Finance script error:", e);
    throw e;
  }
}

// Schedule: every day at 09:00 Asia/Kolkata
cron.schedule("0 9 * * *", async () => {
  console.log("Running finance cron:", new Date().toISOString());
  try {
    await runOnce();
  } catch (e) {
    console.error("Cron error:", e);
  }
}, { timezone: "Asia/Kolkata" });

// If you run this file directly: run once then keep the cron alive
if (require.main === module) {
  runOnce().catch(console.error);
}