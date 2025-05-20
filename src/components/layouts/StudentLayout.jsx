import { useState } from 'react';
import { Outlet, Link, useLocation, NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Layout.css';

const StudentLayout = () => {
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
            <Link to="/student/dashboard">StreamVibe</Link>
          </h2>
        </div>
        <ul className="sidebar-menu">
          <li>
            <NavLink 
              to="/student/dashboard" 
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              <span className="icon">📊</span> Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/student/search" 
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              <span className="icon">🔍</span> Search Videos
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/student/playlists" 
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              <span className="icon">📚</span> My Playlists
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/student/notes" 
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              <span className="icon">📝</span> My Notes
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/student/history" 
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              <span className="icon">⏱️</span> Watch History
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/student/notices" 
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              <span className="icon">📢</span> Notice Board
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/student/notifications" 
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
              {location.pathname === '/student/dashboard' && 'Dashboard'}
              {location.pathname === '/student/search' && 'Search Videos'}
              {location.pathname.startsWith('/student/watch/') && 'Watch Video'}
              {location.pathname === '/student/playlists' && 'My Playlists'}
              {location.pathname.startsWith('/student/playlists/') && 'Playlist Details'}
              {location.pathname === '/student/notes' && 'My Notes'}
              {location.pathname === '/student/history' && 'Watch History'}
              {location.pathname === '/student/notices' && 'Notice Board'}
              {location.pathname === '/student/notifications' && 'Notifications'}
              {location.pathname === '/student/profile' && 'My Profile'}
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
                    <Link to="/student/profile" onClick={() => setShowDropdown(false)}>
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

export default StudentLayout; 