import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './ManageVideos.css';

const ManageVideos = () => {
  const location = useLocation();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'published', 'processing', 'draft'
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'most-viewed', 'alphabetical'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVideos, setSelectedVideos] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Check if there's a success message in navigation state
  useEffect(() => {
    if (location.state?.successMessage) {
      setSuccessMessage(location.state.successMessage);
      // Clear the message from navigation state
      window.history.replaceState({}, document.title);
      
      // Auto-hide the message after 5 seconds
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [location]);

  // Fetch videos from API
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoading(true);
        setError(null); // Clear previous errors
        
        console.log('Fetching videos for teacher...');
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('No authentication token found. Please login again.');
        }
        
        // Add authorization header to ensure the request is authenticated
        const response = await fetch('/api/videos', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Error response:', errorData);
          throw new Error(errorData.error || `Failed to fetch videos (${response.status})`);
        }
        
        const data = await response.json();
        console.log('Fetched videos:', data);
        
        if (data && data.data) {
          setVideos(data.data);
          // If totalPages is not provided, calculate based on total videos
          setTotalPages(data.totalPages || 1);
        } else {
          console.log('No videos found or unexpected data format');
          setVideos([]);
          setTotalPages(1);
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching videos:', err);
        setError(err.message || 'Failed to fetch videos');
        setVideos([]);
        setLoading(false);
      }
    };
    
    fetchVideos();
  }, [currentPage]);

  // Filter videos based on status and search query
  const filteredVideos = () => {
    let filtered = [...videos];
    
    // Apply status filter
    if (filter !== 'all') {
      filtered = filtered.filter(video => video.status === filter);
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(video => 
        video.title.toLowerCase().includes(query) || 
        video.description.toLowerCase().includes(query) ||
        (video.category && video.category.toLowerCase().includes(query))
      );
    }
    
    // Apply sorting
    switch(sortBy) {
      case 'oldest':
        return filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      case 'most-viewed':
        return filtered.sort((a, b) => (b.views || 0) - (a.views || 0));
      case 'alphabetical':
        return filtered.sort((a, b) => a.title.localeCompare(b.title));
      case 'newest':
      default:
        return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
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

  // Format views
  const formatViews = (views) => {
    if (!views) return '0';
    if (views >= 1000000) {
      return (views / 1000000).toFixed(1) + 'M';
    } else if (views >= 1000) {
      return (views / 1000).toFixed(1) + 'K';
    }
    return views;
  };

  // Handle video selection
  const handleVideoSelect = (videoId) => {
    if (selectedVideos.includes(videoId)) {
      setSelectedVideos(selectedVideos.filter(id => id !== videoId));
    } else {
      setSelectedVideos([...selectedVideos, videoId]);
    }
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedVideos([]);
    } else {
      setSelectedVideos(filteredVideos().map(video => video._id));
    }
    setSelectAll(!selectAll);
  };

  // Watch for changes in selected videos
  useEffect(() => {
    setShowBulkActions(selectedVideos.length > 0);
    
    // Check if all videos are selected
    const filteredVideoIds = filteredVideos().map(video => video._id);
    setSelectAll(
      filteredVideoIds.length > 0 && 
      filteredVideoIds.every(id => selectedVideos.includes(id))
    );
  }, [selectedVideos, videos, filter, searchQuery]);

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${selectedVideos.length} selected videos?`)) {
      try {
        const response = await fetch('/api/videos/bulk', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ videoIds: selectedVideos })
        });
        
        if (!response.ok) {
          throw new Error('Failed to delete videos');
        }
        
        // Remove deleted videos from state
        setVideos(videos.filter(video => !selectedVideos.includes(video._id)));
        setSelectedVideos([]);
        setSuccessMessage(`${selectedVideos.length} videos deleted successfully!`);
      } catch (err) {
        console.error('Error deleting videos:', err);
        setError('Failed to delete videos. Please try again.');
      }
    }
  };

  // Handle delete single video
  const handleDeleteVideo = async (videoId) => {
    if (window.confirm('Are you sure you want to delete this video?')) {
      try {
        const response = await fetch(`/api/videos/${videoId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to delete video');
        }
        
        // Remove deleted video from state
        setVideos(videos.filter(video => video._id !== videoId));
        setSuccessMessage('Video deleted successfully!');
      } catch (err) {
        console.error('Error deleting video:', err);
        setError('Failed to delete video. Please try again.');
      }
    }
  };

  const goToPage = (page) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (loading && videos.length === 0) {
    return <div className="loading">Loading your videos...</div>;
  }

  return (
    <div className="manage-videos-container">
      {successMessage && (
        <div className="success-message">
          {successMessage}
          <button onClick={() => setSuccessMessage('')}>×</button>
        </div>
      )}
      
      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}
      
      <div className="page-header">
        <h1>Manage Videos</h1>
        <Link to="/teacher/upload" className="upload-btn">Upload New Video</Link>
      </div>
      
      <div className="videos-controls">
        <div className="search-filter-section">
          <div className="search-box">
            <input 
              type="text" 
              placeholder="Search videos..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="filter-sort-controls">
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              aria-label="Filter videos"
            >
              <option value="all">All Videos</option>
              <option value="published">Published</option>
              <option value="processing">Processing</option>
              <option value="draft">Draft</option>
            </select>
            
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort videos"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="most-viewed">Most Viewed</option>
              <option value="alphabetical">Alphabetical</option>
            </select>
          </div>
        </div>
      </div>
      
      {showBulkActions && (
        <div className="bulk-actions">
          <span>{selectedVideos.length} videos selected</span>
          <div className="bulk-buttons">
            <button 
              className="bulk-delete-btn"
              onClick={handleBulkDelete}
            >
              Delete Selected
            </button>
          </div>
        </div>
      )}
      
      {loading ? (
        <div className="loading-indicator">Loading videos...</div>
      ) : filteredVideos().length === 0 ? (
        <div className="no-videos-message">
          {searchQuery || filter !== 'all' ? (
            <>
              <h3>No videos match your filters</h3>
              <p>Try adjusting your search terms or filters</p>
              <button 
                className="reset-filters-btn"
                onClick={() => {
                  setSearchQuery('');
                  setFilter('all');
                }}
              >
                Reset Filters
              </button>
            </>
          ) : (
            <>
              <h3>You haven't uploaded any videos yet</h3>
              <p>Get started by uploading your first video</p>
              <Link to="/teacher/upload" className="upload-first-btn">
                Upload Your First Video
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className="videos-table">
          <div className="table-header">
            <div className="checkbox-cell">
              <input 
                type="checkbox" 
                checked={selectAll}
                onChange={handleSelectAll}
                aria-label="Select all videos"
              />
            </div>
            <div className="thumbnail-cell">Video</div>
            <div className="details-cell">Details</div>
            <div className="stats-cell">Stats</div>
            <div className="actions-cell">Actions</div>
          </div>
          
          <div className="table-body">
            {filteredVideos().map(video => (
              <div key={video._id} className="table-row">
                <div className="checkbox-cell">
                  <input 
                    type="checkbox" 
                    checked={selectedVideos.includes(video._id)}
                    onChange={() => handleVideoSelect(video._id)}
                    aria-label={`Select ${video.title}`}
                  />
                </div>
                
                <div className="thumbnail-cell">
                  <div className="video-thumbnail">
                    <img 
                      src={video.thumbnailUrl || 'https://via.placeholder.com/320x180?text=No+Thumbnail'} 
                      alt={`${video.title} thumbnail`} 
                    />
                    <span className="duration">{video.duration ? `${Math.floor(video.duration / 60)}:${(video.duration % 60).toString().padStart(2, '0')}` : '00:00'}</span>
                  </div>
                </div>
                
                <div className="details-cell">
                  <h3 className="video-title">
                    <Link to={`/teacher/videos/${video._id}`}>{video.title}</Link>
                  </h3>
                  <p className="video-description">{video.description.substring(0, 100)}{video.description.length > 100 ? '...' : ''}</p>
                  <div className="video-meta">
                    <span className="upload-date">Uploaded on {formatDate(video.createdAt)}</span>
                    <span className="category">{video.subject}</span>
                  </div>
                </div>
                
                <div className="stats-cell">
                  <div className="stat-item">
                    <span className="stat-label">Views</span>
                    <span className="stat-value">{formatViews(video.views)}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Likes</span>
                    <span className="stat-value">{formatViews(video.likes ? video.likes.length : 0)}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Comments</span>
                    <span className="stat-value">{formatViews(video.comments ? video.comments.length : 0)}</span>
                  </div>
                </div>
                
                <div className="actions-cell">
                  <div className="action-buttons">
                    <Link to={`/teacher/videos/${video._id}/edit`} className="edit-btn" aria-label={`Edit ${video.title}`}>
                      Edit
                    </Link>
                    <button 
                      className="delete-btn" 
                      onClick={() => handleDeleteVideo(video._id)}
                      aria-label={`Delete ${video.title}`}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {totalPages > 1 && (
        <div className="pagination">
          <button 
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="prev-page"
          >
            Previous
          </button>
          
          <span className="page-info">
            Page {currentPage} of {totalPages}
          </span>
          
          <button 
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="next-page"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ManageVideos; 