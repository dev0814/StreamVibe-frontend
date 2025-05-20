import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Register.css';

const Register = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const roleFromUrl = queryParams.get('role');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: roleFromUrl || 'student',
    branch: 'CSE',
    department: 'CSE',
    year: '1st',
    profilePicture: null
  });
  
  const [previewImage, setPreviewImage] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { register, error: authError } = useAuth();
  
  // Update error from auth context if it changes
  useEffect(() => {
    if (authError) {
      setError(authError);
    }
  }, [authError]);
  
  // Clear error when user modifies the form
  useEffect(() => {
    if (error) {
      setError('');
    }
  }, [formData]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    
    if (file) {
      // Check file size (limit to 500KB)
      if (file.size > 500 * 1024) {
        setError('Profile picture must be less than 500KB');
        e.target.value = '';
        return;
      }
      
      // Check file type
      if (!file.type.match('image.*')) {
        setError('File must be an image');
        e.target.value = '';
        return;
      }
      
      setFormData({
        ...formData,
        profilePicture: file
      });
      
      // Create a preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  const validatePassword = (password) => {
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    
    if (!minLength) return 'Password must be at least 8 characters long';
    if (!hasUpperCase) return 'Password must contain at least one uppercase letter';
    if (!hasLowerCase) return 'Password must contain at least one lowercase letter';
    if (!hasNumber) return 'Password must contain at least one number';
    if (!hasSpecial) return 'Password must contain at least one special character';
    
    return null; // Valid password
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset error
    setError('');
    
    // Validate inputs
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all required fields');
      return;
    }
    
    // Validate email
    if (!validateEmail(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    // Validate password complexity
    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    
    try {
      setLoading(true);
      
      // Create registration data (excluding confirmPassword)
      const { confirmPassword, ...registrationData } = formData;
      
      // Prepare data based on role
      const finalData = { ...registrationData };
      
      if (finalData.role === 'student') {
        // For students, include branch and year, remove department
        delete finalData.department;
      } else if (finalData.role === 'teacher') {
        // For teachers, include department, remove branch and year
        delete finalData.branch;
        delete finalData.year;
      }
      
      // Log data for debugging
      console.log('Submitting registration data:', finalData);
      
      await register(finalData);
      // Navigation is handled in the AuthContext after successful registration
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };
  
  return (
    <div className="container">
      <div className="row">
        <div className="col-6">
          <div className="card mt-5">
            <h2 className="text-center">Register for StreamVibe</h2>
            
            {error && (
              <div className="alert alert-error">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="role">I am a:</label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  required
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  required
                />
              </div>
              
              {formData.role === 'student' ? (
                <div className="form-group">
                  <label htmlFor="branch">Branch</label>
                  <select
                    id="branch"
                    name="branch"
                    value={formData.branch}
                    onChange={handleChange}
                    required
                  >
                    <option value="CSE">Computer Science Engineering (CSE)</option>
                    <option value="CSE-AI">Computer Science Engineering-Artificial Intelligence (CSE-AI)</option>
                    <option value="CSE-SF">Computer Science Engineering-Self Financed (CSE-SF)</option>
                    <option value="ECE">Electronics & Communication (ECE)</option>
                    <option value="EE">Electrical Engineering (EE)</option>
                    <option value="ME">Mechanical Engineering (ME)</option>
                    <option value="CHE">Chemical Engineering (CHE)</option>
                    <option value="CE">Civil Engineering (CE)</option>
                  </select>
                </div>
              ) : (
                <div className="form-group">
                  <label htmlFor="department">Department</label>
                  <select
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    required
                  >
                    <option value="CSE">Computer Science Engineering (CSE)</option>
                    <option value="ECE">Electronics & Communication (ECE)</option>
                    <option value="EE">Electrical Engineering (EE)</option>
                    <option value="ME">Mechanical Engineering (ME)</option>
                    <option value="CHE">Chemical Engineering (CHE)</option>
                    <option value="CE">Civil Engineering (CE)</option>
                  </select>
                </div>
              )}
              
              {formData.role === 'student' && (
                <div className="form-group">
                  <label htmlFor="year">Year of Study</label>
                  <select
                    id="year"
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    required
                  >
                    <option value="1st">1st Year</option>
                    <option value="2nd">2nd Year</option>
                    <option value="3rd">3rd Year</option>
                    <option value="4th">4th Year</option>
                  </select>
                </div>
              )}
              
              <div className="form-group">
                <label htmlFor="profilePicture">Profile Picture (Optional)</label>
                <input
                  type="file"
                  id="profilePicture"
                  name="profilePicture"
                  onChange={handleFileChange}
                  accept="image/*"
                />
                <small className="form-text">
                  Recommended: Square image, &lt; 500KB
                </small>
                
                {previewImage && (
                  <div className="mt-2">
                    <img 
                      src={previewImage} 
                      alt="Profile Preview" 
                      style={{ 
                        width: '100px', 
                        height: '100px', 
                        objectFit: 'cover',
                        borderRadius: '50%'
                      }} 
                    />
                  </div>
                )}
              </div>
              
              <div className="form-group password-field">
                <label htmlFor="password">Password</label>
                <div className="password-input-container">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password (min. 8 characters)"
                    required
                    minLength={8}
                  />
                  <button 
                    type="button" 
                    className="password-toggle" 
                    onClick={togglePasswordVisibility}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                <small className="form-text">
                  Must be at least 8 characters with uppercase, lowercase, number, and special character
                </small>
              </div>
              
              <div className="form-group password-field">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <div className="password-input-container">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    required
                  />
                  <button 
                    type="button" 
                    className="password-toggle" 
                    onClick={toggleConfirmPasswordVisibility}
                  >
                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>
              
              {formData.role === 'teacher' && (
                <div className="alert alert-info">
                  Note: Teacher accounts require admin approval before you can upload videos.
                </div>
              )}
              
              <button 
                type="submit" 
                className="btn" 
                disabled={loading}
              >
                {loading ? (
                  <div className="spinner-container">
                    <div className="spinner"></div>
                    <span>Registering...</span>
                  </div>
                ) : 'Register'}
              </button>
            </form>
            
            <p className="text-center mt-3">
              Already have an account? <Link to="/login">Login</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register; 