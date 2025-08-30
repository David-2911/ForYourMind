const { Client } = require('pg');
(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  const tables = ['users','organizations','employees','therapists','journals','mood_entries','appointments','courses','wellness_assessments','assessment_responses','buddy_matches','refresh_tokens'];
  for (const t of tables) {
    try {
      const r = await c.query(`SELECT count(*) as c FROM ${t}`);
      console.log(t, r.rows[0].c);
    } catch (e) {
      console.log(t, 'ERR', e.message);
    }
  }
  await c.end();
})();
