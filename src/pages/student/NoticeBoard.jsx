import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './NoticeBoard.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const NoticeBoard = () => {
  const [notices, setNotices] = useState([]);
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'general', 'course', 'exam'
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await axios.get(`${API_URL}/notices`);
        
        if (response.data.success && response.data.data) {
          setNotices(response.data.data);
          if (response.data.data.length > 0) {
            setSelectedNotice(response.data.data[0]);
          }
        } else {
          throw new Error('Failed to fetch notices');
        }
      } catch (err) {
        console.error('Error fetching notices:', err);
        setError('Failed to load notices. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchNotices();
  }, []);

  // Filter notices by category
  const filteredNotices = () => {
    if (filter === 'all') return notices;
    return notices.filter(notice => notice.category === filter);
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className="loading">Loading notices...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="notice-board-container">
      <div className="notice-sidebar">
        <div className="notice-filters">
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Notices</option>
            <option value="general">General</option>
            <option value="course">Course Related</option>
            <option value="exam">Examination</option>
          </select>
        </div>
        
        <div className="notices-list">
          {filteredNotices().length === 0 ? (
            <div className="no-notices">No notices found</div>
          ) : (
            filteredNotices().map(notice => (
              <div 
                key={notice._id}
                className={`notice-item ${selectedNotice?._id === notice._id ? 'active' : ''} ${notice.important ? 'important' : ''}`}
                onClick={() => setSelectedNotice(notice)}
              >
                <h3>{notice.title}</h3>
                <div className="notice-meta">
                  <span className="notice-category">{notice.category.charAt(0).toUpperCase() + notice.category.slice(1)}</span>
                  <span className="notice-date">{formatDate(notice.createdAt)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      <div className="notice-content">
        {selectedNotice ? (
          <>
            <div className="notice-header">
              <h1>{selectedNotice.title}</h1>
              <div className="notice-info">
                <span className="notice-author">Posted by: {selectedNotice.postedBy.name}</span>
                <span className="notice-date">{formatDate(selectedNotice.createdAt)}</span>
                {selectedNotice.important && (
                  <span className="notice-important-tag">Important</span>
                )}
              </div>
            </div>
            
            <div 
              className="notice-body"
              dangerouslySetInnerHTML={{ __html: selectedNotice.content }}
            />
            
            {selectedNotice.attachmentUrl && (
              <div className="notice-attachment">
                <a href={selectedNotice.attachmentUrl} target="_blank" rel="noopener noreferrer">
                  View Attachment
                </a>
              </div>
            )}
          </>
        ) : (
          <div className="no-notice-selected">
            <p>Select a notice to view details</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NoticeBoard; 