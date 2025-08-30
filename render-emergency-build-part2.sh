#!/bin/bash
# This script continues the ESM-compatible server build
set -e

# Create additional module files needed for the server
echo "🔧 Creating additional module files..."

# Create minimal database.js module
cat > dist/database.js << 'EOF'
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

// We defer creating a Neon DB connection until runtime
export let db = undefined;

export async function initializeDatabase() {
  // If the app is configured to use SQLite, skip Neon initialization.
  if (process.env.USE_SQLITE === 'true') {
    console.log("USE_SQLITE detected — skipping Neon initialization");
    return;
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.warn("DATABASE_URL not set — skipping Neon initialization");
    return;
  }

  try {
    const sql = neon(databaseUrl);
    db = drizzle(sql);
    console.log("Neon database connected successfully");
    
    // Verify connection with a simple query
    const result = await sql`SELECT 1 as test`;
    console.log("Database connection test:", result);
  } catch (error) {
    console.error("Neon database connection failed:", error);
    throw error; // Re-throw to stop server startup
  }
}
EOF

# Create storage.js for storage selection logic
cat > dist/storage.js << 'EOF'
import { InMemoryStorage } from './inMemoryStorage.js';
import { SqliteStorage } from './sqliteStorage.js';
import { PostgresStorage } from './postgresStorage.js';

export function getStorageForEnvironment() {
  const useSqlite = process.env.USE_SQLITE === 'true';
  const databaseUrl = process.env.DATABASE_URL;
  
  console.log("Storage selection:", {
    useSqlite,
    hasDbUrl: !!databaseUrl
  });
  
  if (databaseUrl && !useSqlite) {
    console.log("Using PostgresStorage with DATABASE_URL");
    return new PostgresStorage();
  } else if (useSqlite) {
    console.log("Using SqliteStorage");
    return new SqliteStorage();
  } else {
    console.log("Fallback to InMemoryStorage");
    return new InMemoryStorage();
  }
}
EOF

# Create basic routes.js
cat > dist/routes.js << 'EOF'
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'your_refresh_token_secret';

