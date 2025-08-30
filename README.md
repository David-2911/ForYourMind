# MindfulMe - Digital Wellbeing Platform

MindfulMe is a comprehensive mental wellness platform designed to support both individuals and organizations in their mental health journey.

## Features

- **Personal Wellness**: Track mood, journal, and access wellness assessments
- **Team Wellness**: For managers to monitor team wellbeing and provide support
- **Anonymous Rants**: Express concerns in a safe, anonymous environment
- **Professional Support**: Connect with therapists and wellness professionals

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
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. Start development server
   ```
   npm run dev
   ```

5. Open your browser to http://localhost:5173

## Deployment

### Option 1: Traditional Server Deployment

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

### Option 2: Docker Deployment

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

## Authentication

The application uses JWT authentication with refresh tokens:

- Access tokens (short-lived, 15 minutes by default)
- Refresh tokens (longer-lived, 7 days by default, stored in HTTP-only cookies)

## Database Configuration

By default, the application uses SQLite for simplicity. For production use with multiple users, consider switching to a PostgreSQL database by:

1. Setting up a PostgreSQL database
2. Configuring the `DATABASE_URL` environment variable
3. Setting `USE_SQLITE=false` in your environment variables

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
