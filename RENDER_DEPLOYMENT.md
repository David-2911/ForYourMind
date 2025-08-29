# Deploying MindfulMe to Render.com

This guide will walk you through deploying both the frontend and backend of your MindfulMe application on Render.com.

## Prerequisites

Before you begin deployment, ensure you have:

1. **Render Account**: Sign up for a free account at [Render.com](https://render.com)
2. **Git Repository**: Your code should be in a Git repository (GitHub, GitLab, or Bitbucket)
3. **Code Preparation**: Make sure all changes are committed and pushed to your repository
4. **Database Migration**: Prepare for migrating from SQLite to PostgreSQL

## Deployment Methods

You have two options for deploying to Render:

1. **Blueprint Deployment** (Recommended): Uses the `render.yaml` file to set up all services at once
2. **Manual Deployment**: Set up each service individually through the Render dashboard

## Option 1: Blueprint Deployment

This is the easiest way to deploy your entire application stack at once.

1. Log in to your Render dashboard
2. Go to **Blueprints** in the left sidebar
3. Click **New Blueprint Instance**
4. Connect to your repository containing the `render.yaml` file
5. Review the services to be created:
   - **mindfulme-api**: Backend API service
   - **mindfulme-web**: Frontend web service
   - **mindfulme-db**: PostgreSQL database
6. Click **Apply** to create all services

Render will automatically configure and deploy your services based on the blueprint.

## Option 2: Manual Deployment

### Step 1: Create a PostgreSQL Database

1. From your Render dashboard, go to **New** > **PostgreSQL**
2. Configure your database:
   - **Name**: mindfulme-db
   - **Database**: mindfulme
   - **User**: mindfulme_user
   - **Region**: Choose the closest to your users
   - **Plan**: Free (or choose a paid plan for production)
3. Click **Create Database**
4. Copy the **Internal Database URL** for the next step

### Step 2: Deploy Backend API

1. From your Render dashboard, go to **New** > **Web Service**
2. Connect to your repository
3. Configure the service:
   - **Name**: mindfulme-api
   - **Environment**: Node
   - **Region**: Choose the closest to your users
   - **Branch**: main (or your preferred branch)
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
4. Add environment variables:
   - `NODE_ENV`: production
   - `PORT`: 10000
   - `USE_SQLITE`: false
   - `JWT_SECRET`: [generate a secure random string]
   - `COOKIE_SECRET`: [generate a secure random string]
   - `DATABASE_URL`: [paste your PostgreSQL connection string]
   - `CORS_ORIGIN`: https://mindfulme-web.onrender.com
5. Click **Create Web Service**

### Step 3: Deploy Frontend

1. From your Render dashboard, go to **New** > **Web Service**
2. Connect to your repository
3. Configure the service:
   - **Name**: mindfulme-web
   - **Environment**: Node
   - **Region**: Choose the closest to your users
   - **Branch**: main (or your preferred branch)
   - **Build Command**: `npm install && npm run build:frontend`
   - **Start Command**: `npm run serve:frontend`
4. Add environment variables:
   - `VITE_API_URL`: https://mindfulme-api.onrender.com/api
5. Click **Create Web Service**

## Database Migration

After deployment, you need to migrate your data from SQLite to PostgreSQL:

1. Set the DATABASE_URL environment variable locally:
   ```
   export DATABASE_URL=your_postgres_connection_string
   ```

2. Run the migration script:
   ```
   ./db-migrate.sh
   ```

## Verifying Deployment

Once deployment is complete:

1. Check the health of your API by visiting:
   ```
   https://mindfulme-api.onrender.com/api/health
   ```

2. Visit your frontend application:
   ```
   https://mindfulme-web.onrender.com
   ```

3. Test user login and core functionality

## Troubleshooting

### Common Issues

1. **Build Failures**:
   - Check build logs in the Render dashboard
   - Ensure all dependencies are properly installed
   - Verify that build commands are correct

2. **Database Connection Issues**:
   - Verify your DATABASE_URL is correct
   - Check if your database service is running
   - Ensure the migration ran successfully

3. **CORS Errors**:
   - Verify that CORS_ORIGIN is set correctly in your API service
   - Make sure the frontend is using the correct API URL

4. **Slow Initial Loads**:
   - Free tier services on Render spin down after inactivity
   - The first request after inactivity may take 30-60 seconds

## Monitoring and Management

- **Logs**: View real-time logs in the Render dashboard
- **Metrics**: Monitor CPU, memory, and response times
- **Scaling**: Upgrade plans as needed for increased traffic

## Next Steps

After successful deployment, consider:

1. Setting up a custom domain
2. Configuring SSL certificates
3. Setting up automatic database backups
4. Implementing monitoring and alerts
