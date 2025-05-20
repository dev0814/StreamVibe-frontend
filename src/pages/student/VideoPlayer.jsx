import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import PropTypes from 'prop-types';
import './VideoPlayer.css';

const VideoPlayer = forwardRef(({ 
  videoSource, 
  onTimeUpdate, 
  onError, 
  onCanPlay,
  currentTime,
  error
}, ref) => {
  const videoRef = useRef(null);
  const progressRef = useRef(null);
  const volumeRef = useRef(null);
  const playerContainerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSpeedMenuOpen, setIsSpeedMenuOpen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const controlsTimeoutRef = useRef(null);

  // Expose the video element reference to parent component
  useImperativeHandle(ref, () => ({
    // Expose the video properties and functions
    play: () => videoRef.current.play(),
    pause: () => videoRef.current.pause(),
    get currentTime() {
      return videoRef.current ? videoRef.current.currentTime : 0;
    },
    set currentTime(time) {
      if (videoRef.current) videoRef.current.currentTime = time;
    },
    get duration() {
      return videoRef.current ? videoRef.current.duration : 0;
    },
    get paused() {
      return videoRef.current ? videoRef.current.paused : true;
    },
    // Add reference to the actual DOM element if needed
    get videoElement() {
      return videoRef.current;
    }
  }));

  // Initialize the video player
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.playbackRate = playbackRate;
      
      // If currentTime was passed, set it
      if (currentTime && currentTime > 0) {
        videoRef.current.currentTime = currentTime;
      }
      
      // Set up event handlers
      const updateDuration = () => {
        if (videoRef.current && videoRef.current.duration) {
          setDuration(videoRef.current.duration);
        }
      };

      videoRef.current.addEventListener('loadedmetadata', updateDuration);
      return () => {
        if (videoRef.current) {
          videoRef.current.removeEventListener('loadedmetadata', updateDuration);
        }
      };
    }
  }, [videoRef, videoSource, currentTime]);

  // Auto-hide controls when not interacting
  useEffect(() => {
    const startControlsTimeout = () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      
      if (isPlaying) {
        controlsTimeoutRef.current = setTimeout(() => {
          setShowControls(false);
        }, 3000);
      }
    };

    if (isPlaying) {
      startControlsTimeout();
    } else {
      setShowControls(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying]);

  // Handle play/pause
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Handle volume change
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };

  // Toggle mute
  const toggleMute = () => {
    if (videoRef.current) {
      if (isMuted) {
        videoRef.current.volume = volume > 0 ? volume : 0.5;
        setVolume(volume > 0 ? volume : 0.5);
      } else {
        videoRef.current.volume = 0;
      }
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Handle seeking (timeline progress)
  const handleSeek = (e) => {
    if (videoRef.current && duration) {
      const seekTime = (e.target.value / 100) * duration;
      videoRef.current.currentTime = seekTime;
      setCurrentProgress((seekTime / duration) * 100);
    }
  };

  // Update the progress bar
  const handleTimeUpdateInternal = () => {
    if (videoRef.current) {
      const currentTime = videoRef.current.currentTime;
      const calculatedProgress = (currentTime / duration) * 100;
      setCurrentProgress(calculatedProgress);
      
      // Call the passed onTimeUpdate handler
      if (onTimeUpdate) {
        onTimeUpdate(currentTime);
      }
    }
  };

  // Handle video ended
  const handleVideoEnded = () => {
    setIsPlaying(false);
    setShowControls(true);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
    
    // Close any open menus
    setIsSettingsOpen(false);
    setIsSpeedMenuOpen(false);
  };

  // Toggle Picture-in-Picture mode
  const togglePictureInPicture = () => {
    if (document.pictureInPictureElement) {
      document.exitPictureInPicture().catch(err => {
        console.error(`Error exiting Picture-in-Picture mode: ${err.message}`);
      });
    } else if (document.pictureInPictureEnabled) {
      videoRef.current.requestPictureInPicture().catch(err => {
        console.error(`Error entering Picture-in-Picture mode: ${err.message}`);
      });
    }
    
    // Close settings menu
    setIsSettingsOpen(false);
  };

  // Set playback speed
  const setSpeed = (speed) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      setPlaybackRate(speed);
      setIsSpeedMenuOpen(false);
      setIsSettingsOpen(false);
    }
  };

  // Format time (seconds to MM:SS format)
  const formatTime = (seconds) => {
    if (isNaN(seconds)) return "00:00";
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Show controls on mouse move
  const handleMouseMove = () => {
    setShowControls(true);
    if (isPlaying) {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isSettingsOpen && 
        !event.target.closest('.settings-menu') && 
        !event.target.closest('.settings-button')
      ) {
        setIsSettingsOpen(false);
        setIsSpeedMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSettingsOpen]);

  return (
    <div 
      className="video-player-container" 
      ref={playerContainerRef}
      onMouseMove={handleMouseMove}
    >
      <video
        ref={videoRef}
        className="video-player"
        onClick={togglePlay}
        onTimeUpdate={handleTimeUpdateInternal}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={handleVideoEnded}
        onError={onError}
        onCanPlay={onCanPlay}
        playsInline
        preload="auto"
      >
        <source src={videoSource} type="video/mp4" />
        <source src={videoSource} type="video/webm" />
        Your browser does not support the video tag.
      </video>
      
      {/* Video controls */}
      <div className={`video-controls ${showControls ? 'visible' : 'hidden'}`}>
        {/* Progress bar */}
        <div className="progress-container">
          <input
            type="range"
            className="progress-slider"
            value={currentProgress}
            onChange={handleSeek}
            min="0"
            max="100"
            step="0.1"
            ref={progressRef}
          />
          <div 
            className="progress-fill"
            style={{ width: `${currentProgress}%` }}
          ></div>
        </div>
        
        {/* Control buttons */}
        <div className="controls-main">
          <div className="controls-left">
            {/* Play/Pause button */}
            <button className="control-button play-button" onClick={togglePlay}>
              {isPlaying ? (
                <svg viewBox="0 0 24 24" fill="currentColor" height="24" width="24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor" height="24" width="24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
            
            {/* Volume controls */}
            <div className="volume-container">
              <button className="control-button volume-button" onClick={toggleMute}>
                {isMuted || volume === 0 ? (
                  <svg viewBox="0 0 24 24" fill="currentColor" height="24" width="24">
                    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                  </svg>
                ) : volume <= 0.5 ? (
                  <svg viewBox="0 0 24 24" fill="currentColor" height="24" width="24">
                    <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="currentColor" height="24" width="24">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                  </svg>
                )}
              </button>
              <input
                type="range"
                className="volume-slider"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                ref={volumeRef}
              />
            </div>
            
            {/* Time display */}
            <div className="time-display">
              {formatTime(videoRef.current?.currentTime || 0)} / {formatTime(duration)}
            </div>
          </div>
          
          <div className="controls-right">
            {/* Settings button */}
            <button 
              className="control-button settings-button" 
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            >
              <div className="kebab-icon">
                <div className="kebab-dot"></div>
                <div className="kebab-dot"></div>
                <div className="kebab-dot"></div>
              </div>
            </button>
            
            {/* Fullscreen button */}
            <button 
              className="control-button fullscreen-button" 
              onClick={toggleFullscreen}
            >
              {isFullscreen ? (
                <svg viewBox="0 0 24 24" fill="currentColor" height="24" width="24">
                  <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor" height="24" width="24">
                  <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Settings menu */}
      {isSettingsOpen && (
        <div className="settings-menu">
          {/* Playback speed option */}
          <div 
            className="settings-menu-item"
            onClick={() => setIsSpeedMenuOpen(!isSpeedMenuOpen)}
          >
            <svg className="settings-icon" viewBox="0 0 24 24" fill="currentColor" height="16" width="16">
              <path d="M13 2.05v3.03c3.39.49 6 3.39 6 6.92 0 .9-.18 1.75-.48 2.54l2.6 1.53c.56-1.24.88-2.62.88-4.07 0-5.18-3.95-9.45-9-9.95zM12 19c-3.87 0-7-3.13-7-7 0-3.53 2.61-6.43 6-6.92V2.05c-5.06.5-9 4.76-9 9.95 0 5.52 4.47 10 9.99 10 3.31 0 6.24-1.61 8.06-4.09l-2.6-1.53C16.17 17.98 14.21 19 12 19z" />
            </svg>
            Playback Speed
            <span className="settings-value">{playbackRate}x</span>
          </div>
          
          {/* Picture-in-Picture option */}
          <div 
            className="settings-menu-item"
            onClick={togglePictureInPicture}
          >
            <svg className="settings-icon" viewBox="0 0 24 24" fill="currentColor" height="16" width="16">
              <path d="M19 11h-8v6h8v-6zm4-8H1v16h10v-2H3V5h18v8h2V3z" />
            </svg>
            Picture-in-Picture
          </div>
          
          {/* Fullscreen option */}
          <div 
            className="settings-menu-item"
            onClick={toggleFullscreen}
          >
            <svg className="settings-icon" viewBox="0 0 24 24" fill="currentColor" height="16" width="16">
              <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
            </svg>
            {isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          </div>
        </div>
      )}
      
      {/* Playback speed menu */}
      {isSpeedMenuOpen && (
        <div className="speed-menu">
          {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
            <div 
              key={speed}
              className={`speed-option ${playbackRate === speed ? 'active' : ''}`}
              onClick={() => setSpeed(speed)}
            >
              {speed}x
            </div>
          ))}
        </div>
      )}
      
      {/* Play button overlay (shows in center when paused) */}
      {!isPlaying && (
        <button className="play-overlay" onClick={togglePlay}>
          <svg viewBox="0 0 24 24" fill="currentColor" height="48" width="48">
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>
      )}
      
      {/* Error message display */}
      {error && (
        <div className="video-error-overlay">
          <div className="error-icon">⚠️</div>
          <h3 className="error-title">Video Playback Error</h3>
          <p className="error-message">{error}</p>
        </div>
      )}
    </div>
  );
});

VideoPlayer.propTypes = {
  videoSource: PropTypes.string.isRequired,
  onTimeUpdate: PropTypes.func,
  onError: PropTypes.func,
  onCanPlay: PropTypes.func,
  currentTime: PropTypes.number,
  error: PropTypes.string
};

VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer; 