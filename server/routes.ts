import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertJournalSchema, insertAnonymousRantSchema, insertMoodEntrySchema, insertAppointmentSchema } from "@shared/schema";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "for-your-mind-secret-key";

// JWT middleware
const authenticateToken = (req: Request, res: Response, next: any) => {
  const token = req.headers.authorization?.split(" ")[1];
  
  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    (req as any).user = user;
    next();
  });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const user = await storage.createUser(userData);
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.json({ 
        user: { 
          id: user.id, 
          email: user.email, 
          displayName: user.displayName,
          role: user.role 
        }, 
        token 
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid user data", error });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" });
      }

      const user = await storage.verifyPassword(email, password);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.json({ 
        user: { 
          id: user.id, 
          email: user.email, 
          displayName: user.displayName,
          role: user.role 
        }, 
        token 
      });
    } catch (error) {
      res.status(500).json({ message: "Login failed", error });
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

  // Courses routes
  app.get("/api/courses", authenticateToken, async (req: Request, res: Response) => {
    try {
      const courses = await storage.getCourses();
      res.json(courses);
    } catch (error) {
      res.status(500).json({ message: "Failed to get courses", error });
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

  const httpServer = createServer(app);
  return httpServer;
}
