// @ts-nocheck
import postgres from 'postgres';
import { randomUUID } from 'crypto';
import bcrypt from 'bcrypt';
import { drizzle } from 'drizzle-orm/postgres-js';
import type { User, InsertUser, Journal, InsertJournal, AnonymousRant, InsertAnonymousRant, MoodEntry, InsertMoodEntry, Therapist, Course, Organization, Employee, Appointment, InsertAppointment } from '@shared/schema';

export class PostgresStorage {
  client: any;
  db: any;

  constructor(databaseUrl: string) {
    // Use postgres client with SSL for Render/Postgres providers
    this.client = postgres(databaseUrl, { ssl: { rejectUnauthorized: false }, max: 5 });
    // drizzle wrapper in case it's needed elsewhere
    try {
      this.db = drizzle(this.client);
    } catch (e) {
      this.db = undefined;
    }
  }

  async close() {
    await this.client.end();
  }

  // --- Users ---
  async getUser(id: string): Promise<User | undefined> {
    const r = await this.client`SELECT * FROM users WHERE id = ${id} LIMIT 1`;
    if (!r || r.length === 0) return undefined;
    const row = r[0];
    return {
      id: row.id,
      email: row.email,
      displayName: row.display_name,
      role: row.role,
      password: row.password,
      avatarUrl: row.avatar_url,
      timezone: row.timezone,
      preferences: row.preferences ? JSON.parse(row.preferences) : {},
      createdAt: row.created_at
    } as unknown as User;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const r = await this.client`SELECT * FROM users WHERE email = ${email} LIMIT 1`;
    if (!r || r.length === 0) return undefined;
    return this.getUser(r[0].id);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const hashed = await bcrypt.hash(insertUser.password, 10);
    await this.client`INSERT INTO users (id,email,password,role,display_name,avatar_url,timezone,preferences,created_at) VALUES (${id}, ${insertUser.email}, ${hashed}, ${insertUser.role}, ${insertUser.displayName}, ${insertUser.avatarUrl || null}, ${insertUser.timezone || 'UTC'}, ${JSON.stringify(insertUser.preferences || {})}, now())`;
    return (await this.getUser(id)) as User;
  }

  async verifyPassword(email: string, password: string): Promise<User | null> {
    const r = await this.client`SELECT * FROM users WHERE email = ${email} LIMIT 1`;
    if (!r || r.length === 0) return null;
    const row = r[0];
    const ok = await bcrypt.compare(password, row.password);
    return ok ? (await this.getUser(row.id)) as User : null;
  }

  // --- Journals ---
  async createJournal(insertJournal: InsertJournal): Promise<Journal> {
    const id = randomUUID();
    await this.client`INSERT INTO journals (id,user_id,mood_score,content,tags,is_private,created_at) VALUES (${id}, ${insertJournal.userId}, ${insertJournal.moodScore || null}, ${insertJournal.content || null}, ${JSON.stringify(insertJournal.tags || [])}, ${insertJournal.isPrivate ? 1 : 0}, now())`;
    const r = await this.client`SELECT * FROM journals WHERE id = ${id} LIMIT 1`;
    const row = r[0];
    return { id: row.id, userId: row.user_id, moodScore: row.mood_score, content: row.content, tags: row.tags ? JSON.parse(row.tags) : [], isPrivate: !!row.is_private, createdAt: row.created_at } as Journal;
  }

  async getUserJournals(userId: string): Promise<Journal[]> {
    const rows = await this.client`SELECT * FROM journals WHERE user_id = ${userId} ORDER BY created_at DESC`;
    return rows.map((r: any) => ({ id: r.id, userId: r.user_id, moodScore: r.mood_score, content: r.content, tags: r.tags ? JSON.parse(r.tags) : [], isPrivate: !!r.is_private, createdAt: r.created_at }));
  }

  async getJournal(id: string): Promise<Journal | undefined> {
    const r = await this.client`SELECT * FROM journals WHERE id = ${id} LIMIT 1`;
    if (!r || r.length === 0) return undefined;
    const row = r[0];
    return { id: row.id, userId: row.user_id, moodScore: row.mood_score, content: row.content, tags: row.tags ? JSON.parse(row.tags) : [], isPrivate: !!row.is_private, createdAt: row.created_at } as Journal;
  }

  async updateJournal(id: string, updates: Partial<Journal>): Promise<Journal | undefined> {
    const existing = await this.getJournal(id);
    if (!existing) return undefined;
    const newObj = { ...existing, ...updates };
    await this.client`UPDATE journals SET mood_score = ${newObj.moodScore || null}, content = ${newObj.content || null}, tags = ${JSON.stringify(newObj.tags || [])}, is_private = ${newObj.isPrivate ? 1 : 0} WHERE id = ${id}`;
    return this.getJournal(id);
  }

  async deleteJournal(id: string): Promise<boolean> {
    const r = await this.client`DELETE FROM journals WHERE id = ${id}`;
    return true;
  }

  // --- Anonymous rants ---
  async createAnonymousRant(insertRant: InsertAnonymousRant): Promise<AnonymousRant> {
    const id = randomUUID();
    await this.client`INSERT INTO anonymous_rants (id,anonymous_token,content,sentiment_score,support_count,created_at) VALUES (${id}, ${insertRant.anonymousToken}, ${insertRant.content}, ${insertRant.sentimentScore || null}, 0, now())`;
    const r = await this.client`SELECT * FROM anonymous_rants WHERE id = ${id} LIMIT 1`;
    const row = r[0];
    return { id: row.id, anonymousToken: row.anonymous_token, content: row.content, sentimentScore: row.sentiment_score, supportCount: row.support_count, createdAt: row.created_at } as AnonymousRant;
  }

