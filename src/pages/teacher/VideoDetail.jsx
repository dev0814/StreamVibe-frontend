import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import './VideoDetail.css';

const VideoDetail = () => {
  const { id } = useParams();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/videos/${id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch video');
        }
        
        const data = await response.json();
        setVideo(data.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching video:', err);
        setError(err.message);
        setLoading(false);
      }
    };
    
    fetchVideo();
  }, [id]);

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return <div className="loading">Loading video...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error}</p>
        <Link to="/teacher/videos" className="back-btn">Back to Videos</Link>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="not-found-container">
        <h2>Video Not Found</h2>
        <p>The video you're looking for doesn't exist or has been removed.</p>
        <Link to="/teacher/videos" className="back-btn">Back to Videos</Link>
      </div>
    );
  }

  return (
    <div className="video-detail-container">
      <div className="video-nav">
        <Link to="/teacher/videos" className="back-btn">
          &larr; Back to Videos
        </Link>
        <div className="video-actions">
          <Link to={`/teacher/videos/${id}/edit`} className="edit-btn">
            Edit Video
          </Link>
          <Link to={`/teacher/videos/${id}/analytics`} className="analytics-btn">
            View Analytics
          </Link>
        </div>
      </div>
      
      <div className="video-player-container">
        <div className="video-player">
          <video 
            controls 
            poster={video.thumbnailUrl}
            src={video.videoUrl}
            className="main-video-player"
          >
            Your browser does not support the video tag.
          </video>
        </div>
      </div>
      
      <div className="video-info">
        <h1 className="video-title">{video.title}</h1>
        <div className="video-meta">
          <span className="video-date">Uploaded on {formatDate(video.createdAt)}</span>
          <span className="video-views">{video.views || 0} views</span>
          <span className="video-likes">{video.likes ? video.likes.length : 0} likes</span>
        </div>
        
        <div className="video-tags">
          {video.category && <span className="tag category-tag">{video.category}</span>}
          {video.branch && <span className="tag branch-tag">{video.branch}</span>}
          {video.year && <span className="tag year-tag">Year {video.year}</span>}
          {video.tags && video.tags.map((tag, index) => (
            <span key={index} className="tag">{tag}</span>
          ))}
        </div>
        
        <div className="video-description">
          <h3>Description</h3>
          <p>{video.description}</p>
        </div>
        
        <div className="video-statistics">
          <h3>Statistics</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-value">{video.views || 0}</span>
              <span className="stat-label">Views</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{video.likes ? video.likes.length : 0}</span>
              <span className="stat-label">Likes</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{video.comments ? video.comments.length : 0}</span>
              <span className="stat-label">Comments</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{video.duration ? `${Math.floor(video.duration / 60)}:${(video.duration % 60).toString().padStart(2, '0')}` : '00:00'}</span>
              <span className="stat-label">Duration</span>
            </div>
          </div>
        </div>
        
        <div className="video-comments">
          <h3>Comments ({video.comments ? video.comments.length : 0})</h3>
          {video.comments && video.comments.length > 0 ? (
            <div className="comments-list">
              {video.comments.map((comment) => (
                <div key={comment._id} className="comment">
                  <div className="comment-header">
                    <span className="comment-author">{comment.user.name}</span>
                    <span className="comment-date">{formatDate(comment.createdAt)}</span>
                  </div>
                  <div className="comment-body">
                    <p>{comment.text}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-comments">No comments yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoDetail; 