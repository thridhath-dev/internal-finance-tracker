"use client";

import { useState } from "react";
import { Mail, Send, Eye, CheckCircle, XCircle } from "lucide-react";

export default function TestEmailPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testEmail = async (sendActual = false) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const url = sendActual 
        ? '/api/nodemailer' 
        : '/api/nodemailer?test=true';
      
      const method = sendActual ? 'POST' : 'GET';
      const body = sendActual ? JSON.stringify({ action: 'send-report' }) : undefined;

      const response = await fetch(url, {
        method,
        headers: sendActual ? { 'Content-Type': 'application/json' } : undefined,
        body
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Email Testing Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Test your nodemailer configuration and view email content
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Test Mode Button */}
            <button
              onClick={() => testEmail(false)}
              disabled={loading}
              className="flex items-center space-x-3 p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Eye className="w-6 h-6 text-green-600 dark:text-green-400" />
              <div className="text-left">
                <h3 className="font-semibold text-green-900 dark:text-green-100">
                  Test Mode
                </h3>
                <p className="text-sm text-green-700 dark:text-green-300">
                  View email content without sending
                </p>
              </div>
            </button>

            {/* Send Email Button */}
            <button
              onClick={() => testEmail(true)}
              disabled={loading}
              className="flex items-center space-x-3 p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <div className="text-left">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                  Send Email
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Actually send the email to configured recipient
                </p>
              </div>
            </button>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                {result === null ? 'Testing email configuration...' : 'Sending email...'}
              </p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 mb-6">
              <div className="flex items-center space-x-3">
                <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                <div>
                  <h3 className="font-semibold text-red-900 dark:text-red-100">
                    Error
                  </h3>
                  <p className="text-red-700 dark:text-red-300">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Success State */}
          {result && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 mb-6">
              <div className="flex items-center space-x-3 mb-4">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                <div>
                  <h3 className="font-semibold text-green-900 dark:text-green-100">
                    Success!
                  </h3>
                  <p className="text-green-700 dark:text-green-300">{result.message}</p>
                </div>
              </div>

              {result.data && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Due Expenses</p>
                    <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                      {result.data.dueExpenses}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Unpaid Transactions</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {result.data.unpaidTransactions}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Overdue Expenses</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {result.data.overdueExpenses}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Budget Breaches</p>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {result.data.categoryBreaches}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Email Configuration Info */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              📧 Email Configuration
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600 dark:text-gray-400">SMTP Host:</p>
                <p className="font-mono text-gray-900 dark:text-white">smtp.gmail.com</p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">SMTP Port:</p>
                <p className="font-mono text-gray-900 dark:text-white">587</p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">From:</p>
                <p className="font-mono text-gray-900 dark:text-white">thridhath@wigoh.ai</p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">To:</p>
                <p className="font-mono text-gray-900 dark:text-white">gpthridhath@gmail.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
