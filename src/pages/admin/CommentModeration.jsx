import React, { useState, useEffect } from 'react';
import './CommentModeration.css';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';

const CommentModeration = () => {
  const [comments, setComments] = useState([]);
  const [filteredComments, setFilteredComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedComments, setSelectedComments] = useState([]);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [currentReports, setCurrentReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [reportFilter, setReportFilter] = useState('all'); // 'all', 'reported', 'not-reported'
  const [sortConfig, setSortConfig] = useState({
    key: 'createdAt',
    direction: 'desc'
  });

  const commentsPerPage = 10;
  
  // Fetch all comments only once or when sort changes
  useEffect(() => {
    const fetchComments = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        let params = new URLSearchParams();
        params.append('sort', sortConfig.key);
        params.append('order', sortConfig.direction);
        const queryString = params.toString();
        const url = `${API_URL}/comments${queryString ? `?${queryString}` : ''}`;
        const response = await axios.get(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });
        
        if (!response.data.success) {
          throw new Error(response.data.error || 'Failed to fetch comments');
        }
        
        // Get comments
        const commentsData = response.data.data || [];
        
        // Fetch report counts for each comment
        const commentsWithReports = await Promise.all(commentsData.map(async (comment) => {
          try {
            const reportResponse = await axios.get(`${API_URL}/reports/count/${comment._id}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
              }
            });
            
            return {
              ...comment,
              reportCount: reportResponse.data.count || 0
            };
          } catch (err) {
            console.error(`Error fetching report count for comment ${comment._id}:`, err);
            return { ...comment, reportCount: 0 };
          }
        }));
        
        setComments(commentsWithReports);
      } catch (error) {
        setError(error.message);
        setComments([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchComments();
  }, [sortConfig]);

  // Filter comments on the frontend
  useEffect(() => {
    let filtered = comments;
    
    // Apply search filter
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(comment =>
        (comment.content && comment.content.toLowerCase().includes(term)) ||
        (comment.user && comment.user.name && comment.user.name.toLowerCase().includes(term)) ||
        (comment.video && comment.video.title && comment.video.title.toLowerCase().includes(term))
      );
    }
    
    // Apply report filter
    if (reportFilter === 'reported') {
      filtered = filtered.filter(comment => comment.reportCount > 0);
    } else if (reportFilter === 'not-reported') {
      filtered = filtered.filter(comment => comment.reportCount === 0);
    }
    
    setFilteredComments(filtered);
    setCurrentPage(1); // Reset to first page on search or filter
  }, [searchTerm, comments, reportFilter]);

  // Get current comments for pagination
  const indexOfLastComment = currentPage * commentsPerPage;
  const indexOfFirstComment = indexOfLastComment - commentsPerPage;
  const currentComments = filteredComments.slice(indexOfFirstComment, indexOfLastComment);
  const totalPages = Math.ceil(filteredComments.length / commentsPerPage);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
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
      setSelectedComments(currentComments.map(comment => comment._id));
    } else {
      setSelectedComments([]);
    }
  };

  // Handle select single comment
  const handleSelectComment = (commentId) => {
    if (selectedComments.includes(commentId)) {
      setSelectedComments(selectedComments.filter(id => id !== commentId));
    } else {
      setSelectedComments([...selectedComments, commentId]);
    }
  };

  // Handle bulk delete
  const handleBulkDelete = () => {
    setShowActionModal(true);
  };

  // Confirm and process bulk delete
  const confirmBulkDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.post(`${API_URL}/comments/bulk-action`, {
        commentIds: selectedComments
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to delete comments');
      }
      
      // Refresh comments after successful deletion
      const refreshResponse = await axios.get(`${API_URL}/comments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      if (refreshResponse.data.success) {
        const commentsData = refreshResponse.data.data || [];
        
        // Fetch report counts for each comment
        const commentsWithReports = await Promise.all(commentsData.map(async (comment) => {
          try {
            const reportResponse = await axios.get(`${API_URL}/reports/count/${comment._id}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
              }
            });
            
            return {
              ...comment,
              reportCount: reportResponse.data.count || 0
            };
          } catch (err) {
            console.error(`Error fetching report count for comment ${comment._id}:`, err);
            return { ...comment, reportCount: 0 };
          }
        }));
        
        setComments(commentsWithReports);
        setFilteredComments(commentsWithReports);
      }
      
    setSelectedComments([]);
    setShowActionModal(false);
    } catch (error) {
      console.error('Error deleting comments:', error);
      alert(error.message || 'Error deleting comments');
    }
  };

  // View reports for a comment
  const viewReports = async (commentId) => {
    setLoadingReports(true);
    setCurrentReports([]);
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${API_URL}/reports/comment/${commentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      if (response.data.success) {
        setCurrentReports(response.data.data || []);
        setShowReportModal(true);
      } else {
        throw new Error(response.data.error || 'Failed to fetch reports');
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      alert(error.message || 'Error fetching reports');
    } finally {
      setLoadingReports(false);
    }
  };
  
  // Update report status
  const updateReportStatus = async (reportId, status) => {
    try {
      const token = localStorage.getItem('token');
      
      await axios.put(`${API_URL}/reports/${reportId}`, {
        status
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Update local state
      setCurrentReports(currentReports.map(report => 
        report._id === reportId ? { ...report, status } : report
      ));
    } catch (error) {
      console.error('Error updating report status:', error);
      alert(error.message || 'Error updating report status');
    }
  };

  // Truncate content
  const truncateContent = (content, maxLength = 100) => {
    if (!content) return '';
    if (content.length <= maxLength) return content;
    return content.slice(0, maxLength) + '...';
  };

  // Get reason display text
  const getReasonText = (reason) => {
    switch (reason) {
      case 'spam': return 'Spam';
      case 'harassment': return 'Harassment / Hate speech';
      case 'off-topic': return 'Off-topic';
      case 'inappropriate': return 'Inappropriate content';
      case 'other': return 'Other';
      default: return reason;
    }
  };

  if (isLoading) {
    return (
      <div className="comment-moderation-container">
        <div className="loading">Loading comments...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="comment-moderation-container">
        <div className="error">
          <i className="fas fa-exclamation-circle"></i>
          <p>Error: {error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="comment-moderation-container">
      <header className="comment-moderation-header">
        <h1>Comment Management</h1>
      </header>
      
      <div className="filter-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search comments by content, user or video"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <i className="fas fa-search"></i>
        </div>
        
        <div className="filter-box">
          <label>Filter by reports:</label>
          <select 
            value={reportFilter}
            onChange={(e) => setReportFilter(e.target.value)}
          >
            <option value="all">All Comments</option>
            <option value="reported">Reported Comments</option>
            <option value="not-reported">Non-Reported Comments</option>
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
            <option value="createdAt-desc">Newest First</option>
            <option value="createdAt-asc">Oldest First</option>
            <option value="reportCount-desc">Most Reported</option>
            <option value="reportCount-asc">Least Reported</option>
          </select>
        </div>
      </div>
      
      {selectedComments.length > 0 && (
        <div className="bulk-actions">
          <span>{selectedComments.length} comments selected</span>
          <div className="action-buttons">
            <button 
              className="action-btn delete-btn" 
              onClick={handleBulkDelete}
            >
              <i className="fas fa-trash-alt"></i> Delete
            </button>
          </div>
        </div>
      )}
      
      <div className="comments-table-container">
        <table className="comments-table">
          <thead>
            <tr>
              <th className="checkbox-column">
                <label className="checkbox-container">
                  <input 
                    type="checkbox" 
                    onChange={handleSelectAll}
                    checked={selectedComments.length === currentComments.length && currentComments.length > 0}
                  />
                  <span className="checkmark"></span>
                </label>
              </th>
              <th className="user-column">User</th>
              <th className="comment-column">Comment</th>
              <th onClick={() => handleSort('video')} className="video-column sortable-column">
                Video
                {sortConfig.key === 'video' && (
                  <i className={`fas fa-sort-${sortConfig.direction === 'asc' ? 'up' : 'down'}`}></i>
                )}
              </th>
              <th onClick={() => handleSort('reportCount')} className="reports-column sortable-column">
                Reports
                {sortConfig.key === 'reportCount' && (
                  <i className={`fas fa-sort-${sortConfig.direction === 'asc' ? 'up' : 'down'}`}></i>
                )}
              </th>
              <th onClick={() => handleSort('createdAt')} className="date-column sortable-column">
                Date
                {sortConfig.key === 'createdAt' && (
                  <i className={`fas fa-sort-${sortConfig.direction === 'asc' ? 'up' : 'down'}`}></i>
                )}
              </th>
              <th className="actions-column">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentComments.length > 0 ? (
              currentComments.map(comment => (
                <tr key={comment._id} className={comment.reportCount > 0 ? 'reported-comment' : ''}>
                  <td className="checkbox-column">
                    <label className="checkbox-container">
                      <input 
                        type="checkbox"
                        checked={selectedComments.includes(comment._id)}
                        onChange={() => handleSelectComment(comment._id)}
                      />
                      <span className="checkmark"></span>
                    </label>
                  </td>
                  <td className="user-column">
                    <div className="user-cell">
                      <div className="user-avatar">
                        {comment.user.profileImage ? (
                          <img src={comment.user.profileImage} alt={comment.user.name} />
                        ) : (
                          <div className="avatar-placeholder">
                            {comment.user.name?.substring(0, 2).toUpperCase() || 'UN'}
                          </div>
                        )}
                      </div>
                      <div className="user-info">
                        <div className="user-name">{comment.user.name}</div>
                        <div className="user-role">{comment.user.role}</div>
                      </div>
                    </div>
                  </td>
                  <td className="comment-column">
                    <div className="comment-content">
                      {truncateContent(comment.content)}
                      <button className="view-full-btn" data-content={comment.content}>View full comment</button>
                    </div>
                  </td>
                  <td className="video-column">
                    <a href={`/watch/${comment.video._id}`} className="video-link" target="_blank" rel="noopener noreferrer">
                      {comment.video.title}
                    </a>
                  </td>
                  <td className="reports-column">
                    {comment.reportCount > 0 ? (
                      <div 
                        className="report-badge"
                        onClick={() => viewReports(comment._id)}
                        title="Click to view reports"
                      >
                        {comment.reportCount}
                      </div>
                    ) : (
                      <span className="no-reports">0</span>
                    )}
                  </td>
                  <td className="date-column">{formatDate(comment.createdAt)}</td>
                  <td className="actions-column">
                    <div className="action-buttons comment-actions">
                      {comment.reportCount > 0 && (
                        <button 
                          className="action-icon report-icon" 
                          title="View reports"
                          onClick={() => viewReports(comment._id)}
                        >
                          🚩
                        </button>
                      )}
                      <button 
                        className="action-icon delete-icon" 
                        title="Delete comment"
                        onClick={() => {
                          setSelectedComments([comment._id]);
                          handleBulkDelete();
                        }}
                      >
                        ×
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="no-results">
                  No comments found matching your criteria
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination controls */}
      {filteredComments.length > commentsPerPage && (
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
      
      {/* Delete confirmation modal */}
      {showActionModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>Confirm Delete</h3>
              <button 
                className="close-modal-btn"
                onClick={() => setShowActionModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-content">
              <p>
                Are you sure you want to delete {selectedComments.length === 1 ? 'this comment' : `these ${selectedComments.length} comments`}?
                This action cannot be undone.
              </p>
              <div className="selected-comments-preview">
                {selectedComments.slice(0, 3).map(commentId => {
                  const comment = comments.find(c => c._id === commentId);
                  if (!comment) return null;
                  return (
                    <div key={commentId} className="preview-comment">
                      <div className="preview-user">{comment.user.name}</div>
                      <div className="preview-content">{truncateContent(comment.content, 50)}</div>
                    </div>
                  );
                })}
                {selectedComments.length > 3 && (
                  <div className="preview-more">
                    +{selectedComments.length - 3} more
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
                className="confirm-btn delete-btn"
                onClick={confirmBulkDelete}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reports modal */}
      {showReportModal && (
        <div className="modal-overlay">
          <div className="modal-container report-modal">
            <div className="modal-header">
              <h3>Comment Reports</h3>
              <button 
                className="close-modal-btn"
                onClick={() => setShowReportModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-content">
              {loadingReports ? (
                <div className="loading">Loading reports...</div>
              ) : (
                currentReports.length === 0 ? (
                  <div className="no-reports-message">No reports found for this comment.</div>
                ) : (
                  <div className="reports-list">
                    {currentReports.map(report => (
                      <div key={report._id} className={`report-item ${report.status}`}>
                        <div className="report-header">
                          <div className="report-user">
                            <div className="user-avatar">
                              {report.user.profilePicture ? (
                                <img src={report.user.profilePicture} alt={report.user.name} />
                              ) : (
                                <div className="avatar-placeholder">
                                  {report.user.name?.substring(0, 2).toUpperCase() || 'UN'}
                                </div>
                              )}
                            </div>
                            <div className="user-info">
                              <div className="user-name">{report.user.name}</div>
                              <div className="report-date">{formatDate(report.createdAt)}</div>
                            </div>
                          </div>
                          <div className="report-status">
                            <select 
                              value={report.status}
                              onChange={(e) => updateReportStatus(report._id, e.target.value)}
                              className={`status-select ${report.status}`}
                            >
                              <option value="pending">Pending</option>
                              <option value="reviewed">Reviewed</option>
                              <option value="ignored">Ignored</option>
                            </select>
                          </div>
                        </div>
                        <div className="report-reason">
                          <strong>Reason:</strong> {getReasonText(report.reason)}
                        </div>
                        {report.details && (
                          <div className="report-details">
                            <strong>Details:</strong> {report.details}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
            <div className="modal-footer">
              <button 
                className="close-btn"
                onClick={() => setShowReportModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommentModeration; 