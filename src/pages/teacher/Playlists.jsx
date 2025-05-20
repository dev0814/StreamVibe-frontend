import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Playlists.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Playlists = () => {
  const [playlists, setPlaylists] = useState([]);
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
        
        const response = await axios.get(`${API_URL}/playlists/teacher`);
        
        if (response.data.success) {
          setPlaylists(response.data.data);
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
  }, []);

  const handleCreatePlaylist = async (e) => {
    e.preventDefault();
    
    if (!newPlaylistName.trim()) return;
    
    try {
      const response = await axios.post(`${API_URL}/playlists`, {
        name: newPlaylistName,
        description: newPlaylistDescription || 'No description'
      });
      
      if (response.data.success) {
        setPlaylists([...playlists, response.data.data]);
        setNewPlaylistName('');
        setNewPlaylistDescription('');
        setShowCreateModal(false);
      } else {
        throw new Error('Failed to create playlist');
      }
    } catch (err) {
      console.error('Error creating playlist:', err);
      alert('Failed to create playlist. Please try again.');
    }
  };

  const handleDeletePlaylist = async (playlistId) => {
    if (!window.confirm('Are you sure you want to delete this playlist?')) return;
    
    try {
      const response = await axios.delete(`${API_URL}/playlists/${playlistId}`);
      
      if (response.data.success) {
        setPlaylists(playlists.filter(playlist => playlist._id !== playlistId));
      } else {
        throw new Error('Failed to delete playlist');
      }
    } catch (err) {
      console.error('Error deleting playlist:', err);
      alert('Failed to delete playlist. Please try again.');
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return <div className="loading">Loading playlists...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="playlists-container">
      <div className="playlists-header">
        <h1>Course Playlists</h1>
        <button 
          className="create-playlist-btn"
          onClick={() => setShowCreateModal(true)}
        >
          Create New Playlist
        </button>
      </div>

      {playlists.length === 0 ? (
        <div className="empty-playlists">
          <p>You haven't created any playlists yet.</p>
          <button 
            className="create-first-playlist-btn"
            onClick={() => setShowCreateModal(true)}
          >
            Create Your First Playlist
          </button>
        </div>
      ) : (
        <div className="playlists-grid">
          {playlists.map(playlist => (
            <div className="playlist-card" key={playlist._id}>
              <div className="playlist-info">
                <h2>{playlist.name}</h2>
                <p className="playlist-description">{playlist.description}</p>
                <div className="playlist-meta">
                  <span>{playlist.videos?.length || 0} videos</span>
                  <span>Created: {formatDate(playlist.createdAt)}</span>
                  <span>{playlist.viewCount || 0} views</span>
                </div>
              </div>
              <div className="playlist-actions">
                <Link 
                  to={`/teacher/playlists/${playlist._id}`}
                  className="edit-btn"
                >
                  Edit
                </Link>
                <button 
                  className="delete-btn"
                  onClick={() => handleDeletePlaylist(playlist._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="modal-overlay">
          <div className="create-playlist-modal">
            <div className="modal-header">
              <h2>Create New Playlist</h2>
              <button 
                className="close-modal-btn"
                onClick={() => setShowCreateModal(false)}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleCreatePlaylist}>
              <div className="form-group">
                <label htmlFor="playlist-name">Playlist Name</label>
                <input 
                  type="text"
                  id="playlist-name"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="Enter playlist name"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="playlist-desc">Description (optional)</label>
                <textarea 
                  id="playlist-desc"
                  value={newPlaylistDescription}
                  onChange={(e) => setNewPlaylistDescription(e.target.value)}
                  placeholder="Enter a description for this playlist"
                  rows={4}
                ></textarea>
              </div>
              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="create-btn"
                  disabled={!newPlaylistName.trim()}
                >
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

export default Playlists; 