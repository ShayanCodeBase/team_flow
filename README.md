## Project Overview

This is my submission for the full-stack technical assessment. The brief asked for a ClickUp/Trello-style tool and I built Team Flow — a workspace-based project management app where users organize work into projects, create tasks with unlimited nesting depth, and track progress across a Kanban board, calendar view, and task table. The backend is a layered Node.js/Express API with PostgreSQL and Prisma, JWT authentication with refresh token rotation, role-based permissions, and Socket.io for real-time notifications. The frontend is React with TanStack Query, drag-and-drop Kanban, and a dashboard showing live analytics, activity feeds, and tasks due today. I treated this like a production codebase — proper separation of concerns, soft deletes, audit logs, generic repository pattern, and Swagger documentation on every endpoint.

---

## Architecture Decisions

**Layered backend (routes → controllers → services → repositories)**  
I structured the API into four clear layers so each has one job. Controllers handle HTTP and validation. Services enforce business rules, permissions, and side effects like activity logging and notifications. Repositories own all database access. Adding a feature means touching one service and one repository — not rewriting handlers.

**Prisma with PostgreSQL**  
The assessment required PostgreSQL. I paired it with Prisma for type-safe queries, a single readable schema file, and compile-time schema drift detection. Migrations are reproducible and straightforward which matters when the schema evolves frequently.

**Task tree via `treePath` and `level` instead of recursive SQL**  
Nested tasks use a materialized path string (e.g. /parentId/childId/) plus a level column. Loading a subtree is one indexed prefix query. Moving a branch updates all descendants in a single transaction. This avoids recursive SQL which degrades as depth and volume grow.

**JWT access token + httpOnly refresh cookie**  
The client stores the access token in memory and sends it as Authorization: Bearer. The refresh token lives in an httpOnly cookie so XSS cannot read it. Axios retries automatically on 401 by calling /auth/refresh. Google OAuth ends with the same token pair.

**Socket.io rooms keyed by `userId`**  
Notifications emit directly to io.to(userId). Each socket authenticates with the JWT on connect and joins its own private room. Delivery is targeted with no workspace-wide broadcasting needed.

**React Query for server state**  
All server data uses TanStack Query with explicit cache invalidation after mutations. No Redux or global store — Query handles caching, background refetching, and loading states out of the box.You said: also use .
---

## Local Setup

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 18+ recommended |
| npm | 9+ |
| PostgreSQL | 14+ (or a Neon account — see below) |

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd interview_project
```

### 2. Install dependencies

```bash
cd backend
npm install

cd ../client
npm install
```

### 3. Configure environment variables

Copy the examples and fill in real values:

```bash
cp backend/.env.example backend/.env
cp client/.env.example client/.env
```

See [Environment Variables](#environment-variables) below for every key.

### 4. Set up the database

Follow [Database Setup](#database-setup), then from the `backend` folder:

```bash
npx prisma migrate dev
npx prisma db seed
```

`db seed` upserts **Owner**, **Admin**, and **Member** roles with their permission sets. You can also run `npm run seed` — it runs the same script.

### 5. Start the backend

```bash
cd backend
npm run dev
```

Default API: `http://localhost:8000` with base path `/api`. Swagger UI: `http://localhost:8000/api/docs`.

### 6. Start the frontend

```bash
cd client
npm run dev
```

Open `http://localhost:5173`, register an account, and you land in your first workspace.

---

## Database Setup

You need a PostgreSQL database and `DATABASE_URL` in `backend/.env`.

### Neon (recommended)

