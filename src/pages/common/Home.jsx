import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  useEffect(() => {
    // Add animation classes after component mounts
    const elements = document.querySelectorAll('.fade-in');
    elements.forEach((element, index) => {
      setTimeout(() => {
        element.classList.add('visible');
      }, 200 * index);
    });
  }, []);

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content fade-in">
          <h1>Welcome to EduStream</h1>
          <h2 className="fade-in">Learn Anytime, Anywhere</h2>
          <p className="fade-in">Experience interactive learning with access to lectures, courses, and educational resources</p>
          <div className="cta-buttons fade-in">
            <Link to="/register" className="btn btn-cta">Get Started</Link>
            <Link to="/about" className="btn btn-secondary">Learn More</Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <h2 className="fade-in">Platform Features</h2>
        <div className="feature-grid">
          <div className="feature-card fade-in">
            <div className="feature-icon">🎓</div>
            <h3>HD Lectures</h3>
            <p>Access high-quality lecture videos from your professors</p>
          </div>
          <div className="feature-card fade-in">
            <div className="feature-icon">📱</div>
            <h3>Multi-device Access</h3>
            <p>Learn on any device - laptop, tablet, or smartphone</p>
          </div>
          <div className="feature-card fade-in">
            <div className="feature-icon">🔍</div>
            <h3>Course Search</h3>
            <p>Find your courses and materials with powerful search tools</p>
          </div>
          <div className="feature-card fade-in">
            <div className="feature-icon">💾</div>
            <h3>Download & Watch</h3>
            <p>Download lectures to watch offline anytime, anywhere</p>
          </div>
        </div>
      </section>

      {/* User Types Section */}
      <section className="user-types">
        <h2 className="fade-in">For Students & Teachers</h2>
        <div className="user-grid">
          <div className="user-card fade-in">
            <h3>Students</h3>
            <ul>
              <li>Access to course lectures</li>
              <li>Downloadable study materials</li>
              <li>Interactive learning tools</li>
              <li>Track course progress</li>
            </ul>
            <Link to="/register?role=student" className="btn btn-cta">Register as Student</Link>
          </div>
          <div className="user-card fade-in">
            <h3>Teachers</h3>
            <ul>
              <li>Upload lecture videos</li>
              <li>Create course materials</li>
              <li>Track student engagement</li>
              <li>Organize course content</li>
              <li>Interact with students</li>
            </ul>
            <Link to="/register?role=teacher" className="btn btn-cta">Register as Teacher</Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section fade-in">
        <h2>Join Our Educational Community Today</h2>
        <p>Connect with teachers and fellow students to enhance your learning experience</p>
        <Link to="/register" className="btn btn-cta">Create Your Account</Link>
      </section>
    </div>
  );
};

export default Home; 