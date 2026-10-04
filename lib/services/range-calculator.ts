import type { Bike, FuelLog, DailyReading } from '@/types';
import { calculateMileageStats } from './mileage-calculator';

export interface RangeEstimateResult {
  estimatedFuel: number | null; // Liters
  estimatedRange: number | null; // Kilometers
  percentageRemaining: number | null; // 0 - 100%
  isReserveLevel: boolean;
  distanceTraveledSinceRefill: number | null;
  effectiveMileage: number;
  lastKnownFuelAmount: number | null;
  lastKnownOdometer: number | null;
  currentOdometer: number;
  hasEnoughData: boolean;
  warningNote?: string;
}

/**
 * Range Calculator Service
 * Estimates remaining fuel and range without physical sensor reliance.
 * Note: Royal Enfield Classic 350 has a 13-litre tank with ~2.6-litre reserve.
 */
export function calculateEstimatedRange(
  bike: Bike,
  fuelLogs: FuelLog[],
  readings: DailyReading[] = []
): RangeEstimateResult {
  const tankCapacity = bike.tankCapacity || 13;
  const reserveCapacity = bike.reserveCapacity || 2.6;

  if (!fuelLogs || fuelLogs.length === 0) {
    return {
      estimatedFuel: null,
      estimatedRange: null,
      percentageRemaining: null,
      isReserveLevel: false,
      distanceTraveledSinceRefill: null,
      effectiveMileage: bike.expectedMileage || 35,
      lastKnownFuelAmount: null,
      lastKnownOdometer: null,
      currentOdometer: bike.currentOdometer || 0,
      hasEnoughData: false,
      warningNote: 'Add at least one fuel refill log to estimate fuel & range.',
    };
  }

  // Sort logs latest first
  const sortedLogs = [...fuelLogs].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime() || b.odometer - a.odometer;
  });

  const lastRefill = sortedLogs[0];
  const lastKnownFuelAmount = lastRefill.isFullTank ? tankCapacity : lastRefill.fuelQuantity;
  const lastKnownOdometer = lastRefill.odometer;

  // Find the highest current odometer from bike, readings, or latest log
  let currentOdometer = Math.max(bike.currentOdometer || 0, lastKnownOdometer);
  for (const r of readings) {
    if (r.odometer > currentOdometer) {
      currentOdometer = r.odometer;
    }
  }

  // Determine effective mileage
  const mileageStats = calculateMileageStats(fuelLogs, bike.expectedMileage);
  const effectiveMileage = mileageStats.averageMileage || bike.expectedMileage || 35.0;

  // Calculate distance since last fill
  const distanceTraveled = currentOdometer - lastKnownOdometer;

  if (distanceTraveled < 0) {
    return {
      estimatedFuel: lastKnownFuelAmount,
      estimatedRange: Number((lastKnownFuelAmount * effectiveMileage).toFixed(0)),
      percentageRemaining: Number(((lastKnownFuelAmount / tankCapacity) * 100).toFixed(0)),
      isReserveLevel: lastKnownFuelAmount <= reserveCapacity,
      distanceTraveledSinceRefill: 0,
      effectiveMileage,
      lastKnownFuelAmount,
      lastKnownOdometer,
      currentOdometer,
      hasEnoughData: true,
    };
  }

  // Estimated fuel consumed = distance / mileage
  const estimatedConsumed = distanceTraveled / effectiveMileage;

  // Estimated remaining fuel = known fuel - estimated consumption
  const rawRemainingFuel = lastKnownFuelAmount - estimatedConsumed;
  const estimatedFuel = Math.max(0, Number(rawRemainingFuel.toFixed(1)));

  // Estimated range = estimated remaining fuel × average mileage
  const estimatedRange = Math.max(0, Number((estimatedFuel * effectiveMileage).toFixed(0)));

  const percentage = Math.min(100, Math.max(0, Number(((estimatedFuel / tankCapacity) * 100).toFixed(0))));
  const isReserve = estimatedFuel <= reserveCapacity;

  return {
    estimatedFuel,
    estimatedRange,
    percentageRemaining: percentage,
    isReserveLevel: isReserve,
    distanceTraveledSinceRefill: distanceTraveled,
    effectiveMileage,
    lastKnownFuelAmount,
    lastKnownOdometer,
    currentOdometer,
    hasEnoughData: true,
    warningNote: isReserve
      ? `Estimated Fuel is near/in Reserve (≤ ${reserveCapacity}L). Refill soon.`
      : undefined,
  };
}
