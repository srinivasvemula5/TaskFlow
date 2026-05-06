import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_change_in_prod';
const JWT_EXPIRES = '7d';

export async function signup(req: Request, res: Response) {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email and password are required' });
  }
  try {
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]) as any[];
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Email already registered' });
    }
    const hash = await bcrypt.hash(password, 12);
    const userRole = role === 'admin' ? 'admin' : 'member';
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name, email, hash, userRole]
    ) as any[];
    const token = jwt.sign(
      { userId: result.insertId, email, role: userRole },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );
    return res.status(201).json({
      token,
      user: { id: result.insertId, name, email, role: userRole }
    });
  } catch (err: any) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]) as any[];
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );
    return res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err: any) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}

export async function getMe(req: Request, res: Response) {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
      [req.user!.userId]
    ) as any[];
    if (rows.length === 0) return res.status(404).json({ message: 'User not found' });
    return res.json(rows[0]);
  } catch (err: any) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}
