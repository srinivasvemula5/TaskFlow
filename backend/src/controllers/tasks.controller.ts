import { Request, Response } from 'express';
import pool from '../config/db';

export async function getProjectTasks(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const [tasks] = await pool.query(
      `SELECT t.*, 
        u1.name as assigned_to_name, 
        u2.name as created_by_name
       FROM tasks t
       LEFT JOIN users u1 ON t.assigned_to = u1.id
       LEFT JOIN users u2 ON t.created_by = u2.id
       WHERE t.project_id = ?
       ORDER BY t.created_at DESC`,
      [id]
    );
    return res.json(tasks);
  } catch (err: any) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}

export async function createTask(req: Request, res: Response) {
  const { id: project_id } = req.params;
  const { title, description, priority, due_date, assigned_to } = req.body;
  if (!title) return res.status(400).json({ message: 'Title is required' });
  try {
    const [result] = await pool.query(
      `INSERT INTO tasks (title, description, priority, due_date, project_id, assigned_to, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [title, description || '', priority || 'medium', due_date || null, project_id, assigned_to || null, req.user!.userId]
    ) as any[];
    return res.status(201).json({ id: result.insertId, title, description, priority, due_date, project_id, assigned_to });
  } catch (err: any) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}

export async function updateTask(req: Request, res: Response) {
  const { id } = req.params;
  const { title, description, status, priority, due_date, assigned_to } = req.body;
  try {
    const [tasks] = await pool.query('SELECT * FROM tasks WHERE id = ?', [id]) as any[];
    if (tasks.length === 0) return res.status(404).json({ message: 'Task not found' });
    const task = tasks[0];
    await pool.query(
      `UPDATE tasks SET title=?, description=?, status=?, priority=?, due_date=?, assigned_to=?
       WHERE id = ?`,
      [
        title ?? task.title,
        description ?? task.description,
        status ?? task.status,
        priority ?? task.priority,
        due_date !== undefined ? due_date : task.due_date,
        assigned_to !== undefined ? assigned_to : task.assigned_to,
        id
      ]
    );
    return res.json({ message: 'Task updated' });
  } catch (err: any) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}

export async function updateTaskStatus(req: Request, res: Response) {
  const { id } = req.params;
  const { status } = req.body;
  const validStatuses = ['todo', 'in_progress', 'done'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }
  try {
    await pool.query('UPDATE tasks SET status = ? WHERE id = ?', [status, id]);
    return res.json({ message: 'Status updated' });
  } catch (err: any) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}

export async function deleteTask(req: Request, res: Response) {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM tasks WHERE id = ?', [id]);
    return res.json({ message: 'Task deleted' });
  } catch (err: any) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}

export async function getDashboardStats(req: Request, res: Response) {
  const userId = req.user!.userId;
  try {
    const [totalTasks] = await pool.query(
      `SELECT COUNT(*) as count FROM tasks t
       JOIN project_members pm ON t.project_id = pm.project_id
       WHERE pm.user_id = ? OR t.assigned_to = ?`, [userId, userId]
    ) as any[];

    const [completedTasks] = await pool.query(
      `SELECT COUNT(*) as count FROM tasks t
       JOIN project_members pm ON t.project_id = pm.project_id
       WHERE (pm.user_id = ? OR t.assigned_to = ?) AND t.status = 'done'`, [userId, userId]
    ) as any[];

    const [inProgressTasks] = await pool.query(
      `SELECT COUNT(*) as count FROM tasks t
       JOIN project_members pm ON t.project_id = pm.project_id
       WHERE (pm.user_id = ? OR t.assigned_to = ?) AND t.status = 'in_progress'`, [userId, userId]
    ) as any[];

    const [overdueTasks] = await pool.query(
      `SELECT t.*, p.name as project_name, u.name as assigned_to_name
       FROM tasks t
       JOIN projects p ON t.project_id = p.id
       LEFT JOIN users u ON t.assigned_to = u.id
       JOIN project_members pm ON t.project_id = pm.project_id
       WHERE (pm.user_id = ? OR t.assigned_to = ?)
         AND t.due_date < CURDATE()
         AND t.status != 'done'
       GROUP BY t.id
       ORDER BY t.due_date ASC
       LIMIT 5`, [userId, userId]
    );

    const [recentTasks] = await pool.query(
      `SELECT t.*, p.name as project_name, u.name as assigned_to_name
       FROM tasks t
       JOIN projects p ON t.project_id = p.id
       LEFT JOIN users u ON t.assigned_to = u.id
       JOIN project_members pm ON t.project_id = pm.project_id
       WHERE pm.user_id = ? OR t.assigned_to = ?
       GROUP BY t.id
       ORDER BY t.updated_at DESC
       LIMIT 8`, [userId, userId]
    );

    return res.json({
      stats: {
        total: (totalTasks as any[])[0].count,
        completed: (completedTasks as any[])[0].count,
        inProgress: (inProgressTasks as any[])[0].count,
        overdue: (overdueTasks as any[]).length
      },
      overdueTasks,
      recentTasks
    });
  } catch (err: any) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}
