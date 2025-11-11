// @ts-nocheck
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import type { User, InsertUser, Journal, InsertJournal, AnonymousRant, InsertAnonymousRant, MoodEntry, InsertMoodEntry, Therapist, Course, Organization, Employee, Appointment, InsertAppointment } from '@mindfulme/shared';

export class SqliteStorage {
  private db: any;

  constructor(dbPath: string = './data/db.sqlite') {
    // Ensure parent directory exists (Render ephemeral FS still allows runtime writes)
    try {
      const dir = path.dirname(dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    } catch (e) {
      console.warn('Could not ensure SQLite data directory exists:', e);
    }
    this.db = new Database(dbPath);
    this.migrate();
    // Seed demo data if DB is empty
    try {
      seedData.call(this);
    } catch (err) {
      // non-fatal seeding error
      console.warn('SQLite seeding failed:', err);
    }
  }

  private migrate() {
    // Create tables (simple schema compatible with prompt)
    const createStatements = [
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE,
        password TEXT,
        role TEXT,
        display_name TEXT,
        avatar_url TEXT,
        timezone TEXT,
        preferences TEXT,
        created_at INTEGER
      )`,
      `CREATE TABLE IF NOT EXISTS organizations (
        id TEXT PRIMARY KEY,
        name TEXT,
        admin_user_id TEXT,
        settings TEXT,
        wellness_score REAL,
        created_at INTEGER
      )`,
      `CREATE TABLE IF NOT EXISTS employees (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        org_id TEXT,
        job_title TEXT,
        department TEXT,
        anonymized_id TEXT UNIQUE,
        wellness_streak INTEGER
      )`,
      `CREATE TABLE IF NOT EXISTS journals (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        mood_score INTEGER,
        content TEXT,
        tags TEXT,
        is_private INTEGER,
        created_at INTEGER
      )`,
      `CREATE TABLE IF NOT EXISTS anonymous_rants (
        id TEXT PRIMARY KEY,
        anonymous_token TEXT,
        content TEXT,
        sentiment_score REAL,
        support_count INTEGER,
        created_at INTEGER
      )`,
      `CREATE TABLE IF NOT EXISTS therapists (
        id TEXT PRIMARY KEY,
        name TEXT,
        specialization TEXT,
        license_number TEXT,
        profile_url TEXT,
        rating REAL,
        availability TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS appointments (
        id TEXT PRIMARY KEY,
        therapist_id TEXT,
        user_id TEXT,
        start_time INTEGER,
        end_time INTEGER,
        status TEXT,
        notes TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS courses (
        id TEXT PRIMARY KEY,
        title TEXT,
        description TEXT,
        duration_minutes INTEGER,
        difficulty TEXT,
        thumbnail_url TEXT,
        modules TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS mood_entries (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        mood_score INTEGER,
        notes TEXT,
        created_at INTEGER
      )`,
      `CREATE TABLE IF NOT EXISTS refresh_tokens (
        token TEXT PRIMARY KEY,
        user_id TEXT,
        expires_at INTEGER
      )`
    ];

    // Buddy matches
    createStatements.push(`CREATE TABLE IF NOT EXISTS buddy_matches (
      id TEXT PRIMARY KEY,
      user_a_id TEXT,
      user_b_id TEXT,
      compatibility_score REAL,
      status TEXT,
      created_at INTEGER
    )`);

    // Wellness Assessments
    createStatements.push(`CREATE TABLE IF NOT EXISTS wellness_assessments (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      assessment_type TEXT,
      title TEXT,
      questions TEXT,
      is_active INTEGER,
      created_at INTEGER
    )`);

    createStatements.push(`CREATE TABLE IF NOT EXISTS assessment_responses (
      id TEXT PRIMARY KEY,
      assessment_id TEXT,
      user_id TEXT,
      responses TEXT,
      total_score REAL,
      category_scores TEXT,
      recommendations TEXT,
      completed_at INTEGER
    )`);

    const tx = this.db.transaction(() => {
      for (const s of createStatements) this.db.prepare(s).run();
    });
    tx();
  }

  // --- Users ---
  async getUser(id: string): Promise<User | undefined> {
    const row = this.db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    if (!row) return undefined;
    return {
      id: row.id,
      email: row.email,
      displayName: row.display_name,
      role: row.role,
      password: row.password,
      avatarUrl: row.avatar_url,
      timezone: row.timezone,
      preferences: row.preferences ? JSON.parse(row.preferences) : {},
      createdAt: new Date(row.created_at)
    } as unknown as User;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const row = this.db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!row) return undefined;
    return await this.getUser(row.id);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const hashed = await bcrypt.hash(insertUser.password, 10);
    this.db.prepare(`INSERT INTO users (id,email,password,role,display_name,avatar_url,timezone,preferences,created_at) VALUES (?,?,?,?,?,?,?,?,?)`).run(
      id, insertUser.email, hashed, insertUser.role, insertUser.displayName, insertUser.avatarUrl || null, insertUser.timezone || 'UTC', JSON.stringify(insertUser.preferences || {}), Date.now()
    );
    return (await this.getUser(id)) as User;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const fields = [];
    const values = [];

    if (updates.displayName !== undefined) {
      fields.push('display_name = ?');
      values.push(updates.displayName);
    }
    if (updates.email !== undefined) {
      fields.push('email = ?');
      values.push(updates.email);
    }
    if (updates.avatarUrl !== undefined) {
      fields.push('avatar_url = ?');
      values.push(updates.avatarUrl);
    }
    if (updates.preferences !== undefined) {
      fields.push('preferences = ?');
      values.push(JSON.stringify(updates.preferences));
    }

    // Support password updates (for password change endpoint)
    if ((updates as any).password !== undefined) {
      fields.push('password = ?');
      values.push((updates as any).password);
      console.log(`[SQLite updateUser] Password field detected, will update password`);
    }

    if (fields.length === 0) return await this.getUser(id);

    values.push(id);
    const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
    console.log(`[SQLite updateUser] Query: ${sql}`);
    console.log(`[SQLite updateUser] Values count: ${values.length}, Fields: ${fields.join(', ')}`);
    
    const result = this.db.prepare(sql).run(...values);
    console.log(`[SQLite updateUser] Update result changes: ${result.changes}`);

    return await this.getUser(id);
  }

  async verifyPassword(email: string, password: string): Promise<User | null> {
    const row = this.db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!row) return null;
    const ok = await bcrypt.compare(password, row.password);
    return ok ? (await this.getUser(row.id)) as User : null;
  }

  // --- Journals ---
  async createJournal(insertJournal: InsertJournal): Promise<Journal> {
    const id = randomUUID();
    this.db.prepare(`INSERT INTO journals (id,user_id,mood_score,content,tags,is_private,created_at) VALUES (?,?,?,?,?,?,?)`).run(
      id, insertJournal.userId, insertJournal.moodScore || null, insertJournal.content || null, JSON.stringify(insertJournal.tags || []), insertJournal.isPrivate ? 1 : 0, Date.now()
    );
    return (await this.getJournal(id)) as Journal;
  }

  async getUserJournals(userId: string): Promise<Journal[]> {
    const rows = this.db.prepare('SELECT * FROM journals WHERE user_id = ? ORDER BY created_at DESC').all(userId);
    return rows.map((r: any) => ({
      id: r.id,
      userId: r.user_id,
      moodScore: r.mood_score,
      content: r.content,
      tags: r.tags ? JSON.parse(r.tags) : [],
      isPrivate: !!r.is_private,
      createdAt: new Date(r.created_at)
    }));
  }

  async getJournal(id: string): Promise<Journal | undefined> {
    const r = this.db.prepare('SELECT * FROM journals WHERE id = ?').get(id);
    if (!r) return undefined;
    return {
      id: r.id,
      userId: r.user_id,
      moodScore: r.mood_score,
      content: r.content,
      tags: r.tags ? JSON.parse(r.tags) : [],
      isPrivate: !!r.is_private,
      createdAt: new Date(r.created_at)
    };
  }

  async updateJournal(id: string, updates: Partial<Journal>): Promise<Journal | undefined> {
    const existing = await this.getJournal(id);
    if (!existing) return undefined;
    const newObj = { ...existing, ...updates };
    this.db.prepare(`UPDATE journals SET mood_score = ?, content = ?, tags = ?, is_private = ? WHERE id = ?`).run(
      newObj.moodScore || null, newObj.content || null, JSON.stringify(newObj.tags || []), newObj.isPrivate ? 1 : 0, id
    );
    return await this.getJournal(id);
  }

  async deleteJournal(id: string): Promise<boolean> {
    const info = this.db.prepare('DELETE FROM journals WHERE id = ?').run(id);
    return info.changes > 0;
  }

  // --- Anonymous rants ---
  async createAnonymousRant(insertRant: InsertAnonymousRant): Promise<AnonymousRant> {
    const id = randomUUID();
    this.db.prepare(`INSERT INTO anonymous_rants (id,anonymous_token,content,sentiment_score,support_count,created_at) VALUES (?,?,?,?,?,?)`).run(
      id, insertRant.anonymousToken, insertRant.content, insertRant.sentimentScore || null, 0, Date.now()
    );
    const row = this.db.prepare('SELECT * FROM anonymous_rants WHERE id = ?').get(id);
    return { id: row.id, anonymousToken: row.anonymous_token, content: row.content, sentimentScore: row.sentiment_score, supportCount: row.support_count, createdAt: new Date(row.created_at) };
  }

  async getAnonymousRants(): Promise<AnonymousRant[]> {
    const rows = this.db.prepare('SELECT * FROM anonymous_rants ORDER BY created_at DESC').all();
    return rows.map((r: any) => ({ id: r.id, anonymousToken: r.anonymous_token, content: r.content, sentimentScore: r.sentiment_score, supportCount: r.support_count, createdAt: new Date(r.created_at) }));
  }

  async supportAnonymousRant(id: string): Promise<boolean> {
    const info = this.db.prepare('UPDATE anonymous_rants SET support_count = support_count + 1 WHERE id = ?').run(id);
    return info.changes > 0;
  }

  // --- Mood entries ---
  async createMoodEntry(insertEntry: InsertMoodEntry): Promise<MoodEntry> {
    const id = randomUUID();
    this.db.prepare('INSERT INTO mood_entries (id,user_id,mood_score,notes,created_at) VALUES (?,?,?,?,?)').run(id, insertEntry.userId, insertEntry.moodScore, insertEntry.notes || null, Date.now());
    const r = this.db.prepare('SELECT * FROM mood_entries WHERE id = ?').get(id);
    return { id: r.id, userId: r.user_id, moodScore: r.mood_score, notes: r.notes, createdAt: new Date(r.created_at) };
  }

  async getUserMoodEntries(userId: string, days: number = 30): Promise<MoodEntry[]> {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const rows = this.db.prepare('SELECT * FROM mood_entries WHERE user_id = ? AND created_at >= ? ORDER BY created_at DESC').all(userId, cutoff);
    return rows.map((r: any) => ({ id: r.id, userId: r.user_id, moodScore: r.mood_score, notes: r.notes, createdAt: new Date(r.created_at) }));
  }

  // --- Therapists & appointments & courses ---
  async getTherapists(): Promise<Therapist[]> {
    const rows = this.db.prepare('SELECT * FROM therapists').all();
    return rows.map((r: any) => ({ id: r.id, name: r.name, specialization: r.specialization, licenseNumber: r.license_number, profileUrl: r.profile_url, rating: r.rating, availability: r.availability ? JSON.parse(r.availability) : {} }));
  }

  async getTherapist(id: string): Promise<Therapist | undefined> {
    const r = this.db.prepare('SELECT * FROM therapists WHERE id = ?').get(id);
    if (!r) return undefined;
    return { id: r.id, name: r.name, specialization: r.specialization, licenseNumber: r.license_number, profileUrl: r.profile_url, rating: r.rating, availability: r.availability ? JSON.parse(r.availability) : {} };
  }

  async createAppointment(insertAppointment: InsertAppointment): Promise<Appointment> {
    const id = randomUUID();
    this.db.prepare('INSERT INTO appointments (id,therapist_id,user_id,start_time,end_time,status,notes) VALUES (?,?,?,?,?,?,?)').run(
      id, insertAppointment.therapistId || null, insertAppointment.userId || null, insertAppointment.startTime ? new Date(insertAppointment.startTime).getTime() : null, insertAppointment.endTime ? new Date(insertAppointment.endTime).getTime() : null, 'pending', insertAppointment.notes || null
    );
    const r = this.db.prepare('SELECT * FROM appointments WHERE id = ?').get(id);
    return { id: r.id, therapistId: r.therapist_id, userId: r.user_id, startTime: r.start_time ? new Date(r.start_time) : null, endTime: r.end_time ? new Date(r.end_time) : null, status: r.status, notes: r.notes } as Appointment;
  }

  async getUserAppointments(userId: string): Promise<Appointment[]> {
    const rows = this.db.prepare('SELECT * FROM appointments WHERE user_id = ? ORDER BY start_time ASC').all(userId);
    return rows.map((r: any) => ({ id: r.id, therapistId: r.therapist_id, userId: r.user_id, startTime: r.start_time ? new Date(r.start_time) : null, endTime: r.end_time ? new Date(r.end_time) : null, status: r.status, notes: r.notes }));
  }

  async getCourses(): Promise<Course[]> {
    const rows = this.db.prepare('SELECT * FROM courses').all();
    return rows.map((r: any) => ({ id: r.id, title: r.title, description: r.description, durationMinutes: r.duration_minutes, difficulty: r.difficulty, thumbnailUrl: r.thumbnail_url, modules: r.modules ? JSON.parse(r.modules) : {} }));
  }

  async getCourse(id: string): Promise<Course | undefined> {
    const r = this.db.prepare('SELECT * FROM courses WHERE id = ?').get(id);
    if (!r) return undefined;
    return { id: r.id, title: r.title, description: r.description, durationMinutes: r.duration_minutes, difficulty: r.difficulty, thumbnailUrl: r.thumbnail_url, modules: r.modules ? JSON.parse(r.modules) : {} };
  }

  // --- Organizations & employees ---
  async getOrganization(id: string): Promise<Organization | undefined> {
    const r = this.db.prepare('SELECT * FROM organizations WHERE id = ?').get(id);
    if (!r) return undefined;
    return { id: r.id, name: r.name, adminUserId: r.admin_user_id, settings: r.settings ? JSON.parse(r.settings) : {}, wellnessScore: r.wellness_score, createdAt: new Date(r.created_at) } as Organization;
  }

  async getEmployeesByOrg(orgId: string): Promise<Employee[]> {
    const rows = this.db.prepare('SELECT * FROM employees WHERE org_id = ?').all(orgId);
    return rows.map((r: any) => ({ id: r.id, userId: r.user_id, orgId: r.org_id, jobTitle: r.job_title, department: r.department, anonymizedId: r.anonymized_id, wellnessStreak: r.wellness_streak }));
  }

  async getOrganizationWellnessMetrics(orgId: string): Promise<any> {
    // Simple aggregate: average mood for org employees
    const employees = this.getEmployeesByOrg(orgId);
    // return mock metrics for now
    return {
      teamWellness: 7.5,
      engagement: 0.85,
      sessionsThisWeek: 42,
      atRiskCount: 2,
      departments: [
        { name: 'Engineering', average: 8.0, status: 'good' }
      ]
    };
  }

  async createOrganization(name: string, adminUserId: string): Promise<Organization> {
    const id = randomUUID();
    this.db.prepare('INSERT INTO organizations (id,name,admin_user_id,settings,wellness_score,created_at) VALUES (?,?,?,?,?,?)').run(id, name, adminUserId, JSON.stringify({}), 0, Date.now());
    return (await this.getOrganization(id)) as Organization;
  }

  async addEmployeeToOrg(userId: string, orgId: string, jobTitle?: string, department?: string): Promise<Employee> {
    const id = randomUUID();
    const anonymized = randomUUID();
    this.db.prepare('INSERT INTO employees (id,user_id,org_id,job_title,department,anonymized_id,wellness_streak) VALUES (?,?,?,?,?,?,?)').run(id, userId, orgId, jobTitle || null, department || null, anonymized, 0);
    const r = this.db.prepare('SELECT * FROM employees WHERE id = ?').get(id);
    return { id: r.id, userId: r.user_id, orgId: r.org_id, jobTitle: r.job_title, department: r.department, anonymizedId: r.anonymized_id, wellnessStreak: r.wellness_streak };
  }

  // --- Refresh tokens ---
  async createRefreshToken(userId: string, expiresInDays: number = 7): Promise<string> {
    const token = randomUUID();
    const expiresAt = Date.now() + expiresInDays * 24 * 60 * 60 * 1000;
    this.db.prepare('INSERT INTO refresh_tokens (token,user_id,expires_at) VALUES (?,?,?)').run(token, userId, expiresAt);
    return token;
  }

  async verifyRefreshToken(token: string): Promise<string | null> {
    const r = this.db.prepare('SELECT * FROM refresh_tokens WHERE token = ?').get(token);
    if (!r) return null;
    if (r.expires_at < Date.now()) {
      this.db.prepare('DELETE FROM refresh_tokens WHERE token = ?').run(token);
      return null;
    }
    return r.user_id;
  }

  async deleteRefreshToken(token: string): Promise<void> {
    this.db.prepare('DELETE FROM refresh_tokens WHERE token = ?').run(token);
  }

  // --- Buddy matching ---
  async suggestBuddies(userId: string, limit: number = 5): Promise<any[]> {
    // Simple suggestion: pick random users excluding self
    const rows = this.db.prepare('SELECT id, email, display_name FROM users WHERE id != ? ORDER BY RANDOM() LIMIT ?').all(userId, limit);
    return rows.map((r: any) => ({ id: r.id, displayName: r.display_name, email: r.email }));
  }

  async createBuddyMatch(userA: string, userB: string, score: number = 0): Promise<any> {
    const id = randomUUID();
    this.db.prepare('INSERT INTO buddy_matches (id,user_a_id,user_b_id,compatibility_score,status,created_at) VALUES (?,?,?,?,?,?)').run(id, userA, userB, score, 'pending', Date.now());
    const r = this.db.prepare('SELECT * FROM buddy_matches WHERE id = ?').get(id);
    return { id: r.id, userAId: r.user_a_id, userBId: r.user_b_id, compatibilityScore: r.compatibility_score, status: r.status, createdAt: new Date(r.created_at) };
  }

  async updateBuddyMatchStatus(matchId: string, status: 'pending' | 'accepted' | 'declined'): Promise<boolean> {
    const info = this.db.prepare('UPDATE buddy_matches SET status = ? WHERE id = ?').run(status, matchId);
    return info.changes > 0;
  }

  async getBuddyMatches(userId: string): Promise<any[]> {
    const rows = this.db.prepare('SELECT * FROM buddy_matches WHERE user_a_id = ? OR user_b_id = ? ORDER BY created_at DESC').all(userId, userId);
    return rows.map((r: any) => ({ id: r.id, userAId: r.user_a_id, userBId: r.user_b_id, compatibilityScore: r.compatibility_score, status: r.status, createdAt: new Date(r.created_at) }));
  }

  // --- Wellness Assessments ---
  async getWellnessAssessments(userId: string): Promise<any[]> {
    // Check if user has any assessments, if not create default one
    const existing = this.db.prepare('SELECT * FROM wellness_assessments WHERE user_id = ?').all(userId);
    if (existing.length === 0) {
      this.createDefaultAssessment(userId);
    }

    const rows = this.db.prepare('SELECT * FROM wellness_assessments WHERE user_id = ? AND is_active = 1').all(userId);
    return rows.map((r: any) => ({
      id: r.id,
      userId: r.user_id,
      assessmentType: r.assessment_type,
      title: r.title,
      questions: JSON.parse(r.questions),
      isActive: r.is_active === 1,
      createdAt: new Date(r.created_at)
    }));
  }

  async getWellnessAssessment(id: string): Promise<any> {
    const row = this.db.prepare('SELECT * FROM wellness_assessments WHERE id = ?').get(id);
    if (!row) return null;

    return {
      id: row.id,
      userId: row.user_id,
      assessmentType: row.assessment_type,
      title: row.title,
      questions: JSON.parse(row.questions),
      isActive: row.is_active === 1,
      createdAt: new Date(row.created_at)
    };
  }

  async createAssessmentResponse(response: any): Promise<any> {
    const id = randomUUID();
    this.db.prepare(`
      INSERT INTO assessment_responses (id, assessment_id, user_id, responses, total_score, category_scores, recommendations, completed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      response.assessmentId,
      response.userId,
      JSON.stringify(response.responses),
      response.totalScore,
      JSON.stringify(response.categoryScores),
      JSON.stringify(response.recommendations),
      Date.now()
    );

    return {
      id,
      ...response,
      completedAt: new Date()
    };
  }

  async getUserAssessmentResponses(userId: string): Promise<any[]> {
    const rows = this.db.prepare('SELECT * FROM assessment_responses WHERE user_id = ? ORDER BY completed_at DESC').all(userId);
    return rows.map((r: any) => ({
      id: r.id,
      assessmentId: r.assessment_id,
      userId: r.user_id,
      responses: JSON.parse(r.responses),
      totalScore: r.total_score,
      categoryScores: JSON.parse(r.category_scores),
      recommendations: JSON.parse(r.recommendations),
      completedAt: new Date(r.completed_at)
    }));
  }

  async getLatestAssessmentResponse(userId: string): Promise<any> {
    const row = this.db.prepare('SELECT * FROM assessment_responses WHERE user_id = ? ORDER BY completed_at DESC LIMIT 1').get(userId);
    if (!row) return null;

    return {
      id: row.id,
      assessmentId: row.assessment_id,
      userId: row.user_id,
      responses: JSON.parse(row.responses),
      totalScore: row.total_score,
      categoryScores: JSON.parse(row.category_scores),
      recommendations: JSON.parse(row.recommendations),
      completedAt: new Date(row.completed_at)
    };
  }

  private createDefaultAssessment(userId: string) {
    const assessmentId = randomUUID();
    const questions = [
      {
        id: 'stress-level',
        question: 'How would you rate your current stress level?',
        type: 'scale',
        options: ['Very Low', 'Low', 'Moderate', 'High', 'Very High'],
        category: 'Stress Management'
      },
      {
        id: 'sleep-quality',
        question: 'How would you describe your sleep quality over the past week?',
        type: 'scale',
        options: ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'],
        category: 'Sleep & Rest'
      },
      {
        id: 'work-life-balance',
        question: 'How satisfied are you with your work-life balance?',
        type: 'scale',
        options: ['Very Dissatisfied', 'Dissatisfied', 'Neutral', 'Satisfied', 'Very Satisfied'],
        category: 'Work-Life Balance'
      },
      {
        id: 'social-support',
        question: 'How strong is your social support network?',
        type: 'scale',
        options: ['Very Weak', 'Weak', 'Moderate', 'Strong', 'Very Strong'],
        category: 'Social Support'
      },
      {
        id: 'physical-activity',
        question: 'How often do you engage in physical activity?',
        type: 'scale',
        options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Very Often'],
        category: 'Physical Health'
      },
      {
        id: 'emotional-regulation',
        question: 'How well can you manage your emotions?',
        type: 'scale',
        options: ['Poorly', 'Below Average', 'Average', 'Above Average', 'Excellent'],
        category: 'Emotional Regulation'
      },
      {
        id: 'mindfulness-practice',
        question: 'How often do you practice mindfulness or meditation?',
        type: 'scale',
        options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Daily'],
        category: 'Mindfulness'
      },
      {
        id: 'goal-clarity',
        question: 'How clear are you about your personal and professional goals?',
        type: 'scale',
        options: ['Not Clear', 'Somewhat Clear', 'Moderately Clear', 'Very Clear', 'Extremely Clear'],
        category: 'Goal Setting'
      },
      {
        id: 'energy-levels',
        question: 'How would you describe your energy levels during the day?',
        type: 'scale',
        options: ['Very Low', 'Low', 'Moderate', 'High', 'Very High'],
        category: 'Energy & Vitality'
      },
      {
        id: 'overall-wellbeing',
        question: 'Overall, how would you rate your current wellbeing?',
        type: 'scale',
        options: ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'],
        category: 'Overall Wellbeing'
      }
    ];

    this.db.prepare(`
      INSERT INTO wellness_assessments (id, user_id, assessment_type, title, questions, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      assessmentId,
      userId,
      'comprehensive',
      'Comprehensive Wellness Assessment',
      JSON.stringify(questions),
      1,
      Date.now()
    );
  }
}

export default SqliteStorage;

// -- seeding helper (kept outside class so it doesn't capture internal state) --
// Note: uses synchronous bcrypt hashing to keep constructor synchronous
function seedData(this: any) {
  try {
    const userCountRow = this.db.prepare('SELECT COUNT(*) as c FROM users').get();
    const count = userCountRow?.c || 0;
    if (count > 0) return;

  // use imports from module scope (avoid require() in ESM runtime)
  // bcrypt and randomUUID are imported at top of file

    // Insert therapists
    const therapist1Id = randomUUID();
    const therapist2Id = randomUUID();
    this.db.prepare('INSERT INTO therapists (id,name,specialization,license_number,profile_url,rating,availability) VALUES (?,?,?,?,?,?,?)')
      .run(therapist1Id, 'Dr. Sarah Chen', 'Anxiety & Stress', 'PSY-001234', 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200', 4.9, JSON.stringify({ status: 'available', nextSlot: 'today' }));
    this.db.prepare('INSERT INTO therapists (id,name,specialization,license_number,profile_url,rating,availability) VALUES (?,?,?,?,?,?,?)')
      .run(therapist2Id, 'Dr. Michael Rodriguez', 'Depression & Mood', 'PSY-005678', 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200', 4.8, JSON.stringify({ status: 'busy', nextSlot: '2pm' }));

    // Insert a course
    const courseId = randomUUID();
    this.db.prepare('INSERT INTO courses (id,title,description,duration_minutes,difficulty,thumbnail_url,modules) VALUES (?,?,?,?,?,?,?)')
      .run(courseId, 'Mindful Breathing Basics', 'Learn fundamental breathing techniques for stress relief', 15, 'Beginner', 'https://images.unsplash.com/photo-1545389336-cf090694435e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=200', JSON.stringify({ count: 5, completed: 0 }));

    // Insert anonymous rants
    const rant1Id = randomUUID();
    const rant2Id = randomUUID();
    this.db.prepare('INSERT INTO anonymous_rants (id,anonymous_token,content,sentiment_score,support_count,created_at) VALUES (?,?,?,?,?,?)')
      .run(rant1Id, randomUUID(), 'Feeling completely overwhelmed with the workload. Management keeps piling on more tasks without considering our bandwidth. It\'s affecting my sleep and personal life. Just needed to get this out somewhere safe.', -0.8, 12, Date.now() - 2 * 60 * 60 * 1000);
    this.db.prepare('INSERT INTO anonymous_rants (id,anonymous_token,content,sentiment_score,support_count,created_at) VALUES (?,?,?,?,?,?)')
      .run(rant2Id, randomUUID(), 'The breathing exercises have really helped me during stressful meetings. Grateful for this platform!', 0.6, 8, Date.now() - 4 * 60 * 60 * 1000);

    // Insert organization
    const orgId = 'org-123';
    this.db.prepare('INSERT INTO organizations (id,name,admin_user_id,settings,wellness_score,created_at) VALUES (?,?,?,?,?,?)').run(orgId, 'TechCorp Inc.', null, JSON.stringify({ allowAnonymousRants: true, requireMoodCheckins: false }), 8.2, Date.now());

    // Insert demo users (admin, manager, employee) with known ids/emails/passwords
    const adminId = 'admin-demo';
    const managerId = 'manager-demo';
    const employeeId = 'employee-demo';
  const adminPass = bcrypt.hashSync('admin123', 10);
  const managerPass = bcrypt.hashSync('manager123', 10);
  const employeePass = bcrypt.hashSync('employee123', 10);

    this.db.prepare('INSERT INTO users (id,email,password,role,display_name,avatar_url,timezone,preferences,created_at) VALUES (?,?,?,?,?,?,?,?,?)')
      .run(adminId, 'admin@foryourmind.com', adminPass, 'admin', 'Admin User', null, 'UTC', JSON.stringify({}), Date.now());
    this.db.prepare('INSERT INTO users (id,email,password,role,display_name,avatar_url,timezone,preferences,created_at) VALUES (?,?,?,?,?,?,?,?,?)')
      .run(managerId, 'manager@techcorp.com', managerPass, 'manager', 'Sarah Johnson', null, 'UTC', JSON.stringify({}), Date.now());
    this.db.prepare('INSERT INTO users (id,email,password,role,display_name,avatar_url,timezone,preferences,created_at) VALUES (?,?,?,?,?,?,?,?,?)')
      .run(employeeId, 'john@techcorp.com', employeePass, 'individual', 'John Smith', null, 'UTC', JSON.stringify({}), Date.now());

    // Add employee record
    const empRecId = randomUUID();
    this.db.prepare('INSERT INTO employees (id,user_id,org_id,job_title,department,anonymized_id,wellness_streak) VALUES (?,?,?,?,?,?,?)')
      .run(empRecId, employeeId, orgId, 'Software Engineer', 'Engineering', randomUUID(), 7);

    // Add a sample mood entry and journal for employee
    const moodId = randomUUID();
    this.db.prepare('INSERT INTO mood_entries (id,user_id,mood_score,notes,created_at) VALUES (?,?,?,?,?)').run(moodId, employeeId, 4, 'Feeling good after morning meditation', Date.now());

    const journalId = randomUUID();
    this.db.prepare('INSERT INTO journals (id,user_id,mood_score,content,tags,is_private,created_at) VALUES (?,?,?,?,?,?,?)')
      .run(journalId, employeeId, 4, 'Today was a productive day. I managed to complete my tasks and even had time for a walk during lunch. Grateful for the support from my team.', JSON.stringify(['gratitude','productivity','team']), 1, Date.now() - 24 * 60 * 60 * 1000);
  } catch (err) {
    // ignore seeding errors but log for visibility
    console.warn('seedData error', err);
  }
}
