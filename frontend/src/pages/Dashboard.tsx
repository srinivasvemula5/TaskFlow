import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tasksApi } from '../api';
import type { DashboardStats, Task } from '../types';
import toast from 'react-hot-toast';
import {
  CheckCircle2, Clock, AlertTriangle, BarChart3,
  ArrowRight, Calendar, FolderOpen, TrendingUp
} from 'lucide-react';
import { format, isValid, parseISO } from 'date-fns';

function StatusBadge({ status }: { status: Task['status'] }) {
  const map = {
    todo: { label: 'To Do', cls: 'badge-todo' },
    in_progress: { label: 'In Progress', cls: 'badge-progress' },
    done: { label: 'Done', cls: 'badge-done' },
  };
  return <span className={`badge ${map[status].cls}`}>{map[status].label}</span>;
}

function PriorityBadge({ priority }: { priority: Task['priority'] }) {
  const map = {
    low: { label: 'Low', cls: 'pri-low' },
    medium: { label: 'Medium', cls: 'pri-medium' },
    high: { label: 'High', cls: 'pri-high' },
  };
  return <span className={`priority-dot ${map[priority].cls}`}>{map[priority].label}</span>;
}

function formatDate(date: string | null) {
  if (!date) return '—';
  const d = parseISO(date);
  return isValid(d) ? format(d, 'MMM d, yyyy') : '—';
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    tasksApi.getDashboard()
      .then(res => setData(res.data))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  const stats = data?.stats;

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="page-subtitle">Here's what's happening with your tasks today.</p>
        </div>
        <Link to="/projects" className="btn btn-primary">
          <FolderOpen size={16} /> View Projects
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card stat-total">
          <div className="stat-icon"><BarChart3 size={24} /></div>
          <div className="stat-info">
            <span className="stat-value">{loading ? '—' : stats?.total ?? 0}</span>
            <span className="stat-label">Total Tasks</span>
          </div>
          <TrendingUp size={40} className="stat-bg-icon" />
        </div>
        <div className="stat-card stat-done">
          <div className="stat-icon"><CheckCircle2 size={24} /></div>
          <div className="stat-info">
            <span className="stat-value">{loading ? '—' : stats?.completed ?? 0}</span>
            <span className="stat-label">Completed</span>
          </div>
          <CheckCircle2 size={40} className="stat-bg-icon" />
        </div>
        <div className="stat-card stat-progress">
          <div className="stat-icon"><Clock size={24} /></div>
          <div className="stat-info">
            <span className="stat-value">{loading ? '—' : stats?.inProgress ?? 0}</span>
            <span className="stat-label">In Progress</span>
          </div>
          <Clock size={40} className="stat-bg-icon" />
        </div>
        <div className="stat-card stat-overdue">
          <div className="stat-icon"><AlertTriangle size={24} /></div>
          <div className="stat-info">
            <span className="stat-value">{loading ? '—' : stats?.overdue ?? 0}</span>
            <span className="stat-label">Overdue</span>
          </div>
          <AlertTriangle size={40} className="stat-bg-icon" />
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Overdue Tasks */}
        <div className="card">
          <div className="card-header">
            <h3><AlertTriangle size={16} className="text-danger" /> Overdue Tasks</h3>
          </div>
          {loading ? (
            <div className="skeleton-list">{[1,2,3].map(i => <div key={i} className="skeleton-row" />)}</div>
          ) : data?.overdueTasks.length === 0 ? (
            <div className="empty-state-small">
              <CheckCircle2 size={32} className="text-success" />
              <p>No overdue tasks! 🎉</p>
            </div>
          ) : (
            <div className="task-list">
              {data?.overdueTasks.map(task => (
                <div key={task.id} className="task-row overdue">
                  <div className="task-row-left">
                    <PriorityBadge priority={task.priority} />
                    <div>
                      <p className="task-title">{task.title}</p>
                      <p className="task-meta">{task.project_name}</p>
                    </div>
                  </div>
                  <div className="task-row-right">
                    <span className="due-date overdue-date">
                      <Calendar size={12} /> {formatDate(task.due_date)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Tasks */}
        <div className="card">
          <div className="card-header">
            <h3><Clock size={16} /> Recent Activity</h3>
            <Link to="/projects" className="card-link">View all <ArrowRight size={14} /></Link>
          </div>
          {loading ? (
            <div className="skeleton-list">{[1,2,3,4].map(i => <div key={i} className="skeleton-row" />)}</div>
          ) : data?.recentTasks.length === 0 ? (
            <div className="empty-state-small">
              <p>No recent tasks yet.</p>
            </div>
          ) : (
            <div className="task-list">
              {data?.recentTasks.map(task => (
                <div key={task.id} className="task-row">
                  <div className="task-row-left">
                    <StatusBadge status={task.status} />
                    <div>
                      <p className="task-title">{task.title}</p>
                      <p className="task-meta">{task.project_name} {task.assigned_to_name ? `· ${task.assigned_to_name}` : ''}</p>
                    </div>
                  </div>
                  <PriorityBadge priority={task.priority} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
