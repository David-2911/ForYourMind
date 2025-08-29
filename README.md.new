# MindfulMe - Digital Wellbeing Platform

MindfulMe is a comprehensive mental wellness platform designed to support both individuals and organizations in their mental health journey.

## Features

- **Personal Wellness**: Track mood, journal, and access wellness assessments
- **Team Wellness**: For managers to monitor team wellbeing and provide support
- **Anonymous Rants**: Express concerns in a safe, anonymous environment
- **Professional Support**: Connect with therapists and wellness professionals
- **Responsive Design**: Optimized for all devices from mobile to desktop

## Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn
- SQLite (default) or PostgreSQL (optional for larger deployments)

### Local Development

1. Clone the repository
   ```
   git clone https://github.com/yourusername/mindfulme.git
   cd mindfulme
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Set up environment variables
   ```
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. Start development server
   ```
   npm run dev
   ```

5. Open your browser to http://localhost:5173

## Deployment

### Option 1: Vercel Deployment (Recommended)

The application is optimized for deployment on Vercel:

1. Prepare for deployment
   ```
   chmod +x vercel-build.sh vercel-deploy.sh
   ```

2. Deploy to Vercel
   ```
   ./vercel-deploy.sh
   ```

3. Configure the following environment variables in your Vercel project settings:
   - `NODE_ENV=production`
   - `JWT_SECRET` (use a strong, unique value)
   - `DATABASE_URL` (for PostgreSQL connection, we recommend Neon Database)
   - `CORS_ORIGIN` (set to your frontend URL)
   - `COOKIE_SECRET` (use a strong, unique value)
   - `USE_SQLITE=false` (to use PostgreSQL in production)

4. Migrate your data if needed:
   ```
   export DATABASE_URL=your_postgres_connection_string
   ./db-migrate.sh
   ```

### Option 2: Traditional Server Deployment

1. Set up environment variables for production
   ```
   cp .env.example .env
   # Edit .env with production settings
   ```

2. Run the deployment script
   ```
   ./deploy.sh
   ```

3. Start the application
   ```
   npm run start
   ```

For persistent deployment, consider using a process manager like PM2:
```
npm install -g pm2
pm2 start npm --name "mindfulme" -- run start
```

### Option 3: Docker Deployment

1. Build the Docker image
   ```
   docker build -t mindfulme .
   ```

2. Run the container
   ```
   docker run -p 5000:5000 -e JWT_SECRET=your_secret_key mindfulme
   ```

## Project Structure

- `client/`: Frontend React application
- `server/`: Backend Express API
- `shared/`: Shared TypeScript types and utilities
- `data/`: SQLite database files (in development/SQLite mode)
- `dist/`: Built files (generated during build process)
- `api/`: Serverless functions for Vercel deployment

## Authentication

The application uses JWT authentication with refresh tokens:

- Access tokens (short-lived, 15 minutes by default)
- Refresh tokens (longer-lived, 7 days by default, stored in HTTP-only cookies)

## Database Configuration

By default, the application uses SQLite for simplicity. For production use with multiple users, consider switching to a PostgreSQL database by:

1. Setting up a PostgreSQL database (we recommend Neon Database for Vercel deployment)
2. Configuring the `DATABASE_URL` environment variable
3. Setting `USE_SQLITE=false` in your environment variables

## Cloud Database Setup

For production deployment, we recommend using Neon Database:

1. Create a Neon account at https://neon.tech
2. Create a new project
3. Get the connection string from the dashboard
4. Set `DATABASE_URL` environment variable in your Vercel project settings
5. Run the migration script: `./db-migrate.sh`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
