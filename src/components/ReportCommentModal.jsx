import React, { useState } from 'react';
import axios from 'axios';
import '../styles/ReportCommentModal.css';

const API_URL = import.meta.env.VITE_API_URL;

const ReportCommentModal = ({ commentId, isOpen, onClose, onReportSuccess }) => {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelTimeout, setCancelTimeout] = useState(null);

  const reasons = [
    { id: 'spam', label: 'Spam' },
    { id: 'harassment', label: 'Harassment / Hate speech' },
    { id: 'off-topic', label: 'Off-topic' },
    { id: 'inappropriate', label: 'Inappropriate content' },
    { id: 'other', label: 'Other' },
  ];

  // Close modal on escape key
  React.useEffect(() => {
    const handleEscapeKey = (e) => {
      if (isOpen && e.key === 'Escape') {
        handleClose();
      }
    };
    
    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen]);

  // Prevent background scrolling when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  // Reset state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setReason('');
      setDetails('');
      setError('');
      setIsSubmitting(false);
      setIsSuccess(false);
      setIsCancelling(false);
    }
  }, [isOpen]);

  // Clear any pending timeouts on unmount
  React.useEffect(() => {
    return () => {
      if (cancelTimeout) {
        clearTimeout(cancelTimeout);
      }
    };
  }, [cancelTimeout]);

  const handleClose = () => {
    // If successful report, trigger the success callback
    if (isSuccess) {
      onReportSuccess();
    } else {
      onClose();
    }
    
    // Clear any pending timeouts
    if (cancelTimeout) {
      clearTimeout(cancelTimeout);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!reason) {
      setError('Please select a reason for reporting');
      return;
    }

    if (reason === 'other' && !details.trim()) {
      setError('Please provide details for your report');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('You must be logged in to report a comment');
        setIsSubmitting(false);
        return;
      }

      // Send report to API
      await axios.post(
        `${API_URL}/reports`, 
        { 
          commentId, 
          reason, 
          details: reason === 'other' ? details : undefined 
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      // Show success state
      setIsSubmitting(false);
      setIsSuccess(true);
      
      // Set auto close timeout (longer now to allow for undo)
      const timeout = setTimeout(() => {
        onReportSuccess();
      }, 5000); // 5 seconds to undo
      
      setCancelTimeout(timeout);
    } catch (err) {
      setIsSubmitting(false);
      setError(err.response?.data?.error || 'Failed to submit report. Please try again.');
    }
  };

  // Handle the undo/cancel report action
  const handleUndoReport = async () => {
    // Clear the auto-close timeout first
    if (cancelTimeout) {
      clearTimeout(cancelTimeout);
      setCancelTimeout(null);
    }
    
    setIsCancelling(true);
    setError('');
    
    try {
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('You must be logged in to cancel this report');
        setIsCancelling(false);
        return;
      }

      // Call API to cancel the report
      await axios.delete(
        `${API_URL}/reports/cancel/${commentId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      // Close the modal using the onClose handler which will update the parent component
      onClose();
    } catch (err) {
      setIsCancelling(false);
      setError(err.response?.data?.error || 'Failed to cancel report. The report has been submitted.');
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('report-modal-overlay')) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="report-modal-overlay" onClick={handleOverlayClick}>
      <div className="report-modal">
        <div className="report-modal-header">
          <h3>{isSuccess ? "Report Submitted" : "Report Comment"}</h3>
          <button className="report-modal-close" onClick={handleClose}>&times;</button>
        </div>

        <div className="report-modal-body">
          {isSuccess ? (
            <div className="report-success">
              <div className="report-success-icon">✓</div>
              <p>Thank you for your report. We will review this comment shortly.</p>
              
              <div className="report-undo-container">
                <button 
                  className="report-undo-button" 
                  onClick={handleUndoReport}
                  disabled={isCancelling}
                >
                  {isCancelling ? (
                    <span className="report-loading">
                      <span className="report-loading-dot"></span>
                      <span className="report-loading-dot"></span>
                      <span className="report-loading-dot"></span>
                    </span>
                  ) : "Undo Report"}
                </button>
                <div className="report-undo-hint">You can undo this report within 5 seconds</div>
              </div>
              
              {error && <div className="report-error-message">{error}</div>}
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="report-form-group">
                <label className="report-form-label">Why are you reporting this comment?</label>
                
                <div className="report-reason-options">
                  {reasons.map(item => (
                    <div 
                      className={`report-reason-option ${reason === item.id ? 'selected' : ''}`} 
                      key={item.id}
                      onClick={() => setReason(item.id)}
                    >
                      <input
                        type="radio"
                        id={`reason-${item.id}`}
                        name="reason"
                        value={item.id}
                        checked={reason === item.id}
                        onChange={() => setReason(item.id)}
                      />
                      <label htmlFor={`reason-${item.id}`}>{item.label}</label>
                    </div>
                  ))}
                </div>
              </div>

              {reason === 'other' && (
                <div className="report-form-group">
                  <label className="report-form-label">Please provide details:</label>
                  <textarea
                    className="report-form-textarea"
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Explain why you are reporting this comment..."
                    rows={3}
                  />
                </div>
              )}

              {error && <div className="report-error-message">{error}</div>}

              <div className="report-form-actions">
                <button 
                  type="button" 
                  className="report-button-cancel" 
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="report-button-submit" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="report-loading">
                      <span className="report-loading-dot"></span>
                      <span className="report-loading-dot"></span>
                      <span className="report-loading-dot"></span>
                    </span>
                  ) : "Submit Report"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportCommentModal; 