import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './UploadVideo.css';
import api from '../../utils/api';

const UploadVideo = () => {
  const navigate = useNavigate();
  const videoInputRef = useRef(null);
  const thumbnailInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    topic: '',
    branch: '',
    year: '',
    tags: [],
    visibility: 'public',
    videoFile: null,
    thumbnailFile: null
  });
  
  const [errors, setErrors] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState('');
  const [tagInput, setTagInput] = useState('');
  
  const branches = [
    { value: 'CSE', label: 'Computer Science Engineering (CSE)' },
    { value: 'CSE-AI', label: 'Computer Science Engineering-Artificial Intelligence (CSE-AI)' },
    { value: 'CSE-SF', label: 'Computer Science Engineering-Self Financed (CSE-SF)' },
    { value: 'ECE', label: 'Electronics & Communication (ECE)' },
    { value: 'EE', label: 'Electrical Engineering (EE)' },
    { value: 'ME', label: 'Mechanical Engineering (ME)' },
    { value: 'CHE', label: 'Chemical Engineering (CHE)' },
    { value: 'CE', label: 'Civil Engineering (CE)' }
  ];

  const subjects = [
    'Data Structures and Algorithms',
    'Database Management Systems',
    'Operating Systems',
    'Computer Networks',
    'Software Engineering',
    'Web Development',
    'Mobile App Development',
    'Cloud Computing',
    'Artificial Intelligence',
    'Machine Learning',
    'Deep Learning',
    'Computer Vision',
    'Natural Language Processing',
    'Cybersecurity',
    'Blockchain Technology',
    'Internet of Things',
    'Big Data Analytics',
    'DevOps',
    'System Design',
    'Programming Languages'
  ];

  const years = ['1st', '2nd', '3rd', '4th'];
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const handleTagInputChange = (e) => {
    setTagInput(e.target.value);
  };

  const handleTagInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (newTag && !formData.tags.includes(newTag)) {
        const updatedTags = [...formData.tags, newTag];
        console.log('Adding tag:', newTag, 'Updated tags:', updatedTags);
        setFormData({
          ...formData,
          tags: updatedTags
        });
        setTagInput('');
      }
    }
  };

  const removeTag = (tagToRemove) => {
    const updatedTags = formData.tags.filter(tag => tag !== tagToRemove);
    console.log('Removing tag:', tagToRemove, 'Updated tags:', updatedTags);
    setFormData({
      ...formData,
      tags: updatedTags
    });
  };
  
  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files.length === 0) return;
    
    const file = files[0];
    
    // Validate file type
    if (name === 'videoFile') {
      if (!file.type.startsWith('video/')) {
        setErrors({ ...errors, videoFile: 'Please upload a valid video file' });
        return;
      }
    } else if (name === 'thumbnailFile') {
      if (!file.type.startsWith('image/')) {
        setErrors({ ...errors, thumbnailFile: 'Please upload a valid image file' });
        return;
      }
    }
    
    setFormData({ ...formData, [name]: file });
    
    // Clear error
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!formData.subject) {
      newErrors.subject = 'Please select a subject';
    }
    
    if (!formData.topic.trim()) {
      newErrors.topic = 'Topic is required';
    }
    
    if (!formData.branch) {
      newErrors.branch = 'Please select a branch';
    }

    if (!formData.year) {
      newErrors.year = 'Please select a year';
    }
    
    if (!formData.videoFile) {
      newErrors.videoFile = 'Please upload a video file';
    }
    
    // Validate thumbnail if provided
    if (formData.thumbnailFile && !formData.thumbnailFile.type.startsWith('image/')) {
      newErrors.thumbnailFile = 'Please upload a valid image file';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    setUploadStage('video');
    
    try {
      // Create FormData object for video upload
      const formDataToSend = new FormData();
      formDataToSend.append('video', formData.videoFile);
      
      console.log('Starting video upload...', {
        fileName: formData.videoFile.name,
        fileSize: formData.videoFile.size,
        fileType: formData.videoFile.type
      });
      
      // Upload video first using the API utility
      const responseData = await api.post('videos/upload', formDataToSend, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });
      
      console.log('Video upload successful:', responseData);
      
      // Upload thumbnail if provided
      let thumbnailUrl = 'default-thumbnail.jpg';
      
      if (formData.thumbnailFile) {
        setUploadStage('thumbnail');
        setUploadProgress(0);
        console.log('Uploading thumbnail...', {
          fileName: formData.thumbnailFile.name,
          fileSize: formData.thumbnailFile.size,
          fileType: formData.thumbnailFile.type
        });
        
        const thumbnailFormData = new FormData();
        thumbnailFormData.append('thumbnail', formData.thumbnailFile);
        
        try {
          const thumbnailResponse = await api.post('videos/thumbnail', thumbnailFormData, {
            onUploadProgress: (progressEvent) => {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setUploadProgress(percentCompleted);
            },
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });
          
          console.log('Thumbnail upload successful:', thumbnailResponse);
          if (thumbnailResponse.data.success && thumbnailResponse.data.data.thumbnailUrl) {
            thumbnailUrl = thumbnailResponse.data.data.thumbnailUrl;
          } else {
            console.error('Thumbnail upload response does not contain expected data:', thumbnailResponse);
          }
        } catch (thumbnailError) {
          console.error('Thumbnail upload failed:', thumbnailError);
          console.error('Error details:', thumbnailError.response ? thumbnailError.response.data : 'No response data');
          // Continue with default thumbnail if upload fails
        }
      }
      
      setUploadStage('metadata');
      setUploadProgress(0);
      
      // Get the selected branch object
      const selectedBranch = branches.find(branch => branch.value === formData.branch);
      
      // Create video entry
      const videoData = {
        title: formData.title,
        description: formData.description,
        subject: formData.subject,
        topic: formData.topic,
        tags: formData.tags,
        videoUrl: responseData.data.videoUrl,
        thumbnailUrl: thumbnailUrl,
        duration: responseData.data.duration || 0,
        formats: responseData.data.formats || {},
        branch: formData.branch, // This is now the branch code (e.g., 'CSE')
        year: formData.year,
        specialAccess: formData.visibility === 'private' ? [] : [] // Empty array for now, can be populated later with specific users
      };
      
      console.log('Creating video entry with data:', videoData);
      console.log('Tags being sent:', formData.tags);
      
      // Create video entry using the API utility
      const createResponseData = await api.post('videos', videoData);
      
      console.log('Video entry created successfully:', createResponseData);
      
      // Show success message
      alert('Video uploaded successfully!');
      
      // Navigate to videos page on success
      navigate('/teacher/videos', { 
        state: { 
          successMessage: `"${formData.title}" has been successfully uploaded and is now available.`
        }
      });
    } catch (error) {
      console.error('Upload error:', error);
      setErrors({ submit: error.message });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setUploadStage('');
    }
  };
  
  const triggerFileInput = (inputRef) => {
    inputRef.current.click();
  };
  
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="upload-video-container">
      <div className="upload-header">
        <h1>Upload New Video</h1>
        <p>Share your knowledge with students around the world</p>
      </div>
      
      <form className="upload-form" onSubmit={handleSubmit}>
        <div className="form-columns">
          <div className="form-left">
            <div className="form-group">
              <label>
                Video Title <span className="required">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className={errors.title ? 'error' : ''}
                placeholder="Enter a descriptive title"
              />
              {errors.title && <div className="error-message">{errors.title}</div>}
              <div className="form-hint">A clear title helps students find your video</div>
            </div>
            
            <div className="form-group">
              <label>
                Description <span className="required">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className={errors.description ? 'error' : ''}
                rows="5"
                placeholder="Describe what students will learn from this video"
              ></textarea>
              {errors.description && <div className="error-message">{errors.description}</div>}
            </div>
            
            <div className="form-group">
              <label>
                Subject <span className="required">*</span>
              </label>
              <select
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                className={errors.subject ? 'error' : ''}
              >
                <option value="">Select a subject</option>
                {subjects.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
              {errors.subject && <div className="error-message">{errors.subject}</div>}
            </div>

            <div className="form-group">
              <label>
                Topic <span className="required">*</span>
              </label>
              <input
                type="text"
                name="topic"
                value={formData.topic}
                onChange={handleInputChange}
                className={errors.topic ? 'error' : ''}
                placeholder="Enter the specific topic of the video"
              />
              {errors.topic && <div className="error-message">{errors.topic}</div>}
            </div>

            <div className="form-group">
              <label>
                Branch <span className="required">*</span>
              </label>
              <select
                name="branch"
                value={formData.branch}
                onChange={handleInputChange}
                className={errors.branch ? 'error' : ''}
              >
                <option value="">Select a branch</option>
                {branches.map((branch) => (
                  <option key={branch.value} value={branch.value}>
                    {branch.label}
                  </option>
                ))}
              </select>
              {errors.branch && <div className="error-message">{errors.branch}</div>}
            </div>

            <div className="form-group">
              <label>
                Year <span className="required">*</span>
              </label>
              <select
                name="year"
                value={formData.year}
                onChange={handleInputChange}
                className={errors.year ? 'error' : ''}
              >
                <option value="">Select a year</option>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year} Year
                  </option>
                ))}
              </select>
              {errors.year && <div className="error-message">{errors.year}</div>}
            </div>
            
            <div className="form-group">
              <label>Tags</label>
              <div className="tags-input-container">
                <div className="tags-list">
                  {formData.tags.map((tag, index) => (
                    <span key={index} className="tag">
                      {tag}
                      <button
                        type="button"
                        className="remove-tag"
                        onClick={() => removeTag(tag)}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  value={tagInput}
                  onChange={handleTagInputChange}
                  onKeyDown={handleTagInputKeyDown}
                  placeholder="Type and press Enter to add tags"
                  className="tag-input"
                />
              </div>
              <div className="form-hint">Add relevant tags to help students find your video</div>
            </div>
          </div>
          
          <div className="form-right">
            <div className="form-group">
              <label>Video Visibility</label>
              <div className="radio-group">
                <div className="radio-option">
                  <input
                    type="radio"
                    id="public"
                    name="visibility"
                    value="public"
                    checked={formData.visibility === 'public'}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="public">
                    <strong>Public</strong>
                    <span>Anyone can view this video</span>
                  </label>
                </div>
                
                <div className="radio-option">
                  <input
                    type="radio"
                    id="unlisted"
                    name="visibility"
                    value="unlisted"
                    checked={formData.visibility === 'unlisted'}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="unlisted">
                    <strong>Unlisted</strong>
                    <span>Only people with the link can view</span>
                  </label>
                </div>
                
                <div className="radio-option">
                  <input
                    type="radio"
                    id="private"
                    name="visibility"
                    value="private"
                    checked={formData.visibility === 'private'}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="private">
                    <strong>Private</strong>
                    <span>Only you can view this video</span>
                  </label>
                </div>
              </div>
            </div>
            
            <div className="form-group">
              <label>
                Upload Video <span className="required">*</span>
              </label>
              <div 
                className={`file-upload-area ${errors.videoFile ? 'error' : ''}`}
                onClick={() => triggerFileInput(videoInputRef)}
              >
                <input
                  type="file"
                  ref={videoInputRef}
                  className="file-input"
                  name="videoFile"
                  accept="video/*"
                  onChange={handleFileChange}
                />
                
                <div className="upload-content">
                  {formData.videoFile ? (
                    <div className="file-info">
                      <div className="file-name">{formData.videoFile.name}</div>
                      <div className="file-size">{formatFileSize(formData.videoFile.size)}</div>
                    </div>
                  ) : (
                    <>
                      <div className="upload-icon">
                        <i className="fas fa-cloud-upload-alt"></i>
                      </div>
                      <div className="upload-text">
                        <span className="primary-text">Click to upload video</span>
                        <span className="secondary-text">MP4, WebM, or MOV (max 2GB)</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
              {errors.videoFile && <div className="error-message">{errors.videoFile}</div>}
            </div>
            
            <div className="form-group">
              <label>Thumbnail Image</label>
              <div className="thumbnail-section">
                <div className="thumbnail-preview">
                  {formData.thumbnailFile ? (
                    <img
                      src={URL.createObjectURL(formData.thumbnailFile)}
                      alt="Thumbnail preview"
                    />
                  ) : (
                    <div className="thumbnail-placeholder">No image selected</div>
                  )}
                </div>
                
                <div className="thumbnail-upload">
                  <div className="upload-btn-wrapper">
                    <button
                      type="button"
                      className="upload-btn-secondary"
                      onClick={() => triggerFileInput(thumbnailInputRef)}
                    >
                      {formData.thumbnailFile ? 'Change Thumbnail' : 'Upload Thumbnail'}
                    </button>
                    <input
                      type="file"
                      ref={thumbnailInputRef}
                      className="file-input"
                      name="thumbnailFile"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </div>
                  <div className="form-hint">Recommended size: 1280×720 (16:9)</div>
                  {errors.thumbnailFile && <div className="error-message">{errors.thumbnailFile}</div>}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {isUploading && (
          <div className="upload-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <div className="progress-text">
              {uploadStage === 'video' && (uploadProgress < 100 ? `Uploading video... ${uploadProgress}%` : 'Video upload complete!')}
              {uploadStage === 'thumbnail' && (uploadProgress < 100 ? `Uploading thumbnail... ${uploadProgress}%` : 'Thumbnail upload complete!')}
              {uploadStage === 'metadata' && 'Saving video information...'}
            </div>
          </div>
        )}
        
        <div className="form-actions">
          <button 
            type="button" 
            className="cancel-btn"
            onClick={() => navigate('/teacher/videos')}
            disabled={isUploading}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="submit-btn"
            disabled={isUploading}
          >
            {isUploading ? 'Uploading...' : 'Upload Video'}
          </button>
        </div>
        
        {errors.submit && (
          <div className="error-message submit-error">
            Error: {errors.submit}
          </div>
        )}
      </form>
    </div>
  );
};

export default UploadVideo; 