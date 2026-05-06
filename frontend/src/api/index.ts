import api from './axios';
import type { AuthResponse, Project, Task, DashboardStats, User } from '../types';

// Auth
export const authApi = {
  signup: (data: { name: string; email: string; password: string; role?: string }) =>
    api.post<AuthResponse>('/auth/signup', data),
  login: (data: { email: string; password: string }) =>
    api.post<AuthResponse>('/auth/login', data),
  getMe: () => api.get<User>('/auth/me'),
};

// Projects
export const projectsApi = {
  getAll: () => api.get<Project[]>('/projects'),
  getOne: (id: number) => api.get<Project>(`/projects/${id}`),
  create: (data: { name: string; description: string }) => api.post<Project>('/projects', data),
  update: (id: number, data: { name?: string; description?: string }) =>
    api.put(`/projects/${id}`, data),
  delete: (id: number) => api.delete(`/projects/${id}`),
  addMember: (projectId: number, data: { userId: number; role?: string }) =>
    api.post(`/projects/${projectId}/members`, data),
  removeMember: (projectId: number, userId: number) =>
    api.delete(`/projects/${projectId}/members/${userId}`),
};

// Tasks
export const tasksApi = {
  getByProject: (projectId: number) => api.get<Task[]>(`/tasks/project/${projectId}`),
  create: (projectId: number, data: Partial<Task>) =>
    api.post<Task>(`/tasks/project/${projectId}`, data),
  update: (id: number, data: Partial<Task>) => api.put(`/tasks/${id}`, data),
  updateStatus: (id: number, status: string) => api.patch(`/tasks/${id}/status`, { status }),
  delete: (id: number) => api.delete(`/tasks/${id}`),
  getDashboard: () => api.get<DashboardStats>('/tasks/dashboard'),
};

// Users
export const usersApi = {
  getAll: () => api.get<User[]>('/users'),
};
