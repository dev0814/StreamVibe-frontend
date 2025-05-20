import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './VideoManagement.css';

const VideoManagement = () => {
  const [videos, setVideos] = useState([]);
  const [filteredVideos, setFilteredVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedVideos, setSelectedVideos] = useState([]);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState('');
  const [sortConfig, setSortConfig] = useState({
    key: 'uploadDate',
    direction: 'desc'
  });

  const videosPerPage = 8;
  
  // Fetch videos from API
  useEffect(() => {
    const fetchVideos = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        
        // Create URL with filters
        let params = new URLSearchParams();
        
        if (filter !== 'all') {
          params.append('status', filter);
        }
        
        if (searchTerm) {
          params.append('search', searchTerm);
        }
        
        // Sort parameters
        params.append('sort', sortConfig.key);
        params.append('order', sortConfig.direction);
        
        const queryString = params.toString();
        const url = `/api/videos${queryString ? `?${queryString}` : ''}`;
        
        console.log('Fetching videos from:', url);
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });
        
        // Check for JSON response
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.error('Server returned non-JSON response');
          throw new Error('Server returned non-JSON response');
        }
        
        if (response.ok) {
          const data = await response.json();
          console.log('Fetched videos:', data);
          
          if (data && data.data) {
            setVideos(data.data);
            setFilteredVideos(data.data);
          } else {
            console.error('Unexpected data format:', data);
            setVideos([]);
            setFilteredVideos([]);
          }
        } else {
          const errorData = await response.json();
          console.error('API error:', errorData);
          setVideos([]);
          setFilteredVideos([]);
        }
      } catch (error) {
        console.error('Error fetching videos:', error);
        setVideos([]);
        setFilteredVideos([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVideos();
  }, [filter, searchTerm, sortConfig]);

  // Get current videos for pagination
  const indexOfLastVideo = currentPage * videosPerPage;
  const indexOfFirstVideo = indexOfLastVideo - videosPerPage;
  const currentVideos = filteredVideos.slice(indexOfFirstVideo, indexOfLastVideo);
  const totalPages = Math.ceil(filteredVideos.length / videosPerPage);

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
    if (views >= 1000000) {
      return (views / 1000000).toFixed(1) + 'M';
    } else if (views >= 1000) {
      return (views / 1000).toFixed(1) + 'K';
    }
    return views;
  };

  // Handle sort
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Handle select all
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedVideos(currentVideos.map(video => video.id));
    } else {
      setSelectedVideos([]);
    }
  };

  // Handle select single video
  const handleSelectVideo = (videoId) => {
    if (selectedVideos.includes(videoId)) {
      setSelectedVideos(selectedVideos.filter(id => id !== videoId));
    } else {
      setSelectedVideos([...selectedVideos, videoId]);
    }
  };

  // Handle bulk action button click
  const handleBulkAction = (action) => {
    setActionType(action);
    setShowActionModal(true);
  };

  // Confirm and process bulk action
  const confirmBulkAction = async () => {
    console.log(`Performing ${actionType} action on videos:`, selectedVideos);
    
    try {
      const token = localStorage.getItem('token');
      
      // Prepare the action endpoint and data
      const endpoint = actionType === 'delete' 
        ? '/api/videos/bulk-delete'
        : '/api/videos/bulk-update';
      
      const requestData = {
        videoIds: selectedVideos,
        action: actionType
      };
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestData)
      });
      
      if (response.ok) {
        console.log(`Bulk ${actionType} action completed successfully`);
        
        // Refresh videos from the server instead of manipulating client-side
        const token = localStorage.getItem('token');
        let params = new URLSearchParams();
        
        if (filter !== 'all') {
          params.append('status', filter);
        }
        
        if (searchTerm) {
          params.append('search', searchTerm);
        }
        
        params.append('sort', sortConfig.key);
        params.append('order', sortConfig.direction);
        
        const queryString = params.toString();
        const url = `/api/videos${queryString ? `?${queryString}` : ''}`;
        
        const refreshResponse = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });
        
        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          if (data && data.data) {
            setVideos(data.data);
            setFilteredVideos(data.data);
          }
        }
      } else {
        const errorData = await response.json();
        console.error(`Failed to perform bulk ${actionType}:`, errorData);
        alert(`Error: ${errorData.message || `Failed to ${actionType} videos`}`);
      }
    } catch (error) {
      console.error(`Error during bulk ${actionType}:`, error);
      alert(`Error processing your request. Please try again.`);
    } finally {
      setSelectedVideos([]);
      setShowActionModal(false);
    }
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'published':
        return 'status-published';
      case 'pending':
        return 'status-pending';
      case 'unpublished':
        return 'status-unpublished';
      case 'reported':
        return 'status-reported';
      default:
        return '';
    }
  };

  if (isLoading) {
    return (
      <div className="video-management-container">
        <div className="loading">Loading videos...</div>
      </div>
    );
  }

  return (
    <div className="video-management-container">
      <header className="video-management-header">
        <h1>Video Management</h1>
        <div className="header-actions">
          <Link to="/admin/video-management/upload" className="action-button">
            <i className="fas fa-plus"></i> Add New Video
          </Link>
        </div>
      </header>
      
      <div className="filter-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search videos by title, description, or tags"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <i className="fas fa-search"></i>
        </div>
        
        <div className="filter-box">
          <label>Filter by Status:</label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Videos</option>
            <option value="published">Published</option>
            <option value="pending">Pending Review</option>
            <option value="unpublished">Unpublished</option>
            <option value="reported">Reported</option>
          </select>
        </div>
        
        <div className="sort-box">
          <label>Sort by:</label>
          <select 
            value={`${sortConfig.key}-${sortConfig.direction}`}
            onChange={(e) => {
              const [key, direction] = e.target.value.split('-');
              setSortConfig({ key, direction });
            }}
          >
            <option value="uploadDate-desc">Newest First</option>
            <option value="uploadDate-asc">Oldest First</option>
            <option value="views-desc">Most Views</option>
            <option value="views-asc">Least Views</option>
            <option value="title-asc">Title (A-Z)</option>
            <option value="title-desc">Title (Z-A)</option>
          </select>
        </div>
      </div>
      
      {selectedVideos.length > 0 && (
        <div className="bulk-actions">
          <span>{selectedVideos.length} videos selected</span>
          <div className="action-buttons">
            <button 
              className="action-btn publish-btn" 
              onClick={() => handleBulkAction('publish')}
            >
              <i className="fas fa-check-circle"></i> Publish
            </button>
            <button 
              className="action-btn unpublish-btn" 
              onClick={() => handleBulkAction('unpublish')}
            >
              <i className="fas fa-eye-slash"></i> Unpublish
            </button>
            <button 
              className="action-btn delete-btn" 
              onClick={() => handleBulkAction('delete')}
            >
              <i className="fas fa-trash-alt"></i> Delete
            </button>
          </div>
        </div>
      )}
      
      {currentVideos.length > 0 ? (
        <div className="video-grid">
          {currentVideos.map(video => (
            <div key={video.id} className="video-card">
              <div className="card-header">
                <label className="checkbox-container">
                  <input 
                    type="checkbox"
                    checked={selectedVideos.includes(video.id)}
                    onChange={() => handleSelectVideo(video.id)}
                  />
                  <span className="checkmark"></span>
                </label>
                <div className="video-status">
                  <span className={`status-badge ${getStatusBadgeClass(video.status)}`}>
                    {video.status}
                  </span>
                </div>
                <div className="video-actions">
                  <div className="action-dropdown">
                    <button className="action-dropdown-toggle">
                      <i className="fas fa-ellipsis-v"></i>
                    </button>
                    <div className="action-dropdown-menu">
                      <Link to={`/admin/video-management/edit/${video.id}`} className="dropdown-item">
                        <i className="fas fa-edit"></i> Edit
                      </Link>
                      <Link to={`/watch/${video.id}`} className="dropdown-item">
                        <i className="fas fa-play"></i> Watch
                      </Link>
                      {video.status === 'published' ? (
                        <button className="dropdown-item">
                          <i className="fas fa-eye-slash"></i> Unpublish
                        </button>
                      ) : (
                        <button className="dropdown-item">
                          <i className="fas fa-check-circle"></i> Publish
                        </button>
                      )}
                      {video.status === 'reported' && (
                        <button className="dropdown-item">
                          <i className="fas fa-flag"></i> View Reports
                        </button>
                      )}
                      <button className="dropdown-item text-danger">
                        <i className="fas fa-trash-alt"></i> Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="video-thumbnail">
                <img src={video.thumbnail} alt={video.title} />
                <span className="video-duration">{video.duration}</span>
              </div>
              <div className="video-details">
                <h3 className="video-title" title={video.title}>
                  <Link to={`/admin/video-management/edit/${video.id}`}>{video.title}</Link>
                </h3>
                <p className="video-author">By {video.author.name}</p>
                <div className="video-meta">
                  <span className="video-views">
                    <i className="fas fa-eye"></i> {formatViews(video.views)}
                  </span>
                  <span className="video-date">
                    <i className="fas fa-calendar-alt"></i> {formatDate(video.uploadDate)}
                  </span>
                </div>
                <div className="video-tags">
                  {video.tags.map((tag, index) => (
                    <span key={index} className="tag">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-results">
          <i className="fas fa-search"></i>
          <p>No videos found matching your criteria</p>
          <button onClick={() => {setSearchTerm(''); setFilter('all');}}>
            Clear Filters
          </button>
        </div>
      )}
      
      {/* Pagination controls */}
      {filteredVideos.length > videosPerPage && (
        <div className="pagination">
          <button 
            className="pagination-btn"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            <i className="fas fa-chevron-left"></i>
          </button>
          
          <div className="page-numbers">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(page => {
                if (totalPages <= 5) return true;
                if (page === 1 || page === totalPages) return true;
                return Math.abs(page - currentPage) <= 1;
              })
              .map((page, index, array) => {
                // Add ellipsis if there's a gap in the page numbers
                if (index > 0 && array[index - 1] !== page - 1) {
                  return (
                    <React.Fragment key={`ellipsis-${page}`}>
                      <span className="ellipsis">...</span>
                      <button 
                        className={`page-number ${currentPage === page ? 'active' : ''}`}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  );
                }
                
                return (
                  <button 
                    key={page} 
                    className={`page-number ${currentPage === page ? 'active' : ''}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                );
              })}
          </div>
          
          <button 
            className="pagination-btn"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      )}
      
      {/* Action confirmation modal */}
      {showActionModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>Confirm {actionType}</h3>
              <button 
                className="close-modal-btn"
                onClick={() => setShowActionModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-content">
              <p>
                Are you sure you want to {actionType}{' '}
                {selectedVideos.length === 1 ? 'this video' : `these ${selectedVideos.length} videos`}?
                {actionType === 'delete' && ' This action cannot be undone.'}
              </p>
              <div className="selected-videos-preview">
                {selectedVideos.slice(0, 3).map(videoId => {
                  const video = videos.find(v => v.id === videoId);
                  if (!video) return null;
                  return (
                    <div key={videoId} className="preview-video">
                      <div className="preview-thumbnail">
                        <img src={video.thumbnail} alt={video.title} />
                      </div>
                      <span>{video.title.length > 25 ? video.title.substring(0, 25) + '...' : video.title}</span>
                    </div>
                  );
                })}
                {selectedVideos.length > 3 && (
                  <div className="preview-more">
                    +{selectedVideos.length - 3} more
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="cancel-btn"
                onClick={() => setShowActionModal(false)}
              >
                Cancel
              </button>
              <button 
                className={`confirm-btn ${actionType === 'delete' ? 'delete-btn' : ''}`}
                onClick={confirmBulkAction}
              >
                Yes, {actionType}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoManagement; 