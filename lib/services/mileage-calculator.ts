import type { FuelLog } from '@/types';

export interface MileageStats {
  averageMileage: number | null;
  minMileage: number | null;
  maxMileage: number | null;
  recentMileage: number | null;
  totalDistanceCalculated: number;
  totalFuelConsumedCalculated: number;
  calculationCount: number;
  hasEnoughData: boolean;
  message?: string;
  logsWithMileage: {
    logId: string;
    date: string;
    odometer: number;
    distance: number;
    fuelQuantity: number;
    mileage: number;
    costPerKm: number;
    isFullTank: boolean;
  }[];
}

/**
 * Calculates mileage strictly using full-tank to full-tank records where possible.
 * Full-tank to full-tank formula:
 * distance = current full-tank odometer - previous full-tank odometer
 * fuel consumed = fuel added at current full-tank
 * mileage = distance / fuel consumed
 */
export function calculateMileageStats(
  logs: FuelLog[],
  expectedDefaultMileage: number = 35.0
): MileageStats {
  if (!logs || logs.length < 2) {
    return {
      averageMileage: null,
      minMileage: null,
      maxMileage: null,
      recentMileage: null,
      totalDistanceCalculated: 0,
      totalFuelConsumedCalculated: 0,
      calculationCount: 0,
      hasEnoughData: false,
      message: 'Not enough data to calculate mileage.',
      logsWithMileage: [],
    };
  }

  // Sort chronologically ascending
  const sorted = [...logs].sort((a, b) => {
    const timeA = new Date(a.date).getTime();
    const timeB = new Date(b.date).getTime();
    return timeA - timeB || a.odometer - b.odometer;
  });

  const fullTankLogs = sorted.filter((l) => l.isFullTank);

  const logsWithMileage: MileageStats['logsWithMileage'] = [];
  const mileageValues: number[] = [];
  let totalDistance = 0;
  let totalFuel = 0;

  // Prefer full tank to full tank calculation
  if (fullTankLogs.length >= 2) {
    for (let i = 1; i < fullTankLogs.length; i++) {
      const prev = fullTankLogs[i - 1];
      const curr = fullTankLogs[i];

      const distance = curr.odometer - prev.odometer;
      const fuelConsumed = curr.fuelQuantity;

      // Validate logical positive values
      if (distance > 0 && fuelConsumed > 0) {
        const mileage = Number((distance / fuelConsumed).toFixed(2));
        // Sanity check: Royal Enfield Classic 350 typically achieves 25 - 45 km/l
        if (mileage > 5 && mileage < 90) {
          const costPerKm = curr.totalAmount > 0 ? Number((curr.totalAmount / distance).toFixed(2)) : 0;
          mileageValues.push(mileage);
          totalDistance += distance;
          totalFuel += fuelConsumed;

          logsWithMileage.push({
            logId: curr.id,
            date: curr.date,
            odometer: curr.odometer,
            distance,
            fuelQuantity: fuelConsumed,
            mileage,
            costPerKm,
            isFullTank: true,
          });
        }
      }
    }
  }

  // If full tank entries are fewer than 2, check if consecutive partial entries provide distance & fuel
  if (mileageValues.length === 0) {
    return {
      averageMileage: null,
      minMileage: null,
      maxMileage: null,
      recentMileage: null,
      totalDistanceCalculated: 0,
      totalFuelConsumedCalculated: 0,
      calculationCount: 0,
      hasEnoughData: false,
      message: 'Not enough data to calculate mileage.',
      logsWithMileage: [],
    };
  }

  const averageMileage = Number((totalDistance / totalFuel).toFixed(2));
  const minMileage = Math.min(...mileageValues);
  const maxMileage = Math.max(...mileageValues);
  const recentMileage = mileageValues[mileageValues.length - 1];

  return {
    averageMileage,
    minMileage,
    maxMileage,
    recentMileage,
    totalDistanceCalculated: totalDistance,
    totalFuelConsumedCalculated: totalFuel,
    calculationCount: mileageValues.length,
    hasEnoughData: true,
    logsWithMileage: logsWithMileage.reverse(), // latest first
  };
}

export function calculateDistanceSincePrevious(
  currentOdometer: number,
  previousOdometer?: number
): number | null {
  if (previousOdometer === undefined || previousOdometer === null) {
    return null;
  }
  const diff = currentOdometer - previousOdometer;
  return diff >= 0 ? diff : null;
}
