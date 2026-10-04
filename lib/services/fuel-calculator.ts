import type { FuelLog } from '@/types';

export interface FuelAnalyticsSummary {
  totalLiters: number;
  totalCost: number;
  averagePricePerLiter: number;
  minPricePerLiter: number;
  maxPricePerLiter: number;
  totalRefills: number;
  fullTanksCount: number;
  partialTanksCount: number;
  averageRefillQuantity: number;
  monthlyConsumption: {
    month: string;
    liters: number;
    amount: number;
    refillsCount: number;
  }[];
  priceTrends: {
    date: string;
    price: number;
    station: string;
  }[];
}

export function calculateFuelAnalytics(logs: FuelLog[]): FuelAnalyticsSummary {
  if (!logs || logs.length === 0) {
    return {
      totalLiters: 0,
      totalCost: 0,
      averagePricePerLiter: 0,
      minPricePerLiter: 0,
      maxPricePerLiter: 0,
      totalRefills: 0,
      fullTanksCount: 0,
      partialTanksCount: 0,
      averageRefillQuantity: 0,
      monthlyConsumption: [],
      priceTrends: [],
    };
  }

  let totalLiters = 0;
  let totalCost = 0;
  const prices: number[] = [];
  let fullTanks = 0;
  const monthlyMap: Record<string, { liters: number; amount: number; count: number }> = {};

  const sortedAsc = [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const priceTrends: { date: string; price: number; station: string }[] = [];

  for (const log of sortedAsc) {
    totalLiters += log.fuelQuantity;
    totalCost += log.totalAmount;
    if (log.pricePerLiter > 0) {
      prices.push(log.pricePerLiter);
      priceTrends.push({
        date: log.date,
        price: log.pricePerLiter,
        station: log.fuelStation || 'Unknown Station',
      });
    }
    if (log.isFullTank) fullTanks++;

    const monthKey = log.date.substring(0, 7); // YYYY-MM
    if (!monthlyMap[monthKey]) {
      monthlyMap[monthKey] = { liters: 0, amount: 0, count: 0 };
    }
    monthlyMap[monthKey].liters += log.fuelQuantity;
    monthlyMap[monthKey].amount += log.totalAmount;
    monthlyMap[monthKey].count += 1;
  }

  const averagePrice =
    totalLiters > 0 ? Number((totalCost / totalLiters).toFixed(2)) : 0;
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;

  const monthlyConsumption = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month,
      liters: Number(data.liters.toFixed(1)),
      amount: Number(data.amount.toFixed(2)),
      refillsCount: data.count,
    }));

  return {
    totalLiters: Number(totalLiters.toFixed(1)),
    totalCost: Number(totalCost.toFixed(2)),
    averagePricePerLiter: averagePrice,
    minPricePerLiter: minPrice,
    maxPricePerLiter: maxPrice,
    totalRefills: logs.length,
    fullTanksCount: fullTanks,
    partialTanksCount: logs.length - fullTanks,
    averageRefillQuantity: Number((totalLiters / logs.length).toFixed(1)),
    monthlyConsumption,
    priceTrends,
  };
}
