// components/LandingPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();
  const [animationState, setAnimationState] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationState((prev) => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleUserTypeSelection = (userType) => {
    navigate('/signup', { state: { userType } });
  };

  return (
    <div className="landing-container">
      <div className="left-section">
        <div className="animation-container">
          <div className={`animation-item ${animationState === 0 ? 'active' : ''}`}>
            <img 
              src="/images/connect.png" 
              alt="People connecting" 
              className="animation-image"
            />
            <h3>Connecting Skills with Opportunities</h3>
            <p>HelperHub bridges the gap between informal workers and employers</p>
          </div>
          <div className={`animation-item ${animationState === 1 ? 'active' : ''}`}>
            <img 
              src="/images/secure.webp" 
              alt="Secure transactions" 
              className="animation-image"
            />
            <h3>Safe & Secure Platform</h3>
            <p>Verified profiles and secure payment options for everyone</p>
          </div>
          <div className={`animation-item ${animationState === 2 ? 'active' : ''}`}>
            <img 
              src="/images/grow.jpg" 
              alt="Skills growth" 
              className="animation-image"
            />
            <h3>Grow Your Skills & Business</h3>
            <p>Training opportunities for workers and reliable hiring for businesses</p>
          </div>
        </div>
      </div>

      
      
      <div className="right-section">
        <div className="logo-container">
          <h1>HelperHub</h1>
          <p className="tagline">Connecting Helpers with Opportunities</p>
        </div>
        
        <div className="user-type-selection">
          <h2>I am a...</h2>
          
          <div className="button-container">
            <button 
              className="user-type-button employer-button"
              onClick={() => handleUserTypeSelection('employer')}
            >
              <i className="user-icon">🏢</i>
              <span>Employer</span>
              <p className="button-description">Looking to hire reliable help</p>
            </button>
            
            <button 
              className="user-type-button job-seeker-button"
              onClick={() => handleUserTypeSelection('jobSeeker')}
            >
              <i className="user-icon">👷</i>
              <span>Job Seeker</span>
              <p className="button-description">Looking for work opportunities</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
