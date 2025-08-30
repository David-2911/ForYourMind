const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const { Client } = require('pg');

(async () => {
  try {
    const sqlitePath = './data/db.sqlite';
    const db = await open({ filename: sqlitePath, driver: sqlite3.Database });
    const sUsers = await db.all('SELECT * FROM users');

    const pg = new Client({ connectionString: process.env.DATABASE_URL });
    await pg.connect();
    const r = await pg.query('SELECT * FROM users');
    const pUsers = r.rows;

    console.log('SQLite users:', sUsers.length);
    console.table(sUsers.map(u => ({ id: u.id, email: u.email, display_name: u.display_name })));

    console.log('Postgres users:', pUsers.length);
    console.table(pUsers.map(u => ({ id: u.id, email: u.email, display_name: u.displayname || u.display_name || u.displayName })));

    // find duplicates by email in Postgres
    const pgByEmail = {};
    for (const u of pUsers) {
      const e = (u.email || '').toLowerCase();
      pgByEmail[e] = pgByEmail[e] || [];
      pgByEmail[e].push(u);
    }
    console.log('Postgres duplicate emails (if any):');
    for (const e of Object.keys(pgByEmail)) {
      if (pgByEmail[e].length > 1) console.log(e, pgByEmail[e].length);
    }

    // find sqlite users missing in pg by id
    const pgIds = new Set(pUsers.map(u => u.id));
    const missing = sUsers.filter(u => !pgIds.has(u.id));
    console.log('Users present in SQLite but missing in Postgres by id:', missing.length);
    if (missing.length) console.table(missing.map(u => ({ id: u.id, email: u.email }))); 

    await db.close();
    await pg.end();
  } catch (err) {
    console.error('Error comparing users:', err.message || err);
    process.exit(2);
  }
})();
