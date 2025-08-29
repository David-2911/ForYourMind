#!/usr/bin/env node

/**
 * MindfulMe Production Server
 * This script starts the production server with proper error handling
 */

console.log('🚀 Starting MindfulMe server...');

// Set default port for Render
const PORT = process.env.PORT || 10000;
process.env.PORT = PORT.toString();

// Ensure DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.warn('⚠️ No DATABASE_URL environment variable set. Using SQLite by default.');
  process.env.USE_SQLITE = 'true';
} else {
  console.log('📊 Using PostgreSQL database');
  process.env.USE_SQLITE = 'false';
}

// Start the server
try {
  console.log(`🌐 Server will listen on port ${PORT}`);
  import('./dist/index.js').catch(err => {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  });
} catch (err) {
  console.error('❌ Fatal error starting server:', err);
  process.exit(1);
}
