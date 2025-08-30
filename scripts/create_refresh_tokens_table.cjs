const { Client } = require('pg');
(async () => {
  if (!process.env.DATABASE_URL) {
    console.error('Please set DATABASE_URL');
    process.exit(1);
  }
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    // Create refresh_tokens table compatible with server/sqliteStorage.ts but using timestamptz
    const sql = `
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      token TEXT PRIMARY KEY,
      user_id varchar(255),
      expires_at timestamptz
    );
    `;
    await client.query(sql);
    console.log('refresh_tokens table ensured');
  } catch (err) {
    console.error('Error creating refresh_tokens table:', err.message);
    process.exit(2);
  } finally {
    await client.end();
  }
})();
