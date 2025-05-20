import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Pie } from 'react-chartjs-2';
import './Dashboard.css';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const AreaChart = ({ data, title }) => {
  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: title,
        data: data.values,
        fill: true,
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: title,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return <Line data={chartData} options={options} />;
};

const PieChart = ({ data, title }) => {
  const chartData = {
    labels: data.labels,
    datasets: [
      {
        data: data.values,
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: title,
      },
    },
  };

  return <Pie data={chartData} options={options} />;
};

const AdminDashboard = () => {
  const [statistics, setStatistics] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('7days');
  const [pendingTeachers, setPendingTeachers] = useState([]);
  const [chartData, setChartData] = useState({
    viewsByMonth: { labels: [], values: [] },
    usersByRole: { labels: [], values: [] },
    viewsByBranch: { labels: [], values: [] },
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        
        // Fetch admin stats
        const statsResponse = await fetch('/api/stats/admin', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });
        
        if (!statsResponse.ok) {
          throw new Error('Failed to fetch admin statistics');
        }
        
        const statsData = await statsResponse.json();
        
        if (!statsData.success) {
          throw new Error(statsData.error || 'Failed to fetch admin statistics');
        }
        
        setStatistics(statsData.data.overview);
        
        // Process chart data
        const viewsByMonth = statsData.data.analytics.viewsByMonth.map(item => ({
          label: `${item._id.year}-${item._id.month}`,
          value: item.views
        }));
        
        const usersByRole = statsData.data.overview.usersByRole.map(item => ({
          label: item._id,
          value: item.count
        }));
        
        const viewsByBranch = statsData.data.analytics.viewsByBranch.map(item => ({
          label: item._id,
          value: item.views
        }));
        
        setChartData({
          viewsByMonth: {
            labels: viewsByMonth.map(item => item.label),
            values: viewsByMonth.map(item => item.value)
          },
          usersByRole: {
            labels: usersByRole.map(item => item.label),
            values: usersByRole.map(item => item.value)
          },
          viewsByBranch: {
            labels: viewsByBranch.map(item => item.label),
            values: viewsByBranch.map(item => item.value)
          }
        });
        
        // Set recent activities
        setRecentActivities([
          ...statsData.data.recentActivity.views,
          ...statsData.data.recentActivity.likes,
          ...statsData.data.recentActivity.comments
        ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
        
        // Fetch pending teachers
        const teachersResponse = await fetch('/api/users?role=teacher&approved=false', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!teachersResponse.ok) {
          throw new Error('Failed to fetch pending teachers');
        }
        
        const teachersData = await teachersResponse.json();
        
        if (!teachersData.success) {
          throw new Error(teachersData.error || 'Failed to fetch pending teachers');
        }
        
        setPendingTeachers(teachersData.data || []);
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [timeRange]);

  // Handle teacher approval/rejection
  const handleTeacherApproval = async (userId, isApproved) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/users/approval/bulk', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userIds: [userId],
          isApproved
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update teacher status');
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to update teacher status');
      }
      
      setPendingTeachers(pendingTeachers.filter(teacher => teacher._id !== userId));
      alert(`Teacher ${isApproved ? 'approved' : 'rejected'} successfully`);
    } catch (error) {
      console.error('Error updating teacher status:', error);
      alert(error.message || 'Error updating teacher status');
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard data...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <div className="time-range-selector">
          <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
          </select>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Users</h3>
          <p>{statistics?.usersByRole?.reduce((sum, role) => sum + role.count, 0) || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Total Videos</h3>
          <p>{statistics?.videosByStatus?.reduce((sum, status) => sum + status.count, 0) || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Pending Approvals</h3>
          <p>{pendingTeachers.length}</p>
        </div>
        <div className="stat-card">
          <h3>Total Views</h3>
          <p>{statistics?.viewsByBranch?.reduce((sum, branch) => sum + branch.views, 0) || 0}</p>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-container">
          <AreaChart data={chartData.viewsByMonth} title="Views Over Time" />
        </div>
        <div className="chart-container">
          <PieChart data={chartData.usersByRole} title="Users by Role" />
        </div>
        <div className="chart-container">
          <PieChart data={chartData.viewsByBranch} title="Views by Branch" />
        </div>
      </div>

      <div className="dashboard-sections">
        <div className="pending-approvals">
          <h2>Pending Teacher Approvals</h2>
          {pendingTeachers.length > 0 ? (
            <div className="approval-list">
              {pendingTeachers.map(teacher => (
                <div key={teacher._id} className="approval-item">
                  <div className="teacher-info">
                    <img src={teacher.profilePicture} alt={teacher.name} />
                    <div>
                      <h4>{teacher.name}</h4>
                      <p>{teacher.email}</p>
                      <p>Department: {teacher.department}</p>
                    </div>
                  </div>
                  <div className="approval-actions">
                    <button
                      className="approve-btn"
                      onClick={() => handleTeacherApproval(teacher._id, true)}
                    >
                      Approve
                    </button>
                    <button
                      className="reject-btn"
                      onClick={() => handleTeacherApproval(teacher._id, false)}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>No pending approvals</p>
          )}
        </div>

        <div className="recent-activity">
          <h2>Recent Activity</h2>
          {recentActivities.length > 0 ? (
            <div className="activity-list">
              {recentActivities.map((activity, index) => (
                <div key={index} className="activity-item">
                  <div className="activity-icon">
                    {activity.type === 'view' && '👁️'}
                    {activity.type === 'like' && '❤️'}
                    {activity.type === 'comment' && '💬'}
                  </div>
                  <div className="activity-details">
                    <p>
                      <strong>{activity.user?.name}</strong>
                      {activity.type === 'view' && ' watched '}
                      {activity.type === 'like' && ' liked '}
                      {activity.type === 'comment' && ' commented on '}
                      <strong>{activity.video?.title}</strong>
                    </p>
                    <span className="activity-time">
                      {new Date(activity.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>No recent activity</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;