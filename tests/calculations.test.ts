import { calculateMileageStats } from '../lib/services/mileage-calculator';
import { calculateEstimatedRange } from '../lib/services/range-calculator';
import { calculateFuelAnalytics } from '../lib/services/fuel-calculator';
import { calculateMaintenanceSummary } from '../lib/services/maintenance-service';
import type { Bike, FuelLog, DailyReading, MaintenanceRecord } from '../types';

function runTests() {
  console.log('--- Starting RideFuel Business Logic Unit Tests ---');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, desc: string) {
    if (condition) {
      console.log(`[PASS] ${desc}`);
      passed++;
    } else {
      console.error(`[FAIL] ${desc}`);
      failed++;
    }
  }

  // TEST 1: Mileage with insufficient records
  const emptyLogs: FuelLog[] = [];
  const res1 = calculateMileageStats(emptyLogs, 35);
  assert(res1.hasEnoughData === false, 'Insufficient data returns hasEnoughData: false');
  assert(res1.averageMileage === null, 'Insufficient data returns null mileage');
  assert(res1.message === 'Not enough data to calculate mileage.', 'Correct insufficient data message');

  // TEST 2: Full-tank to full-tank mileage calculation
  // Log 1: Odo 1000, 10L, Full Tank
  // Log 2: Odo 1350, 10L, Full Tank -> Distance = 350, Consumed = 10L -> 35.0 km/L
  // Log 3: Odo 1710, 10L, Full Tank -> Distance = 360, Consumed = 10L -> 36.0 km/L
  const fullTankLogs: FuelLog[] = [
    {
      id: '1',
      userId: 'u1',
      bikeId: 'b1',
      date: '2026-09-01',
      odometer: 1000,
      fuelQuantity: 10,
      pricePerLiter: 96,
      totalAmount: 960,
      isFullTank: true,
    },
    {
      id: '2',
      userId: 'u1',
      bikeId: 'b1',
      date: '2026-09-10',
      odometer: 1350,
      fuelQuantity: 10,
      pricePerLiter: 96,
      totalAmount: 960,
      isFullTank: true,
    },
    {
      id: '3',
      userId: 'u1',
      bikeId: 'b1',
      date: '2026-09-20',
      odometer: 1710,
      fuelQuantity: 10,
      pricePerLiter: 96,
      totalAmount: 960,
      isFullTank: true,
    },
  ];

  const res2 = calculateMileageStats(fullTankLogs, 35);
  assert(res2.hasEnoughData === true, 'Sufficient full tank logs calculate mileage');
  assert(res2.calculationCount === 2, 'Two full-tank calculation intervals identified');
  assert(res2.minMileage === 35, 'Minimum mileage correctly identified as 35.0 km/l');
  assert(res2.maxMileage === 36, 'Maximum mileage correctly identified as 36.0 km/l');
  assert(res2.averageMileage === 35.5, 'Average mileage correctly calculated as 35.5 km/l');
  assert(res2.recentMileage === 36, 'Recent mileage correctly identified as 36.0 km/l');

  // TEST 3: Range & Estimated Fuel Calculation for Royal Enfield Classic 350
  const bike: Bike = {
    id: 'b1',
    userId: 'u1',
    name: 'Classic 350',
    manufacturer: 'Royal Enfield',
    model: 'Classic 350',
    year: 2022,
    initialOdometer: 1000,
    currentOdometer: 1900,
    tankCapacity: 13,
    reserveCapacity: 2.6,
    expectedMileage: 35,
    isActive: true,
  };

  // Last fill was at odo 1710 (Full Tank = 13L)
  // Current odo is 1900 -> distance travelled = 190 km
  // At 35.5 km/L, estimated fuel consumed = 190 / 35.5 ≈ 5.35 L
  // Remaining fuel ≈ 13 - 5.35 = 7.65 L ≈ 7.7 L
  // Estimated range ≈ 7.7 * 35.5 ≈ 273 km
  const rangeRes = calculateEstimatedRange(bike, fullTankLogs, []);
  assert(rangeRes.hasEnoughData === true, 'Range calculation succeeds with fuel logs');
  assert(rangeRes.estimatedFuel !== null && rangeRes.estimatedFuel > 7 && rangeRes.estimatedFuel < 8, 'Estimated fuel correctly calculated around ~7.7L');
  assert(rangeRes.estimatedRange !== null && rangeRes.estimatedRange > 260 && rangeRes.estimatedRange < 285, 'Estimated range correctly calculated around ~273 km');
  assert(rangeRes.isReserveLevel === false, 'Fuel is not in reserve');

  // TEST 4: Reserve warning trigger when fuel is low
  const bikeHighOdo: Bike = {
    ...bike,
    currentOdometer: 2090, // travelled 380 km on a 13L tank -> fuel remaining < 2.6L
  };
  const lowFuelRes = calculateEstimatedRange(bikeHighOdo, fullTankLogs, []);
  assert(lowFuelRes.isReserveLevel === true, 'Reserve warning properly flags when remaining fuel <= 2.6L');

  // TEST 5: Fuel analytics totals
  const fuelAnalytics = calculateFuelAnalytics(fullTankLogs);
  assert(fuelAnalytics.totalLiters === 30, 'Total liters summed correctly (30L)');
  assert(fuelAnalytics.totalCost === 2880, 'Total cost summed correctly (₹2,880)');
  assert(fuelAnalytics.averagePricePerLiter === 96, 'Average fuel price is ₹96/L');

  // TEST 6: Maintenance Overdue vs Upcoming Detection
  const maintenanceRecords: MaintenanceRecord[] = [
    {
      id: 'm1',
      userId: 'u1',
      bikeId: 'b1',
      serviceType: 'Engine oil',
      date: '2026-05-01',
      odometer: 1000,
      amount: 1500,
      description: 'First free service',
      nextDueOdometer: 1500, // Current bike odo is 1900 -> overdue!
      status: 'completed',
    },
    {
      id: 'm2',
      userId: 'u1',
      bikeId: 'b1',
      serviceType: 'Chain lubrication',
      date: '2026-09-01',
      odometer: 1800,
      amount: 200,
      description: 'Clean & lube',
      nextDueOdometer: 2300, // Current is 1900 -> upcoming!
      status: 'completed',
    },
  ];

  const maintSummary = calculateMaintenanceSummary(maintenanceRecords, bike);
  assert(maintSummary.overdueCount === 1, 'Overdue maintenance record detected based on odometer');
  assert(maintSummary.upcomingCount === 1, 'Upcoming maintenance record detected');
  assert(maintSummary.nextMaintenance?.isOverdue === true, 'Next maintenance highlights the overdue task');

  // TEST 5: computeDashboardData for all 14 KPIs and chart datasets
  const { computeDashboardData } = require('../lib/services/dashboard-service');
  const sampleExpenses = [
    { id: 'e1', userId: 'u1', bikeId: 'b1', date: '2026-09-05', category: 'Accessories', amount: 1200, description: 'Crash guards' },
    { id: 'e2', userId: 'u1', bikeId: 'b1', date: '2026-09-12', category: 'Cleaning', amount: 300, description: 'Water wash' },
  ];
  const sampleReadings = [
    { id: 'r1', userId: 'u1', bikeId: 'b1', date: '2026-09-19', odometer: 1850, distance: 40 },
    { id: 'r2', userId: 'u1', bikeId: 'b1', date: '2026-09-20', odometer: 1900, distance: 50 },
  ];

  const dash = computeDashboardData(bike, fullTankLogs, sampleReadings, sampleExpenses, maintenanceRecords);
  assert(dash.summary.currentOdometer === 1900, 'Dashboard Current Odometer is 1900 km');
  assert(typeof dash.summary.todaysDistance === 'number', 'Dashboard Today Distance calculated');
  assert(typeof dash.summary.monthlyDistance === 'number', 'Dashboard Monthly Distance calculated');
  assert(dash.summary.estimatedFuel !== null, 'Dashboard Estimated Fuel calculated');
  assert(dash.summary.estimatedRange !== null, 'Dashboard Estimated Range calculated');
  assert(dash.summary.averageMileage === 35.5, 'Dashboard Average Mileage is 35.5 km/l');
  assert(dash.summary.recentMileage === 36, 'Dashboard Recent Mileage is 36.0 km/l');
  assert(dash.summary.averagePetrolPrice === 96, 'Dashboard Average Petrol Price is 96');
  assert(dash.summary.totalFuelExpenditure === 2880, 'Dashboard Total Fuel Expenditure is 2880');
  assert(dash.summary.totalBikeExpenditure > 2880, 'Dashboard Total Bike Expenditure includes non-fuel expenses');
  assert(dash.summary.costPerKilometer !== null, 'Dashboard Cost Per Kilometer calculated');
  assert(dash.summary.lastFuelFill?.odometer === 1710, 'Dashboard Last Fuel Fill odometer is 1710');
  assert(dash.summary.nextMaintenance?.serviceType === 'Engine oil', 'Dashboard Next Maintenance is Engine oil');
  assert(Array.isArray(dash.charts.mileageOverTime), 'Chart 1 Mileage trend exists');
  assert(Array.isArray(dash.charts.monthlyDistance), 'Chart 2 Distance travelled exists');
  assert(Array.isArray(dash.charts.monthlyFuelConsumption), 'Chart 3 Fuel consumption exists');
  assert(Array.isArray(dash.charts.monthlyFuelExpense), 'Chart 4 Fuel expenditure exists');
  assert(Array.isArray(dash.charts.petrolPriceTrend), 'Chart 5 Petrol price trend exists');
  assert(Array.isArray(dash.charts.costPerKmTrend), 'Chart 6 Cost per km exists');
  assert(Array.isArray(dash.charts.maintenanceExpenses), 'Chart 7 Maintenance expenses exists');

  console.log(`\nTests Completed: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
