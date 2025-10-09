import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      include: {
        transactions: {
          include: {
            category: true
          },
          orderBy: {
            date: 'desc'
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const currentDate = new Date();
    const currentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);

    // Get all categories with monthly targets
    const categories = await prisma.category.findMany();

    // Calculate alerts based on real data
    const alerts = {
      'upcoming-due': [],
      'budget-exceeded': [],
      'revenue-shortfall': []
    };

    // 1. Upcoming Due - Find unpaid recurring transactions due soon
    const upcomingDueTransactions = user.transactions.filter(transaction => 
      transaction.recurrence && 
      transaction.recurrence !== 'none' && 
      !transaction.isPaid &&
      transaction.type === 'expense'
    );

    upcomingDueTransactions.forEach(transaction => {
      const dueDate = getNextDueDate(transaction.date, transaction.recurrence);
      const daysUntilDue = Math.ceil((dueDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilDue <= 14 && daysUntilDue >= 0) { // Due within 14 days
        alerts['upcoming-due'].push({
          id: transaction.id,
          title: `${transaction.category.name} Payment Due`,
          description: `Your ${transaction.category.name} payment of $${transaction.amount.toFixed(2)} is due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}`,
          date: dueDate.toISOString().split('T')[0],
          amount: transaction.amount,
          type: transaction.category.name.toLowerCase(),
          priority: daysUntilDue <= 3 ? 'high' : daysUntilDue <= 7 ? 'medium' : 'low'
        });
      }
    });

    // 2. Budget Exceeded - Check if monthly spending exceeds category targets
    categories.forEach(category => {
      if (category.type === 'expense' && category.monthlyTarget) {
        const monthlySpending = user.transactions
          .filter(t => 
            t.categoryId === category.id && 
            t.type === 'expense' &&
            t.date >= currentMonth &&
            t.date < nextMonth
          )
          .reduce((sum, t) => sum + t.amount, 0);

        if (monthlySpending > category.monthlyTarget) {
          const excess = monthlySpending - category.monthlyTarget;
          alerts['budget-exceeded'].push({
            id: `budget-${category.id}`,
            title: `${category.name} Budget Exceeded`,
            description: `You've spent $${monthlySpending.toFixed(2)} this month, exceeding your $${category.monthlyTarget.toFixed(2)} budget by $${excess.toFixed(2)}`,
            date: currentDate.toISOString().split('T')[0],
            amount: excess,
            type: category.name.toLowerCase(),
            priority: excess > (category.monthlyTarget * 0.2) ? 'high' : 'medium'
          });
        }
      }
    });

    // 3. Revenue Shortfall - Compare actual vs expected income
    const incomeCategories = categories.filter(cat => cat.type === 'income');
    const monthlyIncome = user.transactions
      .filter(t => 
        t.type === 'income' &&
        t.date >= currentMonth &&
        t.date < nextMonth
      )
      .reduce((sum, t) => sum + t.amount, 0);

    // Calculate expected income based on recurring income transactions
    const recurringIncome = user.transactions.filter(t => 
      t.type === 'income' && 
      t.recurrence && 
      t.recurrence !== 'none'
    );

    let expectedIncome = 0;
    recurringIncome.forEach(transaction => {
      const monthlyAmount = getMonthlyAmount(transaction.amount, transaction.recurrence);
      expectedIncome += monthlyAmount;
    });

    // Add income target from categories if available
    const incomeTargets = incomeCategories
      .filter(cat => cat.monthlyTarget)
      .reduce((sum, cat) => sum + (cat.monthlyTarget || 0), 0);
    
    expectedIncome = Math.max(expectedIncome, incomeTargets);

    if (expectedIncome > 0 && monthlyIncome < expectedIncome) {
      const shortfall = expectedIncome - monthlyIncome;
      alerts['revenue-shortfall'].push({
        id: 'revenue-shortfall',
        title: 'Monthly Income Shortfall',
        description: `Your current month income is $${monthlyIncome.toFixed(2)}, $${shortfall.toFixed(2)} short of your expected $${expectedIncome.toFixed(2)}`,
        date: currentDate.toISOString().split('T')[0],
        amount: shortfall,
        type: 'income',
        priority: shortfall > (expectedIncome * 0.2) ? 'high' : 'medium'
      });
    }

    // Check if we should send email alerts
    const shouldSendEmail = process.env.AUTO_EMAIL_ALERTS === 'true';
    const hasUrgentAlerts = 
      alerts['upcoming-due'].some((alert: any) => alert.priority === 'high') ||
      alerts['budget-exceeded'].length > 0 ||
      alerts['revenue-shortfall'].length > 0;

    if (shouldSendEmail && hasUrgentAlerts) {
      try {
        // Import nodemailer functionality directly
        const { runFinanceReport } = await import('../nodemailer/route');
        
        // Send email notification for urgent alerts
        const emailResult = await runFinanceReport();
        
        console.log('Email alert sent for urgent alerts:', emailResult.success);
        if (!emailResult.success) {
          console.error('Email alert failed:', emailResult.message);
        }
      } catch (error) {
        console.error('Failed to send alert email:', error);
      }
    }

    return NextResponse.json(alerts);

  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to calculate next due date based on recurrence
function getNextDueDate(lastDate: Date, recurrence: string): Date {
  const date = new Date(lastDate);
  
  switch (recurrence) {
    case 'daily':
      date.setDate(date.getDate() + 1);
      break;
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'yearly':
      date.setFullYear(date.getFullYear() + 1);
      break;
    default:
      date.setDate(date.getDate() + 1);
  }
  
  return date;
}

// Helper function to convert any recurring amount to monthly equivalent
function getMonthlyAmount(amount: number, recurrence: string): number {
  switch (recurrence) {
    case 'daily':
      return amount * 30; // Approximate
    case 'weekly':
      return amount * 4.33; // Average weeks per month
    case 'monthly':
      return amount;
    case 'yearly':
      return amount / 12;
    default:
      return amount;
  }
}
