import { useState } from 'react';
import { Outlet, Link, useLocation, NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Layout.css';

const TeacherLayout = () => {
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
            <Link to="/teacher/dashboard">StreamVibe</Link>
          </h2>
        </div>
        <ul className="sidebar-menu">
          <li>
            <NavLink 
              to="/teacher/dashboard" 
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              <span className="icon">📊</span> Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/teacher/upload" 
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              <span className="icon">📤</span> Upload Video
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/teacher/videos" 
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              <span className="icon">🎥</span> My Videos
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/teacher/playlists" 
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              <span className="icon">📚</span> Playlists
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/teacher/analytics" 
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              <span className="icon">📈</span> Analytics
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/teacher/notice" 
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              <span className="icon">📢</span> Post Notice
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/teacher/notifications" 
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              <span className="icon">🔔</span> Notifications
            </NavLink>
          </li>
        </ul>
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        <header className="dashboard-header">
          <div className="dashboard-title">
            <h1>
              {location.pathname === '/teacher/dashboard' && 'Dashboard'}
              {location.pathname === '/teacher/upload' && 'Upload Video'}
              {location.pathname === '/teacher/videos' && 'My Videos'}
              {location.pathname === '/teacher/playlists' && 'Playlists'}
              {location.pathname.startsWith('/teacher/playlists/') && 'Playlist Details'}
              {location.pathname === '/teacher/analytics' && 'Analytics'}
              {location.pathname === '/teacher/notice' && 'Post Notice'}
              {location.pathname === '/teacher/notifications' && 'Notifications'}
              {location.pathname === '/teacher/profile' && 'My Profile'}
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
                    <Link to="/teacher/profile" onClick={() => setShowDropdown(false)}>
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

export default TeacherLayout; 