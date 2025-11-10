import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { config } from "dotenv";
import { registerRoutes } from "./routes/index.js";

// Load environment variables
config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Health check endpoint (detailed for monitoring)
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    database: process.env.USE_SQLITE === "true" ? "SQLite" : "PostgreSQL",
    version: "1.0.0",
  });
});

// Simple liveness probe (for container orchestration)
app.get("/healthz", (req, res) => {
  res.status(200).send("OK");
});

// Readiness probe (checks if app is ready to serve traffic)
app.get("/ready", (req, res) => {
  // Add more checks here (database connection, etc.)
  res.status(200).json({ ready: true });
});

// API Routes - registerRoutes is async and returns HTTP server
(async () => {
  try {
    const server = await registerRoutes(app);
    
    // Start the server
    server.listen(PORT, () => {
      console.log(`✅ Backend server running on http://localhost:${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`🗄️  Database: ${process.env.USE_SQLITE ? "SQLite" : "PostgreSQL"}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
})();
