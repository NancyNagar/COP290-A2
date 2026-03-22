# COP290 Assignment 2 — Task Board

A Jira-inspired project management app with Kanban boards, role-based access, and task tracking.

**GitHub:** https://github.com/NancyNagar/COP290-A2

---

## Stack

- **Frontend:** React 18, Vite, TypeScript, CSS Modules
- **Backend:** Node.js, Express.js, TypeScript
- **Database:** SQLite + Prisma ORM
- **Auth:** JWT (dual tokens), bcrypt, HTTP-only cookies
- **Testing:** Jest, Supertest

---

## Prerequisites

- Node.js v18+
- npm v9+

---

## Setup

### 1. Clone

```bash
git clone https://github.com/NancyNagar/COP290-A2.git
cd COP290-A2
```

### 2. Backend

```bash
cd backend
npm install
```

Create a `.env` file inside `backend/`:

```env
DATABASE_URL="file:./dev.db"
JWT_ACCESS_SECRET=your_long_random_access_secret
JWT_REFRESH_SECRET=your_different_long_random_refresh_secret
PORT=3000
NODE_ENV=development
```

Run database migrations and generate Prisma client:

```bash
npx prisma migrate dev --name init
npx prisma generate
```

Start the backend:

```bash
npm run dev
```

Backend runs at **http://localhost:3000**

### 3. Frontend

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at **http://localhost:5173**

---

## Compile / Build for Production

### Backend

```bash
cd backend
npm run build       # compiles TypeScript to dist/
npm start           # runs dist/index.js
```

### Frontend

```bash
cd frontend
npm run build       # outputs to frontend/dist/
npm run preview     # serves the production build locally
```

---

## Running Tests

```bash
cd backend
npm test
```

To run a specific test file:

```bash
npx jest src/tests/unit/auth.test.ts
npx jest src/tests/unit/task.test.ts
npx jest src/tests/integration/integration.test.ts
```

---

## Project Structure

```
COP290-A2/
├── frontend/
│   └── src/
│       ├── components/   # UI components
│       ├── pages/        # Route-level pages
│       ├── context/      # React Context + useReducer
│       ├── hooks/        # Custom hooks
│       ├── api/          # Typed fetch wrappers
│       └── types/        # TypeScript interfaces
└── backend/
    └── src/
        ├── routes/       # URL → controller mapping
        ├── controllers/  # Request/response handling
        ├── services/     # Business logic
        ├── utils/        # jwt, audit, prisma, httpErrors
        └── tests/        # Unit + integration tests
```

---

## Features

- Email/password auth with JWT access + refresh tokens
- Role-based access: Global Admin, Project Admin, Project Member, Project Viewer
- Projects with soft archive and hard delete
- Kanban boards with drag-and-drop (native HTML API)
- WIP limits enforced server-side
- Task types: Story (board-level), Task, Bug with parent-child relationships
- Configurable column workflows with blocked invalid transitions
- Audit trail for status changes, assignee changes, comments
- Comment threads with @mention support
- In-app notifications (polling-based)

---

## Submission

Entry numbers: **[ENTRY_1]** and **[ENTRY_2]**

```bash
tar -cvf a2_<entry1>_<entry2>.tar assignment2/
```
