import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './History.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const History = () => {
  const [watchHistory, setWatchHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterBy, setFilterBy] = useState('all'); // 'all', 'today', 'week', 'month'
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWatchHistory = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await axios.get(`${API_URL}/videos/history`);
        
        if (response.data.success) {
          setWatchHistory(response.data.data);
        } else {
          throw new Error('Failed to fetch watch history');
        }
      } catch (err) {
        console.error('Error fetching watch history:', err);
        setError('Failed to load watch history. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchWatchHistory();
  }, []);

  // Filter history based on time
  const filteredHistory = () => {
    if (filterBy === 'all') return watchHistory;
    
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return watchHistory.filter(item => {
      const watchDate = new Date(item.lastWatched || item.createdAt);
      if (filterBy === 'today') return watchDate >= startOfDay;
      if (filterBy === 'week') return watchDate >= startOfWeek;
      if (filterBy === 'month') return watchDate >= startOfMonth;
      return true;
    });
  };

  // Format date 
  const formatWatchDate = (dateString) => {
    const now = new Date();
    const watchDate = new Date(dateString);
    const diffTime = Math.abs(now - watchDate);
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

  // Clear history function
  const handleClearHistory = async () => {
    if (window.confirm('Are you sure you want to clear your watch history?')) {
      try {
        const response = await axios.delete(`${API_URL}/videos/history`);
        
        if (response.data.success) {
          setWatchHistory([]);
          alert('Watch history cleared successfully');
        } else {
          throw new Error('Failed to clear watch history');
        }
      } catch (err) {
        console.error('Error clearing watch history:', err);
        alert('Failed to clear watch history. Please try again.');
      }
    }
  };

  if (loading) {
    return <div className="loading">Loading watch history...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="history-page">
      <div className="history-header">
        <h1>Watch History</h1>
        <div className="history-actions">
          <div className="filter-controls">
            <select 
              value={filterBy} 
              onChange={(e) => setFilterBy(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
          <button 
            className="clear-history-btn" 
            onClick={handleClearHistory}
            disabled={watchHistory.length === 0}
          >
            Clear History
          </button>
        </div>
      </div>

      {watchHistory.length === 0 ? (
        <div className="empty-history">
          <p>Your watch history is empty</p>
          <Link to="/student/dashboard" className="browse-videos-btn">
            Browse Videos
          </Link>
        </div>
      ) : (
        <div className="history-list">
          {filteredHistory().map(item => (
            <div className="history-item" key={item._id}>
              <div className="video-thumbnail">
                <Link to={`/student/watch/${item.video._id}`}>
                  <img src={item.video.thumbnailUrl || 'https://via.placeholder.com/280x158?text=No+Thumbnail'} alt={item.video.title} />
                  <span className="duration">{formatDuration(item.video.duration)}</span>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${item.progress || 0}%` }}
                    ></div>
                  </div>
                </Link>
              </div>
              <div className="video-details">
                <Link to={`/student/watch/${item.video._id}`} className="video-title">
                  {item.video.title}
                </Link>
                <p className="video-teacher">{item.video.teacher.name}</p>
                <p className="watched-time">Watched {formatWatchDate(item.lastWatched || item.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Format duration from seconds to MM:SS
const formatDuration = (seconds) => {
  if (!seconds) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

export default History; 