import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { projectsApi } from '../api';
import type { Project } from '../types';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  Plus, FolderOpen, Users, CheckSquare,
  Trash2, Edit2, X, Loader2, Search
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

function ProjectModal({
  initial, onClose, onSave
}: { initial?: Project; onClose: () => void; onSave: () => void }) {
  const [name, setName] = useState(initial?.name || '');
  const [desc, setDesc] = useState(initial?.description || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      if (initial) {
        await projectsApi.update(initial.id, { name, description: desc });
        toast.success('Project updated!');
      } else {
        await projectsApi.create({ name, description: desc });
        toast.success('Project created!');
      }
      onSave();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{initial ? 'Edit Project' : 'New Project'}</h3>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label>Project Name *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. Website Redesign" required autoFocus />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)}
              placeholder="Brief description..." rows={3} />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading && <Loader2 size={16} className="spin" />}
              {initial ? 'Update Project' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Projects() {
  const { isAdmin, user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editProject, setEditProject] = useState<Project | undefined>();
  const [search, setSearch] = useState('');

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await projectsApi.getAll();
      setProjects(res.data);
    } catch {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleDelete = async (id: number, ownerId: number) => {
    if (user?.id !== ownerId && !isAdmin) {
      toast.error('Only project owner can delete');
      return;
    }
    if (!confirm('Delete this project and all its tasks?')) return;
    try {
      await projectsApi.delete(id);
      toast.success('Project deleted');
      fetchProjects();
    } catch {
      toast.error('Failed to delete project');
    }
  };

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">{projects.length} project{projects.length !== 1 ? 's' : ''} you're part of</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => { setEditProject(undefined); setShowModal(true); }}>
            <Plus size={16} /> New Project
          </button>
        )}
      </div>

      {/* Search */}
      <div className="search-bar">
        <Search size={16} className="search-icon" />
        <input type="text" placeholder="Search projects..." value={search}
          onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="projects-grid">
          {[1,2,3].map(i => <div key={i} className="project-card skeleton-card" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <FolderOpen size={56} />
          <h3>{search ? 'No matching projects' : 'No projects yet'}</h3>
          <p>{isAdmin ? 'Create your first project to get started.' : 'You haven\'t been added to any project yet.'}</p>
          {isAdmin && !search && (
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={16} /> Create Project
            </button>
          )}
        </div>
      ) : (
        <div className="projects-grid">
          {filtered.map(project => (
            <div key={project.id} className="project-card">
              <div className="project-card-header">
                <div className="project-icon">
                  {project.name[0].toUpperCase()}
                </div>
                <div className="project-card-actions">
                  {(user?.id === project.owner_id || isAdmin) && (
                    <>
                      <button className="icon-btn" title="Edit"
                        onClick={() => { setEditProject(project); setShowModal(true); }}>
                        <Edit2 size={14} />
                      </button>
                      <button className="icon-btn danger" title="Delete"
                        onClick={() => handleDelete(project.id, project.owner_id)}>
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
              <Link to={`/projects/${project.id}`} className="project-card-body">
                <h3 className="project-name">{project.name}</h3>
                <p className="project-desc">{project.description || 'No description'}</p>
                <div className="project-meta">
                  <span><Users size={13} /> {project.member_count ?? 0} member{project.member_count !== 1 ? 's' : ''}</span>
                  <span><CheckSquare size={13} /> {project.task_count ?? 0} task{project.task_count !== 1 ? 's' : ''}</span>
                </div>
                <div className="project-footer">
                  <span className="owner-chip">by {project.owner_name}</span>
                  <span className="project-date">{format(parseISO(project.created_at), 'MMM d, yyyy')}</span>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <ProjectModal
          initial={editProject}
          onClose={() => { setShowModal(false); setEditProject(undefined); }}
          onSave={fetchProjects}
        />
      )}
    </div>
  );
}
