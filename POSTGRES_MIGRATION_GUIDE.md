# PostgreSQL Database Migration Guide

This document explains how to migrate from SQLite to PostgreSQL for your MindfulMe application.

## Local Testing with PostgreSQL

To test the application locally with PostgreSQL:

1. Install PostgreSQL on your local machine or use a Docker container.

2. Create a local PostgreSQL database:
   ```bash
   createdb mindfulme
   ```

3. Apply the database migrations:
   ```bash
   # Set your local PostgreSQL connection string
   export DATABASE_URL=postgres://username:password@localhost:5432/mindfulme
   
   # Run the migration script
   ./apply-postgres-migrations.sh
   ```

4. Start the application with PostgreSQL:
   ```bash
   # Make sure USE_SQLITE is not set
   unset USE_SQLITE
   
   # Run with the PostgreSQL connection string
   DATABASE_URL=postgres://username:password@localhost:5432/mindfulme npm start
   ```

## Verifying Database Connection

To verify that your application is connected to PostgreSQL:

1. Check the server logs during startup. You should see:
   ```
   Using PostgreSQL storage
   ```

2. Try to create a new user account and verify that the login works.

3. You can inspect the PostgreSQL database tables:
   ```bash
   psql postgres://username:password@localhost:5432/mindfulme -c "\dt"
   ```

## Troubleshooting

If you encounter issues with the PostgreSQL connection:

1. Verify your DATABASE_URL format: `postgres://username:password@hostname:port/database`

2. Make sure PostgreSQL is running and accessible from your application server.

3. Check that the migrations have been applied correctly:
   ```bash
   psql postgres://username:password@localhost:5432/mindfulme -c "SELECT * FROM users LIMIT 1;"
   ```

4. Check the application logs for specific error messages.

5. If using Render, make sure you've set the DATABASE_URL environment variable in your service settings.
