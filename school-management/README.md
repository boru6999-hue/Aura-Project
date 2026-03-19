# AURA — School OS v2.0

Navy blue + beige editorial design system.  
Stack: **Express + Prisma + MySQL** (backend) · **React + Vite** (frontend)

---

## Quickstart

### 1. Database
Create a MySQL database named `school_management` and update `backend/.env`:
```
DATABASE_URL="mysql://YOUR_USER:YOUR_PASS@localhost:3306/school_management"
```

### 2. Install dependencies
```bash
npm run install:all
```

### 3. Setup database + seed data
```bash
npm run setup:db
```

### 4. Run both servers

**Terminal 1 — Backend (port 5000):**
```bash
npm run dev:backend
```

**Terminal 2 — Frontend (port 5173):**
```bash
npm run dev:frontend
```

Open: http://localhost:5173

---

## Demo accounts

| Role    | Email                  | Password    |
|---------|------------------------|-------------|
| Admin   | admin@school.mn        | admin123    |
| Teacher | teacher1@school.mn     | teacher123  |
| Student | student1@school.mn     | student123  |

---

## Features

- **Dashboard** — stats, grade distribution bar chart, attendance bars
- **Students / Teachers / Courses** — CRUD with search + pagination
- **Grades** — Teachers enter grades once; subsequent edits require admin approval
- **Attendance** — Mark present/absent/late with date filters
- **Enrollments** — Enroll students into courses by semester/year
- **Schedule** — Weekly grid view + list view, Mon–Fri timetable
- **Schedule Requests** — Teachers request time changes; admin approves/rejects
  - Also handles **grade edit requests** from teachers (tab-separated)
- **My Requests** — Teacher's own request history (schedule + grade)
- **Student Dashboard** — Personal grades, attendance bars, enrolled courses, schedule

---

## Project structure

```
AuraProject/
├── backend/          Express + Prisma + MySQL API
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── prisma/
│   └── prisma/schema.prisma
└── frontend/         React + Vite
    └── src/
        ├── api/
        ├── components/   Layout, Modal, Toast, UI (shared)
        ├── context/      AuthContext
        └── pages/        All 11 pages
```
