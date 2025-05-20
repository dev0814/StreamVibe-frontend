import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Notifications.css';

const Notifications = () => {
  const location = useLocation();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'expired'
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  
  useEffect(() => {
    // Check if notice was posted
    if (location.state?.noticePosted) {
      setShowSuccessMessage(true);
      
      // Hide the message after 5 seconds
      const timer = setTimeout(() => {
        setShowSuccessMessage(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [location]);
  
  useEffect(() => {
    // Simulate API call to fetch notices
    setTimeout(() => {
      const mockNotices = [
        {
          id: '1',
          title: 'Course Update: New Content Added to React Fundamentals',
          content: 'We\'ve added new lectures and exercises to the React Fundamentals course. Check them out in Module 3.',
          createdAt: '2023-10-15T14:30:00',
          expiresAt: '2023-11-15T14:30:00',
          audience: 'Enrolled Students',
          priority: 'high',
          isExpired: false,
          views: 143,
          emailSent: true
        },
        {
          id: '2',
          title: 'Upcoming Maintenance: Platform Will Be Unavailable',
          content: 'Our platform will be undergoing maintenance on October 25th from 2:00 AM to 4:00 AM UTC. During this time, the platform will be unavailable.',
          createdAt: '2023-10-10T09:45:00',
          expiresAt: '2023-10-26T00:00:00',
          audience: 'All Students',
          priority: 'normal',
          isExpired: false,
          views: 256,
          emailSent: true
        },
        {
          id: '3',
          title: 'New Feature: Interactive Coding Exercises',
          content: 'We\'ve introduced interactive coding exercises to help you practice as you learn. Try them out in your next lesson!',
          createdAt: '2023-09-28T11:20:00',
          expiresAt: '2023-10-12T11:20:00',
          audience: 'All Students',
          priority: 'normal',
          isExpired: true,
          views: 421,
          emailSent: true
        },
        {
          id: '4',
          title: 'Webinar: Advanced React Patterns with Guest Speaker',
          content: 'Join us for a special webinar on Advanced React Patterns with guest speaker Jane Smith on November 5th at 6:00 PM UTC.',
          createdAt: '2023-10-01T13:10:00',
          expiresAt: '2023-11-06T00:00:00',
          audience: 'Enrolled Students',
          priority: 'normal',
          isExpired: false,
          views: 89,
          emailSent: false
        },
        {
          id: '5',
          title: 'Holiday Schedule: Instructor Availability',
          content: 'Please note that instructor response times may be delayed during the upcoming holiday period from December 23rd to January 2nd.',
          createdAt: '2023-10-05T16:45:00',
          expiresAt: '2024-01-03T00:00:00',
          audience: 'All Students',
          priority: 'low',
          isExpired: false,
          views: 112,
          emailSent: true
        }
      ];
      
      setNotices(mockNotices);
      setLoading(false);
    }, 1000);
  }, []);
  
  // Filter notices based on status and search query
  const filteredNotices = () => {
    let filtered = [...notices];
    
    // Apply status filter
    if (filter === 'active') {
      filtered = filtered.filter(notice => !notice.isExpired);
    } else if (filter === 'expired') {
      filtered = filtered.filter(notice => notice.isExpired);
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(notice => 
        notice.title.toLowerCase().includes(query) || 
        notice.content.toLowerCase().includes(query)
      );
    }
    
    // Sort by date (newest first)
    return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  };
  
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  // Calculate time remaining
  const getTimeRemaining = (expiryDate) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - now;
    
    // If already expired
    if (diffTime <= 0) {
      return 'Expired';
    }
    
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} left`;
    }
    
    const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} left`;
  };
  
  // Get priority class
  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'high':
        return 'priority-high';
      case 'low':
        return 'priority-low';
      default:
        return 'priority-normal';
    }
  };
  
  const handleDeleteNotice = (id) => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      setNotices(notices.filter(notice => notice.id !== id));
    }
  };
  
  const handleResendEmail = (id) => {
    // In a real app, would make an API call to resend email
    alert('Email has been resent to students.');
  };
  
  if (loading) {
    return <div className="loading">Loading announcements...</div>;
  }

  return (
    <div className="notifications-container">
      <div className="page-header">
        <h1>Announcements</h1>
        <Link to="/teacher/post-notice" className="create-btn">
          Post New Announcement
        </Link>
      </div>
      
      {showSuccessMessage && (
        <div className="success-message">
          <span>Announcement posted successfully!</span>
          <button 
            className="close-message"
            onClick={() => setShowSuccessMessage(false)}
          >
            &times;
          </button>
        </div>
      )}
      
      <div className="notifications-controls">
        <div className="search-filter-section">
          <div className="search-box">
            <input 
              type="text" 
              placeholder="Search announcements..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="filter-control">
            <label>Filter:</label>
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All Announcements</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>
      </div>
      
      {filteredNotices().length === 0 ? (
        <div className="no-notices">
          <h2>No announcements found</h2>
          {searchQuery || filter !== 'all' ? (
            <p>Try adjusting your filters.</p>
          ) : (
            <p>Get started by posting your first announcement.</p>
          )}
        </div>
      ) : (
        <div className="notices-list">
          {filteredNotices().map(notice => (
            <div key={notice.id} className="notice-item">
              <div className={`notice-priority ${getPriorityClass(notice.priority)}`}>
                {notice.priority.charAt(0).toUpperCase() + notice.priority.slice(1)}
              </div>
              
              <div className="notice-content">
                <h3 className="notice-title">{notice.title}</h3>
                <p className="notice-text">{notice.content}</p>
                
                <div className="notice-meta">
                  <div className="notice-details">
                    <span className="notice-audience">To: {notice.audience}</span>
                    <span className="notice-date">Posted: {formatDate(notice.createdAt)}</span>
                    <span className={`notice-expiry ${notice.isExpired ? 'expired' : ''}`}>
                      {notice.isExpired ? 'Expired' : getTimeRemaining(notice.expiresAt)}
                    </span>
                  </div>
                  
                  <div className="notice-stats">
                    <span className="notice-views">{notice.views} views</span>
                    <span className="notice-email-status">
                      {notice.emailSent ? 'Email sent' : 'Email not sent'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="notice-actions">
                <Link 
                  to={`/teacher/notifications/${notice.id}/edit`} 
                  className="action-btn edit-btn"
                >
                  Edit
                </Link>
                
                {!notice.isExpired && !notice.emailSent && (
                  <button 
                    className="action-btn email-btn"
                    onClick={() => handleResendEmail(notice.id)}
                  >
                    Send Email
                  </button>
                )}
                
                <button 
                  className="action-btn delete-btn"
                  onClick={() => handleDeleteNotice(notice.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications; 