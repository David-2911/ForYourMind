const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

(async () => {
  const gen = path.resolve('./generated_migrations/0000_tough_cloak.sql');
  if (!fs.existsSync(gen)) {
    console.error('Generated SQL not found:', gen);
    process.exit(1);
  }
  const sql = fs.readFileSync(gen, 'utf8');
  // Remove any lines referencing pg_stat_statements or DROP EXTENSION
  const cleaned = sql.split(/\n/).filter(l => !/pg_stat_statements|DROP EXTENSION|DROP VIEW/i.test(l)).join('\n');

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    // split by our statement break markers and run each independently
    const parts = cleaned.split('--> statement-breakpoint').map(p => p.trim()).filter(Boolean);
    for (const [i, part] of parts.entries()) {
      if (!part) continue;
      try {
        await client.query(part);
        console.log(`Statement ${i + 1}/${parts.length} applied`);
      } catch (err) {
        console.warn(`Statement ${i + 1}/${parts.length} failed, continuing:`, err.message);
      }
    }
    console.log('Applied generated migration (one-by-one, best-effort)');
  } catch (err) {
    console.error('Applying migration failed unexpectedly:', err.message);
  } finally {
    await client.end();
  }
})();
