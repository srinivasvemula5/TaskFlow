import { Request, Response } from 'express';
import pool from '../config/db';

export async function getProjects(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;
    const [rows] = await pool.query(
      `SELECT p.*, u.name as owner_name,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as task_count,
        (SELECT COUNT(*) FROM project_members pm WHERE pm.project_id = p.id) as member_count
       FROM projects p
       JOIN users u ON p.owner_id = u.id
       WHERE p.owner_id = ? OR p.id IN (
         SELECT project_id FROM project_members WHERE user_id = ?
       )
       ORDER BY p.created_at DESC`,
      [userId, userId]
    );
    return res.json(rows);
  } catch (err: any) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}

export async function createProject(req: Request, res: Response) {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ message: 'Project name is required' });
  try {
    const userId = req.user!.userId;
    const [result] = await pool.query(
      'INSERT INTO projects (name, description, owner_id) VALUES (?, ?, ?)',
      [name, description || '', userId]
    ) as any[];
    // Auto-add owner as admin member
    await pool.query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)',
      [result.insertId, userId, 'admin']
    );
    return res.status(201).json({ id: result.insertId, name, description, owner_id: userId });
  } catch (err: any) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}

export async function getProject(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const [projects] = await pool.query(
      `SELECT p.*, u.name as owner_name FROM projects p
       JOIN users u ON p.owner_id = u.id WHERE p.id = ?`, [id]
    ) as any[];
    if (projects.length === 0) return res.status(404).json({ message: 'Project not found' });
    // Check access
    const [access] = await pool.query(
      `SELECT 1 FROM project_members WHERE project_id = ? AND user_id = ?
       UNION SELECT 1 FROM projects WHERE id = ? AND owner_id = ?`,
      [id, userId, id, userId]
    ) as any[];
    if (access.length === 0) return res.status(403).json({ message: 'Access denied' });

    const [members] = await pool.query(
      `SELECT u.id, u.name, u.email, u.role as global_role, pm.role as project_role
       FROM project_members pm JOIN users u ON pm.user_id = u.id
       WHERE pm.project_id = ?`, [id]
    );
    return res.json({ ...projects[0], members });
  } catch (err: any) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}

export async function updateProject(req: Request, res: Response) {
  const { id } = req.params;
  const { name, description } = req.body;
  try {
    const [projects] = await pool.query('SELECT * FROM projects WHERE id = ?', [id]) as any[];
    if (projects.length === 0) return res.status(404).json({ message: 'Project not found' });
    if (projects[0].owner_id !== req.user!.userId && req.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await pool.query('UPDATE projects SET name = ?, description = ? WHERE id = ?',
      [name || projects[0].name, description ?? projects[0].description, id]);
    return res.json({ message: 'Project updated' });
  } catch (err: any) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}

export async function deleteProject(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const [projects] = await pool.query('SELECT * FROM projects WHERE id = ?', [id]) as any[];
    if (projects.length === 0) return res.status(404).json({ message: 'Project not found' });
    if (projects[0].owner_id !== req.user!.userId && req.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await pool.query('DELETE FROM projects WHERE id = ?', [id]);
    return res.json({ message: 'Project deleted' });
  } catch (err: any) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}

export async function addMember(req: Request, res: Response) {
  const { id } = req.params;
  const { userId, role } = req.body;
  if (!userId) return res.status(400).json({ message: 'userId is required' });
  try {
    const [existing] = await pool.query(
      'SELECT 1 FROM project_members WHERE project_id = ? AND user_id = ?', [id, userId]
    ) as any[];
    if (existing.length > 0) return res.status(409).json({ message: 'User already a member' });
    await pool.query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)',
      [id, userId, role || 'member']
    );
    return res.status(201).json({ message: 'Member added' });
  } catch (err: any) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}

export async function removeMember(req: Request, res: Response) {
  const { id, userId } = req.params;
  try {
    await pool.query(
      'DELETE FROM project_members WHERE project_id = ? AND user_id = ?', [id, userId]
    );
    return res.json({ message: 'Member removed' });
  } catch (err: any) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}
