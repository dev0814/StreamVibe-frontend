import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import './Dashboard.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentVideos, setRecentVideos] = useState([]);
  const [popularVideos, setPopularVideos] = useState([]);
  const [recentComments, setRecentComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch teacher stats
        const statsResponse = await axios.get(`${API_URL}/teachers/stats`);
        setStats(statsResponse.data.data);
        
        // Fetch recently uploaded videos
        const recentVideosResponse = await axios.get(`${API_URL}/videos/teacher/recent?limit=3`);
        setRecentVideos(recentVideosResponse.data.data);
        
        // Fetch popular videos
        const popularVideosResponse = await axios.get(`${API_URL}/videos/teacher/popular?limit=3`);
        setPopularVideos(popularVideosResponse.data.data);
        
        // Fetch recent comments
        const commentsResponse = await axios.get(`${API_URL}/comments/teacher/recent?limit=3`);
        setRecentComments(commentsResponse.data.data);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Format number with comma separators
  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  if (loading) {
    return <div className="loading">Loading dashboard data...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="teacher-dashboard">
      {/* Welcome Section */}
      <section className="welcome-section">
        <h2>Welcome back, {currentUser?.name || 'Teacher'}</h2>
        <p>Here's an overview of your teaching stats and activity</p>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stat-card">
          <div className="stat-value">{stats.totalVideos}</div>
          <div className="stat-label">Total Videos</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{formatNumber(stats.totalViews)}</div>
          <div className="stat-label">Total Views</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{formatNumber(stats.totalStudents)}</div>
          <div className="stat-label">Students</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.averageRating} <span className="rating-star">★</span></div>
          <div className="stat-label">Avg. Rating</div>
        </div>
      </section>

      {/* Recent Videos Section */}
      <section className="recent-videos-section">
        <div className="section-header">
          <h2>Recently Uploaded</h2>
          <Link to="/teacher/videos" className="view-all">View All Videos</Link>
        </div>
        <div className="video-grid">
          {recentVideos.length > 0 ? (
            recentVideos.map(video => (
              <div className="video-card" key={video._id}>
                <div className="video-thumbnail">
                  <img src={video.thumbnailUrl || 'https://via.placeholder.com/300x180?text=No+Thumbnail'} alt={video.title} />
                  <span className="duration">{formatDuration(video.duration)}</span>
                  {video.status === 'processing' && (
                    <div className="video-status processing">Processing</div>
                  )}
                </div>
                <div className="video-details">
                  <h3>{video.title}</h3>
                  <div className="video-meta">
                    <span>Uploaded: {formatDate(video.createdAt)}</span>
                    <span>{video.views} views</span>
                  </div>
                  <div className="video-actions">
                    <Link to={`/teacher/videos/edit/${video._id}`} className="edit-btn">Edit</Link>
                    <Link to={`/student/watch/${video._id}`} className="view-btn">Preview</Link>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <p>You haven't uploaded any videos yet.</p>
            </div>
          )}
          <div className="upload-card">
            <Link to="/teacher/upload" className="upload-link">
              <div className="upload-icon">+</div>
              <span>Upload New Video</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Popular Videos Section */}
      <section className="popular-videos-section">
        <div className="section-header">
          <h2>Most Popular Videos</h2>
          <Link to="/teacher/analytics" className="view-all">View Analytics</Link>
        </div>
        <div className="video-grid">
          {popularVideos.length > 0 ? (
            popularVideos.map(video => (
              <div className="video-card" key={video._id}>
                <div className="video-thumbnail">
                  <img src={video.thumbnailUrl || 'https://via.placeholder.com/300x180?text=No+Thumbnail'} alt={video.title} />
                  <span className="duration">{formatDuration(video.duration)}</span>
                </div>
                <div className="video-details">
                  <h3>{video.title}</h3>
                  <div className="video-meta">
                    <span>{formatNumber(video.views)} views</span>
                    <span className="rating">{video.rating} <span className="rating-star">★</span></span>
                  </div>
                  <div className="video-actions">
                    <Link to={`/teacher/analytics/video/${video._id}`} className="analytics-btn">View Stats</Link>
                    <Link to={`/student/watch/${video._id}`} className="view-btn">Watch</Link>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <p>No popular videos available yet.</p>
            </div>
          )}
        </div>
      </section>

      {/* Recent Comments Section */}
      <section className="recent-comments-section">
        <div className="section-header">
          <h2>Recent Comments</h2>
          <Link to="/teacher/comments" className="view-all">View All</Link>
        </div>
        <div className="comments-list">
          {recentComments.length > 0 ? (
            recentComments.map(comment => (
              <div className="comment-card" key={comment._id}>
                <div className="comment-content">
                  <p>"{comment.content}"</p>
                </div>
                <div className="comment-meta">
                  <div>
                    <span className="comment-user">{comment.user.name}</span>
                    <span className="comment-date">on {formatDate(comment.createdAt)}</span>
                  </div>
                  <Link to={`/student/watch/${comment.video._id}`} className="comment-video-link">
                    {comment.video.title}
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <p>No comments on your videos yet.</p>
            </div>
          )}
        </div>
      </section>
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

export default Dashboard; 