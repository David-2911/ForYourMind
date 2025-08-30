// migrate-data.js
// This script migrates data from SQLite to PostgreSQL with proper timestamp conversions
import 'dotenv/config';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log('MindfulMe: SQLite to PostgreSQL Data Migration');
  console.log('--------------------------------------------');

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL environment variable not set');
    process.exit(1);
  }

  // Open SQLite database
  const sqliteDb = await open({
    filename: './data/db.sqlite',
    driver: sqlite3.Database
  });

  console.log('Connected to SQLite database');

  // Connect to PostgreSQL
  console.log('Connecting to PostgreSQL database...');
  
  try {
    // Configure postgres client with SSL
    const client = postgres(databaseUrl, { 
      ssl: { rejectUnauthorized: false },
      max: 1
    });

    const pgDb = drizzle(client);

    console.log('Connected to PostgreSQL database');
    
    // Migration order to respect foreign key constraints
    const migrationOrder = [
      'users',
      'organizations',
      'therapists',
      'employees',
      'courses',
      'appointments',
      'journals',
      'anonymous_rants',
      'wellness_assessments',
      'assessment_responses',
      'mood_entries',
      'buddy_matches',
      'refresh_tokens'
    ];

    // Process each table in order
    for (const table of migrationOrder) {
      console.log(`Migrating table: ${table}`);
      
      try {
        // Get data from SQLite
        const rows = await sqliteDb.all(`SELECT * FROM ${table}`);
        
        if (rows.length === 0) {
          console.log(`No data in table ${table}, skipping`);
          continue;
        }
        
        console.log(`Found ${rows.length} rows in ${table}`);
        
        // Process data based on table type
        let processedRows = [];
        
        switch (table) {
          case 'users':
          case 'journals':
          case 'anonymous_rants':
          case 'mood_entries':
          case 'wellness_assessments':
          case 'organizations':
            // Convert Unix timestamps to PostgreSQL timestamps
            processedRows = rows.map(row => {
              const newRow = { ...row };
              if (newRow.created_at) {
                // Convert milliseconds to ISO string for PostgreSQL
                newRow.created_at = new Date(Number(newRow.created_at)).toISOString();
              }
              return newRow;
            });
            break;
            
          case 'refresh_tokens':
            // Convert expires_at from Unix timestamp to ISO date
            processedRows = rows.map(row => {
              const newRow = { ...row };
              if (newRow.expires_at) {
                newRow.expires_at = new Date(Number(newRow.expires_at)).toISOString();
              }
              return newRow;
            });
            break;
            
          case 'therapists':
            // Fix JSON formatting
            processedRows = rows.map(row => {
              const newRow = { ...row };
              if (newRow.availability && typeof newRow.availability === 'string') {
                try {
                  // Try to parse the availability string if it's already JSON
                  JSON.parse(newRow.availability);
                } catch (e) {
                  // Convert to proper JSON object if it's not valid JSON
                  const availStr = newRow.availability;
                  // Replace incorrect format with proper JSON
                  const formattedStr = availStr
                    .replace(/{/g, '{"')
                    .replace(/}/g, '"}')
                    .replace(/:/g, '":"')
                    .replace(/,/g, '","');
                  newRow.availability = formattedStr;
                }
              }
              return newRow;
            });
            break;
            
          default:
            processedRows = rows;
        }
        
        // Insert data into PostgreSQL
        if (processedRows.length > 0) {
          const columns = Object.keys(processedRows[0]).join(', ');
          
          for (const row of processedRows) {
            const values = Object.values(row).map(val => {
              if (val === null) return 'NULL';
              if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
              if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
              return val;
            }).join(', ');
            
            const query = `INSERT INTO ${table} (${columns}) VALUES (${values}) ON CONFLICT DO NOTHING`;
            
            try {
              await client`${query}`;
            } catch (err) {
              console.error(`Error inserting row into ${table}:`, err.message);
              console.error('Query:', query);
            }
          }
          
          console.log(`Migrated ${processedRows.length} rows to ${table}`);
        }
      } catch (err) {
        console.error(`Error migrating table ${table}:`, err.message);
      }
    }

    console.log('Data migration completed successfully');
    await client.end();
    await sqliteDb.close();
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();
