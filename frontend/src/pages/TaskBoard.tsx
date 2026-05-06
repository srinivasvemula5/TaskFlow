import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { tasksApi, projectsApi } from '../api';
import type { Task, Project, User } from '../types';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Plus, X, Loader2, Trash2, Edit2,
  Calendar, User as UserIcon, Flag
} from 'lucide-react';
import { format, parseISO, isValid, isPast } from 'date-fns';

const COLUMNS = [
  { key: 'todo' as const, label: 'To Do', cls: 'col-todo' },
  { key: 'in_progress' as const, label: 'In Progress', cls: 'col-progress' },
  { key: 'done' as const, label: 'Done', cls: 'col-done' },
];

function TaskModal({
  projectId, task, members, onClose, onSave
}: {
  projectId: number;
  task?: Task;
  members: User[];
  onClose: () => void;
  onSave: () => void;
}) {
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    priority: task?.priority || 'medium',
    status: task?.status || 'todo',
    due_date: task?.due_date ? task.due_date.split('T')[0] : '',
    assigned_to: task?.assigned_to ?? '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setLoading(true);
    try {
      const payload = {
        ...form,
        due_date: form.due_date || null,
        assigned_to: form.assigned_to === '' ? null : Number(form.assigned_to),
      };
      if (task) {
        await tasksApi.update(task.id, payload);
        toast.success('Task updated!');
      } else {
        await tasksApi.create(projectId, payload);
        toast.success('Task created!');
      }
      onSave();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-wide" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{task ? 'Edit Task' : 'New Task'}</h3>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label>Title *</label>
            <input type="text" value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="Task title..." required autoFocus />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Task details..." rows={3} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label><Flag size={13} /> Priority</label>
              <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as any })}>
                <option value="low">🟢 Low</option>
                <option value="medium">🟡 Medium</option>
                <option value="high">🔴 High</option>
              </select>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as any })}>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label><Calendar size={13} /> Due Date</label>
              <input type="date" value={form.due_date}
                onChange={e => setForm({ ...form, due_date: e.target.value })} />
            </div>
            <div className="form-group">
              <label><UserIcon size={13} /> Assign To</label>
              <select value={form.assigned_to}
                onChange={e => setForm({ ...form, assigned_to: e.target.value })}>
                <option value="">Unassigned</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading && <Loader2 size={16} className="spin" />}
              {task ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TaskCard({
  task, onEdit, onDelete, onStatusChange, canManage
}: {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (status: Task['status']) => void;
  canManage: boolean;
}) {
  const priorityColors: Record<string, string> = {
    high: 'pri-high', medium: 'pri-medium', low: 'pri-low'
  };
  const dueDate = task.due_date ? parseISO(task.due_date) : null;
  const isOverdue = dueDate && isValid(dueDate) && isPast(dueDate) && task.status !== 'done';

  return (
    <div className={`task-card ${isOverdue ? 'task-overdue' : ''}`}>
      <div className="task-card-header">
        <span className={`priority-dot ${priorityColors[task.priority]}`}>{task.priority}</span>
        {canManage && (
          <div className="task-card-actions">
            <button className="icon-btn-sm" onClick={onEdit} title="Edit"><Edit2 size={12} /></button>
            <button className="icon-btn-sm danger" onClick={onDelete} title="Delete"><Trash2 size={12} /></button>
          </div>
        )}
      </div>
      <p className="task-card-title">{task.title}</p>
      {task.description && <p className="task-card-desc">{task.description}</p>}
      <div className="task-card-footer">
        {task.assigned_to_name && (
          <div className="task-assignee-chip">
            <div className="mini-avatar">{task.assigned_to_name[0]}</div>
            <span>{task.assigned_to_name}</span>
          </div>
        )}
        {dueDate && isValid(dueDate) && (
          <span className={`task-due ${isOverdue ? 'overdue-date' : ''}`}>
            <Calendar size={11} /> {format(dueDate, 'MMM d')}
          </span>
        )}
      </div>
      {canManage && (
        <div className="task-status-btns">
          {(['todo', 'in_progress', 'done'] as const).map(s => (
            <button
              key={s}
              className={`status-btn ${task.status === s ? 'active' : ''}`}
              onClick={() => onStatusChange(s)}
            >
              {s === 'todo' ? 'Todo' : s === 'in_progress' ? 'In Progress' : 'Done'}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TaskBoard() {
  const { id } = useParams<{ id: string }>();
  const projectId = Number(id);
  const { user, isAdmin } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState<Task | undefined>();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, tRes] = await Promise.all([
        projectsApi.getOne(projectId),
        tasksApi.getByProject(projectId),
      ]);
      setProject(pRes.data);
      setTasks(tRes.data);
      // Use project members as User array for assignment
      const memberUsers: User[] = (pRes.data.members || []).map((m: any) => ({
        id: m.id, name: m.name, email: m.email, role: m.global_role
      }));
      setMembers(memberUsers);
    } catch {
      toast.error('Failed to load task board');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (taskId: number) => {
    if (!confirm('Delete this task?')) return;
    try {
      await tasksApi.delete(taskId);
      toast.success('Task deleted');
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch {
      toast.error('Failed to delete task');
    }
  };

  const handleStatusChange = async (taskId: number, status: Task['status']) => {
    try {
      await tasksApi.updateStatus(taskId, status);
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
    } catch {
      toast.error('Failed to update status');
    }
  };

  const isOwner = user?.id === project?.owner_id;
  const canManage = isOwner || isAdmin;

  const tasksByStatus = {
    todo: tasks.filter(t => t.status === 'todo'),
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    done: tasks.filter(t => t.status === 'done'),
  };

  return (
    <div className="page-content board-page">
      <div className="page-header">
        <div className="page-header-left">
          <Link to={`/projects/${projectId}`} className="back-btn">
            <ArrowLeft size={18} /> {project?.name || 'Project'}
          </Link>
          <div>
            <h1 className="page-title">Task Board</h1>
            <p className="page-subtitle">{tasks.length} task{tasks.length !== 1 ? 's' : ''} total</p>
          </div>
        </div>
        {canManage && (
          <button className="btn btn-primary" onClick={() => { setEditTask(undefined); setShowModal(true); }}>
            <Plus size={16} /> Add Task
          </button>
        )}
      </div>

      {loading ? (
        <div className="loading-center"><Loader2 size={32} className="spin" /></div>
      ) : (
        <div className="kanban-board">
          {COLUMNS.map(col => (
            <div key={col.key} className={`kanban-col ${col.cls}`}>
              <div className="kanban-col-header">
                <span className="kanban-col-title">{col.label}</span>
                <span className="kanban-count">{tasksByStatus[col.key].length}</span>
              </div>
              <div className="kanban-cards">
                {tasksByStatus[col.key].length === 0 ? (
                  <div className="kanban-empty">No tasks here</div>
                ) : (
                  tasksByStatus[col.key].map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      canManage={canManage || task.assigned_to === user?.id}
                      onEdit={() => { setEditTask(task); setShowModal(true); }}
                      onDelete={() => handleDelete(task.id)}
                      onStatusChange={(s) => handleStatusChange(task.id, s)}
                    />
                  ))
                )}
                {canManage && (
                  <button className="add-task-btn"
                    onClick={() => { setEditTask(undefined); setShowModal(true); }}>
                    <Plus size={14} /> Add task
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <TaskModal
          projectId={projectId}
          task={editTask}
          members={members}
          onClose={() => { setShowModal(false); setEditTask(undefined); }}
          onSave={fetchData}
        />
      )}
    </div>
  );
}
