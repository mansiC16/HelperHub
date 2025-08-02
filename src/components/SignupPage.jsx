import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getDatabase, ref, set } from 'firebase/database';
import '../styles/SignupPage.css';

const SignupPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const userType = location.state?.userType || 'jobSeeker';
  
  const [isLogin, setIsLogin] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const toggleForm = () => {
    setIsLogin(!isLogin);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Basic validation
    if (!isLogin && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const auth = getAuth();
      let userCredential;

      if (isLogin) {
        // Handle login
        userCredential = await signInWithEmailAndPassword(
          auth, 
          formData.email, 
          formData.password
        );
        // Here you would check the user type from your database
        // and redirect to the appropriate home page
        console.log(`${userType} logged in successfully:`, userCredential.user.uid);
        
        // Redirect to home page with userType
        navigate('/home', { state: { userType } });
      } else {
        // Handle signup
        userCredential = await createUserWithEmailAndPassword(
          auth, 
          formData.email, 
          formData.password
        );
        
        // Save additional user data in the database
        const db = getDatabase();
        await set(ref(db, `users/${userType}/${userCredential.user.uid}`), {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          userType: userType,
          createdAt: new Date().toISOString()
        });

        console.log(`${userType} registered successfully:`, userCredential.user.uid);
        
        // Redirect to home page with userType
        navigate('/home', { state: { userType } });
      }
      
    } catch (error) {
      console.error('Authentication error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-form-container">
        <div className="header">
          <h1 className="title">HelperHub</h1>
          <h2 className="subtitle">
            {isLogin ? 'Welcome Back!' : 'Create Your Account'}
          </h2>
          <p className="user-type-indicator">
            {userType === 'employer' ? 'Employer Account' : 'Job Seeker Account'}
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required={!isLogin}
                placeholder="Enter your full name"
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
            />
          </div>

          {!isLogin && (
            <>
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required={!isLogin}
                  placeholder="Confirm your password"
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required={!isLogin}
                  placeholder="Enter your phone number"
                />
              </div>
            </>
          )}

          {error && <div className="error-message">{error}</div>}

          <button 
            type="submit" 
            className="submit-button"
            disabled={loading}
          >
            {loading ? 'Processing...' : isLogin ? 'Login' : 'Sign Up'}
          </button>
        </form>

        <div className="form-toggle">
          <p>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              type="button" 
              className="toggle-button" 
              onClick={toggleForm}
            >
              {isLogin ? 'Sign Up' : 'Login'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;