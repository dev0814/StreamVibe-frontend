import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { currentUser, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Check if the user is authenticated
  if (!isAuthenticated) {
    // Redirect to login page with the return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user has the required role
  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    // Redirect to appropriate dashboard based on role
    if (currentUser.role === 'student') {
      return <Navigate to="/student/dashboard" replace />;
    } else if (currentUser.role === 'teacher') {
      return <Navigate to="/teacher/dashboard" replace />;
    } else if (currentUser.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    
    // Fallback to home page
    return <Navigate to="/" replace />;
  }

  // Check if teacher is approved
  if (currentUser.role === 'teacher' && !currentUser.isApproved) {
    return <Navigate to="/login" state={{ message: 'Your account is pending approval. Please wait for admin approval.' }} replace />;
  }

  // If user is authenticated and has the required role, render the children
  return children;
};

export default ProtectedRoute; 