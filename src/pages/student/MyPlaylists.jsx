import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './MyPlaylists.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const MyPlaylists = () => {
  const { playlistId } = useParams();
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await axios.get(`${API_URL}/playlists`);
        
        if (response.data.success) {
          setPlaylists(response.data.data);
          
          // If a playlistId was provided in URL, select that playlist
          if (playlistId) {
            const foundPlaylist = response.data.data.find(p => p._id === playlistId);
            if (foundPlaylist) {
              // Fetch the detailed playlist with videos
              const detailResponse = await axios.get(`${API_URL}/playlists/${playlistId}`);
              if (detailResponse.data.success) {
                setSelectedPlaylist(detailResponse.data.data);
              }
            } else {
              // If playlist ID in URL is not found, redirect to playlists page
              navigate('/student/playlists');
            }
          } else if (response.data.data.length > 0) {
            // Otherwise select the first playlist if available
            const detailResponse = await axios.get(`${API_URL}/playlists/${response.data.data[0]._id}`);
            if (detailResponse.data.success) {
              setSelectedPlaylist(detailResponse.data.data);
            }
          }
        } else {
          throw new Error('Failed to fetch playlists');
        }
      } catch (err) {
        console.error('Error fetching playlists:', err);
        setError('Failed to load playlists. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPlaylists();
  }, [playlistId, navigate]);

  const handleCreatePlaylist = async (e) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    
    try {
      const response = await axios.post(`${API_URL}/playlists`, {
        name: newPlaylistName,
        description: newPlaylistDescription || 'No description'
      });
      
      if (response.data.success) {
        const newPlaylist = response.data.data;
        
        // Update playlists state
        setPlaylists([...playlists, newPlaylist]);
        setSelectedPlaylist(newPlaylist);
        
        // Reset form and close modal
        setNewPlaylistName('');
        setNewPlaylistDescription('');
        setShowCreateModal(false);
        
        // Update URL to include the new playlist ID
        navigate(`/student/playlists/${newPlaylist._id}`);
      } else {
        throw new Error('Failed to create playlist');
      }
    } catch (err) {
      console.error('Error creating playlist:', err);
      alert('Failed to create playlist. Please try again.');
    }
  };

  const handleRemoveVideo = async (videoId) => {
    if (!selectedPlaylist) return;
    
    if (window.confirm('Remove this video from the playlist?')) {
      try {
        const response = await axios.delete(`${API_URL}/playlists/${selectedPlaylist._id}/videos/${videoId}`);
        
        if (response.data.success) {
          // Refresh the selected playlist
          const detailResponse = await axios.get(`${API_URL}/playlists/${selectedPlaylist._id}`);
          if (detailResponse.data.success) {
            setSelectedPlaylist(detailResponse.data.data);
            
            // Also update the playlists list
            const playlistsResponse = await axios.get(`${API_URL}/playlists`);
            if (playlistsResponse.data.success) {
              setPlaylists(playlistsResponse.data.data);
            }
          }
        } else {
          throw new Error('Failed to remove video from playlist');
        }
      } catch (err) {
        console.error('Error removing video:', err);
        alert('Failed to remove video. Please try again.');
      }
    }
  };

  const handleDeletePlaylist = async () => {
    if (!selectedPlaylist) return;
    
    if (window.confirm(`Are you sure you want to delete the playlist "${selectedPlaylist.name}"?`)) {
      try {
        const response = await axios.delete(`${API_URL}/playlists/${selectedPlaylist._id}`);
        
        if (response.data.success) {
          // Filter out the deleted playlist
          const updatedPlaylists = playlists.filter(p => p._id !== selectedPlaylist._id);
          
          setPlaylists(updatedPlaylists);
          
          if (updatedPlaylists.length > 0) {
            // Select the first playlist
            const detailResponse = await axios.get(`${API_URL}/playlists/${updatedPlaylists[0]._id}`);
            if (detailResponse.data.success) {
              setSelectedPlaylist(detailResponse.data.data);
              navigate(`/student/playlists/${updatedPlaylists[0]._id}`);
            }
          } else {
            setSelectedPlaylist(null);
            navigate('/student/playlists');
          }
        } else {
          throw new Error('Failed to delete playlist');
        }
      } catch (err) {
        console.error('Error deleting playlist:', err);
        alert('Failed to delete playlist. Please try again.');
      }
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Format duration from seconds to MM:SS
  const formatDuration = (seconds) => {
    if (!seconds) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (loading) {
    return <div className="loading">Loading playlists...</div>;
  }

  return (
    <div className="playlists-container">
      {error && <div className="error-message">{error}</div>}
      
      {/* Sidebar with list of playlists */}
      <div className="playlists-sidebar">
        <div className="sidebar-header">
          <h2>My Playlists</h2>
          <button 
            className="create-playlist-btn"
            onClick={() => setShowCreateModal(true)}
          >
            Create New
          </button>
        </div>
        
        <div className="playlists-list">
          {playlists.length === 0 ? (
            <div className="no-playlists">
              <p>You have no playlists yet</p>
              <button 
                className="create-first-playlist-btn"
                onClick={() => setShowCreateModal(true)}
              >
                Create Your First Playlist
              </button>
            </div>
          ) : (
            playlists.map((playlist) => (
              <div 
                key={playlist._id}
                className={`playlist-item ${selectedPlaylist?._id === playlist._id ? 'active' : ''}`}
                onClick={() => {
                  navigate(`/student/playlists/${playlist._id}`);
                }}
              >
                <h3>{playlist.name}</h3>
                <div className="playlist-meta">
                  <span>{playlist.videoCount || 0} videos</span>
                  <span>Created: {formatDate(playlist.createdAt)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Main content showing selected playlist */}
      <div className="playlist-content">
        {selectedPlaylist ? (
          <>
            <div className="playlist-header">
              <div>
                <h1>{selectedPlaylist.name}</h1>
                <p className="playlist-description">{selectedPlaylist.description}</p>
                <p className="playlist-meta">
                  <span>{selectedPlaylist.videos?.length || 0} videos</span>
                  <span>Created: {formatDate(selectedPlaylist.createdAt)}</span>
                </p>
              </div>
              <button 
                className="delete-playlist-btn"
                onClick={handleDeletePlaylist}
              >
                Delete Playlist
              </button>
            </div>
            
            {!selectedPlaylist.videos || selectedPlaylist.videos.length === 0 ? (
              <div className="empty-playlist">
                <p>This playlist has no videos</p>
                <Link to="/student/search" className="browse-videos-btn">Browse Videos</Link>
              </div>
            ) : (
              <div className="playlist-videos">
                {selectedPlaylist.videos.map((video, index) => (
                  <div key={video._id} className="playlist-video-item">
                    <div className="video-number">{index + 1}</div>
                    <div className="video-thumbnail">
                      <Link to={`/student/watch/${video._id}`}>
                        <img src={video.thumbnailUrl || 'https://via.placeholder.com/240x135?text=No+Thumbnail'} alt={video.title} />
                        <span className="duration">{formatDuration(video.duration)}</span>
                      </Link>
                    </div>
                    <div className="video-details">
                      <Link to={`/student/watch/${video._id}`}>
                        <h3 className="video-title">{video.title}</h3>
                      </Link>
                      <p className="video-teacher">{video.teacher.name}</p>
                      <div className="video-meta">
                        <span>{video.views} views</span>
                        <span>{video.subject}</span>
                      </div>
                    </div>
                    <button 
                      className="remove-video-btn"
                      onClick={() => handleRemoveVideo(video._id)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="no-playlist-selected">
            <h2>No playlist selected</h2>
            <p>Please select a playlist from the sidebar or create a new one</p>
          </div>
        )}
      </div>
      
      {/* Create Playlist Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="create-playlist-modal">
            <h2>Create New Playlist</h2>
            <form onSubmit={handleCreatePlaylist}>
              <div className="form-group">
                <label htmlFor="playlist-name">Playlist Name</label>
                <input
                  id="playlist-name"
                  type="text"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="Enter playlist name"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="playlist-description">Description (optional)</label>
                <textarea
                  id="playlist-description"
                  value={newPlaylistDescription}
                  onChange={(e) => setNewPlaylistDescription(e.target.value)}
                  placeholder="Enter a description"
                  rows="3"
                />
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" disabled={!newPlaylistName.trim()}>
                  Create Playlist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyPlaylists; 