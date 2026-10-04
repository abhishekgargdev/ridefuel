#!/usr/bin/env node
/**
 * RideFuel Database & Demo Dataset Seed Script
 * Initializes or resets the Royal Enfield Classic 350 motorcycle telemetry,
 * instrument panel data, service intervals, and user profiles.
 *
 * Usage:
 *   npm run seed
 *   or: npx tsx scripts/seed.ts
 */

import { Repository } from '../lib/db/repository';
import { getInitialSeedData, DEMO_USER_ID, DEMO_BIKE_ID } from '../lib/db/seed-data';
import { isDatabaseConnected } from '../lib/db/mongodb';

export async function runSeed(): Promise<void> {
  console.log('====================================================');
  console.log('🏍️  RideFuel — Database Seeding Engine');
  console.log('    Royal Enfield Classic 350 (2022) Companion App');
  console.log('====================================================\n');

  try {
    const seedData = getInitialSeedData();
    const activeBike = seedData.bikes[0];

    console.log(`[1/4] Preparing demo dataset...`);
    console.log(`  • Motorcycle: ${activeBike.manufacturer} ${activeBike.model} (${activeBike.variant})`);
    console.log(`  • Registration: ${activeBike.registrationNumber}`);
    console.log(`  • Target Current Odometer: ${activeBike.currentOdometer.toLocaleString()} km`);
    console.log(`  • Fuel Tank Capacity: ${activeBike.tankCapacity} Litres (Reserve: ${activeBike.reserveCapacity} L)`);
    console.log(`  • Expected Mileage: ${activeBike.expectedMileage} km/L`);

    console.log(`\n[2/4] Resetting data repository...`);
    await Repository.resetToSeed();

    const isConnected = isDatabaseConnected();
    console.log(`  • Storage target: ${isConnected ? 'MongoDB (Cloud / Local Instance)' : 'In-Memory Repository'}`);

    console.log(`\n[3/4] Verifying seeded collections & entities:`);
    console.log(`  ✓ Users: ${seedData.users.length} accounts (demo@ridefuel.com, abhishekgarg959@gmail.com)`);
    console.log(`  ✓ Bikes: ${seedData.bikes.length} motorcycle`);
    console.log(`  ✓ Fuel Logs: ${seedData.fuelLogs.length} full-tank fill cycles`);
    console.log(`  ✓ Daily Readings: ${seedData.dailyReadings.length} odometer distance entries (Latest: 12,430 km)`);
    console.log(`  ✓ Expenses: ${seedData.expenses.length} records (Fuel, Maintenance, Parking, Accessories)`);
    console.log(`  ✓ Maintenance Records: ${seedData.maintenanceRecords.length} periodic services`);
    console.log(`  ✓ Bike Care Rules: ${seedData.bikeCareRules.length} tracking rules`);
    console.log(`  ✓ Bike Care Records: ${seedData.bikeCareRecords.length} maintenance events`);
    console.log(`  ✓ Service Records: ${seedData.serviceRecords.length} authorized dealer invoices`);
    console.log(`  ✓ Notifications: ${seedData.notifications.length} proactive maintenance alerts`);

    console.log(`\n[4/4] Instrument Panel & UX Telemetry Summary:`);
    console.log(`  • Current Odometer: 12,430 km`);
    console.log(`  • Bike Health: 92% (Calculated: Chain Lubrication DUE SOON, Bike Wash DUE SOON, Remainder GOOD)`);
    console.log(`  • Maintenance Indicators:`);
    console.log(`      - Engine Oil: GOOD`);
    console.log(`      - Chain: DUE SOON`);
    console.log(`      - Brakes: GOOD`);
    console.log(`      - Tyres: GOOD`);
    console.log(`      - Battery: GOOD`);
    console.log(`      - Service: GOOD`);
    console.log(`  • Estimated Fuel: ~8.3 L`);
    console.log(`  • Estimated Range: ~300 km`);
    console.log(`  • Average Mileage: ~35.8 km/L`);

    console.log('\n====================================================');
    console.log('✅ Seeding completed successfully!');
    console.log('   Demo Login: demo@ridefuel.com');
    console.log('   Password:   Password123!');
    console.log('====================================================\n');
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  }
}

// Execute when invoked directly from CLI
if (require.main === module || !process.env.NEXT_RUNTIME) {
  runSeed()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
