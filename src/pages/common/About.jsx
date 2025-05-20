import React from 'react';
import './About.css';

const About = () => {
  return (
    <div className="about-container">
      <section className="about-hero">
        <div className="about-hero-content">
          <h1>About StreamVibe</h1>
          <p>The educational video streaming platform designed for students and teachers</p>
        </div>
      </section>

      <section className="about-section">
        <div className="container">
          <h2>Our Mission</h2>
          <p>
            StreamVibe aims to revolutionize educational content delivery by providing a seamless platform
            where teachers can share knowledge through video content, and students can access quality
            educational materials anytime, anywhere.
          </p>
          <p>
            We believe that education should be accessible, engaging, and interactive. Our platform
            bridges the gap between traditional classroom learning and modern digital experiences.
          </p>
        </div>
      </section>

      <section className="about-section alt-bg">
        <div className="container">
          <h2>How It Works</h2>
          <div className="about-cards">
            <div className="about-card">
              <div className="about-card-icon">👩‍🏫</div>
              <h3>For Teachers</h3>
              <p>Upload educational videos, create playlists, track analytics, and engage with students through comments. Post important notices and updates for your classes.</p>
            </div>
            <div className="about-card">
              <div className="about-card-icon">👨‍🎓</div>
              <h3>For Students</h3>
              <p>Watch educational videos, take notes, create personal playlists, track your learning history, and interact with teachers and peers through comments.</p>
            </div>
            <div className="about-card">
              <div className="about-card-icon">🏫</div>
              <h3>For Institutions</h3>
              <p>Manage users, monitor content, ensure quality standards, and gain insights into platform usage and engagement metrics.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="about-section">
        <div className="container">
          <h2>Our Team</h2>
          <p>
            StreamVibe was created by a passionate team of educators and developers who understand
            the challenges of modern education. We're committed to continuously improving the platform
            based on feedback from our users.
          </p>
        </div>
      </section>

      <section className="about-section alt-bg">
        <div className="container">
          <h2>Contact Us</h2>
          <p>
            Have questions or suggestions? We'd love to hear from you! Reach out to our team at:
          </p>
          <p>
            <strong>Email:</strong> support@streamvibe.edu<br />
            <strong>Phone:</strong> (123) 456-7890
          </p>
        </div>
      </section>
    </div>
  );
};

export default About; 