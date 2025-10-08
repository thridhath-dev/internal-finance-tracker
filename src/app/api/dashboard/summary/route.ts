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
    const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const lastMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);

    // Get all transactions
    const allTransactions = user.transactions;
    
    // Get current month transactions
    const currentMonthTransactions = allTransactions.filter(t => 
      t.date >= currentMonth && t.date < new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );

    // Get last 6 months for line chart data
    const sixMonthsAgo = new Date(currentDate.getFullYear(), currentDate.getMonth() - 5, 1);
    const monthlyData = [];
    
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 0);
      
      const monthTransactions = allTransactions.filter(t => 
        t.date >= monthStart && t.date <= monthEnd
      );
      
      const monthIncome = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const monthExpenses = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      monthlyData.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
        monthFull: monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        revenue: monthIncome,
        expenses: monthExpenses,
        profit: monthIncome - monthExpenses
      });
    }

    // Calculate totals
    const totalRevenue = allTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = allTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const netProfit = totalRevenue - totalExpenses;

    // Current month totals
    const currentMonthRevenue = currentMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const currentMonthExpenses = currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const currentMonthProfit = currentMonthRevenue - currentMonthExpenses;

    // Category-wise breakdown for pie chart
    const categoryBreakdown = [];
    const categoryMap = new Map();

    allTransactions.forEach(transaction => {
      const categoryName = transaction.category.name;
      const amount = transaction.amount;
      const type = transaction.type;

      if (!categoryMap.has(categoryName)) {
        categoryMap.set(categoryName, {
          name: categoryName,
          type: type,
          amount: 0,
          color: getCategoryColor(categoryName)
        });
      }

      categoryMap.get(categoryName).amount += amount;
    });

    // Convert to array and sort by amount
    categoryBreakdown.push(...categoryMap.values());
    categoryBreakdown.sort((a, b) => b.amount - a.amount);

    // Separate income and expense categories
    const incomeCategories = categoryBreakdown.filter(c => c.type === 'income');
    const expenseCategories = categoryBreakdown.filter(c => c.type === 'expense');

    // Get all categories for reference
    const allCategories = await prisma.category.findMany();

    const summary = {
      totals: {
        totalRevenue: totalRevenue || 0,
        totalExpenses: totalExpenses || 0,
        netProfit: netProfit || 0,
        transactionCount: allTransactions.length || 0
      },
      currentMonth: {
        revenue: currentMonthRevenue || 0,
        expenses: currentMonthExpenses || 0,
        profit: currentMonthProfit || 0,
        transactionCount: currentMonthTransactions.length || 0
      },
      monthlyData: monthlyData || [], // For line chart
      categoryBreakdown: {
        income: incomeCategories || [],
        expense: expenseCategories || [],
        all: categoryBreakdown || []
      },
      allCategories: allCategories || []
    };

    return NextResponse.json(summary);

  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to generate consistent colors for categories
function getCategoryColor(categoryName: string): string {
  const colors = [
    '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00',
    '#0088fe', '#00c49f', '#ffbb28', '#ff8042', '#8884d8',
    '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#0088fe',
    '#00c49f', '#ffbb28', '#ff8042'
  ];
  
  let hash = 0;
  for (let i = 0; i < categoryName.length; i++) {
    hash = categoryName.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}
