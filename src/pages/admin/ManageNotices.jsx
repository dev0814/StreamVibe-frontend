import React, { useState, useEffect } from 'react';
import './ManageNotices.css';

const ManageNotices = () => {
  // State management
  const [notices, setNotices] = useState([]);
  const [filteredNotices, setFilteredNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentNotice, setCurrentNotice] = useState({ 
    id: null, 
    title: '', 
    message: '', 
    targetAudience: 'all', 
    status: 'active', 
    priority: 'normal' 
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // Fetch notices function for refreshing data
  const fetchNotices = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/notices', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data && data.data) {
          setNotices(data.data);
          setFilteredNotices(data.data);
        } else {
          setNotices([]);
          setFilteredNotices([]);
        }
      } else {
        console.error('Failed to fetch notices:', await response.text());
        setNotices([]);
        setFilteredNotices([]);
      }
    } catch (error) {
      console.error('Error fetching notices:', error);
      setNotices([]);
      setFilteredNotices([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch notices from API
  useEffect(() => {
    fetchNotices();
  }, []);

  // Filter notices by status and search term
  useEffect(() => {
    let result = [...notices];
    
    // Filter by status
    if (statusFilter !== 'all') {
      result = result.filter(notice => notice.status === statusFilter);
    }
    
    // Filter by search term
    if (searchTerm.trim() !== '') {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(notice => 
        notice.title.toLowerCase().includes(searchLower) || 
        notice.message.toLowerCase().includes(searchLower)
      );
    }
    
    setFilteredNotices(result);
  }, [notices, statusFilter, searchTerm]);

  // Format date to readable string
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Truncate long text
  const truncateText = (text, maxLength = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Reset form to default values
  const resetForm = () => {
    setCurrentNotice({ 
      id: null, 
      title: '', 
      message: '', 
      targetAudience: 'all', 
      status: 'active', 
      priority: 'normal' 
    });
    setValidationErrors({});
  };

  // Open modal to add new notice
  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  // Open modal to edit existing notice
  const openEditModal = (notice) => {
    setCurrentNotice({ ...notice });
    setIsModalOpen(true);
  };

  // Close modal and reset form
  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  // Handle input changes in the form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentNotice(prev => ({ ...prev, [name]: value }));
    
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Validate form inputs
  const validateForm = () => {
    const errors = {};
    
    if (!currentNotice.title.trim()) {
      errors.title = 'Title is required';
    }
    
    if (!currentNotice.message.trim()) {
      errors.message = 'Message is required';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save notice (create or update)
  const saveNotice = () => {
    if (!validateForm()) return;
    
    // Create a copy of the notice for API submission
    const noticeData = { ...currentNotice };
    
    if (currentNotice.id) {
      // Update existing notice
      updateNotice(noticeData);
    } else {
      // Create new notice
      createNotice(noticeData);
    }
    
    closeModal();
  };

  // Create a new notice
  const createNotice = async (noticeData) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/notices', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(noticeData)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Notice created:', result);
        
        // Refresh notices list
        fetchNotices();
        closeModal();
      } else {
        const errorData = await response.json();
        console.error('Failed to create notice:', errorData);
        alert(`Error: ${errorData.error || 'Failed to create notice'}`);
      }
    } catch (error) {
      console.error('Error creating notice:', error);
      alert('Error creating notice. Please try again.');
    }
  };

  // Update an existing notice
  const updateNotice = async (noticeData) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/notices/${noticeData.id || noticeData._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(noticeData)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Notice updated:', result);
        
        // Refresh notices list
        fetchNotices();
        closeModal();
      } else {
        const errorData = await response.json();
        console.error('Failed to update notice:', errorData);
        alert(`Error: ${errorData.error || 'Failed to update notice'}`);
      }
    } catch (error) {
      console.error('Error updating notice:', error);
      alert('Error updating notice. Please try again.');
    }
  };

  // Open delete confirmation dialog
  const openDeleteConfirmation = (id) => {
    setDeleteId(id);
    setConfirmDelete(true);
  };

  // Close delete confirmation dialog
  const closeDeleteConfirmation = () => {
    setDeleteId(null);
    setConfirmDelete(false);
  };

  // Delete a notice
  const deleteNotice = async () => {
    if (!deleteId) return;
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/notices/${deleteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        console.log('Notice deleted');
        
        // Remove from state
        setNotices(notices.filter(notice => {
          const id = notice.id || notice._id;
          return id !== deleteId;
        }));
        
        // Close confirmation dialog
        closeDeleteConfirmation();
      } else {
        const errorData = await response.json();
        console.error('Failed to delete notice:', errorData);
        alert(`Error: ${errorData.error || 'Failed to delete notice'}`);
      }
    } catch (error) {
      console.error('Error deleting notice:', error);
      alert('Error deleting notice. Please try again.');
    }
  };

  // Get priority badge class based on priority level
  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'high':
        return 'priority-badge high';
      case 'normal':
        return 'priority-badge normal';
      case 'low':
        return 'priority-badge low';
      default:
        return 'priority-badge normal';
    }
  };

  // Get status badge class based on status
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'active':
        return 'status-badge active';
      case 'draft':
        return 'status-badge draft';
      case 'scheduled':
        return 'status-badge scheduled';
      case 'archived':
        return 'status-badge archived';
      default:
        return 'status-badge';
    }
  };

  // Get audience badge class and text
  const getAudienceBadge = (audience) => {
    switch (audience) {
      case 'all':
        return { class: 'audience-badge all', text: 'All Users' };
      case 'students':
        return { class: 'audience-badge students', text: 'Students' };
      case 'teachers':
        return { class: 'audience-badge teachers', text: 'Teachers' };
      case 'admins':
        return { class: 'audience-badge admins', text: 'Admins' };
      default:
        return { class: 'audience-badge', text: audience };
    }
  };

  // Get status text for the status filter
  const getStatusText = (status) => {
    switch (status) {
      case 'all':
        return 'All Notices';
      case 'active':
        return 'Active';
      case 'draft':
        return 'Drafts';
      case 'scheduled':
        return 'Scheduled';
      case 'archived':
        return 'Archived';
      default:
        return 'Unknown';
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className="notices-container">
        <div className="loading-notices">
          <div className="loading-spinner"></div>
          <p>Loading notices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="notices-container">
      {/* Header */}
      <div className="notices-header">
        <div className="header-left">
          <h1>Manage Notices</h1>
          <p>Create, edit, and publish notices for your platform users</p>
        </div>
        <div className="header-right">
          <button className="add-notice-btn" onClick={openAddModal}>
            <i className="fas fa-plus"></i> New Notice
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="notices-toolbar">
        <div className="status-filters">
          <button 
            className={`status-filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            All Notices
          </button>
          <button 
            className={`status-filter-btn ${statusFilter === 'active' ? 'active' : ''}`}
            onClick={() => setStatusFilter('active')}
          >
            Active
          </button>
          <button 
            className={`status-filter-btn ${statusFilter === 'draft' ? 'active' : ''}`}
            onClick={() => setStatusFilter('draft')}
          >
            Drafts
          </button>
          <button 
            className={`status-filter-btn ${statusFilter === 'scheduled' ? 'active' : ''}`}
            onClick={() => setStatusFilter('scheduled')}
          >
            Scheduled
          </button>
          <button 
            className={`status-filter-btn ${statusFilter === 'archived' ? 'active' : ''}`}
            onClick={() => setStatusFilter('archived')}
          >
            Archived
          </button>
        </div>
        <div className="search-bar">
          <i className="fas fa-search search-icon"></i>
          <input
            type="text"
            placeholder="Search notices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Notices List */}
      <div className="notices-list">
        <div className="notices-header-row">
          <span className="notice-title-header">Notice</span>
          <span className="notice-audience-header">Audience</span>
          <span className="notice-status-header">Status</span>
          <span className="notice-date-header">Date</span>
          <span className="notice-actions-header">Actions</span>
        </div>

        {filteredNotices.length === 0 ? (
          <div className="no-notices">
            <i className="fas fa-bell-slash"></i>
            <h3>No notices found</h3>
            <p>
              {searchTerm 
                ? `No notices match your search "${searchTerm}"`
                : `No ${statusFilter !== 'all' ? getStatusText(statusFilter).toLowerCase() : ''} notices available`}
            </p>
            <button className="add-notice-btn" onClick={openAddModal}>
              Create New Notice
            </button>
          </div>
        ) : (
          filteredNotices.map(notice => (
            <div key={notice.id} className="notice-item">
              <div className="notice-info">
                <div className="notice-title-area">
                  <span className={getPriorityBadgeClass(notice.priority)}></span>
                  <h3>{notice.title}</h3>
                </div>
                <p className="notice-message">{truncateText(notice.message)}</p>
              </div>
              <div className="notice-audience">
                <span className={getAudienceBadge(notice.targetAudience).class}>
                  {getAudienceBadge(notice.targetAudience).text}
                </span>
              </div>
              <div className="notice-status">
                <span className={getStatusBadgeClass(notice.status)}>
                  {notice.status.charAt(0).toUpperCase() + notice.status.slice(1)}
                </span>
              </div>
              <div className="notice-date">
                <div className="date-info">
                  <span className="date-label">Created:</span>
                  <span className="date-value">{formatDate(notice.createdAt)}</span>
                </div>
                <div className="date-info">
                  <span className="date-label">Updated:</span>
                  <span className="date-value">{formatDate(notice.updatedAt)}</span>
                </div>
              </div>
              <div className="notice-actions">
                <button 
                  className="edit-btn" 
                  title="Edit Notice"
                  onClick={() => openEditModal(notice)}
                >
                  <i className="fas fa-edit"></i>
                </button>
                <button 
                  className="delete-btn" 
                  title="Delete Notice"
                  onClick={() => openDeleteConfirmation(notice.id)}
                >
                  <i className="fas fa-trash-alt"></i>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Notice Form Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="notice-modal">
            <div className="modal-header">
              <h2>{currentNotice.id ? 'Edit Notice' : 'Create Notice'}</h2>
              <button className="close-modal-btn" onClick={closeModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="title">Notice Title*</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={currentNotice.title}
                  onChange={handleInputChange}
                  className={validationErrors.title ? 'error' : ''}
                />
                {validationErrors.title && (
                  <div className="error-message">{validationErrors.title}</div>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="targetAudience">Target Audience</label>
                  <select
                    id="targetAudience"
                    name="targetAudience"
                    value={currentNotice.targetAudience}
                    onChange={handleInputChange}
                  >
                    <option value="all">All Users</option>
                    <option value="students">Students</option>
                    <option value="teachers">Teachers</option>
                    <option value="admins">Admins</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="priority">Priority</label>
                  <select
                    id="priority"
                    name="priority"
                    value={currentNotice.priority}
                    onChange={handleInputChange}
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="status">Status</label>
                  <select
                    id="status"
                    name="status"
                    value={currentNotice.status}
                    onChange={handleInputChange}
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="message">Message*</label>
                <textarea
                  id="message"
                  name="message"
                  value={currentNotice.message}
                  onChange={handleInputChange}
                  rows="5"
                  className={validationErrors.message ? 'error' : ''}
                ></textarea>
                {validationErrors.message && (
                  <div className="error-message">{validationErrors.message}</div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={closeModal}>Cancel</button>
              <button className="save-btn" onClick={saveNotice}>
                {currentNotice.id ? 'Update Notice' : 'Create Notice'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {confirmDelete && (
        <div className="modal-overlay">
          <div className="confirm-dialog">
            <div className="confirm-header">
              <h3>Confirm Deletion</h3>
            </div>
            <div className="confirm-body">
              <i className="fas fa-exclamation-triangle warning-icon"></i>
              <p>Are you sure you want to delete this notice?</p>
              <p className="confirm-warning">This action cannot be undone.</p>
            </div>
            <div className="confirm-footer">
              <button className="cancel-btn" onClick={closeDeleteConfirmation}>Cancel</button>
              <button className="delete-confirm-btn" onClick={deleteNotice}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageNotices; 