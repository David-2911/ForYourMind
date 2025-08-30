/*
Run with:
export DATABASE_URL='postgresql://user:pass@host:port/dbname?sslmode=require'
node scripts/migrate-sqlite-to-postgres.js
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
    // treat >1e10 as ms
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

  try {
    console.log('Starting migration...');

    // MIGRATE users first
    const users = await db.all('SELECT * FROM users');
    console.log('Users:', users.length);
    for (const u of users) {
      const created_at = convertTimestampMaybe(u.created_at) || new Date().toISOString();
      const prefs = u.preferences ? safeParseJson(u.preferences) : {};
      await pg.query(
        `INSERT INTO users(id, email, password, role, display_name, avatar_url, timezone, preferences, is_verified, created_at)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, display_name = EXCLUDED.display_name`,
        [u.id, u.email, u.password, u.role || 'individual', u.display_name || u.displayName || '', u.avatar_url || null, u.timezone || 'UTC', JSON.stringify(prefs), u.is_verified ? true : false, created_at]
      );
    }

    // ORGANIZATIONS
    const orgs = await db.all('SELECT * FROM organizations');
    console.log('Organizations:', orgs.length);
    for (const o of orgs) {
      const created_at = convertTimestampMaybe(o.created_at) || new Date().toISOString();
      const settings = o.settings ? safeParseJson(o.settings) : {};
      await pg.query(
        `INSERT INTO organizations(id, name, admin_user_id, settings, wellness_score, created_at)
         VALUES($1,$2,$3,$4,$5,$6)
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
        [o.id, o.name, o.admin_user_id || null, JSON.stringify(settings), o.wellness_score || 0, created_at]
      );
    }

    // EMPLOYEES
    const employees = await db.all('SELECT * FROM employees');
    console.log('Employees:', employees.length);
    for (const e of employees) {
      await pg.query(
        `INSERT INTO employees(id, user_id, org_id, job_title, department, anonymized_id, wellness_streak)
         VALUES($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (id) DO NOTHING`,
        [e.id, e.user_id, e.org_id, e.job_title || null, e.department || null, e.anonymized_id || null, e.wellness_streak || 0]
      );
    }

    // THERAPISTS
    const therapists = await db.all('SELECT * FROM therapists');
    console.log('Therapists:', therapists.length);
    for (const t of therapists) {
      const availability = t.availability ? safeParseJson(t.availability) : {};
      await pg.query(
        `INSERT INTO therapists(id, name, specialization, license_number, profile_url, rating, availability)
         VALUES($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
        [t.id, t.name, t.specialization || null, t.license_number || null, t.profile_url || null, t.rating || 0, availability ? JSON.stringify(availability) : null]
      );
    }

    // JOURNALS
    const journals = await db.all('SELECT * FROM journals');
    console.log('Journals:', journals.length);
    for (const j of journals) {
      const created_at = convertTimestampMaybe(j.created_at);
      await pg.query(
        `INSERT INTO journals(id, user_id, mood_score, content, tags, is_private, created_at)
         VALUES($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (id) DO NOTHING`,
        [j.id, j.user_id, j.mood_score || null, j.content || null, j.tags ? JSON.stringify(safeParseJson(j.tags)) : JSON.stringify([]), j.is_private ? true : false, created_at]
      );
    }

    // MOOD_ENTRIES
    const moods = await db.all('SELECT * FROM mood_entries');
    console.log('Mood entries:', moods.length);
    for (const m of moods) {
      const created_at = convertTimestampMaybe(m.created_at);
      await pg.query(
        `INSERT INTO mood_entries(id, user_id, mood_score, notes, created_at)
         VALUES($1,$2,$3,$4,$5)
         ON CONFLICT (id) DO NOTHING`,
        [m.id, m.user_id, m.mood_score || null, m.notes || null, created_at]
      );
    }

    // APPOINTMENTS
    const appointments = await db.all('SELECT * FROM appointments');
    console.log('Appointments:', appointments.length);
    for (const a of appointments) {
      const startTime = convertTimestampMaybe(a.start_time);
      const endTime = convertTimestampMaybe(a.end_time);
      await pg.query(
        `INSERT INTO appointments(id, therapist_id, user_id, start_time, end_time, status, notes)
         VALUES($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (id) DO NOTHING`,
        [a.id, a.therapist_id || null, a.user_id || null, startTime, endTime, a.status || 'pending', a.notes || null]
      );
    }

    // COURSES
    const courses = await db.all('SELECT * FROM courses');
    console.log('Courses:', courses.length);
    for (const c of courses) {
      const modules = c.modules ? safeParseJson(c.modules) : {};
      await pg.query(
        `INSERT INTO courses(id, title, description, duration_minutes, difficulty, thumbnail_url, modules)
         VALUES($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (id) DO NOTHING`,
        [c.id, c.title, c.description || null, c.duration_minutes || null, c.difficulty || null, c.thumbnail_url || null, modules ? JSON.stringify(modules) : null]
      );
    }

    // WELLNESS_ASSESSMENTS
    const assessments = await db.all('SELECT * FROM wellness_assessments');
    console.log('Assessments:', assessments.length);
    for (const w of assessments) {
      const questions = w.questions ? safeParseJson(w.questions) : {};
      await pg.query(
        `INSERT INTO wellness_assessments(id, org_id, title, questions, is_active)
         VALUES($1,$2,$3,$4,$5)
         ON CONFLICT (id) DO NOTHING`,
        [w.id, w.org_id || null, w.title || null, questions ? JSON.stringify(questions) : null, w.is_active ? true : false]
      );
    }

    // ASSESSMENT_RESPONSES
    const responses = await db.all('SELECT * FROM assessment_responses');
    console.log('Assessment responses:', responses.length);
    for (const r of responses) {
      await pg.query(
        `INSERT INTO assessment_responses(id, assessment_id, user_id, responses, total_score, category_scores, recommendations, completed_at)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT (id) DO NOTHING`,
        [r.id, r.assessment_id || null, r.user_id || null, r.responses ? JSON.stringify(safeParseJson(r.responses)) : null, r.total_score || null, r.category_scores ? JSON.stringify(safeParseJson(r.category_scores)) : null, r.recommendations ? JSON.stringify(safeParseJson(r.recommendations)) : null, convertTimestampMaybe(r.completed_at)]
      );
    }

    // BUDDY_MATCHES
    const buddies = await db.all('SELECT * FROM buddy_matches');
    console.log('Buddy matches:', buddies.length);
    for (const b of buddies) {
      await pg.query(
        `INSERT INTO buddy_matches(id, user_a_id, user_b_id, compatibility_score, status, created_at)
         VALUES($1,$2,$3,$4,$5,$6)
         ON CONFLICT (id) DO NOTHING`,
        [b.id, b.user_a_id || null, b.user_b_id || null, b.compatibility_score || null, b.status || 'pending', convertTimestampMaybe(b.created_at)]
      );
    }

    // REFRESH TOKENS (if table exists)
    try {
      const tokens = await db.all('SELECT * FROM refresh_tokens');
      console.log('Refresh tokens:', tokens.length);
      for (const t of tokens) {
        // store as simple token record if table exists
        try {
          await pg.query(`INSERT INTO refresh_tokens(token, user_id, expires_at) VALUES($1,$2,$3) ON CONFLICT (token) DO NOTHING`, [t.token, t.user_id, convertTimestampMaybe(t.expires_at)]);
        } catch (err) {
          console.warn('Skipping refresh token insert (table may not exist):', err.message);
        }
      }
    } catch (err) {
      // table not present in sqlite or pg
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
