export interface User {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: 'admin' | 'member';
  created_at: string;
}

export interface Project {
  id: number;
  name: string;
  description: string;
  owner_id: number;
  created_at: string;
}

export interface ProjectMember {
  project_id: number;
  user_id: number;
  role: 'admin' | 'member';
}

export interface Task {
  id: number;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  due_date: string | null;
  project_id: number;
  assigned_to: number | null;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface JwtPayload {
  userId: number;
  email: string;
  role: 'admin' | 'member';
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
