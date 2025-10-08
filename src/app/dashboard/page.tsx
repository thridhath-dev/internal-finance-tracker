"use client";

import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Wallet, PieChart, DollarSign, Calendar } from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend,
  ArcElement
);

export default function DashboardPage() {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard summary data
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/dashboard/summary');
        
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        
        const data = await response.json();
        setSummary(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching dashboard summary:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  if (loading) {
    return (
      <div className="p-4 lg:p-8 flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 lg:p-8 flex items-center justify-center h-full">
        <div className="text-center">
          <div className="mx-auto w-24 h-24 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-4">
            <TrendingDown className="w-12 h-12 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Error Loading Dashboard
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="p-4 lg:p-8 flex items-center justify-center h-full">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Data Available
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Add some transactions to see your dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 flex flex-col h-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Financial Dashboard 📊
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Here's your financial overview and analytics.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Net Profit Card */}
        <div className={`rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow ${
          summary.totals.netProfit >= 0 
            ? 'bg-gradient-to-br from-green-500 to-green-700' 
            : 'bg-gradient-to-br from-red-500 to-red-700'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
              <DollarSign className="w-6 h-6" />
            </div>
            <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">
              Net Profit
            </span>
          </div>
          <div>
            <p className="text-sm opacity-90 mb-1">Total Net Profit</p>
            <p className="text-3xl font-bold">
              ${summary.totals.netProfit.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Total Revenue Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-800 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-full">
              Revenue
            </span>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Total Revenue
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              ${summary.totals.totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Total Expenses Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-800 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <span className="text-xs font-medium text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-3 py-1 rounded-full">
              Expenses
            </span>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Total Expenses
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              ${summary.totals.totalExpenses.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Current Month Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-800 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded-full">
              This Month
            </span>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Month Profit
            </p>
            <p className={`text-2xl font-bold ${
              summary.currentMonth.profit >= 0 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
              ${summary.currentMonth.profit.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      {summary.monthlyData && summary.monthlyData.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Line Chart - Revenue vs Expenses */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Revenue vs Expenses Trend
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Monthly comparison over the last 6 months
              </p>
            </div>
            
            <div className="h-80">
              <Line
                data={{
                  labels: summary.monthlyData.map((item: any) => item.month),
                  datasets: [
                    {
                      label: 'Revenue',
                      data: summary.monthlyData.map((item: any) => item.revenue),
                      borderColor: '#10B981',
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      borderWidth: 2,
                      tension: 0.4,
                    },
                    {
                      label: 'Expenses',
                      data: summary.monthlyData.map((item: any) => item.expenses),
                      borderColor: '#EF4444',
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      borderWidth: 2,
                      tension: 0.4,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top' as const,
                    },
                    title: {
                      display: false,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: function(value) {
                          return '$' + value;
                        }
                      }
                    },
                  },
                }}
              />
            </div>
          </div>

          {/* Pie Chart - Category Breakdown */}
          {summary.categoryBreakdown?.expense && summary.categoryBreakdown.expense.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Category Breakdown
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Expense categories distribution
                </p>
              </div>
              
              <div className="h-80">
                <Pie
                  data={{
                    labels: summary.categoryBreakdown.expense.map((item: any) => item.name),
                    datasets: [
                      {
                        data: summary.categoryBreakdown.expense.map((item: any) => item.amount),
                        backgroundColor: summary.categoryBreakdown.expense.map((item: any) => item.color),
                        borderColor: summary.categoryBreakdown.expense.map((item: any) => item.color),
                        borderWidth: 2,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom' as const,
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context: any) {
                            const label = context.label || '';
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: $${value.toLocaleString()} (${percentage}%)`;
                          }
                        }
                      }
                    },
                  }}
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-8 mb-8">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <PieChart className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Charts Coming Soon
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Add more transactions to see your financial trends and category breakdowns.
            </p>
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden flex-1">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Recent Transactions
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Your latest financial activities
          </p>
        </div>

        {summary.totals.transactionCount > 0 ? (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-500 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div>
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">Total Revenue</p>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                      ${summary.totals.totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-red-500 rounded-lg">
                    <TrendingDown className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-red-800 dark:text-red-200">Total Expenses</p>
                    <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                      ${summary.totals.totalExpenses.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                </div>
              </div>

              <div className={`rounded-lg p-4 border ${
                summary.totals.netProfit >= 0 
                  ? 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800'
                  : 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800'
              }`}>
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    summary.totals.netProfit >= 0 ? 'bg-green-500' : 'bg-red-500'
                  }`}>
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${
                      summary.totals.netProfit >= 0 
                        ? 'text-green-800 dark:text-green-200' 
                        : 'text-red-800 dark:text-red-200'
                    }`}>Net Profit</p>
                    <p className={`text-2xl font-bold ${
                      summary.totals.netProfit >= 0 
                        ? 'text-green-900 dark:text-green-100' 
                        : 'text-red-900 dark:text-red-100'
                    }`}>
                      ${summary.totals.netProfit.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">This Month Summary</p>
                  <p className="text-lg text-blue-900 dark:text-blue-100">
                    Revenue: ${summary.currentMonth.revenue.toLocaleString("en-US", { minimumFractionDigits: 2 })} | 
                    Expenses: ${summary.currentMonth.expenses.toLocaleString("en-US", { minimumFractionDigits: 2 })} | 
                    Profit: <span className={`font-bold ${
                      summary.currentMonth.profit >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>${summary.currentMonth.profit.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
              <PieChart className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No transactions yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Start tracking your finances by adding your first transaction.
            </p>
            <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl">
              Add Transaction
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

