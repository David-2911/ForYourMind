import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "../storage/index.js";
import { insertUserSchema, insertJournalSchema, insertAnonymousRantSchema, insertMoodEntrySchema, insertAppointmentSchema, insertWellnessAssessmentSchema, insertAssessmentResponseSchema } from "@mindfulme/shared/schema";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "for-your-mind-secret-key-2024";
const ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_TTL || '15m';

// JWT middleware with enhanced error handling
const authenticateToken = (req: Request, res: Response, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    
    if (!token) {
      return res.status(401).json({ message: "Access token required" });
    }

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({ message: "Token expired" });
        }
        return res.status(403).json({ message: "Invalid token" });
      }
      (req as any).user = user;
      next();
    });
  } catch (error) {
    return res.status(500).json({ message: "Authentication error" });
  }
};

// Assessment scoring function
const calculateAssessmentScore = (questions: any[], responses: Record<string, any>) => {
  let totalScore = 0;
  const categoryScores: Record<string, number> = {};
  const recommendations: string[] = [];

  questions.forEach((question) => {
    const response = responses[question.id];
    if (response !== undefined) {
      let score = 0;

      if (question.type === 'scale') {
        // Assuming scale is 1-5, convert to 0-4 for scoring
        score = typeof response === 'number' ? response - 1 : 0;
      } else if (question.type === 'multiple-choice') {
        // Simple scoring based on option index
        score = typeof response === 'number' ? response : 0;
      }

      totalScore += score;

      // Track category scores
      if (!categoryScores[question.category]) {
        categoryScores[question.category] = 0;
      }
      categoryScores[question.category] += score;
    }
  });

  // Generate recommendations based on scores
  Object.entries(categoryScores).forEach(([category, score]) => {
    const avgScore = score / questions.filter(q => q.category === category).length;

    if (avgScore < 2) {
      recommendations.push(`Consider focusing on ${category.toLowerCase()} with additional resources and support.`);
    } else if (avgScore < 3) {
      recommendations.push(`Your ${category.toLowerCase()} could benefit from some attention and self-care practices.`);
    }
  });

  // Normalize total score to 0-10 scale
  const maxPossibleScore = questions.length * 4; // Assuming max 4 points per question
  const normalizedScore = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 10 : 0;

  return {
    totalScore: Math.round(normalizedScore * 10) / 10, // Round to 1 decimal
    categoryScores,
    recommendations
  };
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body as any) as any;
      
      // Validate password strength
      if (userData.password && userData.password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters long" });
      }
      
      // Check if user exists
      const existingUser = await storage.getUserByEmail(userData.email as string);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const user = await storage.createUser(userData as any);
      const token = jwt.sign({ userId: user.id, email: user.email, role: user.role } as any, JWT_SECRET as any, { expiresIn: ACCESS_TOKEN_TTL } as any);
      // create refresh token and set as httpOnly cookie
      const refreshToken = await storage.createRefreshToken(user.id);
      const isProd = process.env.NODE_ENV === 'production';
      res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'none' : 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({
        user: { id: user.id, email: user.email, displayName: user.displayName, role: user.role },
        token
      });
    } catch (error: unknown) {
      console.error("Registration error:", error);
      const err = error as any;
      if (err && err.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid user data", details: err.errors });
      }
      res.status(500).json({ message: "Registration failed", error: "An unexpected error occurred" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
  const { email, password, organizationCode } = req.body as any;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" });
      }

      const user = await storage.verifyPassword(email, password);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Additional validation for manager/admin roles
      if (user.role === "manager" && !organizationCode) {
        return res.status(400).json({ message: "Organization code required for managers" });
      }
      
      if (user.role === "admin") {
        // For demo purposes, accept any code for admin
        // In production, this would validate against a secure 2FA system
        if (!organizationCode) {
          return res.status(400).json({ message: "Admin access code required" });
        }
      }

  const token = jwt.sign({ userId: user.id, email: user.email, role: user.role } as any, JWT_SECRET as any, { expiresIn: ACCESS_TOKEN_TTL } as any);
  const refreshToken = await storage.createRefreshToken(user.id);
      const isProd = process.env.NODE_ENV === 'production';
      res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'none' : 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({ user: { id: user.id, email: user.email, displayName: user.displayName, role: user.role }, token });
    } catch (error) {
      res.status(500).json({ message: "Login failed", error });
    }
  });

  // Refresh token endpoint
  app.post('/api/auth/refresh', async (req: Request, res: Response) => {
    try {
  const refreshToken = req.cookies?.refresh_token || (req.body as any)?.refresh_token;
      if (!refreshToken) return res.status(401).json({ message: 'Refresh token required' });

  const userId = await storage.verifyRefreshToken(refreshToken as string);
      if (!userId) return res.status(403).json({ message: 'Invalid or expired refresh token' });

      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: 'User not found' });

      // Rotate refresh token
      await storage.deleteRefreshToken(refreshToken);
      const newRefreshToken = await storage.createRefreshToken(userId);
      const isProd = process.env.NODE_ENV === 'production';
      res.cookie('refresh_token', newRefreshToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'none' : 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

  const accessToken = jwt.sign({ userId: user.id, email: user.email, role: user.role } as any, JWT_SECRET as any, { expiresIn: ACCESS_TOKEN_TTL } as any);
      res.json({ token: accessToken, user: { id: user.id, email: user.email, displayName: user.displayName, role: user.role } });
    } catch (error) {
      res.status(500).json({ message: 'Failed to refresh token', error });
    }
  });

  // Logout - revoke refresh token and clear cookie
  app.post('/api/auth/logout', async (req: Request, res: Response) => {
    try {
      const refreshToken = req.cookies?.refresh_token || req.body?.refresh_token;
      if (refreshToken) {
        await storage.deleteRefreshToken(refreshToken);
      }
      const isProd = process.env.NODE_ENV === 'production';
      res.clearCookie('refresh_token', {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'none' : 'lax',
        path: '/',
      });
      res.json({ message: 'Logged out' });
    } catch (error) {
      res.status(500).json({ message: 'Logout failed', error });
    }
  });

  // User profile
  app.get("/api/user/profile", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { userId } = (req as any).user;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        avatarUrl: user.avatarUrl,
        preferences: user.preferences
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get profile", error });
    }
  });

  // Update user profile
  app.put("/api/user/profile", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { userId } = (req as any).user;
      const { displayName, email } = req.body;

      const updatedUser = await storage.updateUser(userId, {
        displayName: displayName || undefined,
        email: email || undefined,
      });

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        id: updatedUser.id,
        email: updatedUser.email,
        displayName: updatedUser.displayName,
        role: updatedUser.role,
        avatarUrl: updatedUser.avatarUrl,
        preferences: updatedUser.preferences
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to update profile", error });
    }
  });

  // Change password
  app.patch("/api/user/password", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { userId } = (req as any).user;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current password and new password required" });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ message: "New password must be at least 8 characters" });
      }

      // Get user and verify current password
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const isValid = await storage.verifyPassword(user.email, currentPassword);
      if (!isValid) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }

      // Update password
      const bcrypt = await import("bcrypt");
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      await storage.updateUser(userId, { password: hashedPassword } as any);

      // Inform frontend that re-authentication is required
      // The current JWT token will remain valid until expiry, but we signal
      // that the user should log in again with their new password
      res.json({ 
        message: "Password updated successfully",
        requiresReauthentication: true 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to change password", error });
    }
  });

  // Delete account
  app.delete("/api/user/account", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { userId } = (req as any).user;
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({ message: "Password required to delete account" });
      }

      // Verify password before deletion
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const isValid = await storage.verifyPassword(user.email, password);
      if (!isValid) {
        return res.status(401).json({ message: "Incorrect password" });
      }

      // Delete user (note: storage layer needs deleteUser method)
      if (storage.deleteUser) {
        await storage.deleteUser(userId);
        res.json({ message: "Account deleted successfully" });
      } else {
        res.status(501).json({ message: "Account deletion not implemented in storage layer" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete account", error });
    }
  });

  // Journal routes
  app.post("/api/journals", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { userId } = (req as any).user;
      const journalData = insertJournalSchema.parse({ ...req.body, userId });
      
      const journal = await storage.createJournal(journalData);
      res.status(201).json(journal);
    } catch (error) {
      res.status(400).json({ message: "Failed to create journal", error });
    }
  });

  app.get("/api/journals", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { userId } = (req as any).user;
      const journals = await storage.getUserJournals(userId);
      res.json(journals);
    } catch (error) {
      res.status(500).json({ message: "Failed to get journals", error });
    }
  });

  app.get("/api/journals/:id", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { userId } = (req as any).user;
      
      const journal = await storage.getJournal(id);
      
      if (!journal) {
        return res.status(404).json({ message: "Journal not found" });
      }

      // Verify ownership
      if (journal.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(journal);
    } catch (error) {
      res.status(500).json({ message: "Failed to get journal", error });
    }
  });

  app.put("/api/journals/:id", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { userId } = (req as any).user;
      
      // Verify ownership
      const existing = await storage.getJournal(id);
      if (!existing || existing.userId !== userId) {
        return res.status(404).json({ message: "Journal not found" });
      }

      const updated = await storage.updateJournal(id, req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update journal", error });
    }
  });

  app.delete("/api/journals/:id", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { userId } = (req as any).user;
      
      // Verify ownership
      const existing = await storage.getJournal(id);
      if (!existing || existing.userId !== userId) {
        return res.status(404).json({ message: "Journal not found" });
      }

      const deleted = await storage.deleteJournal(id);
      res.json({ success: deleted });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete journal", error });
    }
  });

  // Mood tracking routes
  app.post("/api/mood", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { userId } = (req as any).user;
      const moodData = insertMoodEntrySchema.parse({ ...req.body, userId });
      
      const entry = await storage.createMoodEntry(moodData);
      res.status(201).json(entry);
    } catch (error) {
      res.status(400).json({ message: "Failed to create mood entry", error });
    }
  });

  app.get("/api/mood", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { userId } = (req as any).user;
      const days = parseInt(req.query.days as string) || 30;
      const entries = await storage.getUserMoodEntries(userId, days);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "Failed to get mood entries", error });
    }
  });

  app.get("/api/mood/stats", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { userId } = (req as any).user;
      const days = parseInt(req.query.days as string) || 30;
      const entries = await storage.getUserMoodEntries(userId, days);

      if (entries.length === 0) {
        return res.json({
          average: null,
          trend: "neutral",
          totalEntries: 0,
          daysTracked: days
        });
      }

      // Calculate average mood
      const moodValues = entries.map(e => e.moodScore);
      const average = moodValues.reduce((a, b) => a + b, 0) / moodValues.length;

      // Calculate trend (comparing first half to second half)
      const midpoint = Math.floor(entries.length / 2);
      const firstHalf = moodValues.slice(0, midpoint);
      const secondHalf = moodValues.slice(midpoint);
      
      const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
      
      let trend = "neutral";
      if (secondAvg > firstAvg + 0.5) trend = "improving";
      else if (secondAvg < firstAvg - 0.5) trend = "declining";

      // Find best and worst moods
      const bestMood = Math.max(...moodValues);
      const worstMood = Math.min(...moodValues);

      res.json({
        average: Math.round(average * 10) / 10,
        trend,
        bestMood,
        worstMood,
        totalEntries: entries.length,
        daysTracked: days
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get mood statistics", error });
    }
  });

  // Anonymous rants routes
  app.post("/api/rants", async (req: Request, res: Response) => {
    try {
      const anonymousToken = randomUUID();
      const rantData = insertAnonymousRantSchema.parse({ 
        ...req.body, 
        anonymousToken 
      });
      
      const rant = await storage.createAnonymousRant(rantData);
      res.status(201).json(rant);
    } catch (error) {
      res.status(400).json({ message: "Failed to create rant", error });
    }
  });

  app.get("/api/rants", async (req: Request, res: Response) => {
    try {
      const rants = await storage.getAnonymousRants();
      res.json(rants);
    } catch (error) {
      res.status(500).json({ message: "Failed to get rants", error });
    }
  });

  app.post("/api/rants/:id/support", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const success = await storage.supportAnonymousRant(id);
      res.json({ success });
    } catch (error) {
      res.status(500).json({ message: "Failed to support rant", error });
    }
  });

  // Therapists routes
  app.get("/api/therapists", authenticateToken, async (req: Request, res: Response) => {
    try {
      const therapists = await storage.getTherapists();
      res.json(therapists);
    } catch (error) {
      res.status(500).json({ message: "Failed to get therapists", error });
    }
  });

  app.get("/api/therapists/:id", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const therapist = await storage.getTherapist(id);
      
      if (!therapist) {
        return res.status(404).json({ message: "Therapist not found" });
      }

      res.json(therapist);
    } catch (error) {
      res.status(500).json({ message: "Failed to get therapist", error });
    }
  });

  // Appointments routes
  app.post("/api/appointments", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { userId } = (req as any).user;
      const appointmentData = insertAppointmentSchema.parse({ ...req.body, userId });
      
      const appointment = await storage.createAppointment(appointmentData);
      res.status(201).json(appointment);
    } catch (error) {
      res.status(400).json({ message: "Failed to create appointment", error });
    }
  });

  app.get("/api/appointments", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { userId } = (req as any).user;
      const appointments = await storage.getUserAppointments(userId);
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ message: "Failed to get appointments", error });
    }
  });

  app.get("/api/appointments/:id", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { userId } = (req as any).user;
      
      const appointment = await storage.getAppointment(id);
      
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }

      // Verify ownership
      if (appointment.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(appointment);
    } catch (error) {
      res.status(500).json({ message: "Failed to get appointment", error });
    }
  });

  app.put("/api/appointments/:id", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { userId } = (req as any).user;
      
      // Verify ownership
      const existing = await storage.getAppointment(id);
      if (!existing || existing.userId !== userId) {
        return res.status(404).json({ message: "Appointment not found" });
      }

      const updated = await storage.updateAppointment(id, req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update appointment", error });
    }
  });

  app.delete("/api/appointments/:id", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { userId } = (req as any).user;
      
      // Verify ownership
      const existing = await storage.getAppointment(id);
      if (!existing || existing.userId !== userId) {
        return res.status(404).json({ message: "Appointment not found" });
      }

      const deleted = await storage.deleteAppointment(id);
      res.json({ success: deleted });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete appointment", error });
    }
  });

  // Courses routes
  app.get("/api/courses", authenticateToken, async (req: Request, res: Response) => {
    try {
      const courses = await storage.getCourses();
      res.json(courses);
    } catch (error) {
      res.status(500).json({ message: "Failed to get courses", error });
    }
  });

  app.get("/api/courses/:id", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const course = await storage.getCourse(id);
      
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      res.json(course);
    } catch (error) {
      res.status(500).json({ message: "Failed to get course", error });
    }
  });

  // Manager/Admin routes
  app.get("/api/admin/wellness-metrics/:orgId", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { role } = (req as any).user;
      const { orgId } = req.params;

      if (role !== "manager" && role !== "admin") {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const metrics = await storage.getOrganizationWellnessMetrics(orgId);
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ message: "Failed to get wellness metrics", error });
    }
  });

  // Organization management routes
  app.post("/api/organizations", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { role, userId } = (req as any).user;
      const { name } = req.body;

      if (role !== "admin") {
        return res.status(403).json({ message: "Only admins can create organizations" });
      }

  if (!storage.createOrganization) return res.status(500).json({ message: 'Storage backend does not support organization creation' });
  const organization = await storage.createOrganization(name, userId);
      res.status(201).json(organization);
    } catch (error) {
      res.status(500).json({ message: "Failed to create organization", error });
    }
  });

  app.post("/api/organizations/:orgId/employees", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { role } = (req as any).user;
      const { orgId } = req.params;
      const { userId, jobTitle, department } = req.body;

      if (role !== "manager" && role !== "admin") {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

  if (!storage.addEmployeeToOrg) return res.status(500).json({ message: 'Storage backend does not support adding employees to orgs' });
  const employee = await storage.addEmployeeToOrg(userId, orgId, jobTitle, department);
      res.status(201).json(employee);
    } catch (error) {
      res.status(500).json({ message: "Failed to add employee", error });
    }
  });

  app.get("/api/organizations/:orgId/employees", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { role } = (req as any).user;
      const { orgId } = req.params;

      if (role !== "manager" && role !== "admin") {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const employees = await storage.getEmployeesByOrg(orgId);
      res.json(employees);
    } catch (error) {
      res.status(500).json({ message: "Failed to get employees", error });
    }
  });

  // Wellness survey routes
  app.post("/api/surveys", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { role } = (req as any).user;
      if (role !== "manager" && role !== "admin") {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      
      // Survey creation logic would go here
      res.status(201).json({ message: "Survey created successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to create survey", error });
    }
  });

  // Learning courses progress
  app.post("/api/courses/:id/progress", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { userId } = (req as any).user;
      const { id } = req.params;
      const { progress } = req.body;
      
      // Course progress tracking logic would go here
      res.json({ message: "Progress updated", courseId: id, progress });
    } catch (error) {
      res.status(500).json({ message: "Failed to update progress", error });
    }
  });

  // Notification preferences
  app.get("/api/notifications/preferences", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { userId } = (req as any).user;
      // Return user notification preferences
      res.json({
        dailyReminders: true,
        weeklyReports: true,
        therapistUpdates: true,
        communityMessages: false
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get preferences", error });
    }
  });

  app.put("/api/notifications/preferences", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { userId } = (req as any).user;
      const preferences = req.body;
      // Update user notification preferences
      res.json({ message: "Preferences updated", preferences });
    } catch (error) {
      res.status(500).json({ message: "Failed to update preferences", error });
    }
  });

  // Buddy matching
  app.get('/api/buddies/suggestions', authenticateToken, async (req: Request, res: Response) => {
    try {
      const { userId } = (req as any).user;
      const suggestions = await storage.suggestBuddies(userId, 10);
      res.json(suggestions);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get buddy suggestions', error });
    }
  });

  app.post('/api/buddies/match', authenticateToken, async (req: Request, res: Response) => {
    try {
      const { userId } = (req as any).user;
      const { otherUserId } = req.body;
      if (!otherUserId) return res.status(400).json({ message: 'otherUserId required' });
      const match = await storage.createBuddyMatch(userId, otherUserId, Math.random());
      res.status(201).json(match);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create buddy match', error });
    }
  });

  app.put('/api/buddies/:id/status', authenticateToken, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      if (!['pending','accepted','declined'].includes(status)) return res.status(400).json({ message: 'Invalid status' });
      const success = await storage.updateBuddyMatchStatus(id, status);
      res.json({ success });
    } catch (error) {
      res.status(500).json({ message: 'Failed to update match status', error });
    }
  });

  app.get('/api/buddies/matches', authenticateToken, async (req: Request, res: Response) => {
    try {
      const { userId } = (req as any).user;
      const matches = await storage.getBuddyMatches(userId);
      res.json(matches);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get matches', error });
    }
  });

  // Wellness Assessment routes
  app.get("/api/wellness-assessments", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { userId } = (req as any).user;
      const assessments = await storage.getWellnessAssessments(userId);
      res.json(assessments);
    } catch (error) {
      res.status(500).json({ message: "Failed to get assessments", error });
    }
  });

  app.get("/api/wellness-assessments/:id", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const assessment = await storage.getWellnessAssessment(id);
      
      if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }

      res.json(assessment);
    } catch (error) {
      res.status(500).json({ message: "Failed to get assessment", error });
    }
  });

  app.post("/api/wellness-assessments/:id/submit", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { userId } = (req as any).user;
      const { id } = req.params;
      const { responses } = req.body;

      // Get the assessment to validate responses
      const assessment = await storage.getWellnessAssessment(id);
      if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }

      // Calculate scores and generate recommendations
      const { totalScore, categoryScores, recommendations } = calculateAssessmentScore(assessment.questions, responses);

      const responseData = {
        assessmentId: id,
        userId,
        responses,
        totalScore,
        categoryScores,
        recommendations,
      };

      const savedResponse = await storage.createAssessmentResponse(responseData);
      res.status(201).json(savedResponse);
    } catch (error) {
      res.status(500).json({ message: "Failed to submit assessment", error });
    }
  });

  app.get("/api/wellness-assessments/responses", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { userId } = (req as any).user;
      const responses = await storage.getUserAssessmentResponses(userId);
      res.json(responses);
    } catch (error) {
      res.status(500).json({ message: "Failed to get responses", error });
    }
  });

  app.get("/api/wellness-assessments/responses/latest", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { userId } = (req as any).user;
      const latestResponse = await storage.getLatestAssessmentResponse(userId);
      res.json(latestResponse);
    } catch (error) {
      res.status(500).json({ message: "Failed to get latest response", error });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
