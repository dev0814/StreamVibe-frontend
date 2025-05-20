import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import './Dashboard.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [recentVideos, setRecentVideos] = useState([]);
  const [recommendedVideos, setRecommendedVideos] = useState([]);
  const [notices, setNotices] = useState([]);
  const [stats, setStats] = useState({
    videosWatched: 0,
    hoursWatched: 0,
    notesCreated: 0,
    playlists: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      
      // Fetch recently watched videos
      try {
        console.log('Fetching recently watched videos...');
        const historyResponse = await axios.get(`${API_URL}/videos/history?limit=3`);
        console.log('History response:', historyResponse.data);
        setRecentVideos(historyResponse.data.data || []);
      } catch (err) {
        console.error('Error fetching history:', err.response?.data || err.message);
        // Don't set error here to allow other sections to load
      }
      
      // Fetch recommended videos (based on branch and year)
      try {
        console.log('Fetching recommended videos with params:', {
          branch: currentUser.branch,
          year: currentUser.year
        });
        
        const recommendedResponse = await axios.get(`${API_URL}/videos`, {
          params: {
            limit: 3,
            sort: 'createdAt',
            order: 'desc',
            branch: currentUser.branch,
            year: currentUser.year
          }
        });
        
        console.log('Recommended videos response:', recommendedResponse.data);
        setRecommendedVideos(recommendedResponse.data.data || []);
      } catch (err) {
        console.error('Error fetching recommended videos:', err.response?.data || err.message);
        // Don't set error here to allow other sections to load
      }
      
      // Fetch recent notices
      try {
        console.log('Fetching recent notices...');
        const noticesResponse = await axios.get(`${API_URL}/notices?limit=2&sort=createdAt&order=desc`);
        console.log('Notices response:', noticesResponse.data);
        setNotices(noticesResponse.data.data || []);
      } catch (err) {
        console.error('Error fetching notices:', err.response?.data || err.message);
        // Don't set error here to allow other sections to load
      }
      
      // Fetch user stats
      try {
        console.log('Fetching user stats...');
        const statsResponse = await axios.get(`${API_URL}/users/stats`);
        console.log('Stats response:', statsResponse.data);
        setStats(statsResponse.data.data || {
          videosWatched: 0,
          hoursWatched: 0,
          notesCreated: 0,
          playlists: 0
        });
      } catch (err) {
        console.error('Error fetching user stats:', err.response?.data || err.message);
        // Don't set error here to allow other sections to load
      }
      
      setLoading(false);
    };
    
    fetchDashboardData();
  }, [currentUser.branch, currentUser.year]);

  // Format date string
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }
  };

  // Format duration from seconds to MM:SS
  const formatDuration = (seconds) => {
    if (!seconds) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="student-dashboard">
      {error && <div className="error-message">{error}</div>}
      
      {/* Welcome Section */}
      <section className="welcome-section">
        <h2>Welcome back, {currentUser?.name || 'Student'}</h2>
        <p>Continue your learning journey</p>
      </section>

      {/* Overview Stats */}
      <section className="stats-section">
        <div className="stat-card">
          <h3>{stats.videosWatched}</h3>
          <p>Videos Watched</p>
        </div>
        <div className="stat-card">
          <h3>{stats.hoursWatched}</h3>
          <p>Hours Watched</p>
        </div>
        <div className="stat-card">
          <h3>{stats.notesCreated}</h3>
          <p>Notes Created</p>
        </div>
        <div className="stat-card">
          <h3>{stats.playlists}</h3>
          <p>Playlists</p>
        </div>
      </section>

      {/* Recent Videos */}
      <section className="recent-videos-section">
        <div className="section-header">
          <h2>Continue Watching</h2>
          <Link to="/student/history" className="view-all">View all</Link>
        </div>

        {loading ? (
          <div className="loading-spinner">Loading...</div>
        ) : recentVideos.length > 0 ? (
          <div className="video-grid">
            {recentVideos.map(video => (
              <div className="video-card" key={video._id}>
                <Link to={`/student/watch/${video._id}`}>
                  <div className="thumbnail">
                    <img src={video.thumbnailUrl || 'https://via.placeholder.com/300x180?text=No+Thumbnail'} alt={video.title} />
                    <span className="duration">{formatDuration(video.duration)}</span>
                  </div>
                  <div className="video-info">
                    <h3>{video.title}</h3>
                    <p>{video.teacher.name}</p>
                    <span className="views">{video.views} views</span>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>You haven't watched any videos yet. Start exploring!</p>
            <Link to="/student/search" className="explore-btn">Explore Videos</Link>
          </div>
        )}
      </section>

      {/* Recommended Videos */}
      <section className="recommended-videos-section">
        <div className="section-header">
          <h2>Recommended for You</h2>
          <Link to="/student/search" className="view-all">Browse all</Link>
        </div>

        {loading ? (
          <div className="loading-spinner">Loading...</div>
        ) : recommendedVideos.length > 0 ? (
          <div className="video-grid">
            {recommendedVideos.map(video => (
              <div className="video-card" key={video._id}>
                <Link to={`/student/watch/${video._id}`}>
                  <div className="thumbnail">
                    <img src={video.thumbnailUrl || 'https://via.placeholder.com/300x180?text=No+Thumbnail'} alt={video.title} />
                    <span className="duration">{formatDuration(video.duration)}</span>
                  </div>
                  <div className="video-info">
                    <h3>{video.title}</h3>
                    <p>{video.teacher.name}</p>
                    <span className="views">{video.views} views</span>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No recommended videos available yet.</p>
          </div>
        )}
      </section>

      {/* Recent Notices */}
      <section className="notices-section">
        <div className="section-header">
          <h2>Recent Notices</h2>
          <Link to="/student/notices" className="view-all">View all</Link>
        </div>

        {loading ? (
          <div className="loading-spinner">Loading...</div>
        ) : notices.length > 0 ? (
          <div className="notices-list">
            {notices.map(notice => (
              <div className="notice-card" key={notice._id}>
                <div className="notice-header">
                  <h3>{notice.title}</h3>
                  <span className="date">{formatDate(notice.createdAt)}</span>
                </div>
                <p>{notice.content}</p>
                {notice.attachmentUrl && (
                  <a href={notice.attachmentUrl} target="_blank" rel="noopener noreferrer" className="attachment-link">
                    View Attachment
                  </a>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No notices available.</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default Dashboard; 