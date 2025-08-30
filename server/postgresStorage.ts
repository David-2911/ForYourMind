// @ts-nocheck
import { type User, type InsertUser, type Journal, type InsertJournal, type AnonymousRant, type InsertAnonymousRant, type MoodEntry, type InsertMoodEntry, type Therapist, type Course, type Organization, type Employee, type Appointment, type InsertAppointment } from "@shared/schema";
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";
import { Client } from 'pg';
import { IStorage } from "./storage";

export class PostgresStorage implements IStorage {
  private client: Client;
  private connected: boolean = false;
  
  constructor(connectionString: string) {
    if (!connectionString) {
      throw new Error('DATABASE_URL is required for PostgreSQL storage');
    }
    // Enable TLS when connecting to managed providers (Neon/Supabase/etc.)
    const forceSSL = process.env.PGSSL === 'true';
    const needsSSL = forceSSL || /sslmode=require|neon|supabase|render|heroku|aws/i.test(connectionString);
    this.client = new Client({
      connectionString,
      ...(needsSSL ? { ssl: { rejectUnauthorized: false } } : {}),
    });
    this.connect();
  }
  
  private async connect() {
    if (!this.connected) {
      try {
        await this.client.connect();
        this.connected = true;
        console.log('PostgreSQL connected successfully');
      } catch (err) {
        console.error('PostgreSQL connection error:', err);
        throw err;
      }
    }
  }
  
  // User management
  async getUser(id: string): Promise<User | undefined> {
    try {
      const result = await this.client.query('SELECT * FROM users WHERE id = $1', [id]);
      if (result.rows.length === 0) return undefined;
      
      const user = result.rows[0];
      return {
        id: user.id,
        email: user.email,
        password: user.password,
        role: user.role,
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
        timezone: user.timezone || 'UTC',
        preferences: user.preferences || {},
        createdAt: new Date(user.created_at)
      } as User;
    } catch (err) {
      console.error('Error getting user:', err);
      return undefined;
    }
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const result = await this.client.query('SELECT * FROM users WHERE email = $1', [email]);
      if (result.rows.length === 0) return undefined;
      
      return this.getUser(result.rows[0].id);
    } catch (err) {
      console.error('Error getting user by email:', err);
      return undefined;
    }
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const hashed = await bcrypt.hash(insertUser.password, 10);
    
