import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(() => {
    // Initialize token from localStorage
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
    }
    return storedToken;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  // Configure axios with token
  useEffect(() => {
    if (token) {
      console.log('Setting auth token:', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
    } else {
      console.log('Removing auth token');
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
    }
  }, [token]);

  // Load user data on initial load or token change
  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        console.log('No token available, skipping user load');
        setLoading(false);
        return;
      }

      try {
        console.log('Loading user data with token');
        const response = await axios.get(`${API_URL}/auth/me`);
        console.log('User data loaded:', response.data);
        setCurrentUser(response.data.user);
        setError('');
      } catch (err) {
        console.error('Failed to load user:', err);
        // Only clear token if it's an authentication error
        if (err.response?.status === 401 || err.response?.status === 403) {
          localStorage.removeItem('token');
          setToken(null);
          setCurrentUser(null);
          setError('Session expired. Please login again.');
        } else {
          setError('Failed to load user data. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [token]);

  // Register user
  const register = async (userData) => {
    try {
      setLoading(true);
      setError('');
      
      const formData = new FormData();
      
      // Append text fields
      Object.keys(userData).forEach(key => {
        if (key !== 'profilePicture') {
          formData.append(key, userData[key]);
        }
      });
      
      // Append file if exists
      if (userData.profilePicture) {
        formData.append('profilePicture', userData.profilePicture);
      }
      
      const response = await axios.post(`${API_URL}/auth/register`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      localStorage.setItem('token', response.data.token);
      setToken(response.data.token);
      setCurrentUser(response.data.user);
      
      // Redirect based on role and approval status
      const { role, isApproved } = response.data.user;
      
      if (role === 'student') {
        navigate('/student/dashboard');
      } else if (role === 'teacher') {
        if (isApproved) {
          navigate('/teacher/dashboard');
        } else {
          navigate('/login', { 
            state: { message: 'Registration successful. Please wait for admin approval before you can login.' } 
          });
        }
      } else if (role === 'admin') {
        navigate('/admin/dashboard');
      }
      
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Login user
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Attempting login for:', email);
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      });
      
      console.log('Login successful, setting token');
      const newToken = response.data.token;
      
      // Set token first to trigger the useEffect
      setToken(newToken);
      setCurrentUser(response.data.user);
      
      // Redirect based on role
      const { role } = response.data.user;
      console.log('User role:', role);
      
      if (role === 'student') {
        navigate('/student/dashboard');
      } else if (role === 'teacher') {
        navigate('/teacher/dashboard');
      } else if (role === 'admin') {
        navigate('/admin/dashboard');
      }
      
      return response.data;
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.error || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout user
  const logout = () => {
    setToken(null);
    setCurrentUser(null);
    navigate('/login');
  };

  // Update user profile
  const updateProfile = async (userData) => {
    try {
      setLoading(true);
      setError('');
      
      const formData = new FormData();
      
      // Append text fields
      Object.keys(userData).forEach(key => {
        if (key !== 'profilePicture') {
          formData.append(key, userData[key]);
        }
      });
      
      // Append file if exists
      if (userData.profilePicture) {
        formData.append('profilePicture', userData.profilePicture);
      }
      
      const response = await axios.put(`${API_URL}/auth/updateprofile`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setCurrentUser(response.data.user);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Profile update failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update password
  const updatePassword = async (currentPassword, newPassword) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await axios.put(`${API_URL}/auth/updatepassword`, {
        currentPassword,
        newPassword
      });
      
      // Update token if returned
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        setToken(response.data.token);
      }
      
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Password update failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Check if user has a specific role
  const hasRole = (roles) => {
    if (!currentUser) return false;
    return roles.includes(currentUser.role);
  };

  const value = {
    currentUser,
    loading,
    error,
    register,
    login,
    logout,
    updateProfile,
    updatePassword,
    hasRole,
    isAuthenticated: !!currentUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 