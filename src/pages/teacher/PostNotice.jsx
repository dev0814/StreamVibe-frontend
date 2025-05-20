import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './PostNotice.css';

const PostNotice = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    audience: 'all',
    sendEmail: false,
    priority: 'normal',
    expiryDays: '7'
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [preview, setPreview] = useState(false);
  
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    
    // Clear error when typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 100) {
      newErrors.title = 'Title cannot exceed 100 characters';
    }
    
    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate API call to post notice
    setTimeout(() => {
      setIsSubmitting(false);
      navigate('/teacher/notifications', { state: { noticePosted: true } });
    }, 1500);
  };
  
  const togglePreview = () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      setErrors({
        ...errors,
        title: !formData.title.trim() ? 'Title is required' : null,
        content: !formData.content.trim() ? 'Content is required' : null
      });
      return;
    }
    
    setPreview(!preview);
  };
  
  const formatDate = (daysToAdd) => {
    const date = new Date();
    date.setDate(date.getDate() + parseInt(daysToAdd, 10));
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  const getPriorityClass = () => {
    switch (formData.priority) {
      case 'high':
        return 'priority-high';
      case 'low':
        return 'priority-low';
      default:
        return 'priority-normal';
    }
  };
  
  const getAudienceDisplay = () => {
    switch (formData.audience) {
      case 'all':
        return 'All Students';
      case 'enrolled':
        return 'Enrolled Students';
      case 'specific':
        return 'Specific Classes';
      default:
        return formData.audience;
    }
  };
  
  return (
    <div className="post-notice-container">
      <div className="page-header">
        <h1>Post Announcement</h1>
        <p>Create announcements to keep your students informed</p>
      </div>
      
      {preview ? (
        <div className="notice-preview">
          <div className="preview-header">
            <h2>Preview</h2>
            <button 
              type="button" 
              className="edit-btn"
              onClick={togglePreview}
            >
              Edit
            </button>
          </div>
          
          <div className="notice-card">
            <div className={`notice-priority ${getPriorityClass()}`}>
              {formData.priority.charAt(0).toUpperCase() + formData.priority.slice(1)} Priority
            </div>
            
            <h3 className="notice-title">{formData.title}</h3>
            
            <div className="notice-meta">
              <span className="notice-audience">To: {getAudienceDisplay()}</span>
              <span className="notice-date">Posted: {new Date().toLocaleDateString()}</span>
            </div>
            
            <div className="notice-content">
              {formData.content.split('\n').map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </div>
            
            <div className="notice-footer">
              <span className="notice-expiry">
                Expires: {formatDate(formData.expiryDays)}
              </span>
            </div>
          </div>
          
          <div className="preview-actions">
            <button 
              type="button" 
              className="cancel-btn"
              onClick={() => navigate('/teacher/notifications')}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            
            <button 
              type="button" 
              className="submit-btn"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Posting...' : 'Post Announcement'}
            </button>
          </div>
        </div>
      ) : (
        <form className="notice-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">
              Title <span className="required">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Enter announcement title"
              className={errors.title ? 'error' : ''}
              maxLength={100}
            />
            {errors.title && <div className="error-message">{errors.title}</div>}
            <div className="character-count">
              {formData.title.length}/100 characters
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="content">
              Content <span className="required">*</span>
            </label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              placeholder="Enter announcement content"
              className={errors.content ? 'error' : ''}
              rows="8"
            ></textarea>
            {errors.content && <div className="error-message">{errors.content}</div>}
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="audience">Audience</label>
              <select
                id="audience"
                name="audience"
                value={formData.audience}
                onChange={handleInputChange}
              >
                <option value="all">All Students</option>
                <option value="enrolled">Only Enrolled Students</option>
                <option value="specific">Specific Classes</option>
              </select>
              {formData.audience === 'specific' && (
                <div className="form-hint">
                  You'll be able to select specific classes after creating the announcement
                </div>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="priority">Priority</label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="expiryDays">Expires After</label>
              <select
                id="expiryDays"
                name="expiryDays"
                value={formData.expiryDays}
                onChange={handleInputChange}
              >
                <option value="3">3 days</option>
                <option value="7">7 days</option>
                <option value="14">14 days</option>
                <option value="30">30 days</option>
                <option value="90">3 months</option>
                <option value="never">Never expires</option>
              </select>
            </div>
            
            <div className="form-group checkbox-group">
              <input
                type="checkbox"
                id="sendEmail"
                name="sendEmail"
                checked={formData.sendEmail}
                onChange={handleInputChange}
              />
              <label htmlFor="sendEmail">
                Also send as email notification
              </label>
              <div className="form-hint">
                An email will be sent to all selected students
              </div>
            </div>
          </div>
          
          <div className="form-actions">
            <button 
              type="button" 
              className="cancel-btn"
              onClick={() => navigate('/teacher/notifications')}
            >
              Cancel
            </button>
            <button 
              type="button" 
              className="preview-btn"
              onClick={togglePreview}
            >
              Preview
            </button>
            <button 
              type="submit" 
              className="submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Posting...' : 'Post Announcement'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default PostNotice; 