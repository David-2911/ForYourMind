# MindfulMe Vercel Deployment Checklist

Use this checklist to ensure a successful deployment of your MindfulMe application to Vercel.

## Pre-Deployment Preparation

- [ ] Make sure all code changes are committed and pushed to your repository
- [ ] Ensure your application is functioning correctly in development mode
- [ ] Run `npm run check` to validate TypeScript compilation
- [ ] Update any hardcoded URLs or API endpoints to use environment variables

## Environment Setup

- [ ] Run `./setup-env.sh` and select the production option
- [ ] Configure the following environment variables for Vercel:
  - [ ] `NODE_ENV=production`
  - [ ] `JWT_SECRET` (use a secure random value)
  - [ ] `COOKIE_SECRET` (use a secure random value)
  - [ ] `CORS_ORIGIN` (set to your frontend URL)
  - [ ] `USE_SQLITE=false` (for PostgreSQL in production)
  - [ ] `DATABASE_URL` (PostgreSQL connection string)

## Database Setup

- [ ] Create a Neon PostgreSQL database at https://neon.tech
- [ ] Copy the connection string from the Neon dashboard
- [ ] Configure the `DATABASE_URL` environment variable in Vercel
- [ ] Run database migration:
  ```
  export DATABASE_URL=your_postgres_connection_string
  ./db-migrate.sh
  ```

## Deployment

- [ ] Make deployment scripts executable:
  ```
  chmod +x vercel-build.sh vercel-deploy.sh
  ```
- [ ] Run the deployment script:
  ```
  ./vercel-deploy.sh
  ```
- [ ] Follow the prompts in the Vercel CLI

## Post-Deployment Verification

- [ ] Test user registration and login functionality
- [ ] Verify that all features work properly in production
- [ ] Check that database connections are working
- [ ] Test on various devices and screen sizes
- [ ] Verify that JWT authentication is working correctly

## Performance Optimization (Optional)

- [ ] Set up a custom domain in Vercel
- [ ] Configure Vercel Edge Functions if needed
- [ ] Set up monitoring for your application
- [ ] Configure analytics
- [ ] Set up regular database backups

## Troubleshooting Common Issues

### Database Connection Issues
- Ensure the `DATABASE_URL` is correctly configured
- Check that the database server allows connections from Vercel's IP ranges
- Verify that SSL is enabled for database connections

### Authentication Problems
- Check that JWT_SECRET is properly set
- Verify that cookies are being set with the correct domain
- Ensure CORS is properly configured

### Build Failures
- Check the build logs in Vercel
- Ensure all dependencies are properly installed
- Verify that the build command is correctly configured
