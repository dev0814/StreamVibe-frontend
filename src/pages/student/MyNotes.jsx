import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './MyNotes.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Quill modules and formats
const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'color': [] }, { 'background': [] }],
    ['link'],
    ['clean']
  ],
};

const quillFormats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'list', 'bullet',
  'color', 'background',
  'link'
];

const MyNotes = () => {
  const [notes, setNotes] = useState([]);
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [error, setError] = useState(null);
  const [showNewNoteModal, setShowNewNoteModal] = useState(false);
  const [newNoteData, setNewNoteData] = useState({ title: '', content: '' });
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'videos', 'standalone'

  // Fetch notes data when component mounts
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching notes from API...');
        const response = await axios.get(`${API_URL}/notes`);
        console.log('Notes API response:', response.data);
        
        if (response.data.success && Array.isArray(response.data.data)) {
          // Process notes to ensure safe access to video properties
          const processedNotes = response.data.data.map(note => {
            // Ensure video property is safe to access
            if (note.video === null || note.video === undefined) {
              return {
                ...note,
                video: null,
                // Ensure standalone notes have a title
                title: note.title || 'Untitled Note'
              };
            }
            return note;
          });
          
          console.log(`Processed ${processedNotes.length} notes`);
          setNotes(processedNotes);
          setFilteredNotes(processedNotes);
        } else {
          console.error('Unexpected API response format:', response.data);
          throw new Error('Failed to fetch notes: Invalid response format');
        }
      } catch (err) {
        console.error('Error fetching notes:', err);
        
        // Show more detailed error message
        const errorMessage = err.response?.data?.error || err.message || 'Failed to load notes';
        setError(`${errorMessage}. Please try again.`);
        
        // Set empty arrays to prevent further errors
        setNotes([]);
        setFilteredNotes([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchNotes();
  }, []);

  // Filter notes based on search term and active tab
  useEffect(() => {
    let filtered = notes;

    // Filter by tab
    if (activeTab === 'videos') {
      filtered = notes.filter(note => note.video);
    } else if (activeTab === 'standalone') {
      filtered = notes.filter(note => !note.video);
    }

    // Filter by search term
    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(note => {
        // Safely check title (might be missing for video notes)
        const matchesTitle = note.title && 
          typeof note.title === 'string' && 
          note.title.toLowerCase().includes(searchTerm.toLowerCase());
          
        // Safely check content
        const matchesContent = note.content && 
          typeof note.content === 'string' && 
          note.content.toLowerCase().includes(searchTerm.toLowerCase());
        
        // For video notes, also search video title (if video exists)
        const matchesVideoTitle = note.video && 
          note.video.title && 
          typeof note.video.title === 'string' && 
          note.video.title.toLowerCase().includes(searchTerm.toLowerCase());
        
        return matchesTitle || matchesContent || matchesVideoTitle;
      });
    }

    setFilteredNotes(filtered);
  }, [searchTerm, notes, activeTab]);

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle note selection
  const handleNoteSelect = (note) => {
    setSelectedNote(note);
    setEditedContent(note.content);
    setIsEditing(false);
  };

  // Handle edit note
  const handleEditNote = () => {
    setIsEditing(true);
  };

  // Handle save note
  const handleSaveNote = async () => {
    if (!selectedNote) return;
    
    try {
      const updateData = {
        content: editedContent
      };
      
      // Include the title for standalone notes
      if (!selectedNote.video) {
        updateData.title = selectedNote.title;
      }
      
      const response = await axios.put(`${API_URL}/notes/${selectedNote._id}`, updateData);
      
      if (response.data.success) {
        const updatedNote = response.data.data;
        
        // Update state
        const updatedNotes = notes.map(note => 
          note._id === updatedNote._id ? updatedNote : note
        );
        
        setNotes(updatedNotes);
        setSelectedNote(updatedNote);
        setIsEditing(false);
        
        // Show success message
        alert('Note saved successfully!');
      } else {
        throw new Error('Failed to update note');
      }
    } catch (err) {
      console.error('Error saving note:', err);
      alert('Failed to save note. Please try again.');
    }
  };

  // Handle delete note
  const handleDeleteNote = async () => {
    if (!selectedNote || !window.confirm('Are you sure you want to delete this note?')) return;
    
    try {
      const response = await axios.delete(`${API_URL}/notes/${selectedNote._id}`);
      
      if (response.data.success) {
        // Update state
        const updatedNotes = notes.filter(note => note._id !== selectedNote._id);
        setNotes(updatedNotes);
        setFilteredNotes(updatedNotes.filter(note => 
          (activeTab === 'all') || 
          (activeTab === 'videos' && note.video) || 
          (activeTab === 'standalone' && !note.video)
        ));
        setSelectedNote(null);
        
        // Show success message
        alert('Note deleted successfully!');
      } else {
        throw new Error('Failed to delete note');
      }
    } catch (err) {
      console.error('Error deleting note:', err);
      alert('Failed to delete note. Please try again.');
    }
  };

  // Create new standalone note
  const handleCreateNote = async () => {
    try {
      if (!newNoteData.title.trim()) {
        alert('Please enter a title for your note');
        return;
      }

      const response = await axios.post(`${API_URL}/notes`, {
        title: newNoteData.title,
        content: newNoteData.content || 'Empty note'
      });
      
      if (response.data.success) {
        const createdNote = response.data.data;
        
        // Update state
        const updatedNotes = [...notes, createdNote];
        setNotes(updatedNotes);
        
        // Update filtered notes based on active tab
        if (activeTab === 'all' || activeTab === 'standalone') {
          setFilteredNotes([...filteredNotes, createdNote]);
        }
        
        setSelectedNote(createdNote);
        setEditedContent(createdNote.content);
        setIsEditing(true);
        
        // Reset form and close modal
        setNewNoteData({ title: '', content: '' });
        setShowNewNoteModal(false);
        
        // Show success message
        alert('Note created successfully!');
      } else {
        throw new Error('Failed to create note');
      }
    } catch (err) {
      console.error('Error creating note:', err);
      alert('Failed to create note. Please try again.');
    }
  };

  if (loading) {
    return <div className="loading-spinner">Loading notes...</div>;
  }

  return (
    <div className="my-notes-container">
      {error && <div className="error-message">{error}</div>}
      
      <div className="notes-sidebar">
        <div className="notes-header">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            className="create-standalone-note" 
            onClick={() => setShowNewNoteModal(true)}
            title="Create new note"
          >
            + New Note
          </button>
        </div>

        <div className="notes-tabs">
          <button 
            className={activeTab === 'all' ? 'active' : ''} 
            onClick={() => setActiveTab('all')}
          >
            All Notes
          </button>
          <button 
            className={activeTab === 'videos' ? 'active' : ''} 
            onClick={() => setActiveTab('videos')}
          >
            Video Notes
          </button>
          <button 
            className={activeTab === 'standalone' ? 'active' : ''} 
            onClick={() => setActiveTab('standalone')}
          >
            My Notes
          </button>
        </div>

        <div className="notes-list">
          {filteredNotes.length === 0 ? (
            <div className="no-notes">
              {searchTerm ? "No notes match your search" : "You haven't created any notes yet"}
              {!searchTerm && (
                <div className="empty-action-buttons">
                  <Link to="/student/search" className="action-btn">
                    Watch videos to take notes
                  </Link>
                  <button 
                    className="action-btn" 
                    onClick={() => setShowNewNoteModal(true)}
                  >
                    Create a note
                  </button>
                </div>
              )}
            </div>
          ) : (
            filteredNotes.map(note => (
              <div 
                key={note._id} 
                className={`note-item ${selectedNote?._id === note._id ? 'active' : ''}`}
                onClick={() => handleNoteSelect(note)}
              >
                <div className="note-item-header">
                  {note.video ? (
                    <div className="video-thumbnail">
                      <img 
                        src={note.video.thumbnailUrl || 'https://via.placeholder.com/120x68?text=No+Thumbnail'} 
                        alt={note.video.title || 'Video thumbnail'} 
                      />
                    </div>
                  ) : (
                    <div className="note-icon">📝</div>
                  )}
                  <div className="note-item-title">
                    <h3>
                      {note.video ? 
                        (note.video.title || 'Untitled Video') : 
                        (note.title || 'Untitled Note')
                      }
                    </h3>
                    <span>
                      {note.video ? 
                        (note.video.teacher?.name || 'Unknown Teacher') : 
                        'Personal Note'
                      }
                    </span>
                  </div>
                </div>
                <div className="note-item-preview">
                  {/* Strip HTML tags for preview */}
                  {note.content ? 
                    note.content.replace(/<[^>]+>/g, '').substring(0, 100) + '...' : 
                    'No content'
                  }
                </div>
                <div className="note-item-footer">
                  <span>Updated: {formatDate(note.updatedAt || note.createdAt || new Date())}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="note-content">
        {selectedNote ? (
          <>
            <div className="note-header">
              <div className="note-header-info">
                <h2>
                  {selectedNote.video ? 
                    (selectedNote.video.title || 'Untitled Video') : 
                    (selectedNote.title || 'Untitled Note')
                  }
                </h2>
                <span>Last updated: {formatDate(selectedNote.updatedAt || selectedNote.createdAt || new Date())}</span>
              </div>
              <div className="note-actions">
                {isEditing ? (
                  <button className="btn save-btn" onClick={handleSaveNote}>
                    Save
                  </button>
                ) : (
                  <button className="btn edit-btn" onClick={handleEditNote}>
                    Edit
                  </button>
                )}
                <button className="btn delete-btn" onClick={handleDeleteNote}>
                  Delete
                </button>
                {selectedNote.video && selectedNote.video._id && (
                  <Link to={`/student/watch/${selectedNote.video._id}`} className="btn view-video-btn">
                    View Video
                  </Link>
                )}
              </div>
            </div>
            
            <div className="note-body">
              {isEditing ? (
                <div className="quill-container">
                  <ReactQuill 
                    theme="snow"
                    value={editedContent}
                    onChange={setEditedContent}
                    modules={quillModules}
                    formats={quillFormats}
                    placeholder="Edit your note..."
                  />
                </div>
              ) : (
                <div className="note-content-text" dangerouslySetInnerHTML={{ __html: selectedNote.content }}></div>
              )}
            </div>
          </>
        ) : (
          <div className="no-note-selected">
            <div className="placeholder-text">
              <h2>Select a note to view</h2>
              <p>Or create a new note to get started</p>
              <button 
                className="create-note-btn" 
                onClick={() => setShowNewNoteModal(true)}
              >
                Create New Note
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Note Modal */}
      {showNewNoteModal && (
        <div className="modal-overlay">
          <div className="create-note-modal">
            <h2>Create New Note</h2>
            <form onSubmit={(e) => { e.preventDefault(); handleCreateNote(); }}>
              <div className="form-group">
                <label htmlFor="note-title">Title</label>
                <input
                  id="note-title"
                  type="text"
                  value={newNoteData.title}
                  onChange={(e) => setNewNoteData({...newNoteData, title: e.target.value})}
                  placeholder="Enter note title"
                  required
                />
              </div>
              <div className="form-group" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <label htmlFor="note-content">Content</label>
                <div className="quill-container">
                  <ReactQuill 
                    theme="snow"
                    value={newNoteData.content}
                    onChange={(content) => setNewNoteData({...newNoteData, content})}
                    modules={quillModules}
                    formats={quillFormats}
                    placeholder="Enter note content..."
                  />
                </div>
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowNewNoteModal(false)}>
                  Cancel
                </button>
                <button type="submit" disabled={!newNoteData.title.trim()}>
                  Create Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyNotes; 