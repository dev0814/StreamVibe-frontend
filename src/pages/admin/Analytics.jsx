import React, { useState, useEffect } from 'react';
import './Analytics.css';

const Analytics = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState('overview');
  const [dateRange, setDateRange] = useState('last30days');
  const [analytics, setAnalytics] = useState({
    overview: {},
    userActivity: [],
    contentPerformance: [],
    engagementMetrics: []
  });

  // Format numbers for display
  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num;
  };

  // Format time in minutes to hours and minutes
  const formatTime = (minutes) => {
    if (!minutes) return '0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Function to fetch analytics data
  const fetchAnalytics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      
      // Fetch overview data
      const overviewResponse = await fetch(`/api/analytics/overview?dateRange=${dateRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      if (!overviewResponse.ok) {
        throw new Error('Failed to fetch overview data');
      }
      
      const overviewData = await overviewResponse.json();
      
      // Fetch user activity data
      const userActivityResponse = await fetch(`/api/analytics/user-activity?dateRange=${dateRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      if (!userActivityResponse.ok) {
        throw new Error('Failed to fetch user activity data');
      }
      
      const userActivityData = await userActivityResponse.json();
      
      // Fetch content performance data
      const contentResponse = await fetch(`/api/analytics/content-performance?dateRange=${dateRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      if (!contentResponse.ok) {
        throw new Error('Failed to fetch content performance data');
      }
      
      const contentData = await contentResponse.json();
      
      // Fetch engagement metrics data
      const engagementResponse = await fetch(`/api/analytics/engagement-metrics?dateRange=${dateRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      if (!engagementResponse.ok) {
        throw new Error('Failed to fetch engagement metrics data');
      }
      
      const engagementData = await engagementResponse.json();
      
      setAnalytics({
        overview: overviewData.data || {},
        userActivity: userActivityData.data || [],
        contentPerformance: contentData.data || [],
        engagementMetrics: engagementData.data || []
      });
      
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Download report function
  const downloadReport = async (reportType) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/analytics/reports/${reportType}?dateRange=${dateRange}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to download report');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${reportType}-report-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('Error downloading report. Please try again.');
    }
  };

  // Fetch analytics data on initial load and when date range changes
  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const renderOverview = () => {
    const { overview } = analytics;
    
    return (
      <div className="analytics-overview">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon users-icon">
              <i className="fas fa-users"></i>
            </div>
            <div className="stat-content">
              <h3>Total Users</h3>
              <div className="stat-value">{formatNumber(overview.totalUsers)}</div>
              <div className="stat-subtitle">
                <span className="highlight">+{formatNumber(overview.newUsersToday)}</span> today
              </div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon videos-icon">
              <i className="fas fa-video"></i>
            </div>
            <div className="stat-content">
              <h3>Total Videos</h3>
              <div className="stat-value">{formatNumber(overview.totalVideos)}</div>
              <div className="stat-subtitle">
                <span className="highlight">+{formatNumber(overview.videoUploadsToday)}</span> today
              </div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon watch-icon">
              <i className="fas fa-clock"></i>
            </div>
            <div className="stat-content">
              <h3>Watch Time</h3>
              <div className="stat-value">{formatTime(overview.totalWatchTime)}</div>
              <div className="stat-subtitle">
                Avg. {formatTime(overview.averageSessionDuration)} per session
              </div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon comments-icon">
              <i className="fas fa-comment-alt"></i>
            </div>
            <div className="stat-content">
              <h3>Comments</h3>
              <div className="stat-value">{formatNumber(overview.commentsToday)}</div>
              <div className="stat-subtitle">
                Posted today
              </div>
            </div>
          </div>
        </div>
        
        <div className="analytics-row">
          <div className="chart-container half-width">
            <h3>Category Distribution</h3>
            <div className="category-chart">
              <div className="category-bars">
                {overview.topCategories?.map((category, index) => (
                  <div className="category-bar-item" key={index}>
                    <div className="category-label">{category.name}</div>
                    <div className="category-bar-container">
                      <div 
                        className={`category-bar category-color-${index + 1}`} 
                        style={{ width: `${category.percentage}%` }}
                      ></div>
                      <span className="category-percentage">{category.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="chart-container half-width">
            <h3>User Activity (Last 7 Days)</h3>
            <div className="activity-chart">
              <div className="chart-axis-y">
                {analytics.userActivity.map((day, index) => (
                  <span key={index}>{formatNumber(day.activeUsers)}</span>
                ))}
              </div>
              <div className="chart-content">
                {analytics.userActivity.map((day, index) => (
                  <div className="activity-bar" key={index}>
                    <div className="activity-bar-container">
                      <div 
                        className="activity-bar-fill" 
                        style={{ height: `${(day.activeUsers / Math.max(...analytics.userActivity.map(d => d.activeUsers))) * 100}%` }}
                      ></div>
                    </div>
                    <div className="activity-date">{formatDate(day.date)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <div className="analytics-row">
          <div className="engagement-metrics">
            <h3>Engagement Metrics</h3>
            <div className="metrics-grid">
              {analytics.engagementMetrics.map((metric, index) => (
                <div className="metric-card" key={index}>
                  <div className="metric-name">{metric.metric}</div>
                  <div className="metric-value">
                    {metric.value}{metric.unit}
                    <span className={`metric-trend ${metric.trend.startsWith('+') ? 'positive' : 'negative'}`}>
                      {metric.trend}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderUserActivity = () => {
    return (
      <div className="user-activity-container">
        <div className="analytics-section-header">
          <h2>User Activity Metrics</h2>
          <p>Detailed analysis of user engagement and activity patterns</p>
        </div>
        
        <div className="analytics-row">
          <div className="chart-container full-width">
            <h3>Daily Active Users</h3>
            <div className="activity-chart">
              <div className="chart-axis-y">
                {analytics.userActivity.map((day, index) => (
                  <span key={index}>{formatNumber(day.activeUsers)}</span>
                ))}
              </div>
              <div className="chart-content">
                {analytics.userActivity.map((day, index) => (
                  <div className="activity-bar" key={index}>
                    <div className="activity-bar-container">
                      <div 
                        className="activity-bar-fill" 
                        style={{ height: `${(day.activeUsers / Math.max(...analytics.userActivity.map(d => d.activeUsers))) * 100}%` }}
                      ></div>
                    </div>
                    <div className="activity-date">{formatDate(day.date)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <div className="analytics-row">
          <div className="chart-container half-width">
            <h3>User Roles Distribution</h3>
            <div className="role-distribution-chart">
              {analytics.overview.userRoles?.map((role, index) => (
                <div key={index} className="role-item">
                  <div className="role-name">{role.name}</div>
                  <div className="role-bar-container">
                    <div 
                      className={`role-bar role-color-${index + 1}`}
                      style={{ width: `${role.percentage}%` }}
                    ></div>
                    <span className="role-percentage">{role.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="chart-container half-width">
            <h3>New User Registration</h3>
            <div className="registration-chart">
              <div className="chart-axis-y">
                {analytics.userActivity.map((day, index) => (
                  <span key={index}>{formatNumber(day.newUsers)}</span>
                ))}
              </div>
              <div className="chart-content">
                {analytics.userActivity.map((day, index) => (
                  <div className="registration-bar" key={index}>
                    <div className="registration-bar-container">
                      <div 
                        className="registration-bar-fill" 
                        style={{ height: `${(day.newUsers / Math.max(...analytics.userActivity.map(d => d.newUsers))) * 100}%` }}
                      ></div>
                    </div>
                    <div className="registration-date">{formatDate(day.date)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <div className="analytics-row">
          <div className="user-activity-table-container">
            <h3>User Engagement by Role</h3>
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>New Users</th>
                  <th>Active Users</th>
                  <th>Student Engagement</th>
                  <th>Teacher Engagement</th>
                </tr>
              </thead>
              <tbody>
                {analytics.userActivity.map((day, index) => (
                  <tr key={index}>
                    <td>{formatDate(day.date)}</td>
                    <td>{formatNumber(day.newUsers)}</td>
                    <td>{formatNumber(day.activeUsers)}</td>
                    <td>
                      <div className="progress-bar-container">
                        <div 
                          className="progress-bar" 
                          style={{ width: `${day.studentEngagement * 100}%` }}
                        ></div>
                        <span>{Math.round(day.studentEngagement * 100)}%</span>
                      </div>
                    </td>
                    <td>
                      <div className="progress-bar-container">
                        <div 
                          className="progress-bar teacher-bar" 
                          style={{ width: `${day.teacherEngagement * 100}%` }}
                        ></div>
                        <span>{Math.round(day.teacherEngagement * 100)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderContentPerformance = () => {
    return (
      <div className="content-performance-container">
        <div className="analytics-section-header">
          <h2>Content Performance Analysis</h2>
          <p>Performance metrics for educational content across the platform</p>
        </div>
        
        <div className="analytics-row">
          <div className="chart-container full-width">
            <h3>Top Performing Videos</h3>
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Author</th>
                  <th>Category</th>
                  <th>Views</th>
                  <th>Completion</th>
                  <th>Rating</th>
                  <th>Engagement</th>
                </tr>
              </thead>
              <tbody>
                {analytics.contentPerformance.map((video, index) => (
                  <tr key={index}>
                    <td>
                      <div className="video-title-cell">
                        <span className="table-video-title">{video.title}</span>
                        <span className="upload-date">{formatDate(video.uploadDate)}</span>
                      </div>
                    </td>
                    <td>{video.author}</td>
                    <td>{video.category}</td>
                    <td>{formatNumber(video.views)}</td>
                    <td>
                      <div className="progress-bar-container">
                        <div 
                          className="progress-bar" 
                          style={{ width: `${video.completionRate * 100}%` }}
                        ></div>
                        <span>{Math.round(video.completionRate * 100)}%</span>
                      </div>
                    </td>
                    <td>
                      <div className="rating-display">
                        <span className="rating-value">{video.avgRating}</span>
                        <div className="rating-stars">
                          {[...Array(5)].map((_, i) => (
                            <i 
                              key={i}
                              className={`fas fa-star ${i < Math.floor(video.avgRating) ? 'filled' : ''}`}
                            ></i>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="progress-bar-container">
                        <div 
                          className="progress-bar engagement-bar" 
                          style={{ width: `${video.engagement * 100}%` }}
                        ></div>
                        <span>{Math.round(video.engagement * 100)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="analytics-row">
          <div className="chart-container half-width">
            <h3>Content Viewership by Category</h3>
            <div className="category-viewership-chart">
              {analytics.overview.categoryViewership?.map((category, index) => (
                <div key={index} className="category-item">
                  <div className="category-name">{category.name}</div>
                  <div className="category-bar-container">
                    <div 
                      className={`category-bar category-color-${index + 1}`}
                      style={{ width: `${category.percentage}%` }}
                    ></div>
                    <span className="category-percentage">{category.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="chart-container half-width">
            <h3>Video Completion Rates</h3>
            <div className="completion-rates-chart">
              {analytics.overview.completionRates?.map((rate, index) => (
                <div key={index} className="completion-item">
                  <div className="completion-type">{rate.type}</div>
                  <div className="completion-bar-container">
                    <div 
                      className={`completion-bar completion-color-${index + 1}`}
                      style={{ width: `${rate.percentage}%` }}
                    ></div>
                    <span className="completion-percentage">{rate.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="analytics-container">
        <div className="loading-analytics">
          <div className="loading-spinner"></div>
          <p>Loading analytics data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-container">
        <div className="error-analytics">
          <i className="fas fa-exclamation-circle"></i>
          <p>Error: {error}</p>
          <button onClick={fetchAnalytics}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-container">
      <header className="analytics-header">
        <div className="header-left">
          <h1>Platform Analytics</h1>
          <p>Performance metrics and insights for StreamVibe</p>
        </div>
        <div className="header-right">
          <div className="date-range-selector">
            <label htmlFor="dateRange">Date Range:</label>
            <select 
              id="dateRange" 
              value={dateRange} 
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="last7days">Last 7 Days</option>
              <option value="last30days">Last 30 Days</option>
              <option value="thisMonth">This Month</option>
              <option value="lastMonth">Last Month</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
          <button className="refresh-btn" onClick={fetchAnalytics}>
            <i className="fas fa-sync-alt"></i> Refresh Data
          </button>
        </div>
      </header>
      
      <div className="analytics-navigation">
        <button 
          className={`nav-button ${activeView === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveView('overview')}
        >
          <i className="fas fa-th-large"></i> Overview
        </button>
        <button 
          className={`nav-button ${activeView === 'userActivity' ? 'active' : ''}`}
          onClick={() => setActiveView('userActivity')}
        >
          <i className="fas fa-users"></i> User Activity
        </button>
        <button 
          className={`nav-button ${activeView === 'contentPerformance' ? 'active' : ''}`}
          onClick={() => setActiveView('contentPerformance')}
        >
          <i className="fas fa-film"></i> Content Performance
        </button>
        <button 
          className={`nav-button ${activeView === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveView('reports')}
        >
          <i className="fas fa-file-alt"></i> Reports
        </button>
      </div>
      
      <div className="analytics-content">
        {activeView === 'overview' && renderOverview()}
        {activeView === 'userActivity' && renderUserActivity()}
        {activeView === 'contentPerformance' && renderContentPerformance()}
        {activeView === 'reports' && (
          <div className="reports-section">
            <h2>Download Reports</h2>
            <p>Generate and download platform reports</p>
            <div className="report-buttons">
              <button className="report-btn" onClick={() => downloadReport('user-activity')}>
                <i className="fas fa-users"></i> User Activity Report
              </button>
              <button className="report-btn" onClick={() => downloadReport('content-performance')}>
                <i className="fas fa-video"></i> Content Performance Report
              </button>
              <button className="report-btn" onClick={() => downloadReport('engagement')}>
                <i className="fas fa-comment"></i> Engagement Report
              </button>
              <button className="report-btn" onClick={() => downloadReport('growth')}>
                <i className="fas fa-chart-line"></i> Growth Metrics Report
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics; 