export default function setupRoutes(app, storage) {
  // Status endpoint
  app.get('/api/status', (req, res) => {
    res.json({ 
      status: 'ok', 
      time: new Date().toISOString(),
      storageType: storage.constructor.name
    });
  });

  // Authenticate middleware
  const authenticate = (req, res, next) => {
    try {
      const token = req.cookies.token;
      if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  };

  // User routes
  app.post('/api/users/register', async (req, res) => {
    try {
      const { email, password, name } = req.body;
      
      // Validate inputs
      if (!email || !password || !name) {
        return res.status(400).json({ error: 'All fields are required' });
      }
      
      // Check if user exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create user
      const userId = await storage.createUser({
        email,
        password: hashedPassword,
        name
      });
      
      // Create tokens
      const token = jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '1h' });
      const refreshToken = jwt.sign({ userId, email }, REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
      
      // Store refresh token
      await storage.storeRefreshToken(userId, refreshToken);
      
      // Set cookies
      res.cookie('token', token, { 
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 3600000 // 1 hour
      });
      
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 3600000 // 7 days
      });
      
      return res.status(201).json({ 
        message: 'User registered successfully',
        userId,
        name
      });
    } catch (error) {
      console.error('Registration error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/users/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Validate inputs
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }
      
      // Get user
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Check password
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Create tokens
      const token = jwt.sign({ userId: user.id, email }, JWT_SECRET, { expiresIn: '1h' });
      const refreshToken = jwt.sign({ userId: user.id, email }, REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
      
      // Store refresh token
      await storage.storeRefreshToken(user.id, refreshToken);
      
      // Set cookies
      res.cookie('token', token, { 
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 3600000 // 1 hour
      });
      
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 3600000 // 7 days
      });
      
      return res.json({ 
        message: 'Login successful',
        userId: user.id,
        name: user.name
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/users/refresh', async (req, res) => {
    try {
      const refreshToken = req.cookies.refreshToken;
      
      if (!refreshToken) {
        return res.status(401).json({ error: 'Refresh token required' });
      }
      
      // Verify token
      const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
      
      // Check if token exists in storage
      const storedToken = await storage.getRefreshToken(decoded.userId, refreshToken);
      if (!storedToken) {
        return res.status(401).json({ error: 'Invalid refresh token' });
      }
      
      // Create new token
      const newToken = jwt.sign({ userId: decoded.userId, email: decoded.email }, JWT_SECRET, { expiresIn: '1h' });
      
      // Set cookie
      res.cookie('token', newToken, { 
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 3600000 // 1 hour
      });
      
      return res.json({ message: 'Token refreshed successfully' });
    } catch (error) {
      console.error('Token refresh error:', error);
      return res.status(401).json({ error: 'Invalid refresh token' });
    }
  });

  app.post('/api/users/logout', (req, res) => {
    // Clear cookies
    res.clearCookie('token');
    res.clearCookie('refreshToken');
    
    return res.json({ message: 'Logout successful' });
  });

  // Profile route
  app.get('/api/users/profile', authenticate, async (req, res) => {
    try {
      const user = await storage.getUserById(req.user.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Don't send password
      const { password, ...userWithoutPassword } = user;
      
      return res.json(userWithoutPassword);
    } catch (error) {
      console.error('Profile error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Additional routes will be added as needed
  return app;
}
EOF

# Create inMemoryStorage.js
cat > dist/inMemoryStorage.js << 'EOF'
export class InMemoryStorage {
  constructor() {
    this.users = [];
    this.journals = [];
    this.refreshTokens = [];
    this.nextUserId = 1;
    this.nextJournalId = 1;
    console.log("InMemoryStorage initialized");
  }

  async getUserByEmail(email) {
    return this.users.find(user => user.email === email);
  }

  async getUserById(id) {
    return this.users.find(user => user.id === id);
  }

  async createUser({ email, password, name }) {
    const id = this.nextUserId++;
    this.users.push({ id, email, password, name });
    return id;
  }

  async storeRefreshToken(userId, token) {
    this.refreshTokens.push({ userId, token });
    return true;
  }

  async getRefreshToken(userId, token) {
    return this.refreshTokens.find(rt => rt.userId === userId && rt.token === token);
  }

  async removeRefreshToken(userId, token) {
    this.refreshTokens = this.refreshTokens.filter(rt => !(rt.userId === userId && rt.token === token));
    return true;
  }

  // Just stubs for the remaining methods
  async createJournalEntry() { return 1; }
  async getJournalEntries() { return []; }
  async getJournalEntry() { return null; }
  async updateJournalEntry() { return true; }
  async deleteJournalEntry() { return true; }
}
EOF

# Create sqliteStorage.js
cat > dist/sqliteStorage.js << 'EOF'
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

export class SqliteStorage {
  constructor() {
    this.dbPromise = this.initializeDb();
    console.log("SqliteStorage initialized");
  }

  async initializeDb() {
    const db = await open({
      filename: './data/db.sqlite',
      driver: sqlite3.Database
    });

    // Create tables if they don't exist
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        password TEXT,
        name TEXT
      );
      
      CREATE TABLE IF NOT EXISTS journals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER,
        content TEXT,
        created TEXT,
        mood TEXT,
        FOREIGN KEY (userId) REFERENCES users(id)
      );
      
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER,
        token TEXT,
        FOREIGN KEY (userId) REFERENCES users(id)
      );
    `);

    return db;
  }

  async getUserByEmail(email) {
    const db = await this.dbPromise;
    return db.get('SELECT * FROM users WHERE email = ?', [email]);
  }

  async getUserById(id) {
    const db = await this.dbPromise;
    return db.get('SELECT * FROM users WHERE id = ?', [id]);
  }

  async createUser({ email, password, name }) {
    const db = await this.dbPromise;
    const result = await db.run(
      'INSERT INTO users (email, password, name) VALUES (?, ?, ?)',
      [email, password, name]
    );
    return result.lastID;
  }

  async storeRefreshToken(userId, token) {
    const db = await this.dbPromise;
    await db.run(
      'INSERT INTO refresh_tokens (userId, token) VALUES (?, ?)',
      [userId, token]
    );
    return true;
  }

  async getRefreshToken(userId, token) {
    const db = await this.dbPromise;
    return db.get(
      'SELECT * FROM refresh_tokens WHERE userId = ? AND token = ?',
      [userId, token]
    );
  }

  async removeRefreshToken(userId, token) {
    const db = await this.dbPromise;
    await db.run(
      'DELETE FROM refresh_tokens WHERE userId = ? AND token = ?',
      [userId, token]
    );
    return true;
  }

  // Just minimal implementations for the journal methods
  async createJournalEntry(userId, content, mood) {
    const db = await this.dbPromise;
    const created = new Date().toISOString();
    const result = await db.run(
      'INSERT INTO journals (userId, content, created, mood) VALUES (?, ?, ?, ?)',
      [userId, content, created, mood]
    );
    return result.lastID;
  }

  async getJournalEntries(userId) {
    const db = await this.dbPromise;
    return db.all(
      'SELECT * FROM journals WHERE userId = ? ORDER BY created DESC',
      [userId]
    );
  }

  async getJournalEntry(id, userId) {
    const db = await this.dbPromise;
    return db.get(
      'SELECT * FROM journals WHERE id = ? AND userId = ?',
      [id, userId]
    );
  }

  async updateJournalEntry(id, userId, content, mood) {
    const db = await this.dbPromise;
    await db.run(
      'UPDATE journals SET content = ?, mood = ? WHERE id = ? AND userId = ?',
      [content, mood, id, userId]
    );
    return true;
  }

  async deleteJournalEntry(id, userId) {
    const db = await this.dbPromise;
    await db.run(
      'DELETE FROM journals WHERE id = ? AND userId = ?',
      [id, userId]
    );
    return true;
  }
}
EOF

# Create postgresStorage.js
cat > dist/postgresStorage.js << 'EOF'
import { db, initializeDatabase } from './database.js';

export class PostgresStorage {
  constructor() {
    console.log("PostgresStorage initialized");
    
    // Make sure the database is initialized
    if (!db) {
      initializeDatabase().catch(err => {
        console.error("Failed to initialize database:", err);
      });
    }
  }

  async getUserByEmail(email) {
    if (!db) return null;
    
    try {
      const result = await db.execute(
        `SELECT id, email, password, name FROM users WHERE email = $1`,
        [email]
      );
      
      return result.rows[0] || null;
    } catch (error) {
      console.error("getUserByEmail error:", error);
      return null;
    }
  }

  async getUserById(id) {
    if (!db) return null;
    
    try {
      const result = await db.execute(
        `SELECT id, email, password, name FROM users WHERE id = $1`,
        [id]
      );
      
      return result.rows[0] || null;
    } catch (error) {
      console.error("getUserById error:", error);
      return null;
    }
  }

  async createUser({ email, password, name }) {
    if (!db) throw new Error("Database not initialized");
    
    try {
      const result = await db.execute(
        `INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id`,
        [email, password, name]
      );
      
      return result.rows[0].id;
    } catch (error) {
      console.error("createUser error:", error);
      throw error;
    }
  }

  async storeRefreshToken(userId, token) {
    if (!db) throw new Error("Database not initialized");
    
    try {
      await db.execute(
        `INSERT INTO refresh_tokens (user_id, token) VALUES ($1, $2)`,
        [userId, token]
      );
      
      return true;
    } catch (error) {
      console.error("storeRefreshToken error:", error);
      return false;
    }
  }

  async getRefreshToken(userId, token) {
    if (!db) return null;
    
    try {
      const result = await db.execute(
        `SELECT id, user_id as "userId", token FROM refresh_tokens WHERE user_id = $1 AND token = $2`,
        [userId, token]
      );
      
      return result.rows[0] || null;
    } catch (error) {
      console.error("getRefreshToken error:", error);
      return null;
    }
  }

  async removeRefreshToken(userId, token) {
    if (!db) return false;
    
    try {
      await db.execute(
        `DELETE FROM refresh_tokens WHERE user_id = $1 AND token = $2`,
        [userId, token]
      );
      
      return true;
    } catch (error) {
      console.error("removeRefreshToken error:", error);
      return false;
    }
  }

  // Minimal journal methods
  async createJournalEntry(userId, content, mood) {
    if (!db) throw new Error("Database not initialized");
    
    try {
      const created = new Date().toISOString();
      const result = await db.execute(
        `INSERT INTO journals (user_id, content, created, mood) VALUES ($1, $2, $3, $4) RETURNING id`,
        [userId, content, created, mood]
      );
      
      return result.rows[0].id;
    } catch (error) {
      console.error("createJournalEntry error:", error);
      throw error;
    }
  }

  async getJournalEntries(userId) {
    if (!db) return [];
    
    try {
      const result = await db.execute(
        `SELECT id, user_id as "userId", content, created, mood FROM journals WHERE user_id = $1 ORDER BY created DESC`,
        [userId]
      );
      
      return result.rows;
    } catch (error) {
      console.error("getJournalEntries error:", error);
      return [];
    }
  }

  async getJournalEntry(id, userId) {
    if (!db) return null;
    
    try {
      const result = await db.execute(
        `SELECT id, user_id as "userId", content, created, mood FROM journals WHERE id = $1 AND user_id = $2`,
        [id, userId]
      );
      
      return result.rows[0] || null;
    } catch (error) {
      console.error("getJournalEntry error:", error);
      return null;
    }
  }

  async updateJournalEntry(id, userId, content, mood) {
    if (!db) return false;
    
    try {
      await db.execute(
        `UPDATE journals SET content = $1, mood = $2 WHERE id = $3 AND user_id = $4`,
        [content, mood, id, userId]
      );
      
      return true;
    } catch (error) {
      console.error("updateJournalEntry error:", error);
      return false;
    }
  }

  async deleteJournalEntry(id, userId) {
    if (!db) return false;
    
    try {
      await db.execute(
        `DELETE FROM journals WHERE id = $1 AND user_id = $2`,
        [id, userId]
      );
      
      return true;
    } catch (error) {
      console.error("deleteJournalEntry error:", error);
      return false;
    }
  }
}
EOF

echo "✅ Server modules created successfully!"

# Copy migrations to the dist folder for reference
echo "📋 Copying migrations to dist..."
mkdir -p dist/migrations
cp -r migrations/* dist/migrations/

# Create a package.json that specifies type: module
echo "📦 Creating ESM package.json..."
cat > dist/package.json << 'EOF'
{
  "name": "mindfulme-server",
  "version": "1.0.0",
  "type": "module",
  "main": "index.js",
  "dependencies": {
    "express": "^4.18.2",
    "cookie-parser": "^1.4.6",
    "cors": "^2.8.5",
    "jsonwebtoken": "^9.0.0",
    "bcrypt": "^5.1.0",
    "drizzle-orm": "^0.25.0",
    "@neondatabase/serverless": "^0.4.0"
  }
}
EOF

echo "✅ Build part 2 completed successfully!"
