import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/ViewReportModal.css';

const API_URL = import.meta.env.VITE_API_URL;

const ViewReportModal = ({ commentId, isOpen, onClose }) => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && commentId) {
      fetchReportDetails();
    }
    
    // Reset state when modal closes
    if (!isOpen) {
      setReport(null);
      setLoading(true);
      setError('');
      setDeleting(false);
      setDeleteSuccess(false);
    }
  }, [isOpen, commentId]);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  const fetchReportDetails = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('You must be logged in to view report details');
      }
      
      // Fetch the specific report details for this user and comment
      const response = await axios.get(`${API_URL}/reports/user-report/${commentId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setReport(response.data.data);
    } catch (err) {
      console.error('Error fetching report details:', err);
      setError(err.response?.data?.error || 'Failed to fetch report details');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteReport = async () => {
    try {
      setDeleting(true);
      setError('');
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('You must be logged in to cancel this report');
      }
      
      // Delete the report
      await axios.delete(`${API_URL}/reports/cancel/${commentId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setDeleteSuccess(true);
      
      // Close modal after a brief delay to show the success message
      setTimeout(() => {
        onClose(true); // Pass true to indicate the report was deleted
      }, 1500);
    } catch (err) {
      console.error('Error deleting report:', err);
      setError(err.response?.data?.error || 'Failed to delete report');
      setDeleting(false);
    }
  };
  
  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('view-report-modal-overlay')) {
      onClose();
    }
  };
  
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

  if (!isOpen) return null;

  return (
    <div className="view-report-modal-overlay" onClick={handleOverlayClick}>
      <div className="view-report-modal">
        <div className="view-report-modal-header">
          <h3>{deleteSuccess ? "Report Deleted" : "Report Details"}</h3>
          <button className="view-report-modal-close" onClick={() => onClose()}>×</button>
        </div>

        <div className="view-report-modal-body">
          {loading ? (
            <div className="view-report-loading">
              <div className="loading-spinner"></div>
              <p>Loading report details...</p>
            </div>
          ) : error ? (
            <div className="view-report-error">
              <p>{error}</p>
              <button className="retry-button" onClick={fetchReportDetails}>Retry</button>
            </div>
          ) : deleteSuccess ? (
            <div className="view-report-success">
              <div className="success-icon">✓</div>
              <p>Your report has been deleted successfully.</p>
            </div>
          ) : report ? (
            <div className="view-report-content">
              <div className="report-detail-item">
                <h4>Reason</h4>
                <p>{getReasonText(report.reason)}</p>
              </div>
              
              {report.details && (
                <div className="report-detail-item">
                  <h4>Additional Details</h4>
                  <p>{report.details}</p>
                </div>
              )}
              
              <div className="report-detail-item">
                <h4>Date Reported</h4>
                <p>{formatDate(report.createdAt)}</p>
              </div>
              
              <div className="report-detail-item">
                <h4>Status</h4>
                <p className={`report-status ${report.status}`}>
                  {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                </p>
              </div>
              
              {report.status === 'pending' && (
                <div className="report-action-container">
                  <button 
                    className="delete-report-button" 
                    onClick={handleDeleteReport}
                    disabled={deleting}
                  >
                    {deleting ? (
                      <span className="button-loading">
                        <span className="loading-dot"></span>
                        <span className="loading-dot"></span>
                        <span className="loading-dot"></span>
                      </span>
                    ) : "Delete Report"}
                  </button>
                  <p className="delete-report-info">
                    You can only delete reports with 'Pending' status.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="view-report-error">
              <p>No report found for this comment.</p>
            </div>
          )}
          
          {error && !loading && (
            <div className="view-report-error-message">{error}</div>
          )}
        </div>
        
        {!loading && !deleteSuccess && (
          <div className="view-report-modal-footer">
            <button 
              className="close-button" 
              onClick={() => onClose()}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewReportModal; 