    try {
      await this.client.query(
        `INSERT INTO users(id, email, password, role, display_name, avatar_url, timezone, preferences, created_at) 
         VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          id,
          insertUser.email,
          hashed,
          insertUser.role || 'individual',
          insertUser.displayName,
          insertUser.avatarUrl || null,
          insertUser.timezone || 'UTC',
          JSON.stringify(insertUser.preferences || {}),
          new Date()
        ]
      );
      
      return (await this.getUser(id)) as User;
    } catch (err) {
      console.error('Error creating user:', err);
      throw new Error(`Failed to create user: ${err.message}`);
    }
  }
  
  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const fields = [];
    const values = [];
    let paramCount = 1;
    
    if (updates.displayName !== undefined) {
      fields.push(`display_name = $${paramCount++}`);
      values.push(updates.displayName);
    }
    
    if (updates.email !== undefined) {
      fields.push(`email = $${paramCount++}`);
      values.push(updates.email);
    }
    
    if (updates.avatarUrl !== undefined) {
      fields.push(`avatar_url = $${paramCount++}`);
      values.push(updates.avatarUrl);
    }
    
    if (updates.preferences !== undefined) {
      fields.push(`preferences = $${paramCount++}`);
      values.push(JSON.stringify(updates.preferences));
    }
    
    if (fields.length === 0) return await this.getUser(id);
    
    values.push(id);
    
    try {
      await this.client.query(
        `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramCount}`,
        values
      );
      
      return await this.getUser(id);
    } catch (err) {
      console.error('Error updating user:', err);
      return undefined;
    }
  }
  
  async verifyPassword(email: string, password: string): Promise<User | null> {
    try {
      const result = await this.client.query('SELECT * FROM users WHERE email = $1', [email]);
      if (result.rows.length === 0) return null;
      
      const user = result.rows[0];
      const ok = await bcrypt.compare(password, user.password);
      
      return ok ? (await this.getUser(user.id)) as User : null;
    } catch (err) {
      console.error('Error verifying password:', err);
      return null;
    }
  }
  
  // Journal operations
  async createJournal(insertJournal: InsertJournal): Promise<Journal> {
    const id = randomUUID();
    
    try {
      await this.client.query(
        `INSERT INTO journals(id, user_id, mood_score, content, tags, is_private, created_at)
         VALUES($1, $2, $3, $4, $5, $6, $7)`,
        [
          id,
          insertJournal.userId,
          insertJournal.moodScore || null,
          insertJournal.content || null,
          JSON.stringify(insertJournal.tags || []),
          insertJournal.isPrivate === undefined ? true : insertJournal.isPrivate,
          new Date()
        ]
      );
      
      const result = await this.client.query('SELECT * FROM journals WHERE id = $1', [id]);
      const journal = result.rows[0];
      
      return {
        id: journal.id,
        userId: journal.user_id,
        moodScore: journal.mood_score,
        content: journal.content,
        tags: journal.tags || [],
        isPrivate: journal.is_private,
        createdAt: new Date(journal.created_at)
      } as Journal;
    } catch (err) {
      console.error('Error creating journal:', err);
      throw new Error(`Failed to create journal: ${err.message}`);
    }
  }
  
  async getUserJournals(userId: string): Promise<Journal[]> {
    try {
      const result = await this.client.query(
        'SELECT * FROM journals WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      );
      
      return result.rows.map(j => ({
        id: j.id,
        userId: j.user_id,
        moodScore: j.mood_score,
        content: j.content,
        tags: j.tags || [],
        isPrivate: j.is_private,
        createdAt: new Date(j.created_at)
      })) as Journal[];
    } catch (err) {
      console.error('Error getting user journals:', err);
      return [];
    }
  }
  
  async getJournal(id: string): Promise<Journal | undefined> {
    try {
      const result = await this.client.query('SELECT * FROM journals WHERE id = $1', [id]);
      if (result.rows.length === 0) return undefined;
      
      const j = result.rows[0];
      return {
        id: j.id,
        userId: j.user_id,
        moodScore: j.mood_score,
        content: j.content,
        tags: j.tags || [],
        isPrivate: j.is_private,
        createdAt: new Date(j.created_at)
      } as Journal;
    } catch (err) {
      console.error('Error getting journal:', err);
      return undefined;
    }
  }
  
  async updateJournal(id: string, updates: Partial<Journal>): Promise<Journal | undefined> {
    const fields = [];
    const values = [];
    let paramCount = 1;
    
    if (updates.moodScore !== undefined) {
      fields.push(`mood_score = $${paramCount++}`);
      values.push(updates.moodScore);
    }
    
    if (updates.content !== undefined) {
      fields.push(`content = $${paramCount++}`);
      values.push(updates.content);
    }
    
    if (updates.tags !== undefined) {
      fields.push(`tags = $${paramCount++}`);
      values.push(JSON.stringify(updates.tags));
    }
    
    if (updates.isPrivate !== undefined) {
      fields.push(`is_private = $${paramCount++}`);
      values.push(updates.isPrivate);
    }
    
    if (fields.length === 0) return await this.getJournal(id);
    
    values.push(id);
    
    try {
      await this.client.query(
        `UPDATE journals SET ${fields.join(', ')} WHERE id = $${paramCount}`,
        values
      );
      
      return await this.getJournal(id);
    } catch (err) {
      console.error('Error updating journal:', err);
      return undefined;
    }
  }
  
  async deleteJournal(id: string): Promise<boolean> {
    try {
      const result = await this.client.query('DELETE FROM journals WHERE id = $1', [id]);
      return result.rowCount > 0;
    } catch (err) {
      console.error('Error deleting journal:', err);
      return false;
    }
  }
  
  // Anonymous rants
  async createAnonymousRant(insertRant: InsertAnonymousRant): Promise<AnonymousRant> {
    const id = randomUUID();
    
    try {
      await this.client.query(
        `INSERT INTO anonymous_rants(id, anonymous_token, content, sentiment_score, support_count, created_at)
         VALUES($1, $2, $3, $4, $5, $6)`,
        [
          id,
          insertRant.anonymousToken,
          insertRant.content,
          insertRant.sentimentScore || null,
          0,
          new Date()
        ]
      );
      
      const result = await this.client.query('SELECT * FROM anonymous_rants WHERE id = $1', [id]);
      const rant = result.rows[0];
      
      return {
        id: rant.id,
        anonymousToken: rant.anonymous_token,
        content: rant.content,
        sentimentScore: rant.sentiment_score,
        supportCount: rant.support_count,
        createdAt: new Date(rant.created_at)
      } as AnonymousRant;
    } catch (err) {
      console.error('Error creating anonymous rant:', err);
      throw new Error(`Failed to create anonymous rant: ${err.message}`);
    }
  }
  
  async getAnonymousRants(): Promise<AnonymousRant[]> {
    try {
      const result = await this.client.query(
        'SELECT * FROM anonymous_rants ORDER BY created_at DESC'
      );
      
      return result.rows.map(r => ({
        id: r.id,
        anonymousToken: r.anonymous_token,
        content: r.content,
        sentimentScore: r.sentiment_score,
        supportCount: r.support_count,
        createdAt: new Date(r.created_at)
      })) as AnonymousRant[];
    } catch (err) {
      console.error('Error getting anonymous rants:', err);
      return [];
    }
  }
  
  async supportAnonymousRant(id: string): Promise<boolean> {
    try {
      await this.client.query(
        'UPDATE anonymous_rants SET support_count = support_count + 1 WHERE id = $1',
        [id]
      );
      return true;
    } catch (err) {
      console.error('Error supporting anonymous rant:', err);
      return false;
    }
  }
  
  // Mood tracking
  async createMoodEntry(insertMood: InsertMoodEntry): Promise<MoodEntry> {
    const id = randomUUID();
    
    try {
      await this.client.query(
        `INSERT INTO mood_entries(id, user_id, mood_score, notes, created_at)
         VALUES($1, $2, $3, $4, $5)`,
        [
          id,
          insertMood.userId,
          insertMood.moodScore,
          insertMood.notes || null,
          new Date()
        ]
      );
      
      const result = await this.client.query('SELECT * FROM mood_entries WHERE id = $1', [id]);
      const entry = result.rows[0];
      
      return {
        id: entry.id,
        userId: entry.user_id,
        moodScore: entry.mood_score,
        notes: entry.notes,
        createdAt: new Date(entry.created_at)
      } as MoodEntry;
    } catch (err) {
      console.error('Error creating mood entry:', err);
      throw new Error(`Failed to create mood entry: ${err.message}`);
    }
  }
  
  async getUserMoodEntries(userId: string, days?: number): Promise<MoodEntry[]> {
    try {
      let query = 'SELECT * FROM mood_entries WHERE user_id = $1';
      const values: any[] = [userId];
      
      if (days) {
        query += ' AND created_at > $2';
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        values.push(cutoff);
      }
      
      query += ' ORDER BY created_at DESC';
      
      const result = await this.client.query(query, values);
      
      return result.rows.map(e => ({
        id: e.id,
        userId: e.user_id,
        moodScore: e.mood_score,
        notes: e.notes,
        createdAt: new Date(e.created_at)
      })) as MoodEntry[];
    } catch (err) {
      console.error('Error getting user mood entries:', err);
      return [];
    }
  }
  
  // Therapists
  async getTherapists(): Promise<Therapist[]> {
    try {
      const result = await this.client.query('SELECT * FROM therapists');
      
      return result.rows.map(t => ({
        id: t.id,
        name: t.name,
        specialization: t.specialization,
        licenseNumber: t.license_number,
        profileUrl: t.profile_url,
        rating: t.rating,
        availability: t.availability || {}
      })) as Therapist[];
    } catch (err) {
      console.error('Error getting therapists:', err);
      return [];
    }
  }
  
  async getTherapist(id: string): Promise<Therapist | undefined> {
    try {
      const result = await this.client.query('SELECT * FROM therapists WHERE id = $1', [id]);
      if (result.rows.length === 0) return undefined;
      
      const t = result.rows[0];
      return {
        id: t.id,
        name: t.name,
        specialization: t.specialization,
        licenseNumber: t.license_number,
        profileUrl: t.profile_url,
        rating: t.rating,
        availability: t.availability || {}
      } as Therapist;
    } catch (err) {
      console.error('Error getting therapist:', err);
      return undefined;
    }
  }
  
  // Appointments
  async createAppointment(insertAppointment: InsertAppointment): Promise<Appointment> {
    const id = randomUUID();
    
    try {
      await this.client.query(
        `INSERT INTO appointments(id, therapist_id, user_id, start_time, end_time, status, notes)
         VALUES($1, $2, $3, $4, $5, $6, $7)`,
        [
          id,
          insertAppointment.therapistId,
          insertAppointment.userId,
          insertAppointment.startTime,
          insertAppointment.endTime,
          insertAppointment.status || 'pending',
          insertAppointment.notes || null
        ]
      );
      
      const result = await this.client.query('SELECT * FROM appointments WHERE id = $1', [id]);
      const a = result.rows[0];
      
      return {
        id: a.id,
        therapistId: a.therapist_id,
        userId: a.user_id,
        startTime: new Date(a.start_time),
        endTime: new Date(a.end_time),
        status: a.status,
        notes: a.notes
      } as Appointment;
    } catch (err) {
      console.error('Error creating appointment:', err);
      throw new Error(`Failed to create appointment: ${err.message}`);
    }
  }
  
  async getUserAppointments(userId: string): Promise<Appointment[]> {
    try {
      const result = await this.client.query(
        'SELECT * FROM appointments WHERE user_id = $1 ORDER BY start_time DESC',
        [userId]
      );
      
      return result.rows.map(a => ({
        id: a.id,
        therapistId: a.therapist_id,
        userId: a.user_id,
        startTime: new Date(a.start_time),
        endTime: new Date(a.end_time),
        status: a.status,
        notes: a.notes
      })) as Appointment[];
    } catch (err) {
      console.error('Error getting user appointments:', err);
      return [];
    }
  }
  
  // Courses
  async getCourses(): Promise<Course[]> {
    try {
      const result = await this.client.query('SELECT * FROM courses');
      
      return result.rows.map(c => ({
        id: c.id,
        title: c.title,
        description: c.description,
        durationMinutes: c.duration_minutes,
        difficulty: c.difficulty,
        thumbnailUrl: c.thumbnail_url,
        modules: c.modules || {}
      })) as Course[];
    } catch (err) {
      console.error('Error getting courses:', err);
      return [];
    }
  }
  
  // Refresh tokens for authentication
  async createRefreshToken(userId: string): Promise<string> {
    const token = randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days expiry
    
    try {
      await this.client.query(
        'INSERT INTO refresh_tokens(token, user_id, expires_at) VALUES($1, $2, $3)',
        [token, userId, expiresAt]
      );
      return token;
    } catch (err) {
      console.error('Error creating refresh token:', err);
      throw new Error(`Failed to create refresh token: ${err.message}`);
    }
  }
  
  async verifyRefreshToken(token: string): Promise<string | null> {
    try {
      const result = await this.client.query(
        'SELECT * FROM refresh_tokens WHERE token = $1',
        [token]
      );
      
      if (result.rows.length === 0) return null;
      
      const refreshToken = result.rows[0];
      const expiresAt = new Date(refreshToken.expires_at);
      
      if (expiresAt < new Date()) {
        await this.deleteRefreshToken(token);
        return null;
      }
      
      return refreshToken.user_id;
    } catch (err) {
      console.error('Error verifying refresh token:', err);
      return null;
    }
  }
  
  async deleteRefreshToken(token: string): Promise<boolean> {
    try {
      await this.client.query('DELETE FROM refresh_tokens WHERE token = $1', [token]);
      return true;
    } catch (err) {
      console.error('Error deleting refresh token:', err);
      return false;
    }
  }
  
  // Organization management (optional methods)
  async createOrganization(name: string, adminUserId: string): Promise<Organization> {
    const id = randomUUID();
    
    try {
      await this.client.query(
        `INSERT INTO organizations(id, name, admin_user_id, settings, wellness_score, created_at)
         VALUES($1, $2, $3, $4, $5, $6)`,
        [id, name, adminUserId, JSON.stringify({}), 0, new Date()]
      );
      
      const result = await this.client.query('SELECT * FROM organizations WHERE id = $1', [id]);
      const org = result.rows[0];
      
      return {
        id: org.id,
        name: org.name,
        adminUserId: org.admin_user_id,
        settings: org.settings || {},
        wellnessScore: org.wellness_score,
        createdAt: new Date(org.created_at)
      } as Organization;
    } catch (err) {
      console.error('Error creating organization:', err);
      throw new Error(`Failed to create organization: ${err.message}`);
    }
  }
  
  async addEmployeeToOrg(userId: string, orgId: string, jobTitle?: string, department?: string): Promise<Employee> {
    const id = randomUUID();
    const anonymizedId = `emp_${Math.random().toString(36).substring(2, 10)}`;
    
    try {
      await this.client.query(
        `INSERT INTO employees(id, user_id, org_id, job_title, department, anonymized_id, wellness_streak)
         VALUES($1, $2, $3, $4, $5, $6, $7)`,
        [id, userId, orgId, jobTitle || null, department || null, anonymizedId, 0]
      );
      
      const result = await this.client.query('SELECT * FROM employees WHERE id = $1', [id]);
      const emp = result.rows[0];
      
      return {
        id: emp.id,
        userId: emp.user_id,
        orgId: emp.org_id,
        jobTitle: emp.job_title,
        department: emp.department,
        anonymizedId: emp.anonymized_id,
        wellnessStreak: emp.wellness_streak
      } as Employee;
    } catch (err) {
      console.error('Error adding employee to org:', err);
      throw new Error(`Failed to add employee to org: ${err.message}`);
    }
  }
  
  async getEmployeesByOrg(orgId: string): Promise<Employee[]> {
    try {
      const result = await this.client.query(
        'SELECT * FROM employees WHERE org_id = $1',
        [orgId]
      );
      
      return result.rows.map(e => ({
        id: e.id,
        userId: e.user_id,
        orgId: e.org_id,
        jobTitle: e.job_title,
        department: e.department,
        anonymizedId: e.anonymized_id,
        wellnessStreak: e.wellness_streak
      })) as Employee[];
    } catch (err) {
      console.error('Error getting employees by org:', err);
      return [];
    }
  }
  
  async getOrganizationWellnessMetrics(orgId: string): Promise<any> {
    // Implement organization wellness metrics
    return {
      averageMood: 7.5,
      participationRate: 0.85,
      topConcerns: ['Work-life balance', 'Stress levels', 'Team communication'],
      recentTrend: 'improving'
    };
  }
  
  // Buddy matching
  async suggestBuddies(userId: string, count: number = 5): Promise<User[]> {
    try {
      // Simple implementation: suggest random users
      const result = await this.client.query(
        'SELECT * FROM users WHERE id != $1 ORDER BY RANDOM() LIMIT $2',
        [userId, count]
      );
      
      return result.rows.map(u => ({
        id: u.id,
        email: u.email,
        displayName: u.display_name,
        role: u.role,
        avatarUrl: u.avatar_url,
        timezone: u.timezone || 'UTC',
        preferences: u.preferences || {}
      })) as User[];
    } catch (err) {
      console.error('Error suggesting buddies:', err);
      return [];
    }
  }
  
  async createBuddyMatch(userAId: string, userBId: string, compatibilityScore: number): Promise<any> {
    const id = randomUUID();
    
    try {
      await this.client.query(
        `INSERT INTO buddy_matches(id, user_a_id, user_b_id, compatibility_score, status, created_at)
         VALUES($1, $2, $3, $4, $5, $6)`,
        [id, userAId, userBId, compatibilityScore, 'pending', new Date()]
      );
      
      const result = await this.client.query('SELECT * FROM buddy_matches WHERE id = $1', [id]);
      return result.rows[0];
    } catch (err) {
      console.error('Error creating buddy match:', err);
      throw new Error(`Failed to create buddy match: ${err.message}`);
    }
  }
  
  async updateBuddyMatchStatus(id: string, status: 'pending' | 'accepted' | 'declined'): Promise<boolean> {
    try {
      await this.client.query(
        'UPDATE buddy_matches SET status = $1 WHERE id = $2',
        [status, id]
      );
      return true;
    } catch (err) {
      console.error('Error updating buddy match status:', err);
      return false;
    }
  }
}

export default PostgresStorage;
