
import React, { useEffect, useState } from 'react';
import { useFamily, useAuth } from '../App';
import { supabaseService } from '../services/supabaseService';
import { Expense } from '../types';
import { Plus, DollarSign, TrendingUp, Calendar as CalendarIcon, Tag } from 'lucide-react';

export const Finance: React.FC = () => {
    const { activeFamily } = useFamily();
    const { user } = useAuth();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);

    // Form State
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('Groceries');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const categories = [
        'Groceries', 'Utilities', 'Education', 'Entertainment', 'Housing', 'Transport', 'Healthcare', 'Other'
    ];

    useEffect(() => {
        if (activeFamily) {
            loadExpenses();
        }
    }, [activeFamily]);

    const loadExpenses = async () => {
        try {
            setLoading(true);
            const data = await supabaseService.getExpenses(activeFamily!.id);
            setExpenses(data);
        } catch (err) {
            console.error('Failed to load expenses', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || !category || !activeFamily || !user) return;

        try {
            await supabaseService.createExpense(activeFamily.id, {
                amount: parseFloat(amount),
                category,
                description,
                date,
                paidBy: user.id
            });
            setShowAddModal(false);
            setAmount('');
            setDescription('');
            setDate(new Date().toISOString().split('T')[0]);
            loadExpenses();
        } catch (err) {
            console.error('Failed to create expense', err);
            alert('Failed to add expense');
        }
    };

    const totalSpent = expenses.reduce((sum, item) => sum + item.amount, 0);

    // Group by category
    // Group by category
    const byCategory = expenses.reduce<Record<string, number>>((acc, item) => {
        const cat = item.category;
        const current = acc[cat] || 0;
        acc[cat] = current + (Number(item.amount) || 0);
        return acc;
    }, {});

    return (
        <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Finance</h1>
                    <p className="text-slate-500 mt-1">Track your family expenses</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                >
                    <Plus className="w-5 h-5" />
                    Add Expense
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                            <DollarSign className="w-6 h-6" />
                        </div>
                        <h3 className="text-slate-500 font-bold uppercase text-xs tracking-wider">Total Spent</h3>
                    </div>
                    <p className="text-3xl font-bold text-slate-900">€{totalSpent.toFixed(2)}</p>
                </div>

                {/* Placeholder for future budget feature */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 opacity-60">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <h3 className="text-slate-500 font-bold uppercase text-xs tracking-wider">Budget Status</h3>
                    </div>
                    <p className="text-lg font-medium text-slate-400">Coming Soon</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Expenses List */}
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-xl font-bold text-slate-800">Recent Transactions</h2>
                    {loading ? (
                        <div className="text-center py-10 text-slate-400">Loading expenses...</div>
                    ) : expenses.length === 0 ? (
                        <div className="bg-white p-10 rounded-2xl text-center border border-slate-200 border-dashed">
                            <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
                                <DollarSign className="w-8 h-8" />
                            </div>
                            <p className="text-slate-500 font-medium">No expenses yet.</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                            {expenses.map(expense => (
                                <div key={expense.id} className="p-4 border-b border-slate-50 last:border-0 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-xl">
                                            {expense.category === 'Groceries' ? '🛒' :
                                                expense.category === 'Utilities' ? '💡' :
                                                    expense.category === 'Education' ? '🎓' :
                                                        expense.category === 'Transport' ? '🚗' :
                                                            expense.category === 'Housing' ? '🏠' : '💸'}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900">{expense.description || expense.category}</p>
                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                                <span className="flex items-center gap-1"><CalendarIcon className="w-3 h-3" /> {new Date(expense.date).toLocaleDateString()}</span>
                                                <span>•</span>
                                                <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">{expense.category}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <span className="font-bold text-slate-900">-€{expense.amount.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Categories Breakdown */}
                <div>
                    <h2 className="text-xl font-bold text-slate-800 mb-4">By Category</h2>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                        {Object.entries(byCategory)
                            .sort(([, a], [, b]) => b - a)
                            .map(([cat, amount]) => (
                                <div key={cat}>
                                    <div className="flex items-center justify-between text-sm mb-1">
                                        <span className="font-medium text-slate-700">{cat}</span>
                                        <span className="font-bold text-slate-900">€{amount.toFixed(2)}</span>
                                    </div>
                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-indigo-500 rounded-full"
                                            style={{ width: `${(amount / totalSpent) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        {expenses.length === 0 && <p className="text-slate-400 text-sm text-center">No data available</p>}
                    </div>
                </div>
            </div>

            {/* Add Expense Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-900">Add Expense</h2>
                            <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>
                        <form onSubmit={handleAddExpense} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Amount (€)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-lg font-mono"
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Category</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {categories.map(cat => (
                                        <button
                                            key={cat}
                                            type="button"
                                            onClick={() => setCategory(cat)}
                                            className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${category === cat
                                                ? 'bg-indigo-50 border-indigo-600 text-indigo-700'
                                                : 'border-slate-200 text-slate-600 hover:border-slate-300'
                                                }`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Date</label>
                                <input
                                    type="date"
                                    required
                                    value={date}
                                    onChange={e => setDate(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Description (Optional)</label>
                                <input
                                    type="text"
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                    placeholder="e.g. Weekly shopping"
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl hover:bg-indigo-700 transition-all mt-4"
                            >
                                Save Expense
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
