import React, { useState, useEffect } from 'react';
import './UserManagement.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState('');
  const [sortConfig, setSortConfig] = useState({
    key: 'createdAt',
    direction: 'desc'
  });
  const [approvalFilter, setApprovalFilter] = useState('any');
  
  // Debounce search term to avoid excessive filtering
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const usersPerPage = 10;
  
  // Fetch users from API instead of using mock data
  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        
        // Create API URL with proper formatting
        let params = new URLSearchParams();
        
        // Add query parameters for server-side filtering - remove searchTerm
        if (filter !== 'all') {
          params.append('role', filter);
        }
        
        if (approvalFilter !== 'any') {
          params.append('approved', approvalFilter === 'approved' ? 'true' : 'false');
        }
        
        // Build the final URL
        const queryString = params.toString();
        const url = `/api/users${queryString ? `?${queryString}` : ''}`;
        
        console.log('Fetching users from:', url);
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });
        
        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          console.error('Server returned non-JSON response:', text);
          throw new Error('Server returned non-JSON response');
        }
        
        if (response.ok) {
          const data = await response.json();
          console.log('Fetched users:', data);
          
          // Check if data has expected format
          if (data && data.data) {
            setUsers(data.data);
            // Don't set filteredUsers here as we'll do it in the next useEffect
          } else {
            console.error('Unexpected data format:', data);
            setUsers([]);
          }
        } else {
          const errorData = await response.json();
          console.error('API error:', errorData);
          alert(`Error: ${errorData.error || 'Failed to fetch users'}`);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        // Set empty arrays instead of using mock data
        setUsers([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [filter, approvalFilter]); // Removed searchTerm from dependency array
  
  // Apply filters and search
  useEffect(() => {
    let result = [...users];
    
    // All filtering happens client-side now
    // Apply role filter
    if (filter !== 'all') {
      result = result.filter(user => user.role === filter);
    }
    
    // Apply approval filter
    if (approvalFilter !== 'any') {
      const isApproved = approvalFilter === 'approved';
      result = result.filter(user => user.isApproved === isApproved);
    }
    
    // Apply search
    if (debouncedSearchTerm) {
      const term = debouncedSearchTerm.toLowerCase();
      result = result.filter(user => 
        (user.name && user.name.toLowerCase().includes(term)) || 
        (user.email && user.email.toLowerCase().includes(term))
      );
    }
    
    // Apply sorting
    result.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
    
    setFilteredUsers(result);
    setCurrentPage(1); // Reset to first page on filter change
  }, [users, filter, debouncedSearchTerm, sortConfig, approvalFilter]);

  // Get current users for pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
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
      setSelectedUsers(currentUsers.map(user => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  // Handle select single user
  const handleSelectUser = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  // Handle bulk action button click
  const handleBulkAction = (action) => {
    setActionType(action);
    setShowActionModal(true);
  };

  // Confirm and process bulk action
  const confirmBulkAction = () => {
    console.log(`Performing ${actionType} action on users:`, selectedUsers);
    // Here you would make an API call to perform the action
    
    // Update local state to reflect changes
    let updatedUsers = [...users];
    if (actionType === 'delete') {
      updatedUsers = updatedUsers.filter(user => !selectedUsers.includes(user.id));
    } else {
      updatedUsers = updatedUsers.map(user => {
        if (selectedUsers.includes(user.id)) {
          return { ...user, status: actionType === 'suspend' ? 'suspended' : 'active' };
        }
        return user;
      });
    }
    
    setUsers(updatedUsers);
    setSelectedUsers([]);
    setShowActionModal(false);
  };

  // Render status badge
  const renderStatusBadge = (status) => {
    let badgeClass = '';
    
    switch(status) {
      case 'active':
        badgeClass = 'status-active';
        break;
      case 'suspended':
        badgeClass = 'status-suspended';
        break;
      case 'inactive':
        badgeClass = 'status-inactive';
        break;
      case 'pending':
        badgeClass = 'status-pending';
        break;
      default:
        badgeClass = '';
    }
    
    return <span className={`status-badge ${badgeClass}`}>{status}</span>;
  };

  // Handle user approval toggle
  const handleApprovalToggle = async (userId, currentApprovalStatus) => {
    // Ask for confirmation first
    const newApprovalStatus = !currentApprovalStatus;
    const actionText = newApprovalStatus ? 'approve' : 'reject';
    
    if (!confirm(`Are you sure you want to ${actionText} this user?`)) {
      return; // User cancelled the action
    }
    
    try {
      // Show user feedback that action is in progress
      const actionType = newApprovalStatus ? 'approving' : 'rejecting';
      
      // Create a temporary message while waiting
      const messageElement = document.createElement('div');
      messageElement.className = 'approval-message processing';
      messageElement.innerText = `${actionType.charAt(0).toUpperCase() + actionType.slice(1)} user...`;
      document.body.appendChild(messageElement);
      
      // Check if we're online
      if (!navigator.onLine) {
        throw new Error('You appear to be offline. Please check your internet connection and try again.');
      }
      
      const token = localStorage.getItem('token');
      
      // Check if we have a valid token
      if (!token) {
        throw new Error('Authentication token missing. Please log in again.');
      }
      
      console.log(`Toggling approval for user ${userId} to ${newApprovalStatus}`);
      
      // Log request details for debugging
      const requestBody = {
        userIds: [userId],
        isApproved: newApprovalStatus
      };
      console.log('Making request to /api/users/approval with data:', requestBody);
      
      const response = await fetch('/api/users/approval', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      console.log('Approval response status:', response.status);
      
      // Clean up message element
      document.body.removeChild(messageElement);
      
      // Handle non-JSON responses
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Server returned non-JSON response:', text);
        throw new Error('Server returned non-JSON response');
      }
      
      const data = await response.json();
      
      if (response.ok) {
        console.log('Approval toggle result:', data);
        
        // Update the user in the state
        setUsers(prevUsers => 
          prevUsers.map(user => {
            const id = user._id || user.id;
            if (id === userId) {
              return { ...user, isApproved: newApprovalStatus };
            }
            return user;
          })
        );
        
        // Also update filtered users
        setFilteredUsers(prevUsers => 
          prevUsers.map(user => {
            const id = user._id || user.id;
            if (id === userId) {
              return { ...user, isApproved: newApprovalStatus };
            }
            return user;
          })
        );
        
        // Show success message
        const successMsg = document.createElement('div');
        successMsg.className = 'approval-message success';
        successMsg.innerText = `User ${newApprovalStatus ? 'approved' : 'rejected'} successfully!`;
        document.body.appendChild(successMsg);
        
        // Remove success message after 3 seconds
        setTimeout(() => {
          document.body.removeChild(successMsg);
        }, 3000);
      } else {
        // Log detailed error information for debugging
        console.error('Failed to update approval status:', data);
        console.error('Error details:', {
          status: response.status,
          statusText: response.statusText,
          error: data.error || 'Unknown error'
        });
        
        // Show error message with more details
        const errorMsg = document.createElement('div');
        errorMsg.className = 'approval-message error';
        errorMsg.innerText = `Error (${response.status}): ${data.error || data.message || 'Failed to update approval status'}`;
        document.body.appendChild(errorMsg);
        
        // Remove error message after 5 seconds
        setTimeout(() => {
          document.body.removeChild(errorMsg);
        }, 5000);
      }
    } catch (error) {
      console.error('Error updating approval status:', error);
      
      // Show error message
      const errorMsg = document.createElement('div');
      errorMsg.className = 'approval-message error';
      errorMsg.innerText = `Error: ${error.message || 'An unexpected error occurred while updating approval status'}`;
      document.body.appendChild(errorMsg);
      
      // Remove error message after 5 seconds
      setTimeout(() => {
        document.body.removeChild(errorMsg);
      }, 5000);
    }
  };

  if (isLoading) {
    return (
      <div className="user-management-container">
        <div className="loading">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="user-management-container">
      <header className="user-management-header">
        <h1>User Management</h1>
        <div className="header-actions">
          <button className="create-user-btn">
            <i className="fas fa-plus"></i> Add New User
          </button>
        </div>
      </header>
      
      <div className="filter-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search users by name or email"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <i className="fas fa-search"></i>
        </div>
        
        <div className="filter-box">
          <label>Filter by Role:</label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Roles</option>
            <option value="student">Students</option>
            <option value="teacher">Teachers</option>
            <option value="admin">Administrators</option>
          </select>
        </div>
        
        <div className="approval-filter">
          <label>Approval Status</label>
          <select 
            value={approvalFilter}
            onChange={(e) => setApprovalFilter(e.target.value)}
          >
            <option value="any">Any Status</option>
            <option value="pending">Pending Approval</option>
            <option value="approved">Approved</option>
          </select>
        </div>
        
        <button 
          className="filter-btn pending-teachers-btn"
          onClick={() => {
            setFilter('teacher');
            setApprovalFilter('pending');
          }}
        >
          <i className="fas fa-user-check"></i> Pending Teachers
        </button>
      </div>
      
      {selectedUsers.length > 0 && (
        <div className="bulk-actions">
          <span>{selectedUsers.length} users selected</span>
          <div className="action-buttons">
            <button 
              className="action-btn activate-btn" 
              onClick={() => handleBulkAction('activate')}
            >
              <i className="fas fa-check-circle"></i> Activate
            </button>
            <button 
              className="action-btn suspend-btn" 
              onClick={() => handleBulkAction('suspend')}
            >
              <i className="fas fa-ban"></i> Suspend
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
      
      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th className="checkbox-column">
                <input 
                  type="checkbox" 
                  onChange={handleSelectAll}
                  checked={selectedUsers.length === currentUsers.length && currentUsers.length > 0}
                />
              </th>
              <th>User</th>
              <th onClick={() => handleSort('role')} className="sortable-column">
                Role
                {sortConfig.key === 'role' && (
                  <i className={`fas fa-sort-${sortConfig.direction === 'asc' ? 'up' : 'down'}`}></i>
                )}
              </th>
              <th onClick={() => handleSort('status')} className="sortable-column">
                Status
                {sortConfig.key === 'status' && (
                  <i className={`fas fa-sort-${sortConfig.direction === 'asc' ? 'up' : 'down'}`}></i>
                )}
              </th>
              <th onClick={() => handleSort('isApproved')} className="sortable-column">
                Approval
                {sortConfig.key === 'isApproved' && (
                  <i className={`fas fa-sort-${sortConfig.direction === 'asc' ? 'up' : 'down'}`}></i>
                )}
              </th>
              <th onClick={() => handleSort('createdAt')} className="sortable-column">
                Joined
                {sortConfig.key === 'createdAt' && (
                  <i className={`fas fa-sort-${sortConfig.direction === 'asc' ? 'up' : 'down'}`}></i>
                )}
              </th>
              <th onClick={() => handleSort('lastLogin')} className="sortable-column">
                Last Login
                {sortConfig.key === 'lastLogin' && (
                  <i className={`fas fa-sort-${sortConfig.direction === 'asc' ? 'up' : 'down'}`}></i>
                )}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentUsers.length > 0 ? (
              currentUsers.map(user => (
                <tr key={user.id}>
                  <td className="checkbox-column">
                    <input 
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => handleSelectUser(user.id)}
                    />
                  </td>
                  <td className="user-cell">
                    <div className="user-avatar">
                      {user.profileImage ? (
                        <img src={user.profileImage} alt={user.name} />
                      ) : (
                        <div className="avatar-placeholder">
                          {user.name.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="user-info">
                      <div className="user-name">{user.name}</div>
                      <div className="user-email">{user.email}</div>
                    </div>
                  </td>
                  <td className="role-cell">
                    <span className={`role-badge role-${user.role}`}>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                  </td>
                  <td className="status-cell">
                    {renderStatusBadge(user.status)}
                  </td>
                  <td className="approval-cell">
                    <div className="approval-container">
                      <span className={`approval-badge ${user.isApproved ? 'approved' : 'pending'}`}>
                        {user.isApproved ? 'Approved' : 'Pending'}
                      </span>
                      {user.role === 'teacher' && (
                        <button 
                          className={`approval-toggle ${user.isApproved ? 'reject-btn' : 'approve-btn'}`}
                          onClick={() => handleApprovalToggle(user._id || user.id, user.isApproved)}
                        >
                          {user.isApproved ? 'Reject' : 'Approve'}
                        </button>
                      )}
                    </div>
                  </td>
                  <td>{formatDate(user.createdAt)}</td>
                  <td>{formatDate(user.lastLogin)}</td>
                  <td className="actions-cell">
                    <div className="action-dropdown">
                      <button className="action-dropdown-toggle">
                        <i className="fas fa-ellipsis-v"></i>
                      </button>
                      <div className="action-dropdown-menu">
                        <button className="dropdown-item">
                          <i className="fas fa-edit"></i> Edit
                        </button>
                        {user.status === 'active' ? (
                          <button className="dropdown-item">
                            <i className="fas fa-ban"></i> Suspend
                          </button>
                        ) : (
                          <button className="dropdown-item">
                            <i className="fas fa-check-circle"></i> Activate
                          </button>
                        )}
                        <button className="dropdown-item">
                          <i className="fas fa-key"></i> Reset Password
                        </button>
                        <button className="dropdown-item text-danger">
                          <i className="fas fa-trash-alt"></i> Delete
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="no-results">
                  No users found matching your criteria
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination controls */}
      {filteredUsers.length > usersPerPage && (
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
                {selectedUsers.length === 1 ? 'this user' : `these ${selectedUsers.length} users`}?
              </p>
              <div className="modal-actions">
                <button 
                  className="confirm-btn"
                  onClick={confirmBulkAction}
                >
                  Confirm
                </button>
                <button 
                  className="cancel-btn"
                  onClick={() => setShowActionModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;