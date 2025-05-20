import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Layout.css';

const PublicLayout = () => {
  const { isAuthenticated, currentUser } = useAuth();

  // Determine dashboard link based on user role
  const getDashboardLink = () => {
    if (!currentUser) return '/';
    
    if (currentUser.role === 'student') {
      return '/student/dashboard';
    } else if (currentUser.role === 'teacher') {
      return '/teacher/dashboard';
    } else if (currentUser.role === 'admin') {
      return '/admin/dashboard';
    }
    
    return '/';
  };

  return (
    <div className="layout">
      <header className="header">
        <div className="logo">
          <Link to="/">
            <h1>StreamVibe</h1>
          </Link>
        </div>
        <nav className="nav">
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            {!isAuthenticated ? (
              <>
                <li>
                  <Link to="/login">Login</Link>
                </li>
                <li>
                  <Link to="/register">Register</Link>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link to={getDashboardLink()}>Dashboard</Link>
                </li>
              </>
            )}
          </ul>
        </nav>
      </header>

      <main className="main-content">
        <Outlet />
      </main>

      <footer className="footer">
        <p>&copy; {new Date().getFullYear()} StreamVibe - Educational Video Sharing Platform</p>
      </footer>
    </div>
  );
};

export default PublicLayout; 