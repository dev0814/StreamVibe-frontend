import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './Profile.css';

const Profile = () => {
  const { currentUser, updateProfile, updatePassword, error: authError } = useAuth();
  
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    profilePicture: null
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  
  // Load user data when component mounts
  useEffect(() => {
    if (currentUser) {
      setProfileData({
        name: currentUser.name || '',
        email: currentUser.email || '',
        profilePicture: null
      });
      setPreviewUrl(currentUser.profilePicture || '');
    }
  }, [currentUser]);
  
  // Set error from auth context
  useEffect(() => {
    if (authError) {
      setError(authError);
    }
  }, [authError]);
  
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileData(prev => ({
        ...prev,
        profilePicture: file
      }));
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
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
  
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    
    // Reset status
    setError('');
    setMessage('');
    
    try {
      setLoading(true);
      
      await updateProfile({
        name: profileData.name,
        email: profileData.email,
        profilePicture: profileData.profilePicture
      });
      
      setMessage('Profile updated successfully!');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };
  
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    // Reset status
    setError('');
    setMessage('');
    
    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return setError('New passwords do not match');
    }
    
    // Validate password complexity
    const passwordError = validatePassword(passwordData.newPassword);
    if (passwordError) {
      return setError(passwordError);
    }
    
    try {
      setLoading(true);
      
      await updatePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );
      
      // Reset form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      setMessage('Password updated successfully!');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>My Profile</h1>
      </div>
      
      {/* Tabs */}
      <div className="profile-tabs">
        <button 
          className={activeTab === 'profile' ? 'active' : ''} 
          onClick={() => setActiveTab('profile')}
        >
          Profile Information
        </button>
        <button 
          className={activeTab === 'password' ? 'active' : ''} 
          onClick={() => setActiveTab('password')}
        >
          Change Password
        </button>
      </div>
      
      {/* Status Messages */}
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}
      
      {message && (
        <div className="alert alert-success">
          {message}
        </div>
      )}
      
      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="profile-form-container">
          <form onSubmit={handleProfileSubmit}>
            <div className="profile-picture-section">
              <div className="profile-picture">
                <img 
                  src={previewUrl || '/default-profile.jpg'} 
                  alt={profileData.name || 'User'} 
                />
                <label htmlFor="profilePicture" className="edit-overlay">
                  <span>Change Photo</span>
                </label>
                <input
                  type="file"
                  id="profilePicture"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="file-input"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={profileData.name}
                onChange={handleProfileChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={profileData.email}
                onChange={handleProfileChange}
                required
              />
            </div>
            
            {/* Display non-editable fields based on role */}
            <div className="form-group">
              <label>Role</label>
              <input
                type="text"
                value={currentUser.role}
                readOnly
                disabled
                className="read-only-field"
              />
            </div>

            {currentUser.role === 'student' && (
              <>
                <div className="form-group">
                  <label>Branch</label>
                  <input
                    type="text"
                    value={currentUser.branch}
                    readOnly
                    disabled
                    className="read-only-field"
                  />
                </div>
                <div className="form-group">
                  <label>Year</label>
                  <input
                    type="text"
                    value={currentUser.year}
                    readOnly
                    disabled
                    className="read-only-field"
                  />
                </div>
              </>
            )}

            {currentUser.role === 'teacher' && (
              <div className="form-group">
                <label>Department</label>
                <input
                  type="text"
                  value={currentUser.branch}
                  readOnly
                  disabled
                  className="read-only-field"
                />
              </div>
            )}
            
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update Profile'}
            </button>
          </form>
        </div>
      )}
      
      {/* Password Tab */}
      {activeTab === 'password' && (
        <div className="profile-form-container">
          <form onSubmit={handlePasswordSubmit}>
            <div className="form-group">
              <label htmlFor="currentPassword">Current Password</label>
              <input
                type="password"
                id="currentPassword"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                required
                minLength={8}
              />
              <small className="form-text">
                Must be at least 8 characters with uppercase, lowercase, number, and special character
              </small>
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                required
              />
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Profile; 