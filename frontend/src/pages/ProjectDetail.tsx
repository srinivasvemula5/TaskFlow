import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { projectsApi, usersApi, tasksApi } from '../api';
import type { Project, Task, User } from '../types';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Users, Plus, X, Loader2,
  CheckSquare, Crown, UserMinus, UserPlus, Kanban
} from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';

function AddMemberModal({ projectId, onClose, onSave }: { projectId: number; onClose: () => void; onSave: () => void }) {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [role, setRole] = useState('member');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    usersApi.getAll().then(r => setAllUsers(r.data));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;
    setLoading(true);
    try {
      await projectsApi.addMember(projectId, { userId: Number(selectedUserId), role });
      toast.success('Member added!');
      onSave();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3><UserPlus size={16} /> Add Member</h3>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label>Select User</label>
            <select value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)} required>
              <option value="">Choose a user...</option>
              {allUsers.map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Project Role</label>
            <select value={role} onChange={e => setRole(e.target.value)}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading && <Loader2 size={16} className="spin" />} Add Member
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function formatDate(d: string | null) {
  if (!d) return '—';
  const parsed = parseISO(d);
  return isValid(parsed) ? format(parsed, 'MMM d, yyyy') : '—';
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const projectId = Number(id);
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddMember, setShowAddMember] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, tRes] = await Promise.all([
        projectsApi.getOne(projectId),
        tasksApi.getByProject(projectId),
      ]);
      setProject(pRes.data);
      setTasks(tRes.data);
    } catch {
      toast.error('Failed to load project');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [projectId]);

  const handleRemoveMember = async (memberId: number) => {
    if (!confirm('Remove this member from the project?')) return;
    try {
      await projectsApi.removeMember(projectId, memberId);
      toast.success('Member removed');
      fetchData();
    } catch {
      toast.error('Failed to remove member');
    }
  };

  const isOwner = user?.id === project?.owner_id;
  const canManage = isOwner || isAdmin;

  const tasksByStatus = {
    todo: tasks.filter(t => t.status === 'todo'),
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    done: tasks.filter(t => t.status === 'done'),
  };

  if (loading) return (
    <div className="page-content">
      <div className="loading-center"><Loader2 size={32} className="spin" /></div>
    </div>
  );

  if (!project) return null;

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-left">
          <Link to="/projects" className="back-btn"><ArrowLeft size={18} /> Projects</Link>
          <div>
            <div className="flex-row gap-8 align-center">
              <h1 className="page-title">{project.name}</h1>
              {isOwner && <span className="role-badge admin">Owner</span>}
            </div>
            <p className="page-subtitle">{project.description || 'No description'}</p>
          </div>
        </div>
        <Link to={`/projects/${projectId}/tasks`} className="btn btn-primary">
          <Kanban size={16} /> Task Board
        </Link>
      </div>

      <div className="detail-grid">
        {/* Members Panel */}
        <div className="card">
          <div className="card-header">
            <h3><Users size={16} /> Members ({project.members?.length ?? 0})</h3>
            {canManage && (
              <button className="btn btn-sm btn-primary" onClick={() => setShowAddMember(true)}>
                <Plus size={14} /> Add
              </button>
            )}
          </div>
          <div className="member-list">
            {project.members?.map(member => (
              <div key={member.id} className="member-row">
                <div className="member-avatar">{member.name[0]}</div>
                <div className="member-info">
                  <p className="member-name">
                    {member.name}
                    {member.id === project.owner_id && <Crown size={12} className="crown" />}
                  </p>
                  <p className="member-email">{member.email}</p>
                </div>
                <span className={`role-badge ${member.project_role}`}>{member.project_role}</span>
                {canManage && member.id !== project.owner_id && (
                  <button className="icon-btn danger" title="Remove" onClick={() => handleRemoveMember(member.id)}>
                    <UserMinus size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Task Summary */}
        <div className="card">
          <div className="card-header">
            <h3><CheckSquare size={16} /> Task Summary</h3>
            <Link to={`/projects/${projectId}/tasks`} className="btn btn-sm btn-primary">
              <Kanban size={14} /> Open Board
            </Link>
          </div>
          <div className="task-summary-list">
            {(['todo', 'in_progress', 'done'] as const).map(status => {
              const label = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' }[status];
              const cls = { todo: 'badge-todo', in_progress: 'badge-progress', done: 'badge-done' }[status];
              const items = tasksByStatus[status];
              return (
                <div key={status} className="task-summary-section">
                  <div className="task-summary-header">
                    <span className={`badge ${cls}`}>{label}</span>
                    <span className="task-count">{items.length}</span>
                  </div>
                  {items.slice(0, 3).map(task => (
                    <div key={task.id} className="task-summary-row">
                      <div>
                        <p className="task-title-sm">{task.title}</p>
                        {task.assigned_to_name && (
                          <p className="task-assignee">→ {task.assigned_to_name}</p>
                        )}
                      </div>
                      <span className="task-due-sm">{formatDate(task.due_date)}</span>
                    </div>
                  ))}
                  {items.length > 3 && (
                    <Link to={`/projects/${projectId}/tasks`} className="more-link">
                      +{items.length - 3} more tasks
                    </Link>
                  )}
                </div>
              );
            })}
            {tasks.length === 0 && (
              <div className="empty-state-small">
                <p>No tasks yet. Open the board to create tasks.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showAddMember && (
        <AddMemberModal
          projectId={projectId}
          onClose={() => setShowAddMember(false)}
          onSave={fetchData}
        />
      )}
    </div>
  );
}
