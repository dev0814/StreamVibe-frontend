import { useState } from 'react';
import { Outlet, Link, useLocation, NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Layout.css';

const AdminLayout = () => {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>
            <Link to="/admin/dashboard">StreamVibe</Link>
          </h2>
        </div>
        <ul className="sidebar-menu">
          <li>
            <NavLink 
              to="/admin/dashboard" 
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              <span className="icon">📊</span> Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/admin/users" 
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              <span className="icon">👥</span> User Management
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/admin/videos" 
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              <span className="icon">🎥</span> Video Management
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/admin/comments" 
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              <span className="icon">💬</span> Comment Moderation
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/admin/analytics" 
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              <span className="icon">📈</span> Analytics
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/admin/notices" 
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              <span className="icon">📢</span> Manage Notices
            </NavLink>
          </li>
        </ul>
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        <header className="dashboard-header">
          <div className="dashboard-title">
            <h1>
              {location.pathname === '/admin/dashboard' && 'Admin Dashboard'}
              {location.pathname === '/admin/users' && 'User Management'}
              {location.pathname === '/admin/videos' && 'Video Management'}
              {location.pathname === '/admin/comments' && 'Comment Moderation'}
              {location.pathname === '/admin/analytics' && 'Platform Analytics'}
              {location.pathname === '/admin/notices' && 'Manage Notices'}
              {location.pathname === '/admin/profile' && 'My Profile'}
            </h1>
          </div>
          <div className="user-menu">
            <img 
              src={currentUser.profilePicture || '/default-profile.jpg'} 
              alt={currentUser.name} 
              className="avatar"
            />
            <span className="name">{currentUser.name}</span>
            <button 
              onClick={toggleDropdown} 
              className="dropdown-toggle"
            >
              ▼
            </button>
            {showDropdown && (
              <div className="dropdown-menu">
                <ul>
                  <li>
                    <Link to="/admin/profile" onClick={() => setShowDropdown(false)}>
                      Profile
                    </Link>
                  </li>
                  <li>
                    <button onClick={logout}>Logout</button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </header>
        <main className="dashboard-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout; 