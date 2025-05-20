import React, { useState, useEffect, useRef, forwardRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import io from 'socket.io-client';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './VideoWatch.css';
import VideoPlayer from './VideoPlayer';
import ReportCommentModal from '../../components/ReportCommentModal';
import ViewReportModal from '../../components/ViewReportModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

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
  clipboard: {
    matchVisual: false
  }
};

const quillFormats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'list', 'bullet',
  'color', 'background',
  'link'
];

// Custom Quill Editor component to handle refs properly
const QuillEditor = forwardRef((props, ref) => {
  const { value, onChange, modules, formats, placeholder, className } = props;
  const editorRef = useRef(null);
  
  // Expose the editor instance through ref
  React.useImperativeHandle(ref, () => ({
    getEditor: () => editorRef.current?.getEditor(),
    focus: () => editorRef.current?.focus(),
  }));
  
  return (
    <ReactQuill
      ref={editorRef}
      theme="snow"
      value={value}
      onChange={onChange}
      modules={modules}
      formats={formats}
      placeholder={placeholder}
      className={className}
    />
  );
});

QuillEditor.displayName = 'QuillEditor';

const VideoWatch = () => {
  const { videoId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [video, setVideo] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [savedNotes, setSavedNotes] = useState('');
  const [currentTime, setCurrentTime] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);
  const videoRef = useRef(null);
  const [activeTab, setActiveTab] = useState('comments'); // 'comments', 'qa'
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [expandedQuestionId, setExpandedQuestionId] = useState(null);
  const [newAnswer, setNewAnswer] = useState('');
  const [useProxyUrl, setUseProxyUrl] = useState(true); // Default to proxy URL for better compatibility
  const [videoSource, setVideoSource] = useState(null);
  const [videoErrorCount, setVideoErrorCount] = useState(0);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showSpeedOptions, setShowSpeedOptions] = useState(false);
  const menuRef = useRef(null);
  const [controlsVisible, setControlsVisible] = useState(true);
  const controlsTimeoutRef = useRef(null);
  const [likes, setLikes] = useState([]);
  const [showLikes, setShowLikes] = useState(false);
  const [replyToComment, setReplyToComment] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const quillRef = useRef(null);
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSaveStatus, setNotesSaveStatus] = useState(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [commentToReport, setCommentToReport] = useState(null);
  const [reportedComments, setReportedComments] = useState([]);
  const [viewReportModalOpen, setViewReportModalOpen] = useState(false);
  const [commentToViewReport, setCommentToViewReport] = useState(null);

  console.log('VideoWatch mounted', { videoId });

  // Get the proxy URL for the video
  const getProxyUrl = () => {
    return `${API_URL}/videos/proxy/${videoId}`;
  };
  
  // Initialize socket connection
  useEffect(() => {
    let newSocket;
    try {
      console.log('Initializing socket connection to:', SOCKET_URL);
      newSocket = io(SOCKET_URL, {
        reconnectionAttempts: 5,
        timeout: 10000,
        // Add error handling to prevent connection issues from causing redirects
        transports: ['websocket', 'polling']
      });
      
      newSocket.on('connect_error', (err) => {
        console.warn('Socket connection error:', err.message);
        // Don't fail the whole component for socket errors
      });
      
      newSocket.on('error', (err) => {
        console.warn('Socket general error:', err);
        // Don't fail the whole component for socket errors
      });
      
      setSocket(newSocket);
    } catch (err) {
      console.error('Socket initialization error:', err);
      // Don't set the socket if there's an error, but don't crash either
    }

    return () => {
      if (newSocket) {
        try {
          newSocket.disconnect();
        } catch (err) {
          console.error('Error disconnecting socket:', err);
        }
      }
    };
  }, []);

  // Prevent automatic redirection issue
  useEffect(() => {
    // This will capture any navigation attempts that might be happening elsewhere
    const preventRedirect = (e) => {
      if (e.currentTarget.location.pathname.includes('/student/dashboard')) {
        console.log('Preventing automatic redirection to dashboard');
        e.stopImmediatePropagation();
        e.preventDefault();
        return false;
      }
    };

    // Add the event listener for a short period after mounting
    window.addEventListener('beforeunload', preventRedirect);
    
    // Remove it after 5 seconds (by then legitimate redirects should be fine)
    const timeout = setTimeout(() => {
      window.removeEventListener('beforeunload', preventRedirect);
    }, 5000);

    return () => {
      window.removeEventListener('beforeunload', preventRedirect);
      clearTimeout(timeout);
    };
  }, []);

  // Join video room for real-time comments
  useEffect(() => {
    if (socket && videoId) {
      socket.emit('joinVideoRoom', videoId);

      socket.on('commentReceived', (data) => {
        // Add new comments only at the top level (if they don't have a parent)
        if (!data.comment.parentComment) {
          setComments(prevComments => [data.comment, ...prevComments]);
        }
      });

      socket.on('commentReplyReceived', (data) => {
        setComments(prevComments => 
          prevComments.map(comment => {
            if (comment._id === data.parentCommentId) {
              // Initialize replies array if it doesn't exist
              const replies = comment.replies || [];
              return { 
                ...comment, 
                replies: [...replies, data.reply] 
              }; 
            }
            return comment;
          })
        );
      });

      socket.on('commentDeleted', (data) => {
        setComments(prevComments => 
          prevComments.filter(comment => comment._id !== data.commentId)
        );
      });

      socket.on('replyDeleted', (data) => {
        setComments(prevComments => 
          prevComments.map(comment => {
            if (comment._id === data.commentId) {
              return {
                ...comment,
                replies: comment.replies.filter(reply => reply._id !== data.replyId)
              };
            }
            return comment;
          })
        );
      });

      socket.on('questionReceived', (data) => {
        setQuestions(prevQuestions => [data.question, ...prevQuestions]);
      });

      socket.on('answerReceived', (data) => {
        setQuestions(prevQuestions => 
          prevQuestions.map(q => 
            q._id === data.questionId 
              ? { ...q, answers: [...(q.answers || []), data.answer] } 
              : q
          )
        );
      });

      return () => {
        if (socket) {
          // Remove all socket event listeners
          socket.off('commentReceived');
          socket.off('commentReplyReceived');
          socket.off('commentDeleted');
          socket.off('replyDeleted');
          socket.off('questionReceived');
          socket.off('answerReceived');
          
          // Leave the video room before disconnecting
          socket.emit('leaveVideoRoom', videoId);
          
          // Disconnect the socket
          socket.disconnect();
        }
      };
    }
  }, [socket, videoId]);

  // Update video source when video or useProxyUrl changes
  useEffect(() => {
    if (video && video.videoUrl) {
      let source;
      if (useProxyUrl) {
        source = getProxyUrl();
        console.log('Using proxy URL:', source);
      } else if (video.optimizedVideoUrl) {
        // Use optimized URL if available
        source = video.optimizedVideoUrl;
        console.log('Using optimized video URL:', source);
      } else {
        // Fall back to regular URL with proper transformations for better compatibility
        try {
          const urlParts = video.videoUrl.split('/upload/');
          if (urlParts.length === 2 && video.videoUrl.includes('cloudinary.com')) {
            source = `${urlParts[0]}/upload/q_auto/f_auto/${urlParts[1]}`;
            console.log('Using optimized video URL with q_auto/f_auto transformations:', source);
          } else {
            source = video.videoUrl;
            console.log('Using regular video URL:', source);
          }
        } catch (err) {
          source = video.videoUrl;
          console.log('Error optimizing URL, using original:', source);
        }
      }
      
      // Validate URL before setting
      if (!source || !isValidUrl(source)) {
        console.error('Invalid video URL:', source);
        setError('The video URL is invalid. Please try a different source.');
      } else {
        setVideoSource(source);
        console.log('Video source updated:', source);
        
        // Reset error state when changing source
        setError(null);
        setVideoErrorCount(0);
      }
    } else {
      console.error('Video object or videoUrl is missing:', video);
    }
  }, [video, useProxyUrl]);

  // Check if a URL is valid
  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };
  
  // Play video directly with the original URL
  const playDirectUrl = () => {
    if (video && video.videoUrl && isValidUrl(video.videoUrl)) {
      console.log('Playing with direct URL from database:', video.videoUrl);
      setVideoSource(video.videoUrl);
      setError(null);
      setVideoErrorCount(0);
      
      if (videoRef.current) {
        if (videoRef.current.videoElement) {
          videoRef.current.videoElement.load();
          videoRef.current.videoElement.play().catch(err => {
            console.error('Error playing video with direct URL:', err);
            setError('Error playing with direct URL: ' + err.message);
          });
        } else {
          // Fall back to using the component methods exposed via useImperativeHandle
          videoRef.current.load && videoRef.current.load();
          videoRef.current.play && videoRef.current.play().catch(err => {
            console.error('Error playing video with direct URL:', err);
            setError('Error playing with direct URL: ' + err.message);
          });
        }
      }
    } else {
      setError('The original video URL is invalid or missing.');
    }
  };

  // Fetch video likes
  const fetchLikes = async () => {
    try {
      const response = await axios.get(`${API_URL}/videos/${videoId}/likes`);
      setLikes(response.data.data || []);
      setIsLiked(response.data.userLiked || false);
    } catch (err) {
      console.error("Error fetching likes:", err);
      // Set default values if the API fails
      setLikes([]);
      setIsLiked(false);
    }
  };

  // Fetch reported comments for the current user
  const fetchReportedComments = async () => {
    try {
      // Get all comments for this video
      const commentIds = comments.map(comment => comment._id);
      
      // Add reply IDs
      comments.forEach(comment => {
        if (comment.replies && comment.replies.length > 0) {
          comment.replies.forEach(reply => {
            commentIds.push(reply._id);
          });
        }
      });
      
      // If no comments yet, return
      if (commentIds.length === 0) return;
      
      // Check which comments the user has already reported
      const reportedIds = [];
      
      // For each comment, check if user has reported it
      for (const commentId of commentIds) {
        try {
          const response = await axios.get(`${API_URL}/reports/check/${commentId}`);
          if (response.data.hasReported) {
            reportedIds.push(commentId);
          }
        } catch (err) {
          console.error(`Error checking report status for comment ${commentId}:`, err);
        }
      }
      
      setReportedComments(reportedIds);
    } catch (err) {
      console.error("Error fetching reported comments:", err);
    }
  };

  // Fetch Video Data
  useEffect(() => {
    const fetchVideoData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Make sure video ID exists
        if (!videoId || videoId === 'undefined') {
          throw new Error('Invalid video ID');
        }

        // Fetch the video data
        const videoResponse = await axios.get(`${API_URL}/videos/${videoId}`);
        const videoData = videoResponse.data.data;
        
        if (!videoData) {
          throw new Error('Video not found');
        }

        console.log('Video data fetched successfully:', videoData);
        setVideo(videoData);

        // Set video source initially to null
        setVideoSource(null);
        
        // Fetch likes for this video
        await fetchLikes();

        // Fetch comments
        const commentsResponse = await axios.get(`${API_URL}/videos/${videoId}/comments?includeReplies=true`);
        // Make sure we get properly structured comments with replies nested
        const structuredComments = commentsResponse.data.data.filter(comment => !comment.parentComment);
        
        // Process any replies and add them to their parent comments
        const replies = commentsResponse.data.data.filter(comment => comment.parentComment);
        replies.forEach(reply => {
          const parentComment = structuredComments.find(c => c._id === reply.parentComment);
          if (parentComment) {
            if (!parentComment.replies) parentComment.replies = [];
            parentComment.replies.push(reply);
          }
        });
        
        setComments(structuredComments);

        // Fetch questions for this video
        try {
          const questionsResponse = await axios.get(`${API_URL}/questions?video=${videoId}`);
          setQuestions(questionsResponse.data.data);
        } catch (questionsErr) {
          console.error("Error fetching questions:", questionsErr);
          // Don't fail if questions can't be fetched, just set an empty array
          setQuestions([]);
        }

        // Fetch user's playlists
        const playlistsResponse = await axios.get(`${API_URL}/playlists`);
        setPlaylists(playlistsResponse.data.data);

        // Check if user has already liked this video
        try {
          const likeCheckResponse = await axios.get(`${API_URL}/videos/${videoId}/likes?checkUserLike=true`);
          setIsLiked(likeCheckResponse.data.userLiked);
        } catch (likeErr) {
          console.error("Error checking like status:", likeErr);
        }

        // Check if user has notes for this video
        try {
          const notesResponse = await axios.get(`${API_URL}/notes?video=${videoId}`);
          if (notesResponse.data.data.length > 0) {
            setNotes(notesResponse.data.data[0].content);
            setSavedNotes(notesResponse.data.data[0].content);
          }
        } catch (notesErr) {
          console.error("Error fetching notes:", notesErr);
        }
        
        // Record a view for this video (only if it's a new session)
        try {
          console.log('Attempting to record view for video:', videoId);
          const viewResponse = await axios.post(`${API_URL}/views`, { 
            videoId,
            watchTime: 0,
            completionPercentage: 0,
            lastPosition: 0
          });
          console.log('View recorded successfully:', viewResponse.data);
        } catch (viewErr) {
          console.error("Error recording view:", viewErr);
          console.error("Error details:", {
            status: viewErr.response?.status,
            message: viewErr.response?.data?.error || viewErr.message,
            endpoint: `${API_URL}/views`
          });
          // Don't fail if view recording fails
        }

        // Fetch reported comments for the current user
        await fetchReportedComments();

        setIsLoading(false);
      } catch (err) {
        console.error("Error fetching video:", err);
        setError(err.response?.data?.error || err.message || 'An error occurred');
        setIsLoading(false);
      }
    };

    fetchVideoData();
  }, [videoId]);

  // Fetch reported comments when comments change
  useEffect(() => {
    if (comments.length > 0 && currentUser) {
      fetchReportedComments();
    }
  }, [comments]);

  // Handle video time update
  const handleTimeUpdate = (time) => {
    setCurrentTime(time);

    // Update view statistics every 30 seconds of watching
    const isThirtySecondInterval = Math.floor(time) % 30 === 0 && time > 0;
    if (isThirtySecondInterval && video && video.duration) {
      updateViewStatistics(time);
    }
  };

  // Update view statistics
  const updateViewStatistics = async (currentTime) => {
    if (!video || !videoId) return;
    
    try {
      // Calculate completion percentage
      const completionPercentage = Math.min(100, Math.round((currentTime / video.duration) * 100));
      
      console.log('Updating view statistics:', {
        videoId,
        currentTime: Math.round(currentTime),
        completionPercentage
      });
      
      const response = await axios.post(`${API_URL}/views`, {
        videoId,
        watchTime: Math.round(currentTime),
        completionPercentage,
        lastPosition: Math.round(currentTime)
      });
      
      console.log('View statistics updated successfully:', response.data);
    } catch (err) {
      console.error('Error updating view statistics:', err);
      console.error('Error details:', {
        status: err.response?.status,
        message: err.response?.data?.error || err.message,
        endpoint: `${API_URL}/views`,
        data: {
          videoId,
          watchTime: Math.round(currentTime || 0)
        }
      });
      // Just log the error, don't disrupt the user experience
    }
  };

  // Handle video error
  const handleVideoError = (e) => {
    console.error("Video error:", e);
    
    setVideoErrorCount(prevCount => prevCount + 1);
    
    // Try different strategies based on error count
    if (videoErrorCount === 0) {
      // First error - Try the exact backend optimized URL format as first attempt
      if (video.videoUrl) {
        try {
          const urlParts = video.videoUrl.split('/upload/');
          if (urlParts.length === 2) {
            // Use more compatible transformations: q_auto/f_auto instead of sp_hd/vc_auto/q_auto
            const backendOptimizedUrl = `${urlParts[0]}/upload/q_auto/f_auto/${urlParts[1]}`;
            console.log("Trying compatible optimized URL:", backendOptimizedUrl);
            setVideoSource(backendOptimizedUrl);
          }
        } catch (err) {
          console.error("Error creating optimized URL:", err);
        }
      }
    } else if (videoErrorCount === 1) {
      // Second error - try direct URL
      console.log("Switching to direct URL");
      setUseProxyUrl(false);
    } else if (videoErrorCount === 2) {
      // Third error - try raw database URL as last resort
      console.log("Trying raw database URL");
      setVideoSource(video.videoUrl);
    } else {
      // Multiple errors - show error message with fallback options
      setError(`Error playing video: ${e && e.message ? e.message : 'Unknown error'}`);
      // Offer to try Cloudinary player if it's a Cloudinary video
      if (video.videoUrl && video.videoUrl.includes('cloudinary.com')) {
        console.log("Offering Cloudinary player as fallback");
        setTimeout(() => {
          if (confirm("Would you like to try using the Cloudinary player instead?")) {
            tryCloudinaryPlayer();
          }
        }, 500);
      }
    }
  };

  // Handle video loaded successfully
  const handleVideoLoaded = () => {
    console.log("Video loaded successfully");
    setError(null);
    setVideoErrorCount(0);
  };

  // Test different video sources
  const testVideoSource = (source) => {
    if (source === 'direct' && video.videoUrl) {
      setUseProxyUrl(false);
      setError(null);
      console.log("Testing direct URL");
    } else if (source === 'proxy') {
      setUseProxyUrl(true);
      setError(null);
      console.log("Testing proxy URL");
    } else if (source === 'optimized' && video.optimizedVideoUrl) {
      // Set a custom source directly
      setVideoSource(video.optimizedVideoUrl);
      setError(null);
      console.log("Testing optimized URL directly");
    } else if (source === 'database' && video.videoUrl) {
      // Use the raw database URL directly
      console.log("Testing raw database URL:", video.videoUrl);
      setVideoSource(video.videoUrl);
      setError(null);
      setVideoErrorCount(0);
    }
  };

  // Handle comment submission
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const response = await axios.post(`${API_URL}/comments`, {
        content: newComment,
        videoId: videoId
      });

      const newCommentObj = response.data.data;
      
      // Emit new comment to all users viewing this video
      if (socket) {
        socket.emit('newComment', {
          videoId,
          comment: newCommentObj
        });
      }

      setComments([newCommentObj, ...comments]);
      setNewComment('');
    } catch (err) {
      console.error("Error posting comment:", err);
      alert('Failed to post comment. Please try again.');
    }
  };

  // Handle reply submission
  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyContent.trim() || !replyToComment) return;

    try {
      const response = await axios.post(`${API_URL}/comments`, {
        content: replyContent,
        videoId: videoId,
        parentComment: replyToComment._id
      });

      const newReplyObj = response.data.data;
      
      // Emit new reply to all users viewing this video
      if (socket) {
        socket.emit('commentReplyReceived', {
          videoId,
          parentCommentId: replyToComment._id,
          reply: newReplyObj
        });
      }

      // Update comments state with the new reply
      setComments(prevComments => 
        prevComments.map(comment => {
          // Check if this is the parent comment
          if (comment._id === replyToComment._id) {
            // Initialize replies array if it doesn't exist
            const replies = comment.replies || [];
            return { 
              ...comment, 
              replies: [...replies, newReplyObj] 
            };
          }
          return comment;
        })
      );
      
      // Clear reply form
      setReplyContent('');
      setReplyToComment(null);
    } catch (err) {
      console.error("Error posting reply:", err);
      alert('Failed to post reply. Please try again.');
    }
  };

  // Cancel reply
  const handleCancelReply = () => {
    setReplyToComment(null);
    setReplyContent('');
  };

  // Handle opening the report modal
  const handleOpenReportModal = (comment) => {
    setCommentToReport(comment);
    setReportModalOpen(true);
  };

  // Handle opening the view report modal
  const handleOpenViewReportModal = (comment) => {
    setCommentToViewReport(comment);
    setViewReportModalOpen(true);
  };

  // Handle closing the view report modal
  const handleCloseViewReportModal = (wasDeleted) => {
    if (wasDeleted && commentToViewReport) {
      // Remove from reported comments if deleted
      setReportedComments(prev => prev.filter(id => id !== commentToViewReport._id));
    }
    setViewReportModalOpen(false);
    setCommentToViewReport(null);
  };

  // Handle successful report submission
  const handleReportSuccess = () => {
    // Add the reported comment to the list of reported comments
    setReportedComments(prev => [...prev, commentToReport._id]);
    // Close the modal
    setReportModalOpen(false);
    // Clear the comment to report
    setCommentToReport(null);
  };

  // Handle report cancellation
  const handleReportCancel = () => {
    // If commentToReport is still in the state, remove it from reportedComments
    if (commentToReport) {
      setReportedComments(prev => prev.filter(id => id !== commentToReport._id));
    }
    // Close the modal
    setReportModalOpen(false);
    // Clear the comment to report
    setCommentToReport(null);
  };

  // Handle comment deletion
  const handleDeleteComment = async (commentId) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    
    try {
      await axios.delete(`${API_URL}/comments/${commentId}`);
      
      // Update comments state by filtering out the deleted comment
      setComments(prevComments => 
        prevComments.filter(comment => comment._id !== commentId)
      );
      
      // If the comment has replies, those will be deleted on the backend
      
      // Emit comment deletion to all users viewing this video
      if (socket) {
        socket.emit('commentDeleted', {
          videoId,
          commentId
        });
      }
    } catch (err) {
      console.error("Error deleting comment:", err);
      alert('Failed to delete comment. Please try again.');
    }
  };
  
  // Handle reply deletion
  const handleDeleteReply = async (commentId, replyId) => {
    if (!confirm('Are you sure you want to delete this reply?')) return;
    
    try {
      await axios.delete(`${API_URL}/comments/${replyId}`);
      
      // Update comments state by filtering out the deleted reply
      setComments(prevComments => 
        prevComments.map(comment => {
          if (comment._id === commentId) {
            return {
              ...comment,
              replies: comment.replies.filter(reply => reply._id !== replyId)
            };
          }
          return comment;
        })
      );
      
      // Emit reply deletion to all users viewing this video
      if (socket) {
        socket.emit('replyDeleted', {
          videoId,
          commentId,
          replyId
        });
      }
    } catch (err) {
      console.error("Error deleting reply:", err);
      alert('Failed to delete reply. Please try again.');
    }
  };

  // Handle question submission
  const handleQuestionSubmit = async (e) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;

    try {
      const response = await axios.post(`${API_URL}/questions`, {
        content: newQuestion,
        video: videoId,
        timestamp: currentTime
      });

      const newQuestionObj = response.data.data;
      
      // Emit new question to all users viewing this video
      if (socket) {
        socket.emit('newQuestion', {
          videoId,
          question: newQuestionObj
        });
      }

      setQuestions([newQuestionObj, ...questions]);
      setNewQuestion('');
    } catch (err) {
      console.error("Error posting question:", err);
      alert('Failed to post question. Please try again later.');
      // Don't clear the question text so user can try again
    }
  };

  // Handle answer submission
  const handleAnswerSubmit = async (questionId) => {
    if (!newAnswer.trim()) return;

    try {
      const response = await axios.post(`${API_URL}/questions/${questionId}/answers`, {
        content: newAnswer
      });

      const newAnswerObj = response.data.data;
      
      // Emit new answer to all users viewing this video
      if (socket) {
        socket.emit('newAnswer', {
          videoId,
          questionId,
          answer: newAnswerObj
        });
      }

      // Update the questions state with the new answer
      setQuestions(questions.map(q => 
        q._id === questionId 
          ? { ...q, answers: [...(q.answers || []), newAnswerObj] } 
          : q
      ));
      
      setNewAnswer('');
    } catch (err) {
      console.error("Error posting answer:", err);
      alert('Failed to post answer. Please try again later.');
      // Don't clear the answer text so user can try again
    }
  };

  // Handle note saving
  const handleSaveNotes = async () => {
    try {
      // Show a saving indicator
      setSavingNotes(true);
      
      // Either update existing notes or create new ones
      const response = await axios.post(`${API_URL}/notes`, {
        content: notes,
        videoId: videoId,
        timestamp: currentTime
      });

      setSavedNotes(notes);
      
      // Show success message
      setNotesSaveStatus({ type: 'success', message: 'Notes saved successfully!' });
      
      // Clear the status message after a delay
      setTimeout(() => {
        setNotesSaveStatus(null);
      }, 3000);
    } catch (err) {
      console.error("Error saving notes:", err);
      
      // Get detailed error message from response if available
      const errorMessage = err.response?.data?.error || 'Failed to save notes. Please try again.';
      console.log("Detailed error message:", errorMessage);
      
      // Show error message
      setNotesSaveStatus({ type: 'error', message: errorMessage });
      
      // Clear the error message after a delay
      setTimeout(() => {
        setNotesSaveStatus(null);
      }, 8000); // Longer timeout for error messages
    } finally {
      setSavingNotes(false);
    }
  };

  // Add timestamp to notes
  const addTimestampToNotes = () => {
    if (!quillRef.current) return;

    // Format the timestamp as [MM:SS]
    const timestamp = `[${formatTime(currentTime)}] `;
    
    // Get the Quill editor instance from the ref
    const editor = quillRef.current.getEditor();
    
    // Get current cursor position
    const range = editor.getSelection();
    
    if (range) {
      // If user has selected a position, insert timestamp there
      editor.insertText(range.index, timestamp);
    } else {
      // If no selection, add to the end of the document
      const length = editor.getLength();
      // If there's already content, add a newline first
      if (length > 1) { // Length is 1 for an empty document (includes trailing newline)
        editor.insertText(length - 1, `\n${timestamp}`);
      } else {
        editor.insertText(0, timestamp);
      }
    }
    
    // Focus editor after inserting timestamp
    editor.focus();
  };

  // Handle video like/unlike
  const handleLikeVideo = async () => {
    try {
      // Optimistically update the UI first
      const wasLiked = isLiked;
      setIsLiked(!wasLiked);
      
      // Update likes count in the UI optimistically
      if (video && video.likes !== undefined) {
        const newLikesCount = wasLiked ? video.likes - 1 : video.likes + 1;
        setVideo({...video, likes: newLikesCount});
      }
      
      // Now make the API call
      const response = await axios.put(`${API_URL}/videos/${videoId}/like`);
      const { liked } = response.data.data || { liked: !wasLiked };
      
      // If the server response doesn't match our optimistic update, revert
      if (liked !== !wasLiked) {
        setIsLiked(liked);
        
        // Also revert the likes count
        if (video && video.likes !== undefined) {
          const serverLikesCount = liked ? 
            (wasLiked ? video.likes : video.likes + 1) : 
            (wasLiked ? video.likes - 1 : video.likes);
          setVideo({...video, likes: serverLikesCount});
        }
      }
      
      // Fetch updated likes in the background
      fetchLikes();
    } catch (err) {
      console.error("Error liking video:", err);
      
      // Revert optimistic update on error
      setIsLiked(isLiked); // Revert to previous state
      
      // Also revert the likes count
      if (video && video.likes !== undefined) {
        const originalVideo = {...video};
        setVideo(originalVideo);
      }
      
      alert('Failed to like video. Please try again.');
    }
  };

  // Handle adding video to playlist
  const handleAddToPlaylist = async (playlistId) => {
    try {
      await axios.post(`${API_URL}/playlists/${playlistId}/videos`, {
        videoId
      });
      setShowPlaylistModal(false);
      alert('Video added to playlist successfully!');
    } catch (err) {
      console.error("Error adding to playlist:", err);
      alert('Failed to add video to playlist. Please try again.');
    }
  };

  // Handle playback rate change
  const handlePlaybackRateChange = (rate) => {
    setPlaybackRate(rate);
    if (videoRef.current && videoRef.current.videoElement) {
      videoRef.current.videoElement.playbackRate = rate;
    }
    // Close menus after selection
    setShowSpeedOptions(false);
    setShowSettingsMenu(false);
  };

  // Toggle picture-in-picture mode
  const togglePictureInPicture = async () => {
    try {
      if (videoRef.current && videoRef.current.videoElement) {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
        } else {
          await videoRef.current.videoElement.requestPictureInPicture();
        }
      }
      // Close settings menu after action
      setShowSettingsMenu(false);
    } catch (error) {
      console.error("Picture-in-Picture failed:", error);
      // Show error message to user
      alert("Picture-in-Picture mode is not supported in your browser.");
    }
  };
  
  // Toggle full screen
  const toggleFullScreen = () => {
    try {
      const videoContainer = document.querySelector('.video-player-container');
      
      if (!document.fullscreenElement) {
        if (videoContainer.requestFullscreen) {
          videoContainer.requestFullscreen();
        } else if (videoContainer.webkitRequestFullscreen) { /* Safari */
          videoContainer.webkitRequestFullscreen();
        } else if (videoContainer.msRequestFullscreen) { /* IE11 */
          videoContainer.msRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.webkitExitFullscreen) { /* Safari */
          document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) { /* IE11 */
          document.msExitFullscreen();
        }
      }
      
      // Close settings menu after action
      setShowSettingsMenu(false);
    } catch (error) {
      console.error("Fullscreen toggle failed:", error);
    }
  };
  
  // Handle clicks outside of settings menu to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target) && 
          !event.target.classList.contains('settings-button')) {
        setShowSettingsMenu(false);
        setShowSpeedOptions(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Toggle question expansion
  const toggleQuestionExpansion = (questionId) => {
    setExpandedQuestionId(expandedQuestionId === questionId ? null : questionId);
    setNewAnswer('');
  };

  // Seek to specific time in video
  const seekToTime = (timeInSeconds) => {
    if (videoRef.current) {
      // Use the setter exposed via useImperativeHandle
      videoRef.current.currentTime = timeInSeconds;
      videoRef.current.play();
    }
  };

  // Function to switch to Cloudinary player
  const tryCloudinaryPlayer = () => {
    if (!video || !video.videoUrl || !video.videoUrl.includes('cloudinary.com')) return;
    
    console.log("Automatically switching to Cloudinary player");
    
    // Get reference to the video player container
    const videoContainer = document.querySelector('.video-player-container');
    if (!videoContainer) {
      console.error("Video container not found");
      return;
    }
    
    // Extract the public ID from the Cloudinary URL
    try {
      const urlParts = video.videoUrl.split('/upload/');
      if (urlParts.length !== 2) {
        throw new Error("Invalid Cloudinary URL format");
      }
      
      const afterUpload = urlParts[1].split('.');
      const publicId = afterUpload[0];
      const cloudName = urlParts[0].split('https://res.cloudinary.com/')[1];
      
      if (!cloudName || !publicId) {
        throw new Error("Could not extract cloudName or publicId from URL");
      }
      
      // Create the Cloudinary player iframe
      const iframe = document.createElement('iframe');
      iframe.className = "video-player";
      iframe.width = "100%";
      iframe.height = "100%";
      iframe.allow = "autoplay; fullscreen";
      iframe.src = `https://player.cloudinary.com/embed/?cloud_name=${cloudName}&public_id=${publicId}&fluid=true&controls=true&source_types%5B0%5D=mp4`;
      
      // Find the video element - either directly or via our ref
      let videoElement = videoContainer.querySelector('video');
      
      // If we can't find it directly, try using our ref
      if (!videoElement && videoRef.current && videoRef.current.videoElement) {
        videoElement = videoRef.current.videoElement;
      }
      
      if (videoElement) {
        // Hide the original video element
        videoElement.style.display = 'none';
        
        // Insert the iframe before the video element
        videoContainer.insertBefore(iframe, videoElement);
        
        // Clear any error state
        setError(null);
      } else {
        console.error("Could not find video element to replace");
      }
    } catch (err) {
      console.error("Error creating Cloudinary player:", err);
      setError("Failed to initialize Cloudinary player: " + err.message);
    }
  };

  // Prevent navigation loops and automatic redirects
  useEffect(() => {
    // Check if we were redirected from dashboard
    const isFromDashboard = window.history.state?.from === 'dashboard';
    
    // Set a flag in session storage to prevent infinite redirects
    if (!sessionStorage.getItem('videoWatchMounted')) {
      console.log('First mount of VideoWatch component, setting prevention flag');
      sessionStorage.setItem('videoWatchMounted', 'true');
      sessionStorage.setItem('lastVideoId', videoId);
    } else if (sessionStorage.getItem('lastVideoId') !== videoId) {
      // If we're viewing a different video, update the ID
      sessionStorage.setItem('lastVideoId', videoId);
    }
    
    // Cleanup function
    return () => {
      // Only clear the flag when actually navigating away, not on hot reloads
      if (window.location.pathname !== `/student/watch/${videoId}`) {
        console.log('Navigating away from VideoWatch, clearing prevention flag');
        sessionStorage.removeItem('videoWatchMounted');
      }
    };
  }, [videoId]);

  // Add event listener to manage custom controls visibility
  useEffect(() => {
    if (videoRef.current && videoRef.current.videoElement) {
      const videoElement = videoRef.current.videoElement;
      const controlsElement = document.querySelector('.video-controls');
      
      // Show custom controls when hovering over video
      const handleMouseEnter = () => {
        if (controlsElement) controlsElement.style.opacity = '1';
      };
      
      // Hide custom controls when mouse leaves, unless video is paused
      const handleMouseLeave = () => {
        if (controlsElement && !videoElement.paused) {
          controlsElement.style.opacity = '0';
        }
      };
      
      // Toggle controls visibility based on playback state
      const handlePlayPause = () => {
        if (controlsElement) {
          controlsElement.style.opacity = videoElement.paused ? '1' : '0';
        }
      };
      
      // Add the event listeners
      videoElement.addEventListener('mouseenter', handleMouseEnter);
      videoElement.addEventListener('mouseleave', handleMouseLeave);
      videoElement.addEventListener('play', handlePlayPause);
      videoElement.addEventListener('pause', handlePlayPause);
      
      // Set initial state
      if (controlsElement) {
        controlsElement.style.opacity = '0';
        controlsElement.style.transition = 'opacity 0.3s ease';
      }
      
      // Cleanup
      return () => {
        videoElement.removeEventListener('mouseenter', handleMouseEnter);
        videoElement.removeEventListener('mouseleave', handleMouseLeave);
        videoElement.removeEventListener('play', handlePlayPause);
        videoElement.removeEventListener('pause', handlePlayPause);
      };
    }
  }, [videoRef.current, videoSource]);

  // Event handler to prevent events from bubbling up
  const stopPropagation = (e) => {
    e.stopPropagation();
  };

  // Function to hide controls after a delay
  const startControlsTimeout = () => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    // Hide controls after 3 seconds if video is playing
    if (videoRef.current && videoRef.current.videoElement && !videoRef.current.videoElement.paused) {
      controlsTimeoutRef.current = setTimeout(() => {
        setControlsVisible(false);
      }, 3000);
    }
  };

  // Toggle controls visibility with mouse move
  const handleMouseMove = () => {
    setControlsVisible(true);
    startControlsTimeout();
  };

  // Set up control visibility when video plays or pauses
  useEffect(() => {
    if (videoRef.current && videoRef.current.videoElement) {
      const handlePlay = () => {
        startControlsTimeout();
      };
      
      const handlePause = () => {
        setControlsVisible(true);
        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current);
        }
      };
      
      videoRef.current.videoElement.addEventListener('play', handlePlay);
      videoRef.current.videoElement.addEventListener('pause', handlePause);
      
      return () => {
        if (videoRef.current && videoRef.current.videoElement) {
          videoRef.current.videoElement.removeEventListener('play', handlePlay);
          videoRef.current.videoElement.removeEventListener('pause', handlePause);
        }
        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current);
        }
      };
    }
  }, [videoRef.current]);

  // Video controls section in the render function
  const renderVideoControls = () => {
    return (
      <div 
        className={`video-controls ${controlsVisible ? 'visible' : 'hidden'}`} 
        onClick={stopPropagation}
      >
        <button 
          className="settings-button" 
          onClick={(e) => {
            e.stopPropagation();
            setShowSettingsMenu(!showSettingsMenu);
            setShowSpeedOptions(false);
          }}
          title="More options"
        >
          <div className="kebab-icon">
            <div className="kebab-dot"></div>
            <div className="kebab-dot"></div>
            <div className="kebab-dot"></div>
          </div>
        </button>
        
        {showSettingsMenu && (
          <div className="settings-menu" ref={menuRef} onClick={stopPropagation}>
            <div 
              className="settings-menu-item"
              onClick={(e) => {
                e.stopPropagation();
                setShowSpeedOptions(!showSpeedOptions);
              }}
            >
              <svg className="submenu-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
              </svg>
              Playback Speed
              <span className="settings-menu-item-right">{playbackRate}x</span>
            </div>
            
            <div 
              className="settings-menu-item"
              onClick={(e) => {
                e.stopPropagation();
                togglePictureInPicture();
              }}
            >
              <svg className="submenu-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                <path d="M19 11h-8v6h8v-6zm4-8H1v16h10v-2H3V5h18v8h2V3z" />
              </svg>
              Picture-in-Picture
            </div>
            
            <div 
              className="settings-menu-item"
              onClick={(e) => {
                e.stopPropagation();
                toggleFullScreen();
              }}
            >
              <svg className="submenu-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
              </svg>
              Toggle Fullscreen
            </div>
          </div>
        )}
        
        {showSpeedOptions && (
          <div className="speed-options-menu" onClick={stopPropagation}>
            {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
              <div 
                key={rate}
                className={`speed-option ${playbackRate === rate ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlaybackRateChange(rate);
                }}
              >
                {rate}x
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Toggle likes display
  const toggleLikesDisplay = () => {
    // If we're opening the likes display and we don't have likes data yet, fetch it
    if (!showLikes && likes.length === 0) {
      fetchLikes();
    }
    setShowLikes(!showLikes);
  };

  // Add TimestampBlot for clickable timestamps
  useEffect(() => {
    if (typeof window !== 'undefined' && quillRef.current) {
      // Only run once when component mounts
      const Quill = quillRef.current.getEditor().constructor;
      
      if (!Quill.imports['formats/timestamp']) {
        // Define custom blot for timestamps
        const Inline = Quill.import('blots/inline');
        
        class TimestampBlot extends Inline {
          static create(value) {
            const node = super.create(value);
            node.setAttribute('data-timestamp', value);
            node.setAttribute('class', 'timestamp-link');
            return node;
          }
          
          static formats(node) {
            return node.getAttribute('data-timestamp');
          }
        }
        
        TimestampBlot.blotName = 'timestamp';
        TimestampBlot.tagName = 'span';
        
        // Register custom blot
        Quill.register('formats/timestamp', TimestampBlot);
      }
      
      // Add click handler for timestamps in the editor
      const editor = quillRef.current.getEditor();
      const container = editor.container;
      
      const handleNotesClick = (e) => {
        if (e.target.classList.contains('timestamp-link') || 
            e.target.parentNode.classList.contains('timestamp-link')) {
          const timestampElement = e.target.classList.contains('timestamp-link') ? 
            e.target : e.target.parentNode;
          
          const timestampText = timestampElement.innerText;
          
          // Extract time from format like [MM:SS]
          const timeMatch = timestampText.match(/\[(\d+):(\d+)\]/);
          if (timeMatch) {
            const minutes = parseInt(timeMatch[1], 10);
            const seconds = parseInt(timeMatch[2], 10);
            const timeInSeconds = minutes * 60 + seconds;
            
            // Seek video to this position
            seekToTime(timeInSeconds);
          }
        }
      };
      
      container.addEventListener('click', handleNotesClick);
      
      return () => {
        container.removeEventListener('click', handleNotesClick);
      };
    }
  }, [quillRef.current]);

  if (isLoading) {
    return <div className="loading-spinner">Loading video...</div>;
  }

  if (error && !video) {
    return (
      <div className="error-container">
        <div className="error-message">
          <h2>Error</h2>
          <p>{error}</p>
          <button 
            className="return-button" 
            onClick={() => navigate('/student/dashboard')}
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="video-watch-container">
      <div className="video-content">
        <div className="video-player-wrapper">
          {video && videoSource ? (
            <VideoPlayer
              videoSource={videoSource}
              onTimeUpdate={handleTimeUpdate}
              onError={handleVideoError}
              onCanPlay={handleVideoLoaded}
              currentTime={currentTime}
              error={error}
              ref={videoRef}
            />
          ) : (
            <div className="video-error">
              <div className="video-error-icon">⚠️</div>
              <h3>Video Not Available</h3>
              <p>The video URL is missing or invalid.</p>
            </div>
          )}
        </div>

        {/* Notes Section - Now appears below the video when toggled */}
        {showNotes && (
          <div className="notes-section">
            <div className="notes-header">
              <h2>My Notes</h2>
              <div className="notes-header-actions">
                <span className="current-time">Current Time: {formatTime(currentTime)}</span>
                <button onClick={addTimestampToNotes} className="timestamp-button">
                  <span className="icon">⏱️</span> Add Timestamp
                </button>
                <button 
                  onClick={handleSaveNotes} 
                  className={`save-notes-button ${savingNotes ? 'saving' : ''}`}
                  disabled={savingNotes}
                >
                  {savingNotes ? 'Saving...' : 'Save Notes'}
                </button>
                <button 
                  onClick={() => setShowNotes(false)}
                  className="close-notes-button"
                >
                  <span className="close-icon">✕</span> Close
                </button>
              </div>
            </div>
            
            {notesSaveStatus && (
              <div className={`notes-status-message ${notesSaveStatus.type}`}>
                {notesSaveStatus.message}
              </div>
            )}
            
            <div className="quill-container">
              <QuillEditor 
                value={notes}
                onChange={setNotes}
                modules={quillModules}
                formats={quillFormats}
                placeholder="Take notes here... Add timestamps to mark important points in the video."
                className="quill-editor"
                ref={quillRef}
              />
            </div>
            
            <div className="notes-help">
              <p>
                <strong>Tip:</strong> Click on timestamps (like [00:30]) in your notes to jump to that point in the video.
              </p>
            </div>
          </div>
        )}

        <div className="video-details">
          <h1>{video.title}</h1>
          <div className="video-meta">
            <span>{video.views} views</span>
            <span>•</span>
            <span>{formatDate(video.createdAt)}</span>
            <div className="video-actions">
              <button className={`action-btn ${isLiked ? 'liked' : ''}`} onClick={handleLikeVideo}>
                <span className="icon">👍</span> {video.likes}
              </button>
              <button className="action-btn" onClick={toggleLikesDisplay}>
                <span className="icon">👁️</span> Show Likes
              </button>
              <button className="action-btn" onClick={() => setShowNotes(!showNotes)}>
                <span className="icon">📝</span> {showNotes ? 'Hide Notes' : 'Show Notes'}
              </button>
              <button className="action-btn" onClick={() => setShowPlaylistModal(true)}>
                <span className="icon">📋</span> Add to Playlist
              </button>
            </div>
          </div>

          {/* Likes display modal */}
          {showLikes && (
            <div className="likes-modal">
              <div className="likes-modal-content">
                <div className="likes-header">
                  <h3>Likes ({likes.length})</h3>
                  <button className="close-button" onClick={toggleLikesDisplay}>×</button>
                </div>
                <div className="likes-list">
                  {likes.length > 0 ? (
                    likes.map(like => (
                      <div key={like._id} className="like-item">
                        <img 
                          src={like.user.profilePicture} 
                          alt={like.user.name} 
                          className="like-user-img" 
                        />
                        <span className="like-user-name">{like.user.name}</span>
                        {/* Only display role for admins and teachers */}
                        {(currentUser.role === 'admin' || currentUser.role === 'teacher') && (
                          <span className="like-user-role">{like.user.role}</span>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="no-likes">No likes yet</p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="teacher-info">
            <img src={video.teacher.profilePicture} alt={video.teacher.name} />
            <div className="teacher-info-content">
              <h3>{video.teacher.name}</h3>
              <span>Teacher</span>
            </div>
          </div>

          <div className="video-description">
            <div className="video-tags">
              <span className="tag tag-subject">Subject: {video.subject}</span>
              <span className="tag tag-topic">Topic: {video.topic}</span>
              <span className="tag tag-branch">Branch: {Array.isArray(video.branch) ? video.branch.join(', ') : video.branch}</span>
              <span className="tag tag-year">Year: {Array.isArray(video.year) ? video.year.join(', ') : video.year}</span>
            </div>
            <p>{video.description}</p>
          </div>
        </div>

        <div className="interaction-tabs">
          <button 
            className={`tab-btn ${activeTab === 'comments' ? 'active' : ''}`}
            onClick={() => setActiveTab('comments')}
          >
            Comments ({comments.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'qa' ? 'active' : ''}`}
            onClick={() => setActiveTab('qa')}
          >
            Q&A ({questions.length})
          </button>
        </div>

        {activeTab === 'comments' && (
          <div className="comments-section">
            <form onSubmit={handleCommentSubmit} className="comment-form">
              <input
                type="text"
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="comment-input"
              />
              <button 
                type="submit" 
                disabled={!newComment.trim()}
                className="comment-submit"
              >
                Comment
              </button>
            </form>

            {replyToComment && (
              <div className="reply-form-container">
                <div className="replying-to">
                  <span>Replying to {replyToComment.user.name}</span>
                  <button 
                    onClick={handleCancelReply}
                    className="cancel-reply-btn"
                  >
                    Cancel
                  </button>
                </div>
                <form onSubmit={handleReplySubmit} className="reply-form">
                  <input
                    type="text"
                    placeholder="Write a reply..."
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    className="reply-input"
                  />
                  <button 
                    type="submit" 
                    disabled={!replyContent.trim()}
                    className="reply-submit"
                  >
                    Reply
                  </button>
                </form>
              </div>
            )}

            <div className="comments-list">
              {comments.length > 0 ? (
                comments.map(comment => (
                  <div className="comment" key={comment._id}>
                    <img 
                      src={comment.user.profilePicture} 
                      alt={comment.user.name} 
                      className="comment-user-img"
                    />
                    <div className="comment-content">
                      <div className="comment-header">
                        <h4 className="comment-author">{comment.user.name}</h4>
                        <span className="comment-date">{formatDate(comment.createdAt)}</span>
                      </div>
                      <p className="comment-text">{comment.content}</p>
                      <div className="comment-actions">
                        <button 
                          className="reply-button"
                          onClick={() => setReplyToComment(comment)}
                        >
                          Reply
                        </button>
                        {/* Show report button only if comment doesn't belong to current user */}
                        {currentUser && comment.user._id !== currentUser._id && (
                          reportedComments.includes(comment._id) ? (
                            <button 
                              className="reported-button"
                              onClick={() => handleOpenViewReportModal(comment)}
                            >
                              Reported
                            </button>
                          ) : (
                            <button 
                              className="report-button"
                              onClick={() => handleOpenReportModal(comment)}
                            >
                              Report
                            </button>
                          )
                        )}
                        {/* Show delete button only if comment belongs to current user */}
                        {currentUser && comment.user._id === currentUser._id && (
                          <button 
                            className="delete-button"
                            onClick={() => handleDeleteComment(comment._id)}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                      
                      {/* Replies section */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="replies-container">
                          {comment.replies.map(reply => (
                            <div className="reply" key={reply._id}>
                              <img 
                                src={reply.user.profilePicture} 
                                alt={reply.user.name} 
                                className="reply-user-img"
                              />
                              <div className="reply-content">
                                <div className="reply-header">
                                  <h5 className="reply-author">{reply.user.name}</h5>
                                  <span className="reply-date">{formatDate(reply.createdAt)}</span>
                                </div>
                                <p className="reply-text">{reply.content}</p>
                                <div className="reply-actions">
                                  {/* Show report button only if reply doesn't belong to current user */}
                                  {currentUser && reply.user._id !== currentUser._id && (
                                    reportedComments.includes(reply._id) ? (
                                      <button 
                                        className="reported-button"
                                        onClick={() => handleOpenViewReportModal(reply)}
                                      >
                                        Reported
                                      </button>
                                    ) : (
                                      <button 
                                        className="report-button"
                                        onClick={() => handleOpenReportModal(reply)}
                                      >
                                        Report
                                      </button>
                                    )
                                  )}
                                  {/* Show delete button only if reply belongs to current user */}
                                  {currentUser && reply.user._id === currentUser._id && (
                                    <button 
                                      className="delete-button"
                                      onClick={() => handleDeleteReply(comment._id, reply._id)}
                                    >
                                      Delete
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="no-comments">No comments yet. Be the first to comment!</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'qa' && (
          <div className="qa-section">
            <div className="qa-header">
              <h3>Questions & Answers</h3>
              <p>Ask your questions about this video and get answers from the teacher or other students.</p>
            </div>

            <form onSubmit={handleQuestionSubmit} className="question-form">
              <textarea
                placeholder="Ask a question about this video..."
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                rows="3"
                className="question-textarea"
              />
              <div className="question-form-footer">
                <span className="current-time">Current time: {formatTime(currentTime)}</span>
                <button 
                  type="submit" 
                  disabled={!newQuestion.trim()}
                  className="question-submit"
                >
                  Ask Question
                </button>
              </div>
            </form>

            <div className="questions-list">
              {questions.length > 0 ? (
                questions.map(question => (
                  <div className="question-item" key={question._id}>
                    <div className="question-header">
                      <div className="user-info">
                        <img 
                          src={question.user.profilePicture} 
                          alt={question.user.name} 
                          className="user-img"
                        />
                        <div className="user-details">
                          <h4>{question.user.name}</h4>
                          <span>{formatDate(question.createdAt)}</span>
                        </div>
                      </div>
                      {question.timestamp && (
                        <button 
                          className="timestamp-link" 
                          onClick={() => seekToTime(question.timestamp)}
                        >
                          <span>⏱️</span> {formatTime(question.timestamp)}
                        </button>
                      )}
                    </div>
                    
                    <div className="question-content">
                      <p>{question.content}</p>
                    </div>
                    
                    <div className="question-footer">
                      <button 
                        className={`toggle-answers-btn ${expandedQuestionId === question._id ? 'active' : ''}`}
                        onClick={() => toggleQuestionExpansion(question._id)}
                      >
                        {expandedQuestionId === question._id ? 'Hide Answers' : 
                          `Show Answers (${question.answers ? question.answers.length : 0})`}
                      </button>
                    </div>
                    
                    {expandedQuestionId === question._id && (
                      <div className="answers-section">
                        {question.answers && question.answers.length > 0 ? (
                          <div className="answers-list">
                            {question.answers.map(answer => (
                              <div className="answer-item" key={answer._id}>
                                <div className="answer-header">
                                  <div className="answer-user-info">
                                    <img 
                                      src={answer.user.profilePicture} 
                                      alt={answer.user.name} 
                                      className="answer-user-img"
                                    />
                                    <div className="answer-user-details">
                                      <h4>{answer.user.name}</h4>
                                      <span>{formatDate(answer.createdAt)}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="answer-content">
                                  <p>{answer.content}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="no-answers">No answers yet. Be the first to answer!</p>
                        )}
                        
                        <div className="new-answer-form">
                          <textarea
                            placeholder="Add your answer..."
                            value={newAnswer}
                            onChange={(e) => setNewAnswer(e.target.value)}
                            rows="2"
                            className="answer-textarea"
                          />
                          <button 
                            onClick={() => handleAnswerSubmit(question._id)}
                            disabled={!newAnswer.trim()}
                            className="answer-submit"
                          >
                            Submit Answer
                          </button>
                          <div style={{ clear: 'both' }}></div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="no-questions">No questions yet. Be the first to ask a question!</p>
              )}
            </div>
          </div>
        )}
      </div>

      {showPlaylistModal && (
        <div className="playlist-modal">
          <div className="playlist-modal-content">
            <h3 className="playlist-modal-title">Add to Playlist</h3>
            {playlists.length > 0 ? (
              <div className="playlist-list">
                {playlists.map(playlist => (
                  <div className="playlist-item" key={playlist._id}>
                    <span className="playlist-name">{playlist.name}</span>
                    <button 
                      onClick={() => handleAddToPlaylist(playlist._id)}
                      className="add-to-playlist-btn"
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-playlists">You don't have any playlists yet.</p>
            )}
            <button 
              className="close-modal-btn" 
              onClick={() => setShowPlaylistModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Report Comment Modal */}
      <ReportCommentModal
        commentId={commentToReport?._id}
        isOpen={reportModalOpen}
        onClose={handleReportCancel}
        onReportSuccess={handleReportSuccess}
      />

      {/* View Report Modal */}
      <ViewReportModal 
        commentId={commentToViewReport?._id}
        isOpen={viewReportModalOpen}
        onClose={handleCloseViewReportModal}
      />
    </div>
  );
};

export default VideoWatch; 