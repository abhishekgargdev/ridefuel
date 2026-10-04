import type { Expense, FuelLog, ExpenseCategory } from '@/types';

export interface ExpenseAnalyticsSummary {
  totalExpenseAmount: number;
  fuelTotal: number;
  nonFuelTotal: number;
  expensesByCategory: {
    category: ExpenseCategory;
    amount: number;
    percentage: number;
    color: string;
    count: number;
  }[];
  monthlyExpenses: {
    month: string;
    petrol: number;
    maintenance: number;
    other: number;
    total: number;
  }[];
}

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  Petrol: '#f59e0b', // Amber
  Maintenance: '#3b82f6', // Blue
  Repair: '#ef4444', // Red
  Insurance: '#8b5cf6', // Violet
  Accessories: '#10b981', // Emerald
  Cleaning: '#06b6d4', // Cyan
  Parking: '#64748b', // Slate
  Toll: '#ec4899', // Pink
  Other: '#94a3b8', // Gray
};

export function calculateExpenseAnalytics(
  expenses: Expense[],
  fuelLogs: FuelLog[] = []
): ExpenseAnalyticsSummary {
  // Synthesize fuel logs into petrol expenses if not explicitly entered in expenses
  const combinedExpenses: {
    category: ExpenseCategory;
    amount: number;
    date: string;
  }[] = [];

  for (const e of expenses) {
    combinedExpenses.push({
      category: e.category,
      amount: e.amount,
      date: e.date,
    });
  }

  // If user recorded fuel logs, ensure Petrol is accounted for
  const totalFuelCost = fuelLogs.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const recordedPetrolInExpenses = expenses
    .filter((e) => e.category === 'Petrol')
    .reduce((acc, curr) => acc + curr.amount, 0);

  // If fuel logs exist and haven't been manually mirrored in expenses, add fuel logs
  if (fuelLogs.length > 0 && recordedPetrolInExpenses === 0) {
    for (const fl of fuelLogs) {
      combinedExpenses.push({
        category: 'Petrol',
        amount: fl.totalAmount,
        date: fl.date,
      });
    }
  }

  let totalExpenseAmount = 0;
  const categoryTotals: Record<ExpenseCategory, { amount: number; count: number }> = {
    Petrol: { amount: 0, count: 0 },
    Maintenance: { amount: 0, count: 0 },
    Repair: { amount: 0, count: 0 },
    Insurance: { amount: 0, count: 0 },
    Accessories: { amount: 0, count: 0 },
    Cleaning: { amount: 0, count: 0 },
    Parking: { amount: 0, count: 0 },
    Toll: { amount: 0, count: 0 },
    Other: { amount: 0, count: 0 },
  };

  const monthlyMap: Record<
    string,
    { petrol: number; maintenance: number; other: number; total: number }
  > = {};

  for (const item of combinedExpenses) {
    totalExpenseAmount += item.amount;
    if (!categoryTotals[item.category]) {
      categoryTotals[item.category] = { amount: 0, count: 0 };
    }
    categoryTotals[item.category].amount += item.amount;
    categoryTotals[item.category].count += 1;

    const month = item.date.substring(0, 7);
    if (!monthlyMap[month]) {
      monthlyMap[month] = { petrol: 0, maintenance: 0, other: 0, total: 0 };
    }
    monthlyMap[month].total += item.amount;
    if (item.category === 'Petrol') {
      monthlyMap[month].petrol += item.amount;
    } else if (item.category === 'Maintenance' || item.category === 'Repair') {
      monthlyMap[month].maintenance += item.amount;
    } else {
      monthlyMap[month].other += item.amount;
    }
  }

  const expensesByCategory = (Object.keys(categoryTotals) as ExpenseCategory[])
    .filter((cat) => categoryTotals[cat].amount > 0)
    .map((category) => {
      const amt = categoryTotals[category].amount;
      const pct =
        totalExpenseAmount > 0
          ? Number(((amt / totalExpenseAmount) * 100).toFixed(1))
          : 0;
      return {
        category,
        amount: Number(amt.toFixed(2)),
        percentage: pct,
        color: CATEGORY_COLORS[category] || '#94a3b8',
        count: categoryTotals[category].count,
      };
    })
    .sort((a, b) => b.amount - a.amount);

  const monthlyExpenses = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month,
      petrol: Number(data.petrol.toFixed(2)),
      maintenance: Number(data.maintenance.toFixed(2)),
      other: Number(data.other.toFixed(2)),
      total: Number(data.total.toFixed(2)),
    }));

  const fuelTotal = categoryTotals['Petrol']?.amount || 0;
  const nonFuelTotal = totalExpenseAmount - fuelTotal;

  return {
    totalExpenseAmount: Number(totalExpenseAmount.toFixed(2)),
    fuelTotal: Number(fuelTotal.toFixed(2)),
    nonFuelTotal: Number(nonFuelTotal.toFixed(2)),
    expensesByCategory,
    monthlyExpenses,
  };
}
