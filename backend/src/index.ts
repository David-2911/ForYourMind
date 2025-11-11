import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { config } from "dotenv";
import { registerRoutes } from "./routes/index.js";

// Load environment variables
config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration - allow multiple origins
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://fym-frontend.onrender.com",
  process.env.CORS_ORIGIN
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
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
    
    // 404 handler - must come after all routes
    app.use((req, res) => {
      res.status(404).json({
        success: false,
        error: "Endpoint not found",
        path: req.path,
        method: req.method
      });
    });

    // Global error handler - must be last middleware
    app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error("Unhandled error:", {
        message: err.message,
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
        path: req.path,
        method: req.method
      });

      // Don't expose sensitive error details in production
      const statusCode = err.statusCode || err.status || 500;
      
      if (process.env.NODE_ENV === "production") {
        res.status(statusCode).json({
          success: false,
          error: statusCode === 500 ? "Internal server error" : err.message,
          ...(err.code && { code: err.code })
        });
      } else {
        res.status(statusCode).json({
          success: false,
          error: err.message,
          stack: err.stack,
          details: err.details || undefined
        });
      }
    });
    
    // Start the server
    server.listen(PORT, () => {
      console.log(`✅ Backend server running on http://localhost:${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`🗄️  Database: ${process.env.USE_SQLITE ? "SQLite" : "PostgreSQL"}`);
    });

    // Handle uncaught exceptions
    process.on("uncaughtException", (error) => {
      console.error("❌ Uncaught Exception:", error?.message || String(error));
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on("unhandledRejection", (reason, promise) => {
      console.error("❌ Unhandled Rejection - reason:", typeof reason === 'object' && reason ? (reason as any).message || JSON.stringify(reason) : String(reason));
      process.exit(1);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
})();
