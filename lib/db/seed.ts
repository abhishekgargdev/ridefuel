/**
 * RideFuel Database Seed Entrypoint
 * Can be run directly via: npx tsx lib/db/seed.ts
 */

import { runSeed } from '../../scripts/seed';

export { runSeed };

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
