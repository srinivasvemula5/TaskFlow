import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, FolderOpen, LogOut, Menu, X,
  ChevronDown, Shield, User, CheckSquare
} from 'lucide-react';

const navLinks = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/projects', label: 'Projects', icon: FolderOpen },
];

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <div className="navbar-logo-icon">
            <CheckSquare size={18} />
          </div>
          <span>TaskFlow</span>
        </Link>

        {/* Desktop Nav */}
        <div className="navbar-links">
          {navLinks.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`nav-link ${location.pathname === to ? 'active' : ''}`}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </div>

        {/* Profile Dropdown */}
        <div className="navbar-right">
          <div className="profile-dropdown">
            <button
              className="profile-btn"
              onClick={() => setProfileOpen(!profileOpen)}
            >
              <div className="profile-avatar">{user?.name?.[0] || 'U'}</div>
              <div className="profile-info">
                <span className="profile-name">{user?.name}</span>
                <span className={`profile-role ${isAdmin ? 'admin' : 'member'}`}>
                  {isAdmin ? <Shield size={10} /> : <User size={10} />}
                  {user?.role}
                </span>
              </div>
              <ChevronDown size={14} className={`chevron ${profileOpen ? 'rotated' : ''}`} />
            </button>

            {profileOpen && (
              <div className="dropdown-menu" onClick={() => setProfileOpen(false)}>
                <div className="dropdown-header">
                  <p className="dropdown-name">{user?.name}</p>
                  <p className="dropdown-email">{user?.email}</p>
                </div>
                <hr className="dropdown-divider" />
                <button className="dropdown-item danger" onClick={handleLogout}>
                  <LogOut size={14} /> Sign Out
                </button>
              </div>
            )}
          </div>

          {/* Mobile toggle */}
          <button className="mobile-menu-btn" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="mobile-nav">
          {navLinks.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className="mobile-nav-link"
              onClick={() => setMobileOpen(false)}>
              <Icon size={16} /> {label}
            </Link>
          ))}
          <button className="mobile-nav-link danger" onClick={handleLogout}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      )}
    </nav>
  );
}
