# Digital Wellbeing Platform

## Overview

A comprehensive digital wellbeing platform serving both individuals and organizations in their mental health journey. The application provides personalized tools, professional therapy connections, anonymous support communities, mood tracking, journaling capabilities, and organizational wellness insights. Built as a modern full-stack web application with role-based access for individuals, managers, and administrators.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client uses React with TypeScript as the primary frontend framework, built with Vite for fast development and optimized builds. The application implements a component-based architecture with:

- **UI Components**: Built on Radix UI primitives with shadcn/ui design system
- **Styling**: Tailwind CSS with custom serene wellness theme (lavender, sage green, coral colors)
- **State Management**: TanStack React Query for server state and local React state for UI
- **Routing**: Wouter for lightweight client-side routing
- **Authentication**: JWT token-based authentication with role-based access control

### Backend Architecture
The server uses Express.js with TypeScript in an ESM configuration, providing:

- **API Layer**: RESTful endpoints organized by feature domains (auth, journals, mood, etc.)
- **Authentication**: JWT middleware for protected routes with role-based authorization
- **Data Access**: In-memory storage implementation (IStorage interface) for development
- **Request Handling**: Express middleware for JSON parsing, logging, and error handling

### Database Design
Uses Drizzle ORM with PostgreSQL schema designed for multi-tenancy:

- **Users**: Core user accounts with role-based access (individual, manager, admin)
- **Organizations**: Company/group entities for manager and admin features
- **Employees**: Association table linking users to organizations
- **Journals**: Personal wellness entries with mood scoring and tagging
- **Mood Entries**: Daily mood tracking with temporal data
- **Anonymous Rants**: Community support with sentiment analysis
- **Therapists & Appointments**: Professional service connections
- **Courses**: Learning module content delivery

### Authentication & Authorization
Role-based access control system with three primary user types:

- **Individual**: Personal wellness tracking, therapy booking, community access
- **Manager**: Team wellness oversight, department metrics, employee insights
- **Admin**: Platform management, organization onboarding, system analytics

JWT tokens provide stateless authentication with refresh token capability for extended sessions.

### Development Workflow
The application uses a monorepo structure with shared types and schemas:

- **Client**: React application in `/client` directory
- **Server**: Express API in `/server` directory  
- **Shared**: Common types and database schemas in `/shared` directory
- **Build Process**: Vite for frontend bundling, esbuild for server compilation

## External Dependencies

### Core Framework Dependencies
- **React & TypeScript**: Frontend framework with type safety
- **Express.js**: Backend web framework
- **Vite**: Frontend build tool and development server
- **Drizzle ORM**: Type-safe database toolkit
- **TanStack React Query**: Server state management

### UI & Styling
- **Radix UI**: Unstyled component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library
- **shadcn/ui**: Pre-built component library

### Database & Authentication
- **PostgreSQL**: Primary database (via Neon serverless)
- **bcrypt**: Password hashing
- **jsonwebtoken**: JWT token generation and validation

### Development Tools
- **TypeScript**: Static type checking
- **Wouter**: Lightweight routing
- **PostCSS**: CSS processing
- **ESBuild**: Fast JavaScript bundler