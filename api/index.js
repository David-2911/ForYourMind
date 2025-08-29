// Vercel serverless function entry point
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { registerRoutes } from '../server/routes';
import { initializeDatabase } from '../server/database';

// Initialize the Express app
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(process.env.COOKIE_SECRET));

// Configure CORS with credentials support
const allowedOrigin = process.env.CORS_ORIGIN || "*";
app.use(cors({ 
  origin: allowedOrigin, 
  credentials: true 
}));

// Initialize database connection
let isDbInitialized = false;

const handler = async (req, res) => {
  // Initialize database if not already done
  if (!isDbInitialized) {
    await initializeDatabase();
    isDbInitialized = true;
  }

  // Handle the request with the Express app
  return app(req, res);
};

// Register all routes
registerRoutes(app);

export default handler;
