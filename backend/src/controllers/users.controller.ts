import { Request, Response } from 'express';
import pool from '../config/db';

export async function getAllUsers(req: Request, res: Response) {
  try {
    const [users] = await pool.query(
      'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC'
    );
    return res.json(users);
  } catch (err: any) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}
