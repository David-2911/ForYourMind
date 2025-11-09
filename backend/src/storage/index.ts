// @ts-nocheck
import { type User, type InsertUser, type Journal, type InsertJournal, type AnonymousRant, type InsertAnonymousRant, type MoodEntry, type InsertMoodEntry, type Therapist, type Course, type Organization, type Employee, type Appointment, type InsertAppointment } from "../../../shared/schema.js";
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";
import { SqliteStorage } from "./sqliteStorage.js";
import { PostgresStorage } from "./postgresStorage.js";

export interface IStorage {
  // User management
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  verifyPassword(email: string, password: string): Promise<User | null>;

  // Journal operations
  createJournal(journal: InsertJournal): Promise<Journal>;
  getUserJournals(userId: string): Promise<Journal[]>;
  getJournal(id: string): Promise<Journal | undefined>;
  updateJournal(id: string, updates: Partial<Journal>): Promise<Journal | undefined>;
  deleteJournal(id: string): Promise<boolean>;

  // Anonymous rants
  createAnonymousRant(rant: InsertAnonymousRant): Promise<AnonymousRant>;
  getAnonymousRants(): Promise<AnonymousRant[]>;
  supportAnonymousRant(id: string): Promise<boolean>;

  // Mood tracking
  createMoodEntry(entry: InsertMoodEntry): Promise<MoodEntry>;
  getUserMoodEntries(userId: string, days?: number): Promise<MoodEntry[]>;

  // Therapists
  getTherapists(): Promise<Therapist[]>;
  getTherapist(id: string): Promise<Therapist | undefined>;

  // Appointments
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  getUserAppointments(userId: string): Promise<Appointment[]>;

  // Courses
  getCourses(): Promise<Course[]>;
  getCourse(id: string): Promise<Course | undefined>;

  // Organization & Employee data (for managers/admins)
  getOrganization(id: string): Promise<Organization | undefined>;
  getEmployeesByOrg(orgId: string): Promise<Employee[]>;
  getOrganizationWellnessMetrics(orgId: string): Promise<any>;
  createOrganization?(name: string, adminUserId: string): Promise<Organization>;
  addEmployeeToOrg?(userId: string, orgId: string, jobTitle?: string, department?: string): Promise<Employee>;
  // Refresh token management
  createRefreshToken(userId: string, expiresInDays?: number): Promise<string>;
  verifyRefreshToken(token: string): Promise<string | null>;
  deleteRefreshToken(token: string): Promise<void>;
  // Buddy matching
  suggestBuddies(userId: string, limit?: number): Promise<any[]>;
  createBuddyMatch(userA: string, userB: string, score?: number): Promise<any>;
  updateBuddyMatchStatus(matchId: string, status: 'pending' | 'accepted' | 'declined'): Promise<boolean>;
  getBuddyMatches(userId: string): Promise<any[]>;

  // Wellness Assessments
  getWellnessAssessments(userId: string): Promise<any[]>;
  getWellnessAssessment(id: string): Promise<any>;
  createAssessmentResponse(response: any): Promise<any>;
  getUserAssessmentResponses(userId: string): Promise<any[]>;
  getLatestAssessmentResponse(userId: string): Promise<any>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private journals: Map<string, Journal> = new Map();
  private anonymousRants: Map<string, AnonymousRant> = new Map();
  private moodEntries: Map<string, MoodEntry> = new Map();
  private therapists: Map<string, Therapist> = new Map();
  private appointments: Map<string, Appointment> = new Map();
  private courses: Map<string, Course> = new Map();
  private organizations: Map<string, Organization> = new Map();
  private employees: Map<string, Employee> = new Map();
  private refreshTokens: Map<string, { userId: string; expiresAt: Date }> = new Map();
  private buddyMatches: Map<string, { id: string; userAId: string; userBId: string; compatibilityScore: number; status: 'pending'|'accepted'|'declined'; createdAt: Date }> = new Map();

  constructor() {
    this.seedData();
  }

