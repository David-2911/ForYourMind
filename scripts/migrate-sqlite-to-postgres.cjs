/*
Run with:
export DATABASE_URL='postgresql://user:pass@host:port/dbname?sslmode=require'
node scripts/migrate-sqlite-to-postgres.cjs
*/

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const { Client } = require('pg');

function safeParseJson(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'object') return value;
  try { return JSON.parse(value); } catch (e) {}
  try {
    let s = String(value).trim();
    s = s.replace(/'/g, '"');
    s = s.replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');
    s = s.replace(/:\s*([a-zA-Z0-9_]+)([,\}])/g, ':"$1"$2');
    return JSON.parse(s);
  } catch (e) {
    return value;
  }
}

function convertTimestampMaybe(msVal) {
  if (msVal === null || msVal === undefined || msVal === '') return null;
  const n = Number(msVal);
  if (!Number.isNaN(n)) {
    if (n > 1e10) return new Date(n).toISOString();
    if (n > 1e9) return new Date(n * 1000).toISOString();
  }
  const d = new Date(msVal);
  if (!isNaN(d)) return d.toISOString();
  return null;
}

(async () => {
  if (!process.env.DATABASE_URL) {
    console.error('Please set DATABASE_URL');
    process.exit(1);
  }

  const sqlitePath = path.resolve('./data/db.sqlite');
  if (!fs.existsSync(sqlitePath)) {
    console.error('SQLite DB not found at', sqlitePath);
    process.exit(1);
  }

  const db = await open({ filename: sqlitePath, driver: sqlite3.Database });
  const pg = new Client({ connectionString: process.env.DATABASE_URL });
  await pg.connect();

  // Cache of table -> columns
  const tableColumns = {};
  async function getColumns(table) {
    if (tableColumns[table]) return tableColumns[table];
    try {
      const res = await pg.query("SELECT column_name FROM information_schema.columns WHERE table_name = $1", [table]);
      const cols = res.rows.map(r => r.column_name);
      tableColumns[table] = cols;
      return cols;
    } catch (err) {
      console.warn('Could not read columns for', table, err.message);
      tableColumns[table] = [];
      return [];
    }
  }

  function normalizeKey(k) {
    return String(k || '').replace(/[_\s]/g, '').toLowerCase();
  }

  function buildNormalizedRowMap(row) {
    const m = {};
    for (const k of Object.keys(row || {})) {
      m[normalizeKey(k)] = row[k];
    }
    return m;
  }

  async function insertRowDynamic(table, row) {
    const cols = await getColumns(table);
    if (!cols || cols.length === 0) return;
    const norm = buildNormalizedRowMap(row);
    const keys = [];
    const placeholders = [];
    const values = [];
    let i = 1;
    for (const c of cols) {
      // prefer exact key, then normalized match
      if (row.hasOwnProperty(c)) {
        keys.push(c);
        placeholders.push('$' + i);
        values.push(row[c]);
        i++;
        continue;
      }
      const n = normalizeKey(c);
      if (norm.hasOwnProperty(n)) {
        keys.push(c);
        placeholders.push('$' + i);
        values.push(norm[n]);
        i++;
      }
    }
    if (keys.length === 0) return;
    const sql = `INSERT INTO ${table}(${keys.join(',')}) VALUES(${placeholders.join(',')}) ON CONFLICT DO NOTHING`;
    try {
      await pg.query(sql, values);
    } catch (err) {
      console.warn('Insert failed for table', table, err.message);
    }
  }

  try {
    console.log('Starting migration...');

    const users = await db.all('SELECT * FROM users');
    console.log('Users:', users.length);
    for (const u of users) {
      const created_at = convertTimestampMaybe(u.created_at) || new Date().toISOString();
      const prefs = u.preferences ? safeParseJson(u.preferences) : {};
      const row = {
        id: u.id,
        email: u.email,
        password: u.password,
        role: u.role || 'individual',
        display_name: u.display_name || u.displayName || '',
        avatar_url: u.avatar_url || null,
        timezone: u.timezone || 'UTC',
        preferences: JSON.stringify(prefs),
        is_verified: u.is_verified ? true : false,
        created_at,
      };
      await insertRowDynamic('users', row);
    }

    const orgs = await db.all('SELECT * FROM organizations');
    console.log('Organizations:', orgs.length);
    for (const o of orgs) {
      const created_at = convertTimestampMaybe(o.created_at) || new Date().toISOString();
      const settings = o.settings ? safeParseJson(o.settings) : {};
      await insertRowDynamic('organizations', {
        id: o.id,
        name: o.name,
        admin_user_id: o.admin_user_id || null,
        settings: JSON.stringify(settings),
        wellness_score: o.wellness_score || 0,
        created_at,
      });
    }

    const employees = await db.all('SELECT * FROM employees');
    console.log('Employees:', employees.length);
    for (const e of employees) {
      await insertRowDynamic('employees', {
        id: e.id,
        user_id: e.user_id,
        org_id: e.org_id,
        job_title: e.job_title || null,
        department: e.department || null,
        anonymized_id: e.anonymized_id || null,
        wellness_streak: e.wellness_streak || 0,
      });
    }

    const therapists = await db.all('SELECT * FROM therapists');
    console.log('Therapists:', therapists.length);
    for (const t of therapists) {
      const availability = t.availability ? safeParseJson(t.availability) : {};
      await insertRowDynamic('therapists', {
        id: t.id,
        name: t.name,
        specialization: t.specialization || null,
        license_number: t.license_number || null,
        profile_url: t.profile_url || null,
        rating: t.rating || 0,
        availability: availability ? JSON.stringify(availability) : null,
      });
    }

    const journals = await db.all('SELECT * FROM journals');
    console.log('Journals:', journals.length);
    for (const j of journals) {
      const created_at = convertTimestampMaybe(j.created_at);
      await insertRowDynamic('journals', {
        id: j.id,
        user_id: j.user_id,
        mood_score: j.mood_score || null,
        content: j.content || null,
        tags: j.tags ? JSON.stringify(safeParseJson(j.tags)) : JSON.stringify([]),
        is_private: j.is_private ? true : false,
        created_at,
      });
    }

    const moods = await db.all('SELECT * FROM mood_entries');
    console.log('Mood entries:', moods.length);
    for (const m of moods) {
      const created_at = convertTimestampMaybe(m.created_at);
      await insertRowDynamic('mood_entries', {
        id: m.id,
        user_id: m.user_id,
        mood_score: m.mood_score || null,
        notes: m.notes || null,
        created_at,
      });
    }

    const appointments = await db.all('SELECT * FROM appointments');
    console.log('Appointments:', appointments.length);
    for (const a of appointments) {
      const startTime = convertTimestampMaybe(a.start_time);
      const endTime = convertTimestampMaybe(a.end_time);
      await insertRowDynamic('appointments', {
        id: a.id,
        therapist_id: a.therapist_id || null,
        user_id: a.user_id || null,
        start_time: startTime,
        end_time: endTime,
        status: a.status || 'pending',
        notes: a.notes || null,
      });
    }

    const courses = await db.all('SELECT * FROM courses');
    console.log('Courses:', courses.length);
    for (const c of courses) {
      const modules = c.modules ? safeParseJson(c.modules) : {};
      await insertRowDynamic('courses', {
        id: c.id,
        title: c.title,
        description: c.description || null,
        duration_minutes: c.duration_minutes || null,
        difficulty: c.difficulty || null,
        thumbnail_url: c.thumbnail_url || null,
        modules: modules ? JSON.stringify(modules) : null,
      });
    }

    const assessments = await db.all('SELECT * FROM wellness_assessments');
    console.log('Assessments:', assessments.length);
    for (const w of assessments) {
      const questions = w.questions ? safeParseJson(w.questions) : {};
      await insertRowDynamic('wellness_assessments', {
        id: w.id,
        org_id: w.org_id || null,
        title: w.title || null,
        questions: questions ? JSON.stringify(questions) : null,
        is_active: w.is_active ? true : false,
        assessment_type: w.assessment_type || w.type || 'general',
      });
    }

    const responses = await db.all('SELECT * FROM assessment_responses');
    console.log('Assessment responses:', responses.length);
    for (const r of responses) {
      await insertRowDynamic('assessment_responses', {
        id: r.id,
        assessment_id: r.assessment_id || null,
        user_id: r.user_id || null,
        responses: r.responses ? JSON.stringify(safeParseJson(r.responses)) : null,
        total_score: r.total_score || null,
        category_scores: r.category_scores ? JSON.stringify(safeParseJson(r.category_scores)) : null,
        recommendations: r.recommendations ? JSON.stringify(safeParseJson(r.recommendations)) : null,
        completed_at: convertTimestampMaybe(r.completed_at),
      });
    }

    const buddies = await db.all('SELECT * FROM buddy_matches');
    console.log('Buddy matches:', buddies.length);
    for (const b of buddies) {
      await insertRowDynamic('buddy_matches', {
        id: b.id,
        user_a_id: b.user_a_id || null,
        user_b_id: b.user_b_id || null,
        compatibility_score: b.compatibility_score || null,
        status: b.status || 'pending',
        created_at: convertTimestampMaybe(b.created_at),
      });
    }

    try {
      const tokens = await db.all('SELECT * FROM refresh_tokens');
      console.log('Refresh tokens:', tokens.length);
      for (const t of tokens) {
        try {
          await insertRowDynamic('refresh_tokens', {
            token: t.token,
            user_id: t.user_id,
            expires_at: convertTimestampMaybe(t.expires_at),
          });
        } catch (err) {
          console.warn('Skipping refresh token insert (table may not exist):', err.message);
        }
      }
    } catch (err) {
      console.log('No refresh_tokens table in sqlite or skipped.');
    }

    console.log('Migration finished successfully.');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await db.close();
    await pg.end();
    process.exit(0);
  }
})();
