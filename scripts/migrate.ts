import { isPgEnabled, migrate } from '../server/services/store-pg.ts';
async function main() {
  if (!isPgEnabled()) {
    console.log('No DATABASE_URL — skipping migrate (file store mode).');
    process.exit(0);
  }
  await migrate();
  console.log('Migrations OK');
}
main().catch((e) => { console.error(e); process.exit(1); });