1. Create a free account at [neon.tech](https://neon.tech).
2. Create a new project and database.
3. Copy the connection string (include `?sslmode=require` if Neon provides it).
4. Set it in `backend/.env`:

```env
DATABASE_URL=postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
```

No local PostgreSQL install required. Migrations run against Neon the same way as local.

### Local PostgreSQL

1. Install PostgreSQL and create a database, e.g. `teamflow`.
2. Set `DATABASE_URL` in `backend/.env`:

```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/teamflow
```

### Apply schema and seed

From the `backend` directory:

```bash
npx prisma migrate dev
npx prisma db seed
```

Optional: open Prisma Studio with `npm run prisma:studio` to inspect tables.

---

## Environment Variables

### Backend (`backend/.env`)

```env
# Server
PORT=8000
NODE_ENV=development
BASE_PATH=/api

# Database (Neon or local PostgreSQL)
DATABASE_URL=postgresql://user:password@localhost:5432/teamflow

# JWT (use long random strings in production)
JWT_SECRET=your_jwt_access_secret_min_32_chars
JWT_REFRESH_SECRET=your_jwt_refresh_secret_min_32_chars

# Google OAuth (Google Cloud Console → Credentials)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:8000/api/auth/google/callback

# CORS — must match the Vite dev server origin
FRONTEND_ORIGIN=http://localhost:5173

# Email (password reset). Gmail: use an App Password with 2FA enabled
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your.email@gmail.com
SMTP_PASS=your16charapppassword
EMAIL_FROM=Team Flow <your.email@gmail.com>
```

| Variable | Purpose |
|----------|---------|
| `PORT` | HTTP port for the API and Socket.io server |
| `NODE_ENV` | `development` or `production` |
| `BASE_PATH` | API prefix (default `/api`) |
| `DATABASE_URL` | PostgreSQL connection string for Prisma |
| `JWT_SECRET` | Signs short-lived access tokens (~15 minutes) |
| `JWT_REFRESH_SECRET` | Signs refresh tokens stored in httpOnly cookie |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth app credentials |
| `GOOGLE_CALLBACK_URL` | Must match Google console; default `http://localhost:8000/api/auth/google/callback` |
| `FRONTEND_ORIGIN` | Allowed CORS origin; OAuth redirect target is `{FRONTEND_ORIGIN}/google/oauth/callback` |
| `SMTP_*` / `EMAIL_FROM` | Outbound mail for forgot-password links |

### Frontend (`client/.env`)

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

| Variable | Purpose |
|----------|---------|
| `VITE_API_BASE_URL` | Backend API root (includes `/api`). Socket.io connects to the same host without the `/api` suffix. |

---

## API Documentation

Interactive **Swagger UI** documents every endpoint (auth, workspaces, projects, tasks, comments, notifications, activity).

| Environment | URL |
|-------------|-----|
| Local | [http://localhost:8000/api/docs](http://localhost:8000/api/docs) |
| Production | `https://seagreen-falcon-553694.hostingersite.com/api/docs/` |

**How to test authenticated routes**

1. Call `POST /api/auth/login` (or register, then login) and copy `accessToken` from the response `data` object.
2. In Swagger, click **Authorize**.
3. Paste: `Bearer <your_access_token>` (include the word `Bearer` and a space).
4. Try protected routes; the UI sends the header on each request.

Refresh uses an httpOnly cookie — use the browser you logged in with, or login again from Swagger’s login endpoint.

---

## Features (implemented end-to-end)

| Area | What works |
|------|------------|
| **Auth** | Register, login, logout, refresh token, forgot/reset password, Google OAuth |
| **Workspaces** | Create, list, update, delete; invite members; change roles; analytics cards |
| **Projects** | CRUD per workspace; project analytics |
| **Tasks** | CRUD, filters, assignees, recurrence (daily/weekly/monthly/custom), soft delete |
| **Task hierarchy** | Subtasks, move/reparent, children and subtree APIs |
| **Views** | Table (sort/filter), Kanban (drag status), Calendar (`react-big-calendar`) |
| **Comments** | Thread per task with pagination |
| **Activity** | Per-task log + dashboard “Recent Activity” (last 20 workspace-wide) |
| **Notifications** | In-app list, unread badge, mark read; real-time via Socket.io |
| **Permissions** | Owner / Admin / Member with route-level `roleGuard` checks |

---

## Known Limitations and Future Improvements

**Task attachments**  
The schema and task mapper include an `attachments` JSON field, but I did not ship file upload endpoints or UI within the project timeline. Storing binaries in JSON is not viable at scale. Next step would be presigned uploads to S3 or Cloudflare R2, with metadata in PostgreSQL and thumbnails in the client.

**Recurrence**  
Tasks support Daily, Weekly, Monthly, and Custom interval recurrence, and completing a recurring task can spawn the next instance. I did not implement RRULE-style rules (“every 3rd Wednesday”, “last Friday of the month”). The `rrule` package would be the natural extension, with a small scheduler to materialize upcoming occurrences.

**Notifications**  
Today, users get notified when assigned to a task or when someone comments on work they are assigned to. I would add overdue reminders and digest emails via a background job (`node-cron` or a queue worker) that queries the same overdue logic the dashboard uses, then emits in-app and email notifications.

**OVERDUE status**  
`OVERDUE` is computed at read time in the task mapper when `targetDate` is in the past and the stored status is `PENDING` or `IN_PROGRESS` (or the row is already stored as `OVERDUE`). That keeps writes simple and matches what users see in the UI, but at very large scale a nightly job that flags overdue rows would make reporting and indexing easier.

---

## AI Tools Used

The project was built from scratch using a combination of AI tools throughout the development process.

**Google Stitch** was used to generate the initial UI designs and wireframes. Google Stitch was connected to Google Antigravity through MCP, which allowed generating a complete website UI. The Stitch skills feature was then used to convert the generated HTML into reusable React components, which formed the foundation of the frontend component library.

**Cursor IDE** was used throughout backend development as an AI coding assistant, helping implement backend features, services, repositories, and API endpoints. AI was also used to add meaningful comments in complex function logic (task hierarchy moves, overdue display rules, JWT refresh flow, and similar areas) so non-obvious behavior stays documented in the code.

**Claude** was used to understand the full project scope and requirements, think through architecture decisions, and write optimized prompts that were fed into Cursor to guide implementation. Claude helped break down complex features into actionable steps and reviewed the gap between requirements and implementation throughout the process.

---

## Tech Stack

| Layer | Technologies |
|-------|----------------|
| Frontend | React 18, TypeScript, Vite, TanStack Query, React Router, Tailwind CSS, shadcn/ui, Socket.io client, Recharts, `@hello-pangea/dnd`, `react-big-calendar` |
| Backend | Node.js, Express, TypeScript, Prisma, PostgreSQL, Passport (local + Google), JWT, Socket.io, Zod, Nodemailer, Swagger |
| Database | PostgreSQL via Prisma ORM |


