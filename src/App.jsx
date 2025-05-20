import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';

// Authentication Context
import { AuthProvider } from './contexts/AuthContext';

// Layouts
import PublicLayout from './components/layouts/PublicLayout';
import StudentLayout from './components/layouts/StudentLayout';
import TeacherLayout from './components/layouts/TeacherLayout';
import AdminLayout from './components/layouts/AdminLayout';

// Public Pages
import Home from './pages/common/Home';
import Login from './pages/common/Login';
import Register from './pages/common/Register';
import NotFound from './pages/common/NotFound';
import Profile from './pages/common/Profile';
import About from './pages/common/About';

// Student Pages
import StudentDashboard from './pages/student/Dashboard';
import VideoWatch from './pages/student/VideoWatch';
import MyNotes from './pages/student/MyNotes';
import MyPlaylists from './pages/student/MyPlaylists';
import History from './pages/student/History';
import StudentNotifications from './pages/student/Notifications';
import Search from './pages/student/Search';
import NoticeBoard from './pages/student/NoticeBoard';

// Teacher Pages
import TeacherDashboard from './pages/teacher/Dashboard';
import UploadVideo from './pages/teacher/UploadVideo';
import ManageVideos from './pages/teacher/ManageVideos';
import VideoDetail from './pages/teacher/VideoDetail';
import TeacherPlaylists from './pages/teacher/Playlists';
import Analytics from './pages/teacher/Analytics';
import PostNotice from './pages/teacher/PostNotice';
import TeacherNotifications from './pages/teacher/Notifications';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import UserManagement from './pages/admin/UserManagement';
import VideoManagement from './pages/admin/VideoManagement';
import CommentModeration from './pages/admin/CommentModeration';
import AdminAnalytics from './pages/admin/Analytics';
import ManageNotices from './pages/admin/ManageNotices';

// Protected Route Components
import ProtectedRoute from './components/common/ProtectedRoute';

// CSS
import './App.css';

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/about" element={<About />} />
          </Route>

          {/* Student Routes */}
          <Route
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/student/watch/:videoId" element={<VideoWatch />} />
            <Route path="/student/notes" element={<MyNotes />} />
            <Route path="/student/playlists" element={<MyPlaylists />} />
            <Route path="/student/playlists/:playlistId" element={<MyPlaylists />} />
            <Route path="/student/history" element={<History />} />
            <Route path="/student/notifications" element={<StudentNotifications />} />
            <Route path="/student/search" element={<Search />} />
            <Route path="/student/notices" element={<NoticeBoard />} />
            <Route path="/student/profile" element={<Profile />} />
          </Route>

          {/* Teacher Routes */}
          <Route
            element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <TeacherLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
            <Route path="/teacher/upload" element={<UploadVideo />} />
            <Route path="/teacher/videos" element={<ManageVideos />} />
            <Route path="/teacher/videos/:id" element={<VideoDetail />} />
            <Route path="/teacher/playlists" element={<TeacherPlaylists />} />
            <Route path="/teacher/playlists/:playlistId" element={<TeacherPlaylists />} />
            <Route path="/teacher/analytics" element={<Analytics />} />
            <Route path="/teacher/notice" element={<PostNotice />} />
            <Route path="/teacher/notifications" element={<TeacherNotifications />} />
            <Route path="/teacher/profile" element={<Profile />} />
          </Route>

          {/* Admin Routes */}
          <Route
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<UserManagement />} />
            <Route path="/admin/videos" element={<VideoManagement />} />
            <Route path="/admin/comments" element={<CommentModeration />} />
            <Route path="/admin/analytics" element={<AdminAnalytics />} />
            <Route path="/admin/notices" element={<ManageNotices />} />
            <Route path="/admin/profile" element={<Profile />} />
          </Route>

          {/* 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