  async getAnonymousRants(): Promise<AnonymousRant[]> {
    const rows = await this.client`SELECT * FROM anonymous_rants ORDER BY created_at DESC`;
    return rows.map((r: any) => ({ id: r.id, anonymousToken: r.anonymous_token, content: r.content, sentimentScore: r.sentiment_score, supportCount: r.support_count, createdAt: r.created_at }));
  }

  async supportAnonymousRant(id: string): Promise<boolean> {
    await this.client`UPDATE anonymous_rants SET support_count = COALESCE(support_count,0) + 1 WHERE id = ${id}`;
    return true;
  }

  // --- Mood entries ---
  async createMoodEntry(insertEntry: InsertMoodEntry): Promise<MoodEntry> {
    const id = randomUUID();
    await this.client`INSERT INTO mood_entries (id,user_id,mood_score,notes,created_at) VALUES (${id}, ${insertEntry.userId}, ${insertEntry.moodScore}, ${insertEntry.notes || null}, now())`;
    const r = await this.client`SELECT * FROM mood_entries WHERE id = ${id} LIMIT 1`;
    const row = r[0];
    return { id: row.id, userId: row.user_id, moodScore: row.mood_score, notes: row.notes, createdAt: row.created_at } as MoodEntry;
  }

  async getUserMoodEntries(userId: string, days: number = 30): Promise<MoodEntry[]> {
    const rows = await this.client`SELECT * FROM mood_entries WHERE user_id = ${userId} AND created_at >= now() - INTERVAL '${days} days' ORDER BY created_at DESC`;
    return rows.map((r: any) => ({ id: r.id, userId: r.user_id, moodScore: r.mood_score, notes: r.notes, createdAt: r.created_at }));
  }

  // --- Therapists & Courses ---
  async getTherapists(): Promise<Therapist[]> {
    const rows = await this.client`SELECT * FROM therapists`;
    return rows.map((r: any) => ({ id: r.id, name: r.name, specialization: r.specialization, licenseNumber: r.license_number, profileUrl: r.profile_url, rating: r.rating, availability: r.availability ? JSON.parse(r.availability) : {} }));
  }

  async getTherapist(id: string): Promise<Therapist | undefined> {
    const r = await this.client`SELECT * FROM therapists WHERE id = ${id} LIMIT 1`;
    if (!r || r.length === 0) return undefined;
    const row = r[0];
    return { id: row.id, name: row.name, specialization: row.specialization, licenseNumber: row.license_number, profileUrl: row.profile_url, rating: row.rating, availability: row.availability ? JSON.parse(row.availability) : {} };
  }

  async getCourses(): Promise<Course[]> {
    const rows = await this.client`SELECT * FROM courses`;
    return rows.map((r: any) => ({ id: r.id, title: r.title, description: r.description, durationMinutes: r.duration_minutes, difficulty: r.difficulty, thumbnailUrl: r.thumbnail_url, modules: r.modules ? JSON.parse(r.modules) : {} }));
  }

  async getCourse(id: string): Promise<Course | undefined> {
    const r = await this.client`SELECT * FROM courses WHERE id = ${id} LIMIT 1`;
    if (!r || r.length === 0) return undefined;
    const row = r[0];
    return { id: row.id, title: row.title, description: row.description, durationMinutes: row.duration_minutes, difficulty: row.difficulty, thumbnailUrl: row.thumbnail_url, modules: row.modules ? JSON.parse(row.modules) : {} };
  }

  // --- Organizations & employees (basic) ---
  async getOrganization(id: string): Promise<Organization | undefined> {
    const r = await this.client`SELECT * FROM organizations WHERE id = ${id} LIMIT 1`;
    if (!r || r.length === 0) return undefined;
    const row = r[0];
    return { id: row.id, name: row.name, adminUserId: row.admin_user_id, settings: row.settings ? JSON.parse(row.settings) : {}, wellnessScore: row.wellness_score, createdAt: row.created_at } as Organization;
  }

  async getEmployeesByOrg(orgId: string): Promise<Employee[]> {
    const rows = await this.client`SELECT * FROM employees WHERE org_id = ${orgId}`;
    return rows.map((r: any) => ({ id: r.id, userId: r.user_id, orgId: r.org_id, jobTitle: r.job_title, department: r.department, anonymizedId: r.anonymized_id, wellnessStreak: r.wellness_streak }));
  }

  // --- Refresh tokens ---
  async createRefreshToken(userId: string, expiresInDays: number = 7): Promise<string> {
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString();
    await this.client`INSERT INTO refresh_tokens (token,user_id,expires_at) VALUES (${token}, ${userId}, ${expiresAt})`;
    return token;
  }

  async verifyRefreshToken(token: string): Promise<string | null> {
    const r = await this.client`SELECT * FROM refresh_tokens WHERE token = ${token} LIMIT 1`;
    if (!r || r.length === 0) return null;
    const row = r[0];
    if (new Date(row.expires_at).getTime() < Date.now()) {
      await this.client`DELETE FROM refresh_tokens WHERE token = ${token}`;
      return null;
    }
    return row.user_id;
  }

  async deleteRefreshToken(token: string): Promise<void> {
    await this.client`DELETE FROM refresh_tokens WHERE token = ${token}`;
  }
}

export default PostgresStorage;
