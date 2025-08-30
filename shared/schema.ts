// @ts-nocheck
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table with role-based access
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().$type<"individual" | "manager" | "admin">(),
  displayName: text("display_name").notNull(),
  avatarUrl: text("avatar_url"),
  timezone: text("timezone").default("UTC"),
  preferences: json("preferences").$type<Record<string, any>>().default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

// Organizations for manager/admin functionality
export const organizations = pgTable("organizations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  adminUserId: varchar("admin_user_id").references(() => users.id),
  settings: json("settings").$type<Record<string, any>>().default({}),
  wellnessScore: real("wellness_score").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Employee associations
export const employees = pgTable("employees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  orgId: varchar("org_id").references(() => organizations.id),
  jobTitle: text("job_title"),
  department: text("department"),
  anonymizedId: text("anonymized_id").unique(),
  wellnessStreak: integer("wellness_streak").default(0),
});

// Journal entries for personal wellness tracking
export const journals = pgTable("journals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  moodScore: integer("mood_score"),
  content: text("content"),
  tags: json("tags").$type<string[]>().default([]),
  isPrivate: boolean("is_private").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Anonymous rants for safe venting
export const anonymousRants = pgTable("anonymous_rants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  anonymousToken: text("anonymous_token").notNull(),
  content: text("content").notNull(),
  sentimentScore: real("sentiment_score"),
  supportCount: integer("support_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Therapist directory
export const therapists = pgTable("therapists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  specialization: text("specialization"),
  licenseNumber: text("license_number"),
  profileUrl: text("profile_url"),
  rating: real("rating").default(0),
  availability: json("availability").$type<Record<string, any>>().default({}),
});

// Appointment booking
export const appointments = pgTable("appointments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  therapistId: varchar("therapist_id").references(() => therapists.id),
  userId: varchar("user_id").references(() => users.id),
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  status: text("status").$type<"pending" | "confirmed" | "completed" | "cancelled">().default("pending"),
  notes: text("notes"),
});

// Learning courses
export const courses = pgTable("courses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  durationMinutes: integer("duration_minutes"),
  difficulty: text("difficulty"),
  thumbnailUrl: text("thumbnail_url"),
  modules: json("modules").$type<Record<string, any>>().default({}),
});

// Wellness surveys for managers
export const wellbeingSurveys = pgTable("wellbeing_surveys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: varchar("org_id").references(() => organizations.id),
  title: text("title").notNull(),
  questions: json("questions").$type<Record<string, any>>().default({}),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Individual wellness assessments
export const wellnessAssessments = pgTable("wellness_assessments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  assessmentType: text("assessment_type").notNull(), // 'comprehensive', 'quick-check', 'monthly-review'
  title: text("title").notNull(),
  questions: json("questions").$type<Array<{
    id: string;
    question: string;
    type: 'scale' | 'multiple-choice' | 'text';
    options?: string[];
    category: string;
  }>>().default([]),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Individual assessment responses
export const assessmentResponses = pgTable("assessment_responses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  assessmentId: varchar("assessment_id").references(() => wellnessAssessments.id),
  userId: varchar("user_id").references(() => users.id),
  responses: json("responses").$type<Record<string, any>>().default({}),
  totalScore: real("total_score"),
  categoryScores: json("category_scores").$type<Record<string, number>>().default({}),
  recommendations: json("recommendations").$type<string[]>().default([]),
  completedAt: timestamp("completed_at").defaultNow(),
});

// Survey responses (anonymous)
export const surveyResponses = pgTable("survey_responses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  surveyId: varchar("survey_id").references(() => wellbeingSurveys.id),
  anonymousToken: text("anonymous_token").notNull(),
  responses: json("responses").$type<Record<string, any>>().default({}),
  wellnessScore: real("wellness_score"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Mood tracking entries
export const moodEntries = pgTable("mood_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  moodScore: integer("mood_score").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Buddy matching table
export const buddyMatches = pgTable("buddy_matches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userAId: varchar("user_a_id").references(() => users.id),
  userBId: varchar("user_b_id").references(() => users.id),
  compatibilityScore: real("compatibility_score").default(0),
  status: text("status").$type<"pending" | "accepted" | "declined">().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Refresh tokens
export const refreshTokens = pgTable("refresh_tokens", {
  token: text("token").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  expiresAt: timestamp("expires_at").notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  role: true,
  displayName: true,
  avatarUrl: true,
  timezone: true,
  preferences: true,
}).partial({
  avatarUrl: true,
  timezone: true,
  preferences: true,
});

export const insertJournalSchema = createInsertSchema(journals).pick({
  userId: true,
  moodScore: true,
  content: true,
  tags: true,
  isPrivate: true,
});

export const insertAnonymousRantSchema = createInsertSchema(anonymousRants).pick({
  anonymousToken: true,
  content: true,
  sentimentScore: true,
});

export const insertMoodEntrySchema = createInsertSchema(moodEntries).pick({
  userId: true,
  moodScore: true,
  notes: true,
});

export const insertAppointmentSchema = createInsertSchema(appointments).pick({
  therapistId: true,
  userId: true,
  startTime: true,
  endTime: true,
  notes: true,
});

export const insertWellnessAssessmentSchema = createInsertSchema(wellnessAssessments).pick({
  userId: true,
  assessmentType: true,
  title: true,
  questions: true,
  isActive: true,
});

export const insertAssessmentResponseSchema = createInsertSchema(assessmentResponses).pick({
  assessmentId: true,
  userId: true,
  responses: true,
  totalScore: true,
  categoryScores: true,
  recommendations: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertJournal = z.infer<typeof insertJournalSchema>;
export type Journal = typeof journals.$inferSelect;

export type InsertAnonymousRant = z.infer<typeof insertAnonymousRantSchema>;
export type AnonymousRant = typeof anonymousRants.$inferSelect;

export type InsertMoodEntry = z.infer<typeof insertMoodEntrySchema>;
export type MoodEntry = typeof moodEntries.$inferSelect;

export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Appointment = typeof appointments.$inferSelect;

export type InsertWellnessAssessment = z.infer<typeof insertWellnessAssessmentSchema>;
export type WellnessAssessment = typeof wellnessAssessments.$inferSelect;

export type InsertAssessmentResponse = z.infer<typeof insertAssessmentResponseSchema>;
export type AssessmentResponse = typeof assessmentResponses.$inferSelect;

export type Therapist = typeof therapists.$inferSelect;
export type Course = typeof courses.$inferSelect;
export type Organization = typeof organizations.$inferSelect;
export type Employee = typeof employees.$inferSelect;
export type WellbeingSurvey = typeof wellbeingSurveys.$inferSelect;
export type SurveyResponse = typeof surveyResponses.$inferSelect;
export type BuddyMatch = typeof buddyMatches.$inferSelect;

export type InsertWellnessAssessment = z.infer<typeof insertWellnessAssessmentSchema>;
export type WellnessAssessment = typeof wellnessAssessments.$inferSelect;

export type InsertAssessmentResponse = z.infer<typeof insertAssessmentResponseSchema>;
export type AssessmentResponse = typeof assessmentResponses.$inferSelect;
