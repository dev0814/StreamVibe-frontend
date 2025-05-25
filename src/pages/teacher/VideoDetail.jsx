import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import VideoPlayer from '../student/VideoPlayer';
import axios from 'axios';
import io from 'socket.io-client';
import './VideoDetail.css';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const VideoDetail = () => {
  const { id } = useParams();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoSource, setVideoSource] = useState(null);
  const [useProxyUrl, setUseProxyUrl] = useState(true);
  const [videoErrorCount, setVideoErrorCount] = useState(0);
  const videoRef = useRef(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState([]);
  const [showLikes, setShowLikes] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState(true);
  const [socket, setSocket] = useState(null);
  const [replyToComment, setReplyToComment] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [reportedComments, setReportedComments] = useState([]);

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/videos/${id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch video');
        }
        
        const data = await response.json();
        setVideo(data.data);
        
        // Set initial video source
        if (data.data.videoUrl) {
          setVideoSource(data.data.videoUrl);
        }
        
        // Fetch likes and comments
        await fetchLikes();
        await fetchComments();
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching video:', err);
        setError(err.message);
        setLoading(false);
      }
    };
    
    fetchVideo();
  }, [id]);

  // Initialize socket connection
  useEffect(() => {
    let newSocket;
    try {
      console.log('Initializing socket connection to:', SOCKET_URL);
      newSocket = io(SOCKET_URL, {
        reconnectionAttempts: 5,
        timeout: 10000,
        transports: ['websocket', 'polling']
      });
      
      newSocket.on('connect_error', (err) => {
        console.warn('Socket connection error:', err.message);
      });
      
      newSocket.on('error', (err) => {
        console.warn('Socket general error:', err);
      });
      
      setSocket(newSocket);
    } catch (err) {
      console.error('Socket initialization error:', err);
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

  // Join video room for real-time comments
  useEffect(() => {
    if (socket && id) {
      socket.emit('joinVideoRoom', id);

      socket.on('commentReceived', (data) => {
        if (!data.comment.parentComment) {
          setComments(prevComments => [data.comment, ...prevComments]);
        }
      });

      socket.on('commentReplyReceived', (data) => {
        setComments(prevComments => 
          prevComments.map(comment => {
            if (comment._id === data.parentCommentId) {
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
    }
  }, [socket, id]);

  // Fetch likes
  const fetchLikes = async () => {
    try {
      const response = await axios.get(`/api/videos/${id}/likes`);
      setLikes(response.data.data || []);
      setIsLiked(response.data.userLiked || false);
    } catch (err) {
      console.error("Error fetching likes:", err);
      setLikes([]);
      setIsLiked(false);
    }
  };

  // Fetch comments
  const fetchComments = async () => {
    try {
      const response = await axios.get(`/api/videos/${id}/comments?includeReplies=true`);
      console.log('Comments response:', response.data); // Debug log
      
      if (!response.data.data) {
        console.error('No comments data in response');
        setComments([]);
        return;
      }

      const structuredComments = response.data.data.filter(comment => !comment.parentComment);
      const replies = response.data.data.filter(comment => comment.parentComment);
      
      // Sort comments by date (newest first)
      structuredComments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      // Sort replies by date (newest first)
      replies.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      // Attach replies to their parent comments
      replies.forEach(reply => {
        const parentComment = structuredComments.find(c => c._id === reply.parentComment);
        if (parentComment) {
          if (!parentComment.replies) parentComment.replies = [];
          parentComment.replies.push(reply);
        }
      });
      
      setComments(structuredComments);
    } catch (err) {
      console.error("Error fetching comments:", err);
      if (err.response) {
        console.error("Error response:", err.response.data);
      }
      setComments([]);
    }
  };

  // Handle like/unlike
  const handleLikeVideo = async () => {
    try {
      const wasLiked = isLiked;
      setIsLiked(!wasLiked);
      
      if (video && video.likes !== undefined) {
        const newLikesCount = wasLiked ? video.likes - 1 : video.likes + 1;
        setVideo({...video, likes: newLikesCount});
      }
      
      const response = await axios.put(`/api/videos/${id}/like`);
      const { liked } = response.data.data || { liked: !wasLiked };
      
      if (liked !== !wasLiked) {
        setIsLiked(liked);
        if (video && video.likes !== undefined) {
          const serverLikesCount = liked ? 
            (wasLiked ? video.likes : video.likes + 1) : 
            (wasLiked ? video.likes - 1 : video.likes);
          setVideo({...video, likes: serverLikesCount});
        }
      }
      
      fetchLikes();
    } catch (err) {
      console.error("Error liking video:", err);
      setIsLiked(isLiked);
      if (video && video.likes !== undefined) {
        const originalVideo = {...video};
        setVideo(originalVideo);
      }
      alert('Failed to like video. Please try again.');
    }
  };

  // Handle adding comment
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      console.log('Sending comment request:', {
        content: newComment,
        videoId: id
      });

      const response = await axios.post(`/api/videos/${id}/comments`, {
        content: newComment,
        videoId: id
      });
      
      console.log('Comment response:', response.data);
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to add comment');
      }

      const newCommentObj = response.data.data;
      
      // Emit socket event for real-time update
      if (socket) {
        socket.emit('commentReceived', {
          videoId: id,
          comment: newCommentObj
        });
      }
      
      setComments(prevComments => [newCommentObj, ...prevComments]);
      setNewComment('');
      
      // Update video comments count
      if (video) {
        setVideo(prevVideo => ({
          ...prevVideo,
          commentsCount: (prevVideo.commentsCount || 0) + 1
        }));
      }
    } catch (err) {
      console.error("Error adding comment:", err);
      if (err.response) {
        console.error("Error response data:", err.response.data);
        console.error("Error response status:", err.response.status);
        console.error("Error response headers:", err.response.headers);
      } else if (err.request) {
        console.error("Error request:", err.request);
      } else {
        console.error("Error message:", err.message);
      }
      alert('Failed to add comment. Please try again.');
    }
  };

  // Handle video time update
  const handleTimeUpdate = (time) => {
    setCurrentTime(time);
  };

  // Handle video error
  const handleVideoError = (e) => {
    console.error("Video error:", e);
    
    setVideoErrorCount(prevCount => prevCount + 1);
    
    if (videoErrorCount === 0) {
      if (video.videoUrl) {
        try {
          const urlParts = video.videoUrl.split('/upload/');
          if (urlParts.length === 2) {
            const backendOptimizedUrl = `${urlParts[0]}/upload/q_auto/f_auto/${urlParts[1]}`;
            console.log("Trying compatible optimized URL:", backendOptimizedUrl);
            setVideoSource(backendOptimizedUrl);
          }
        } catch (err) {
          console.error("Error creating optimized URL:", err);
        }
      }
    } else if (videoErrorCount === 1) {
      console.log("Switching to direct URL");
      setUseProxyUrl(false);
    } else if (videoErrorCount === 2) {
      console.log("Trying raw database URL");
      setVideoSource(video.videoUrl);
    } else {
      setError(`Error playing video: ${e && e.message ? e.message : 'Unknown error'}`);
    }
  };

  // Handle video loaded successfully
  const handleVideoLoaded = () => {
    console.log("Video loaded successfully");
    setError(null);
    setVideoErrorCount(0);
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Handle reply submission
  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyContent.trim() || !replyToComment) return;

    try {
      const response = await axios.post(`/api/comments`, {
        content: replyContent,
        videoId: id,
        parentComment: replyToComment._id
      });

      const newReplyObj = response.data.data;
      
      if (socket) {
        socket.emit('commentReplyReceived', {
          videoId: id,
          parentCommentId: replyToComment._id,
          reply: newReplyObj
        });
      }

      setComments(prevComments => 
        prevComments.map(comment => {
          if (comment._id === replyToComment._id) {
            const replies = comment.replies || [];
            return { 
              ...comment, 
              replies: [...replies, newReplyObj] 
            };
          }
          return comment;
        })
      );
      
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

  // Handle comment deletion
  const handleDeleteComment = async (commentId) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    
    try {
      await axios.delete(`/api/comments/${commentId}`);
      
      setComments(prevComments => 
        prevComments.filter(comment => comment._id !== commentId)
      );
      
      if (socket) {
        socket.emit('commentDeleted', {
          videoId: id,
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
      await axios.delete(`/api/comments/${replyId}`);
      
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
      
      if (socket) {
        socket.emit('replyDeleted', {
          videoId: id,
          commentId,
          replyId
        });
      }
    } catch (err) {
      console.error("Error deleting reply:", err);
      alert('Failed to delete reply. Please try again.');
    }
  };

  if (loading) {
    return <div className="loading">Loading video...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error}</p>
        <Link to="/teacher/videos" className="back-btn">Back to Videos</Link>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="not-found-container">
        <h2>Video Not Found</h2>
        <p>The video you're looking for doesn't exist or has been removed.</p>
        <Link to="/teacher/videos" className="back-btn">Back to Videos</Link>
      </div>
    );
  }

  return (
    <div className="video-detail-container">
      <div className="video-nav">
        <Link to="/teacher/videos" className="back-btn">
          &larr; Back to Videos
        </Link>
        <div className="video-actions">
          <Link to={`/teacher/videos/${id}/edit`} className="edit-btn">
            Edit Video
          </Link>
          <Link to={`/teacher/videos/${id}/analytics`} className="analytics-btn">
            View Analytics
          </Link>
        </div>
      </div>
      
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
      
      <div className="video-info">
        <h1 className="video-title">{video.title}</h1>
        <div className="video-meta">
          <span className="video-date">Uploaded on {formatDate(video.createdAt)}</span>
          <span className="video-views">{video.views || 0} views</span>
          <div className="video-actions">
            <button className={`action-btn ${isLiked ? 'liked' : ''}`} onClick={handleLikeVideo}>
              <span className="icon">👍</span> {video.likes ? video.likes.length : 0}
            </button>
            <button className="action-btn" onClick={() => setShowLikes(!showLikes)}>
              <span className="icon">👁️</span> Show Likes
            </button>
            <button className="action-btn" onClick={() => setShowComments(!showComments)}>
              <span className="icon">💬</span> {showComments ? 'Hide Comments' : 'Show Comments'}
            </button>
          </div>
        </div>
        
        <div className="video-tags">
          {video.category && <span className="tag category-tag">{video.category}</span>}
          {video.branch && <span className="tag branch-tag">{video.branch}</span>}
          {video.year && <span className="tag year-tag">Year {video.year}</span>}
          {video.tags && video.tags.map((tag, index) => (
            <span key={index} className="tag">{tag}</span>
          ))}
        </div>
        
        <div className="video-description">
          <h3>Description</h3>
          <p>{video.description}</p>
        </div>
        
        <div className="video-statistics">
          <h3>Statistics</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-value">{video.views || 0}</span>
              <span className="stat-label">Views</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{video.likesCount || 0}</span>
              <span className="stat-label">Likes</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{video.commentsCount || 0}</span>
              <span className="stat-label">Comments</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{video.duration ? `${Math.floor(video.duration / 60)}:${(video.duration % 60).toString().padStart(2, '0')}` : '00:00'}</span>
              <span className="stat-label">Duration</span>
            </div>
          </div>
        </div>

        {/* Likes Modal */}
        {showLikes && (
          <div className="likes-modal">
            <div className="likes-modal-content">
              <div className="likes-header">
                <h3>Likes ({likes.length})</h3>
                <button className="close-button" onClick={() => setShowLikes(false)}>×</button>
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
                      <span className="like-user-role">{like.user.role}</span>
                    </div>
                  ))
                ) : (
                  <p className="no-likes">No likes yet</p>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Comments Section */}
        {showComments && (
          <div className="video-comments">
            <h3>Comments ({comments.length})</h3>
            
            {/* Add Comment Form */}
            <form onSubmit={handleAddComment} className="comment-form">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="comment-input"
              />
              <button type="submit" className="comment-submit-btn">
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
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Write a reply..."
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
            
            {/* Comments List */}
            {comments.length > 0 ? (
              <div className="comments-list">
                {comments.map((comment) => (
                  <div key={comment._id} className="comment">
                    <div className="comment-user">
                      <img 
                        src={comment.user.profilePicture || 'https://via.placeholder.com/40'} 
                        alt={comment.user.name} 
                        className="comment-user-img"
                      />
                      <div className="comment-user-info">
                        <span className="comment-author">{comment.user.name}</span>
                        <span className="comment-user-role">{comment.user.role}</span>
                      </div>
                    </div>
                    <div className="comment-content">
                      <div className="comment-header">
                        <span className="comment-date">{formatDate(comment.createdAt)}</span>
                      </div>
                      <div className="comment-body">
                        <p>{comment.content}</p>
                      </div>
                      <div className="comment-actions">
                        <button 
                          className="reply-button"
                          onClick={() => setReplyToComment(comment)}
                        >
                          Reply
                        </button>
                        <button 
                          className="delete-button"
                          onClick={() => handleDeleteComment(comment._id)}
                        >
                          Delete
                        </button>
                      </div>
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="replies-container">
                          {comment.replies.map(reply => (
                            <div key={reply._id} className="reply">
                              <div className="reply-user">
                                <img 
                                  src={reply.user.profilePicture || 'https://via.placeholder.com/32'} 
                                  alt={reply.user.name} 
                                  className="reply-user-img"
                                />
                                <div className="reply-user-info">
                                  <span className="reply-author">{reply.user.name}</span>
                                  <span className="reply-user-role">{reply.user.role}</span>
                                </div>
                              </div>
                              <div className="reply-content">
                                <div className="reply-header">
                                  <span className="reply-date">{formatDate(reply.createdAt)}</span>
                                </div>
                                <div className="reply-body">
                                  <p>{reply.content}</p>
                                </div>
                                <div className="reply-actions">
                                  <button 
                                    className="delete-button"
                                    onClick={() => handleDeleteReply(comment._id, reply._id)}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-comments">No comments yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoDetail; 