  // --- Refresh token helpers ---
  async createRefreshToken(userId: string, expiresInDays: number = 7): Promise<string> {
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);
    this.refreshTokens.set(token, { userId, expiresAt });
    return token;
  }

  async verifyRefreshToken(token: string): Promise<string | null> {
    const record = this.refreshTokens.get(token);
    if (!record) return null;
    if (record.expiresAt.getTime() < Date.now()) {
      this.refreshTokens.delete(token);
      return null;
    }
    return record.userId;
  }

  async deleteRefreshToken(token: string): Promise<void> {
    this.refreshTokens.delete(token);
  }

  // --- Buddy matching (in-memory) ---
  async suggestBuddies(userId: string, limit: number = 5): Promise<any[]> {
    const candidates = Array.from(this.users.values()).filter(u => u.id !== userId);
    return candidates.slice(0, limit).map(u => ({ id: u.id, displayName: u.displayName, email: u.email }));
  }

  async createBuddyMatch(userA: string, userB: string, score: number = 0): Promise<any> {
    const id = randomUUID();
    const match = { id, userAId: userA, userBId: userB, compatibilityScore: score, status: 'pending' as const, createdAt: new Date() };
    this.buddyMatches.set(id, match);
    return match;
  }

  async updateBuddyMatchStatus(matchId: string, status: 'pending' | 'accepted' | 'declined'): Promise<boolean> {
    const m = this.buddyMatches.get(matchId);
    if (!m) return false;
    m.status = status;
    this.buddyMatches.set(matchId, m);
    return true;
  }

  async getBuddyMatches(userId: string): Promise<any[]> {
    return Array.from(this.buddyMatches.values()).filter(m => m.userAId === userId || m.userBId === userId);
  }

  private async seedData() {
    // Seed therapists
    const therapist1: Therapist = {
      id: randomUUID(),
      name: "Dr. Sarah Chen",
      specialization: "Anxiety & Stress",
      licenseNumber: "PSY-001234",
      profileUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200",
      rating: 4.9,
      availability: { status: "available", nextSlot: "today" }
    };
    
    const therapist2: Therapist = {
      id: randomUUID(),
      name: "Dr. Michael Rodriguez",
      specialization: "Depression & Mood",
      licenseNumber: "PSY-005678",
      profileUrl: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200",
      rating: 4.8,
      availability: { status: "busy", nextSlot: "2pm" }
    };

    this.therapists.set(therapist1.id, therapist1);
    this.therapists.set(therapist2.id, therapist2);

    // Seed courses
    const course1: Course = {
      id: randomUUID(),
      title: "Mindful Breathing Basics",
      description: "Learn fundamental breathing techniques for stress relief",
      durationMinutes: 15,
      difficulty: "Beginner",
      thumbnailUrl: "https://images.unsplash.com/photo-1545389336-cf090694435e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=200",
      modules: { count: 5, completed: 0 }
    };

    this.courses.set(course1.id, course1);

    // Seed some anonymous rants for demo
    const rant1: AnonymousRant = {
      id: randomUUID(),
      anonymousToken: randomUUID(),
      content: "Feeling completely overwhelmed with the workload. Management keeps piling on more tasks without considering our bandwidth. It's affecting my sleep and personal life. Just needed to get this out somewhere safe.",
      sentimentScore: -0.8,
      supportCount: 12,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
    };

    const rant2: AnonymousRant = {
      id: randomUUID(),
      anonymousToken: randomUUID(),
      content: "The breathing exercises have really helped me during stressful meetings. Grateful for this platform!",
      sentimentScore: 0.6,
      supportCount: 8,
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 hours ago
    };

    this.anonymousRants.set(rant1.id, rant1);
    this.anonymousRants.set(rant2.id, rant2);

    // Seed organization and employees
    const org1: Organization = {
      id: "org-123",
      name: "TechCorp Inc.",
      adminUserId: null,
      settings: { allowAnonymousRants: true, requireMoodCheckins: false },
      wellnessScore: 8.2,
      createdAt: new Date()
    };
    
    this.organizations.set(org1.id, org1);

    // Create demo users for testing all roles
    const demoAdmin: User = {
      id: "admin-demo",
      email: "admin@foryourmind.com",
      displayName: "Admin User",
      role: "admin",
      password: await bcrypt.hash("admin123", 10),
      avatarUrl: null,
      timezone: "UTC",
      preferences: null,
      createdAt: new Date()
    };
    
    const demoManager: User = {
      id: "manager-demo",
      email: "manager@techcorp.com",
      displayName: "Sarah Johnson",
      role: "manager",
      password: await bcrypt.hash("manager123", 10),
      avatarUrl: null,
      timezone: "UTC",
      preferences: null,
      createdAt: new Date()
    };
    
    const demoEmployee: User = {
      id: "employee-demo",
      email: "john@techcorp.com",
      displayName: "John Smith",
      role: "individual",
      password: await bcrypt.hash("employee123", 10),
      avatarUrl: null,
      timezone: "UTC",
      preferences: null,
      createdAt: new Date()
    };
    
    this.users.set(demoAdmin.id, demoAdmin);
    this.users.set(demoManager.id, demoManager);
    this.users.set(demoEmployee.id, demoEmployee);
    
    // Add employee to organization
    const employee1: Employee = {
      id: randomUUID(),
      userId: demoEmployee.id,
      orgId: org1.id,
      jobTitle: "Software Engineer",
      department: "Engineering",
      anonymizedId: randomUUID(),
      wellnessStreak: 7
    };
    
    this.employees.set(employee1.id, employee1);
    
    // Add some sample mood entries and journals for the demo employee
    const moodEntry1: MoodEntry = {
      id: randomUUID(),
      userId: demoEmployee.id,
      moodScore: 4,
      notes: "Feeling good after morning meditation",
      createdAt: new Date()
    };
    
    const journal1: Journal = {
      id: randomUUID(),
      userId: demoEmployee.id,
      moodScore: 4,
      content: "Today was a productive day. I managed to complete my tasks and even had time for a walk during lunch. Grateful for the support from my team.",
      tags: ["gratitude", "productivity", "team"],
      isPrivate: true,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
    };
    
    this.moodEntries.set(moodEntry1.id, moodEntry1);
    this.journals.set(journal1.id, journal1);
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    
    // Create proper user object matching schema
    const user: User = {
      id,
      email: insertUser.email,
      displayName: insertUser.displayName,
      role: insertUser.role as "individual" | "manager" | "admin",
      password: hashedPassword,
      avatarUrl: insertUser.avatarUrl || null,
      timezone: insertUser.timezone || "UTC",
      preferences: insertUser.preferences || {},
      createdAt: new Date()
    };
    
    this.users.set(id, user);
    return user;
  }

  async verifyPassword(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(email);
    if (!user) return null;
    
    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }

  async createJournal(insertJournal: InsertJournal): Promise<Journal> {
    const id = randomUUID();
    const journal: Journal = {
      id,
      userId: insertJournal.userId || null,
      moodScore: insertJournal.moodScore || null,
      content: insertJournal.content || null,
      tags: Array.isArray(insertJournal.tags) ? insertJournal.tags as string[] : null,
      isPrivate: insertJournal.isPrivate !== undefined ? insertJournal.isPrivate : true,
      createdAt: new Date()
    };
    this.journals.set(id, journal);
    return journal;
  }

  async getUserJournals(userId: string): Promise<Journal[]> {
    return Array.from(this.journals.values())
      .filter(journal => journal.userId === userId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async getJournal(id: string): Promise<Journal | undefined> {
    return this.journals.get(id);
  }

  async updateJournal(id: string, updates: Partial<Journal>): Promise<Journal | undefined> {
    const existing = this.journals.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    this.journals.set(id, updated);
    return updated;
  }

  async deleteJournal(id: string): Promise<boolean> {
    return this.journals.delete(id);
  }

  async createAnonymousRant(insertRant: InsertAnonymousRant): Promise<AnonymousRant> {
    const id = randomUUID();
    const rant: AnonymousRant = {
      id,
      anonymousToken: insertRant.anonymousToken,
      content: insertRant.content,
      sentimentScore: insertRant.sentimentScore || null,
      supportCount: 0,
      createdAt: new Date()
    };
    this.anonymousRants.set(id, rant);
    return rant;
  }

  async getAnonymousRants(): Promise<AnonymousRant[]> {
    return Array.from(this.anonymousRants.values())
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async supportAnonymousRant(id: string): Promise<boolean> {
    const rant = this.anonymousRants.get(id);
    if (!rant) return false;
    
    rant.supportCount = (rant.supportCount || 0) + 1;
    this.anonymousRants.set(id, rant);
    return true;
  }

  async createMoodEntry(insertEntry: InsertMoodEntry): Promise<MoodEntry> {
    const id = randomUUID();
    const entry: MoodEntry = {
      id,
      userId: insertEntry.userId || null,
      moodScore: insertEntry.moodScore,
      notes: insertEntry.notes || null,
      createdAt: new Date()
    };
    this.moodEntries.set(id, entry);
    return entry;
  }

  async getUserMoodEntries(userId: string, days: number = 30): Promise<MoodEntry[]> {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return Array.from(this.moodEntries.values())
      .filter(entry => entry.userId === userId && (entry.createdAt || new Date()) >= cutoff)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async getTherapists(): Promise<Therapist[]> {
    return Array.from(this.therapists.values());
  }

  async getTherapist(id: string): Promise<Therapist | undefined> {
    return this.therapists.get(id);
  }

  async createAppointment(insertAppointment: InsertAppointment): Promise<Appointment> {
    const id = randomUUID();
    const appointment: Appointment = {
      id,
      therapistId: insertAppointment.therapistId || null,
      userId: insertAppointment.userId || null,
      startTime: insertAppointment.startTime || null,
      endTime: insertAppointment.endTime || null,
      notes: insertAppointment.notes || null,
      status: "pending"
    };
    this.appointments.set(id, appointment);
    return appointment;
  }

  async getUserAppointments(userId: string): Promise<Appointment[]> {
    return Array.from(this.appointments.values())
      .filter(appointment => appointment.userId === userId)
      .sort((a, b) => (a.startTime?.getTime() || 0) - (b.startTime?.getTime() || 0));
  }

  async getCourses(): Promise<Course[]> {
    return Array.from(this.courses.values());
  }

  async getCourse(id: string): Promise<Course | undefined> {
    return this.courses.get(id);
  }

  async getOrganization(id: string): Promise<Organization | undefined> {
    return this.organizations.get(id);
  }

  async getEmployeesByOrg(orgId: string): Promise<Employee[]> {
    return Array.from(this.employees.values())
      .filter(employee => employee.orgId === orgId);
  }

  async getOrganizationWellnessMetrics(orgId: string): Promise<any> {
    // Mock aggregated wellness data for managers
    return {
      teamWellness: 7.8,
      engagement: 0.89,
      sessionsThisWeek: 156,
      atRiskCount: 3,
      departments: [
        { name: "Engineering", average: 8.2, status: "good" },
        { name: "Marketing", average: 7.1, status: "fair" },
        { name: "Sales", average: 8.0, status: "good" },
        { name: "Support", average: 6.3, status: "needs-attention" }
      ]
    };
  }

  async createOrganization(name: string, adminUserId: string): Promise<Organization> {
    const id = randomUUID();
    const organization: Organization = {
      id,
      name,
      adminUserId,
      settings: { allowAnonymousRants: true, requireMoodCheckins: false },
      wellnessScore: 0,
      createdAt: new Date()
    };
    this.organizations.set(id, organization);
    return organization;
  }

  async addEmployeeToOrg(userId: string, orgId: string, jobTitle?: string, department?: string): Promise<Employee> {
    const id = randomUUID();
    const employee: Employee = {
      id,
      userId,
      orgId,
      jobTitle: jobTitle || null,
      department: department || null,
      anonymizedId: randomUUID(),
      wellnessStreak: 0
    };
    this.employees.set(id, employee);
    return employee;
  }

  // --- Wellness Assessments (in-memory) ---
  async getWellnessAssessments(userId: string): Promise<any[]> {
    // Return a default comprehensive assessment for now
    return [{
      id: 'comprehensive-001',
      userId,
      assessmentType: 'comprehensive',
      title: 'Comprehensive Wellness Assessment',
      questions: [
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
      ],
      isActive: true,
      createdAt: new Date()
    }];
  }

  async getWellnessAssessment(id: string): Promise<any> {
    const assessments = await this.getWellnessAssessments('dummy-user');
    return assessments.find(a => a.id === id);
  }

  async createAssessmentResponse(response: any): Promise<any> {
    // In a real implementation, this would save to a database
    return {
      id: randomUUID(),
      ...response,
      completedAt: new Date()
    };
  }

  async getUserAssessmentResponses(userId: string): Promise<any[]> {
    // Return empty array for now - in real implementation would fetch from database
    return [];
  }

  async getLatestAssessmentResponse(userId: string): Promise<any> {
    const responses = await this.getUserAssessmentResponses(userId);
    return responses.length > 0 ? responses[responses.length - 1] : null;
  }
}

// Use PostgreSQL if DATABASE_URL is set, or SQLite if requested, otherwise use in-memory
const useSqlite = !!process.env.USE_SQLITE || !!process.env.SQLITE_DB_PATH;
const usePostgres = !!process.env.DATABASE_URL && !useSqlite;

let storage: IStorage;

if (useSqlite) {
  console.log("Using SQLite storage");
  storage = new SqliteStorage(process.env.SQLITE_DB_PATH || './data/db.sqlite');
} else if (usePostgres) {
  console.log("Using PostgreSQL storage");
  storage = new PostgresStorage(process.env.DATABASE_URL);
} else {
  console.log("Using in-memory storage");
  storage = new MemStorage();
}

export { storage };
