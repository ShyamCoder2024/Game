# Matka Betting Platform

A comprehensive betting platform built with Next.js, PostgreSQL, Prisma, and Redis.

## Prerequisites

Before running this project, ensure you have the following installed on your machine:

1.  **Node.js** (v18 or higher)
2.  **PostgreSQL** (v15 or higher)
3.  **Redis** (optional, but recommended for full functionality)

## Getting Started

Follow these steps to set up and run the project locally.

### 1. Clone the Repository

```bash
git clone <repository-url>
cd matka-platform
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env` file in the root directory. You can copy the structure from `.env.example` if it exists, or use the following template (ask the project owner for the `JWT_SECRET` and other sensitive keys):

```env
# Database
DATABASE_URL="postgresql://matka_user:matka_secret_2026@localhost:5432/matka_db"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT Secret (Change this!)
JWT_SECRET="your-secret-key-here"

# Admin Credentials (Initial Setup)
ADMIN_ID="ADMIN001"
ADMIN_PASSWORD="admin@matka2026"

# Server Config
PORT=3001
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

> **Important:** The `.env` file contains sensitive passwords and is NOT shared via Git. You must create this file manually.

### 4. Database Setup

Ensure your PostgreSQL server is running. Then, run the following commands to create the database and tables:

```bash
# Run migrations (creates tables)
npx prisma migrate dev

# (Optional) Seed the database with initial data
npx prisma db seed
```

### 5. Run the Application

You need to run both the Next.js frontend and the custom backend server.

```bash
# Terminal 1: Run the backend server/cron jobs
npm run dev:server

# Terminal 2: Run the frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

-   `src/app`: Next.js App Router pages
-   `src/components`: Reusable UI components
-   `src/lib`: Utility functions and API clients
-   `prisma`: Database schema and migrations
-   `server`: Custom backend server for cron jobs and socket.io

## Common Issues

-   **Database Connection Error:** Check if PostgreSQL is running and the `DATABASE_URL` in `.env` is correct.
-   **"Something went wrong":** Check the terminal output for server-side errors.
