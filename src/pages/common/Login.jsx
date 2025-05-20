import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, error: authError } = useAuth();
  const location = useLocation();

  // Check if there's a message in location state (e.g., from registration)
  useEffect(() => {
    if (location.state?.message) {
      setMessage(location.state.message);
    }
  }, [location.state]);

  // Update error from auth context if it changes
  useEffect(() => {
    if (authError) {
      setError(authError);
    }
  }, [authError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset errors and messages
    setError('');
    setMessage('');
    
    // Validate inputs
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    try {
      setLoading(true);
      await login(email, password);
      // Navigation is handled in the AuthContext after successful login
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="row">
        <div className="col-6" style={{ margin: '0 auto' }}>
          <div className="card mt-5">
            <h2 className="text-center">Login to StreamVibe</h2>
            
            {error && (
              <div className="alert alert-error">
                {error}
              </div>
            )}
            
            {message && (
              <div className="alert alert-info">
                {message}
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </div>
              
              <button 
                type="submit" 
                className="btn" 
                disabled={loading}
                style={{ width: '100%',
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center'
                 }}
              >
                {loading ? 'Logging in...' : 'Login '}
              </button>
            </form>
            
            <p className="text-center mt-3">
              Don't have an account? <Link to="/register">Register</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login; 