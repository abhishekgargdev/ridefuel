import { fuelLogSchema } from '../lib/validations/fuel';
import { dailyReadingSchema } from '../lib/validations/reading';
import { bikeSchema } from '../lib/validations/bike';
import { expenseSchema } from '../lib/validations/expense';

function runValidationTests() {
  console.log('--- Starting Zod Validations Unit Tests ---');
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

  // TEST 1: Bike validation
  const validBike = {
    name: 'Classic 350',
    manufacturer: 'Royal Enfield',
    model: 'Classic 350',
    year: 2022,
    initialOdometer: 1000,
    currentOdometer: 8450,
    tankCapacity: 13,
    reserveCapacity: 2.6,
    expectedMileage: 35,
    isActive: true,
  };
  const bikeRes = bikeSchema.safeParse(validBike);
  assert(bikeRes.success === true, 'Valid bike schema passes');

  const invalidBike = { ...validBike, tankCapacity: -5 };
  const invBikeRes = bikeSchema.safeParse(invalidBike);
  assert(invBikeRes.success === false, 'Negative tank capacity fails validation');

  // TEST 2: Fuel log validation
  const validFuel = {
    bikeId: 'b123',
    date: '2026-10-01',
    odometer: 8500,
    fuelQuantity: 10.5,
    pricePerLiter: 96.72,
    totalAmount: 1015.56,
    isFullTank: true,
  };
  const fuelRes = fuelLogSchema.safeParse(validFuel);
  assert(fuelRes.success === true, 'Valid fuel log passes');

  const invalidFuel = { ...validFuel, date: '01-10-2026' }; // wrong format
  const invFuelRes = fuelLogSchema.safeParse(invalidFuel);
  assert(invFuelRes.success === false, 'Invalid date format fails validation');

  // TEST 3: Daily Reading
  const validReading = {
    bikeId: 'b123',
    date: '2026-10-02',
    odometer: 8540,
  };
  const readRes = dailyReadingSchema.safeParse(validReading);
  assert(readRes.success === true, 'Valid daily reading passes');

  // TEST 4: Expense category validation
  const validExpense = {
    bikeId: 'b123',
    date: '2026-10-02',
    category: 'Insurance',
    amount: 3500,
    description: 'Annual Insurance Policy',
  };
  const expRes = expenseSchema.safeParse(validExpense);
  assert(expRes.success === true, 'Valid expense category passes');

  const invExpense = { ...validExpense, category: 'InvalidCategory' };
  const invExpRes = expenseSchema.safeParse(invExpense);
  assert(invExpRes.success === false, 'Invalid category fails validation');

  console.log(`\nValidation Tests Completed: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runValidationTests();
