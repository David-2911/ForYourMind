# Deploying MindfulMe on Render

This guide will help you deploy the MindfulMe application on Render.com.

## Prerequisites

1. A Render.com account
2. Your MindfulMe codebase pushed to a Git repository (GitHub, GitLab, etc.)

## Step 1: Create a PostgreSQL Database on Render

1. Go to the Render dashboard and click **New** → **PostgreSQL**
2. Configure your database:
   - **Name**: mindfulme-db
   - **Database**: mindfulme
   - **User**: mindfulme_user
   - **Region**: Choose region closest to your users
   - **Plan**: Free (or choose a paid plan for production)
3. Click **Create Database**
4. Once created, note the **Internal Database URL** - you'll need this later

## Step 2: Deploy the Backend API

1. In the Render dashboard, click **New** → **Web Service**
2. Connect your repository
3. Configure the service:
   - **Name**: mindfulme-api
   - **Build Command**: `npm install && npm run build:fixed`
   - **Start Command**: `npm run start`
   - **Plan**: Free (or choose an appropriate tier)
   
4. Add the following environment variables:
   - `NODE_ENV`: production
   - `DATABASE_URL`: [Your PostgreSQL Internal Database URL from Step 1]
   - `JWT_SECRET`: [Generate a random string]
   - `COOKIE_SECRET`: [Generate another random string]
   - `CORS_ORIGIN`: [Your frontend URL, e.g., https://mindfulme-web.onrender.com]
   - `USE_SQLITE`: false
   
5. In the **Health Check Path** field, enter: `/health`
   
6. Click **Create Web Service**

## Step 3: Deploy the Frontend

1. In the Render dashboard, click **New** → **Web Service**
2. Connect to the same repository
3. Configure the service:
   - **Name**: mindfulme-web
   - **Build Command**: `npm install && npm run build:frontend:fixed`
   - **Start Command**: `npm run serve:frontend`
   - **Plan**: Free (or choose an appropriate tier)
   
4. Add the environment variable:
   - `VITE_API_URL`: [Your backend API URL, e.g., https://mindfulme-api.onrender.com/api]
   
5. Click **Create Web Service**

## Step 4: Database Migration

After deploying the services, migrate your database:

1. Open a terminal on your local machine
2. Set the DATABASE_URL environment variable:
   ```bash
   export DATABASE_URL="your-postgresql-connection-string"
   ```
3. Run the migration script:
   ```bash
   ./db-migrate.sh
   ```

## Step 5: Verify Deployment

1. Visit your frontend URL
2. Test the application by creating an account and logging in
3. Verify that all features are working correctly

## Troubleshooting

If you encounter issues:

1. Check the service logs in the Render dashboard
2. Verify that all environment variables are set correctly
3. Ensure that the database connection is working
4. Check that CORS is properly configured

## Notes for Production

1. Free tier services on Render will spin down after periods of inactivity, which can cause slow initial loads
2. For production use, consider upgrading to paid plans
3. Set up a custom domain and SSL certificate
4. Configure regular database backups
