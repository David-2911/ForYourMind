import { type User, type InsertUser, type Journal, type InsertJournal, type AnonymousRant, type InsertAnonymousRant, type MoodEntry, type InsertMoodEntry, type Therapist, type Course, type Organization, type Employee, type Appointment, type InsertAppointment } from "@shared/schema";
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";

export interface IStorage {
  // User management
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
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

  constructor() {
    this.seedData();
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

    this.anonymousRants.set(rant1.id, rant1);
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
    const user: User = {
      ...insertUser,
      id,
      password: hashedPassword,
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
      ...insertJournal,
      id,
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
      ...insertRant,
      id,
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
      ...insertEntry,
      id,
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
      ...insertAppointment,
      id,
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
}

export const storage = new MemStorage();
