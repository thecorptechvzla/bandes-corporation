import 'dotenv/config';
import pg from 'pg';

const TABLES_IN_ORDER = [
  'ExitDetail',
  'Bar',
  'Lot',
  'Process',
  'Packing',
  'MaterialExit',
  'Client',
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL no definida');

  const pool = new pg.Pool({ connectionString: url });
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    for (const table of TABLES_IN_ORDER) {
      await client.query(`DELETE FROM "${table}"`);
      console.log(`  ✓ ${table}`);
    }
    await client.query('COMMIT');
    console.log('✅ Todas las tablas limpias.');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error('❌ Error:', e);
  process.exit(1);
});
