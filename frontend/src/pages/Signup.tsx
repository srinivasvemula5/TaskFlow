import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api';
import toast from 'react-hot-toast';
import { UserPlus, Mail, Lock, User, Loader2, Shield } from 'lucide-react';

export default function Signup() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'member' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.signup(form);
      login(res.data.token, res.data.user);
      toast.success(`Welcome to TaskFlow, ${res.data.user.name}!`);
      navigate('/');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 11l3 3L22 4"/>
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
            </svg>
          </div>
          <h1>TaskFlow</h1>
          <p>Team Task Manager</p>
        </div>

        <h2 className="auth-title">Create your account</h2>
        <p className="auth-subtitle">Start managing your team's tasks today</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <div className="input-wrapper">
              <User size={16} className="input-icon" />
              <input id="name" type="text" placeholder="John Doe"
                value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <div className="input-wrapper">
              <Mail size={16} className="input-icon" />
              <input id="email" type="email" placeholder="you@example.com"
                value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <Lock size={16} className="input-icon" />
              <input id="password" type="password" placeholder="Min. 6 characters"
                value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="role">Account Type</label>
            <div className="input-wrapper">
              <Shield size={16} className="input-icon" />
              <select id="role" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                <option value="member">Member — Join and work on projects</option>
                <option value="admin">Admin — Create and manage projects</option>
              </select>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? <Loader2 size={18} className="spin" /> : <UserPlus size={18} />}
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?{' '}
          <Link to="/login">Sign in</Link>
        </p>
      </div>

      <div className="auth-bg">
        <div className="auth-bg-orb orb1" />
        <div className="auth-bg-orb orb2" />
        <div className="auth-bg-orb orb3" />
      </div>
    </div>
  );
}
