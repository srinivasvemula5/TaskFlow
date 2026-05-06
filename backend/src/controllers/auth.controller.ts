import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_change_in_prod';
const JWT_EXPIRES = '7d';

export async function signup(req: Request, res: Response) {
  const { name, email, password, role } = req.body;
  
  // Validation
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email and password are required' });
  }
  
  const trimmedName = (name as string).trim();
  const trimmedEmail = (email as string).trim();
  const trimmedPassword = (password as string).trim();
  
  if (!trimmedName) {
    return res.status(400).json({ message: 'Name cannot be empty' });
  }
  if (!trimmedEmail) {
    return res.status(400).json({ message: 'Email cannot be empty' });
  }
  if (trimmedPassword.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }
  
  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }
  
  try {
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [trimmedEmail]) as any[];
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Email already registered' });
    }
    const hash = await bcrypt.hash(trimmedPassword, 12);
    const userRole = role === 'admin' ? 'admin' : 'member';
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [trimmedName, trimmedEmail, hash, userRole]
    ) as any[];
    const token = jwt.sign(
      { userId: result.insertId, email: trimmedEmail, role: userRole },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );
    return res.status(201).json({
      token,
      user: { id: result.insertId, name: trimmedName, email: trimmedEmail, role: userRole }
    });
  } catch (err: any) {
    console.error('Signup error:', err);
    return res.status(500).json({ message: 'Server error. Please try again later.' });
  }
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  
  const trimmedEmail = (email as string).trim();
  
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [trimmedEmail]) as any[];
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
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Server error. Please try again later.' });
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
