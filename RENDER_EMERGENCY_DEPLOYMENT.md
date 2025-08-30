# MindfulMe Render Deployment Guide

This guide provides instructions for deploying the MindfulMe application to Render.com using the emergency build scripts that handle ESM compatibility.

## Setup on Render.com

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure the following settings:

   - **Name**: MindfulMe
   - **Environment**: Node
   - **Region**: Choose the closest to your users
   - **Branch**: main (or your production branch)
   - **Build Command**: `./render-emergency-build.sh`
   - **Start Command**: `node dist/index.js`

## Required Environment Variables

Set the following environment variables in your Render dashboard:

- `NODE_ENV`: `production`
- `DATABASE_URL`: Your PostgreSQL connection string
- `PORT`: `10000` (or Render will set this automatically)
- `JWT_SECRET`: Your JWT secret (generate a strong random string)
- `REFRESH_TOKEN_SECRET`: Your refresh token secret (different from JWT_SECRET)
- `CORS_ORIGIN`: Your frontend URL (e.g., `https://mindfulme-web.onrender.com`)

## Deployment Process

The `render-emergency-build.sh` script handles:

1. Installing all dependencies
2. Building the frontend with Vite
3. Creating ESM-compatible server files:
   - `index.js` - Main server entry point with __dirname workaround
   - `database.js` - PostgreSQL connection setup
   - `storage.js` - Storage implementation factory
   - And other required modules

The script doesn't rely on TypeScript compilation, which was causing ESM compatibility issues. Instead, it creates JavaScript modules directly.

## Database Setup

Make sure your PostgreSQL database has the following tables:

1. `users` - For user accounts
2. `journals` - For journal entries
3. `refresh_tokens` - For authentication

You can use the migrations in the `migrations` folder to set up your database schema:

```sql
-- users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL
);

-- journals table
CREATE TABLE IF NOT EXISTS journals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  created TEXT NOT NULL,
  mood TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- refresh_tokens table
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  token TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## Troubleshooting

If you encounter deployment issues:

1. Check the Render logs for detailed error messages
2. Verify environment variables are set correctly
3. Ensure your PostgreSQL database is accessible from Render
4. Test the connection with the `/api/status` endpoint

For database connection issues, try running a manual query to check connectivity:

```sql
SELECT 1 as test;
```

If all else fails, you can SSH into your Render instance and debug directly:

```bash
# From Render Shell
cd /opt/render/project/src
node -e "console.log(process.env.DATABASE_URL)"
```

## Additional Resources

- [Render Documentation](https://render.com/docs)
- [PostgreSQL on Render](https://render.com/docs/databases)
- [Environment Variables on Render](https://render.com/docs/environment-variables)
