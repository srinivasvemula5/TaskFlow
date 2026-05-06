# Team Task Manager

Full-stack task management app with React + TypeScript frontend and Node.js + MySQL backend.

## Tech Stack
- **Frontend**: React 18, TypeScript, Vite, React Router v6, Axios
- **Backend**: Node.js, Express.js, TypeScript
- **Database**: MySQL 8
- **Auth**: JWT + bcrypt

## Local Setup

### 1. MySQL Database
Make sure MySQL is running locally. The app will auto-create all tables on first run.

Update `backend/.env` with your MySQL credentials:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=team_task_manager
JWT_SECRET=your_secret_key
```

### 2. Backend
```bash
cd backend
npm install
npm run dev
# Runs on http://localhost:5000
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

## Features
- ✅ JWT Authentication (Signup/Login)
- ✅ Role-based access: Admin / Member
- ✅ Project management (create, edit, delete)
- ✅ Team member management per project
- ✅ Kanban task board (To Do / In Progress / Done)
- ✅ Task priority (Low / Medium / High)
- ✅ Due dates with overdue detection
- ✅ Dashboard with stats & recent activity

## Deployment (Railway)
1. Push to GitHub
2. Create Railway project → Add MySQL plugin
3. Deploy backend service → set env vars from Railway MySQL
4. Deploy frontend as static site (set `VITE_API_URL` to backend URL)
