'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { Input, Label } from '@/components/ui/input';
import { useAuth } from '@/lib/auth/context';
import type { Expense, ExpenseCategory } from '@/types';
import { expenseCategories } from '@/lib/validations/expense';
import { DollarSign, Plus, Edit2, Trash2, Tag, Calendar, AlertCircle } from 'lucide-react';
import { ListSkeleton } from '@/components/ui/page-skeleton';
import { EmptyBikeState } from '@/components/dashboard/empty-bike-state';

export default function ExpensesPage() {
  const { activeBike, user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [formError, setFormError] = useState<string | null>(null);

  const currency = user?.currency || '₹';
  const distanceUnit = user?.distanceUnit || 'km';

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'Cleaning' as ExpenseCategory,
    amount: 0,
    odometer: activeBike?.currentOdometer || 0,
    description: '',
    notes: '',
    receiptUrl: '',
  });

  const fetchExpenses = useCallback(async () => {
    if (!activeBike) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/expenses?bikeId=${activeBike.id}`);
      const json = await res.json();
      if (json.success) {
        setExpenses(json.data || []);
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  }, [activeBike]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const openAddModal = () => {
    setEditingExpense(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      category: 'Cleaning',
      amount: 0,
      odometer: activeBike?.currentOdometer || 0,
      description: '',
      notes: '',
      receiptUrl: '',
    });
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (exp: Expense) => {
    setEditingExpense(exp);
    setFormData({
      date: exp.date,
      category: exp.category,
      amount: exp.amount,
      odometer: exp.odometer || 0,
      description: exp.description,
      notes: exp.notes || '',
      receiptUrl: exp.receiptUrl || '',
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBike) return;
    setFormError(null);

    try {
      const url = editingExpense ? `/api/expenses/${editingExpense.id}` : '/api/expenses';
      const method = editingExpense ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bikeId: activeBike.id,
          ...formData,
          amount: Number(formData.amount),
          odometer: formData.odometer ? Number(formData.odometer) : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save expense');
      }

      await fetchExpenses();
      setModalOpen(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error submitting expense');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense record?')) return;
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchExpenses();
      }
    } catch (e) {
      alert('Failed to delete expense');
    }
  };

  const filteredExpenses =
    selectedCategory === 'ALL'
      ? expenses
      : expenses.filter((e) => e.category === selectedCategory);

  const totalSpent = filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);

  if (!activeBike) {
    return <EmptyBikeState />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-slate-100 flex items-center gap-2">
            <DollarSign className="w-7 h-7 text-emerald-400" />
            Motorcycle Expenses
          </h1>
          <p className="text-xs text-slate-400">
            Log all expenses including insurance, accessories, cleaning, parking, and tolls for {activeBike?.name}
          </p>
        </div>
        <Button onClick={openAddModal} variant="primary">
          <Plus className="w-4 h-4 mr-2" /> Record Expense
        </Button>
      </div>

      {/* Category Filter Pills & Total */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              selectedCategory === 'ALL'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            All Categories
          </button>
          {expenseCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="text-right shrink-0">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Filtered Spend</span>
          <span className="text-xl font-bold text-slate-100">{currency}{totalSpent.toLocaleString()}</span>
        </div>
      </div>

      {/* Expenses List */}
      <div className="space-y-3">
        {loading ? (
          <ListSkeleton count={3} height="h-20" />
        ) : filteredExpenses.length === 0 ? (
          <Card className="text-center py-12">
            <DollarSign className="w-10 h-10 mx-auto text-slate-600 mb-2" />
            <p className="font-semibold text-slate-200">No Expenses Recorded</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
              Add motorcycle purchases, servicing bills, or parking receipts.
            </p>
            <Button onClick={openAddModal} variant="primary" size="sm">
              <Plus className="w-4 h-4 mr-1" /> Add Expense
            </Button>
          </Card>
        ) : (
          filteredExpenses.map((exp) => (
            <Card key={exp.id} className="hover:border-slate-700 transition">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 font-bold">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-base text-slate-100">{exp.description}</span>
                      <Badge variant="amber">{exp.category}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-500" /> {exp.date}
                      </span>
                      {exp.odometer ? (
                        <span>Odo: {exp.odometer.toLocaleString()} {distanceUnit}</span>
                      ) : null}
                      {exp.notes && <span className="italic text-slate-400">&ldquo;{exp.notes}&rdquo;</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-lg font-black text-slate-100">
                    {currency}{exp.amount.toLocaleString()}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(exp)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(exp.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Add / Edit Expense Dialog */}
      <Dialog
        open={modalOpen}
        onOpenChange={(open) => setModalOpen(open)}
        title={editingExpense ? 'Edit Expense' : 'Record Expense'}
        description={`Record expense for ${activeBike?.name}`}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="flex items-center gap-2 p-3 text-xs bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label required>Category</Label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as ExpenseCategory })}
                className="flex h-11 w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 focus:border-amber-500 focus:outline-none"
              >
                {expenseCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label required>Amount ({currency})</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label required>Date</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Odometer ({distanceUnit})</Label>
              <Input
                type="number"
                value={formData.odometer}
                onChange={(e) => setFormData({ ...formData, odometer: Number(e.target.value) })}
              />
            </div>
          </div>

          <div>
            <Label required>Description</Label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g. Foam wash and teflon polish, helmet visor replacement"
              required
            />
          </div>

          <div>
            <Label>Notes</Label>
            <Input
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional details or receipt invoice number"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {editingExpense ? 'Update Expense' : 'Save Expense'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
