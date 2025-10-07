"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Tag, DollarSign, TrendingUp, TrendingDown, Plus, Trash2 } from "lucide-react";

interface Category {
  id: number;
  name: string;
  type: string;
  monthlyTarget: number | null;
  createdAt: string;
  updatedAt: string;
}

export default function CategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "expense",
    monthlyTarget: "",
  });
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      const data = await response.json();
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setFetchLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: "success", text: "Category created successfully!" });
        setFormData({ name: "", type: "expense", monthlyTarget: "" });
        setShowForm(false);
        fetchCategories(); // Refresh the list
      } else {
        setMessage({ type: "error", text: data.error || "Failed to create category" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "An error occurred. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const incomeCategories = categories.filter(cat => cat.type === "income");
  const expenseCategories = categories.filter(cat => cat.type === "expense");

  return (
    <div className="min-h-screen p-4 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Manage Categories
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Organize your income and expenses with custom categories.
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {/* Add Category Form */}
      {showForm && (
        <div className="mb-8">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Add New Category
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Type Selector */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Type *
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, type: "income" }))}
                    className={`p-4 flex items-center justify-center space-x-3 rounded-lg border-2 transition-all ${
                      formData.type === "income"
                        ? "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                        : "border-gray-300 dark:border-gray-700 hover:border-green-400 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    <TrendingUp className="w-5 h-5" />
                    <span className="font-semibold">Income</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, type: "expense" }))}
                    className={`p-4 flex items-center justify-center space-x-3 rounded-lg border-2 transition-all ${
                      formData.type === "expense"
                        ? "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
                        : "border-gray-300 dark:border-gray-700 hover:border-red-400 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    <TrendingDown className="w-5 h-5" />
                    <span className="font-semibold">Expense</span>
                  </button>
                </div>
              </div>

              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Category Name *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Tag className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="e.g., Groceries, Salary, Rent"
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400"
                  />
                </div>
              </div>

              {/* Monthly Target */}
              <div>
                <label htmlFor="monthlyTarget" className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Monthly Target (Optional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <DollarSign className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    id="monthlyTarget"
                    name="monthlyTarget"
                    value={formData.monthlyTarget}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400"
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Set a monthly budget target for this category
                </p>
              </div>

              {/* Message */}
              {message && (
                <div
                  className={`p-4 rounded-lg ${
                    message.type === "success"
                      ? "bg-green-100 dark:bg-green-900/30 border border-green-500 text-green-700 dark:text-green-300"
                      : "bg-red-100 dark:bg-red-900/30 border border-red-500 text-red-700 dark:text-red-300"
                  }`}
                >
                  {message.text}
                </div>
              )}

              {/* Form Actions */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setFormData({ name: "", type: "expense", monthlyTarget: "" });
                    setMessage(null);
                  }}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 px-6 py-3 font-semibold rounded-lg transition-all shadow-lg ${
                    loading
                      ? "bg-gray-400 cursor-not-allowed"
                      : formData.type === "income"
                      ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                      : "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700"
                  } text-white`}
                >
                  {loading ? "Creating..." : `Create ${formData.type === "income" ? "Income" : "Expense"} Category`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Categories List */}
      {fetchLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Income Categories */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800 bg-green-50 dark:bg-green-900/20">
              <h2 className="text-xl font-bold text-green-800 dark:text-green-300 flex items-center space-x-2">
                <TrendingUp className="w-6 h-6" />
                <span>Income Categories ({incomeCategories.length})</span>
              </h2>
            </div>
            <div className="p-6">
              {incomeCategories.length > 0 ? (
                <div className="space-y-3">
                  {incomeCategories.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
                    >
                      <div>
                        <h3 className="font-semibold text-green-800 dark:text-green-300">
                          {category.name}
                        </h3>
                        {category.monthlyTarget && (
                          <p className="text-sm text-green-600 dark:text-green-400">
                            Target: ${category.monthlyTarget.toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No income categories yet
                </p>
              )}
            </div>
          </div>

          {/* Expense Categories */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800 bg-red-50 dark:bg-red-900/20">
              <h2 className="text-xl font-bold text-red-800 dark:text-red-300 flex items-center space-x-2">
                <TrendingDown className="w-6 h-6" />
                <span>Expense Categories ({expenseCategories.length})</span>
              </h2>
            </div>
            <div className="p-6">
              {expenseCategories.length > 0 ? (
                <div className="space-y-3">
                  {expenseCategories.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
                    >
                      <div>
                        <h3 className="font-semibold text-red-800 dark:text-red-300">
                          {category.name}
                        </h3>
                        {category.monthlyTarget && (
                          <p className="text-sm text-red-600 dark:text-red-400">
                            Target: ${category.monthlyTarget.toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No expense categories yet
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Helper Card */}
      <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
          💡 Category Tips
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
          <li>• Create specific categories for better expense tracking</li>
          <li>• Set monthly targets to help with budgeting</li>
          <li>• Use clear, descriptive names (e.g., "Coffee & Snacks" vs "Food")</li>
          <li>• Categories are used when creating transactions</li>
        </ul>
      </div>
    </div>
  );
}

