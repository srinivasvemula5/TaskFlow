export type Role = 'admin' | 'member';
export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type Priority = 'low' | 'medium' | 'high';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  created_at?: string;
}

export interface Project {
  id: number;
  name: string;
  description: string;
  owner_id: number;
  owner_name?: string;
  task_count?: number;
  member_count?: number;
  created_at: string;
  members?: ProjectMember[];
}

export interface ProjectMember {
  id: number;
  name: string;
  email: string;
  global_role: Role;
  project_role: Role;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  due_date: string | null;
  project_id: number;
  assigned_to: number | null;
  assigned_to_name?: string;
  created_by: number;
  created_by_name?: string;
  project_name?: string;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  stats: {
    total: number;
    completed: number;
    inProgress: number;
    overdue: number;
  };
  overdueTasks: Task[];
  recentTasks: Task[];
}

export interface AuthResponse {
  token: string;
  user: User;
}
