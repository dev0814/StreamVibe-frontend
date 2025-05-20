import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './Notifications.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await axios.get(`${API_URL}/notifications`);
        
        if (response.data.success) {
          setNotifications(response.data.data);
        } else {
          throw new Error('Failed to fetch notifications');
        }
      } catch (err) {
        console.error('Error fetching notifications:', err);
        setError('Failed to load notifications. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchNotifications();
  }, []);

  // Filter notifications based on read/unread status
  const filteredNotifications = () => {
    if (filter === 'all') return notifications;
    if (filter === 'unread') return notifications.filter(notif => !notif.isRead);
    if (filter === 'read') return notifications.filter(notif => notif.isRead);
    return notifications;
  };

  // Format date
  const formatTimestamp = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    
    if (diffDays > 0) {
      return diffDays === 1 ? 'Yesterday' : `${diffDays} days ago`;
    } else if (diffHours > 0) {
      return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    } else {
      return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`;
    }
  };

  // Handle mark as read
  const handleMarkAsRead = async (id) => {
    try {
      const response = await axios.put(`${API_URL}/notifications/${id}/read`);
      
      if (response.data.success) {
        setNotifications(notifications.map(notif => 
          notif._id === id ? { ...notif, isRead: true } : notif
        ));
      } else {
        throw new Error('Failed to mark notification as read');
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
      alert('Failed to mark notification as read. Please try again.');
    }
  };

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      const response = await axios.put(`${API_URL}/notifications/read-all`);
      
      if (response.data.success) {
        setNotifications(notifications.map(notif => ({ ...notif, isRead: true })));
      } else {
        throw new Error('Failed to mark all notifications as read');
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      alert('Failed to mark all notifications as read. Please try again.');
    }
  };

  // Get icon based on notification type
  const getNotificationIcon = (type) => {
    switch(type) {
      case 'video':
        return '📹';
      case 'assignment':
        return '📝';
      case 'comment':
        return '💬';
      case 'certificate':
        return '🏆';
      case 'notice':
        return '📢';
      default:
        return '🔔';
    }
  };

  // Count unread notifications
  const unreadCount = notifications.filter(notif => !notif.isRead).length;

  if (loading) {
    return <div className="loading">Loading notifications...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="notifications-container">
      <div className="notifications-header">
        <h1>Notifications</h1>
        <div className="notification-actions">
          <div className="filter-controls">
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
            </select>
          </div>
          {unreadCount > 0 && (
            <button 
              className="mark-all-read-btn" 
              onClick={handleMarkAllAsRead}
            >
              Mark all as read
            </button>
          )}
        </div>
      </div>

      {filteredNotifications().length === 0 ? (
        <div className="empty-notifications">
          <div className="empty-icon">🔔</div>
          <p>No notifications to display</p>
        </div>
      ) : (
        <div className="notifications-list">
          {filteredNotifications().map(notification => (
            <div 
              key={notification._id} 
              className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
            >
              <div className="notification-icon">
                {getNotificationIcon(notification.type)}
              </div>
              <div className="notification-content">
                <div className="notification-header">
                  <h3>{notification.title}</h3>
                  <span className="notification-time">
                    {formatTimestamp(notification.createdAt)}
                  </span>
                </div>
                <p>{notification.content}</p>
                <div className="notification-actions">
                  {notification.link && (
                    <Link to={notification.link} className="view-link">
                      View Details
                    </Link>
                  )}
                  {!notification.isRead && (
                    <button 
                      className="mark-read-btn"
                      onClick={() => handleMarkAsRead(notification._id)}
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications; 