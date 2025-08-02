import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getDatabase, ref, get, query, orderByChild, equalTo } from 'firebase/database';
import UserProfile from './UserProfile';
import '../styles/HomePage.css';

const HomePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('request');
  const [currentImage, setCurrentImage] = useState(0);
  const [userType, setUserType] = useState('employer'); // Default value
  const [isLoading, setIsLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  
  // Images for the changing banner
  const bannerImages = [
    '/images/poster1.jpg',
    '/images/poster2.jpg',
    '/images/poster3.jpg'
  ];

  // Placeholder data for team members
  const teamMembers = [
    { name: 'Mansi Chauhan', role: 'Developer', image: '/images/me.jpg' },
   
  ];

  // Handle clicking on the banner to change image
  const handleBannerClick = () => {
    setCurrentImage((prevImage) => (prevImage + 1) % bannerImages.length);
  };

  // Change banner image automatically
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prevImage) => (prevImage + 1) % bannerImages.length);
    }, 5000); // Change image every 5 seconds
    
    return () => clearInterval(interval);
  }, [bannerImages.length]);

  // Check authentication state and get user type
  useEffect(() => {
    const auth = getAuth();
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in
        // First check location state (for initial navigation)
        if (location.state?.userType) {
          setUserType(location.state.userType);
          fetchRequests(user.uid, location.state.userType);
        } else {
          // If no location state, fetch from database
          const fetchUserType = async () => {
            try {
              // Try to fetch from both possible paths
              const db = getDatabase();
              const employerRef = ref(db, `users/employer/${user.uid}`);
              const jobSeekerRef = ref(db, `users/jobSeeker/${user.uid}`);
              
              const employerSnapshot = await get(employerRef);
              const jobSeekerSnapshot = await get(jobSeekerRef);
              
              if (employerSnapshot.exists()) {
                setUserType('employer');
                fetchRequests(user.uid, 'employer');
              } else if (jobSeekerSnapshot.exists()) {
                setUserType('jobSeeker');
                fetchRequests(user.uid, 'jobSeeker');
              }
              // Default remains 'employer' if not found
            } catch (error) {
              console.error("Error fetching user type:", error);
            } finally {
              setIsLoading(false);
            }
          };
          
          fetchUserType();
        }
      } else {
        // User is not signed in, redirect to landing page
        navigate('/');
      }
    });
    
    return () => unsubscribe();
  }, [location.state, navigate]);

  // Fetch requests based on user type
  const fetchRequests = async (userId, type) => {
    try {
      const db = getDatabase();
      const requestsRef = ref(db, 'requests');
      
      // Get all requests
      const snapshot = await get(requestsRef);
      
      if (snapshot.exists()) {
        const allRequests = [];
        
        snapshot.forEach((childSnapshot) => {
          const request = {
            id: childSnapshot.key,
            ...childSnapshot.val()
          };
          
          // Filter requests based on user type
          if (type === 'jobSeeker' && request.jobSeekerId === userId) {
            allRequests.push(request);
          } else if (type === 'employer' && request.employerId === userId) {
            allRequests.push(request);
          }
        });
        
        if (type === 'jobSeeker') {
          setRequests(allRequests);
        } else {
          setSentRequests(allRequests);
        }
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleServiceClick = (serviceType) => {
    // Handle click on service cards
    if (userType === 'jobSeeker') {
      // Check if the user has already completed their profile
      const auth = getAuth();
      const db = getDatabase();
      const userId = auth.currentUser.uid;
      const userProfileRef = ref(db, `users/${userId}/profile`);
      
      get(userProfileRef).then((snapshot) => {
        if (snapshot.exists() && 
            snapshot.val().firstName && 
            snapshot.val().lastName && 
            snapshot.val().phone) {
          // Profile is complete, navigate to service providers page
          navigate(`/service-providers/${serviceType}`);
        } else {
          // Profile is incomplete, navigate to profile page
          navigate(`/service/${serviceType}`);
        }
      }).catch((error) => {
        console.error("Error checking profile:", error);
        // Default to profile page if there's an error
        navigate(`/service/${serviceType}`);
      });
    } else {
      // For employers, show the service providers directly
      navigate(`/service-providers/${serviceType}`);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (isLoading) {
    return <div className="loading-screen">Loading...</div>;
  }

  return (
    <div className="home-container">
      {/* Navbar */}
      <nav className="navbar">
        <div className="logo">HelperHub</div>
        <div className="nav-tabs">
          <button 
            className={`nav-tab ${activeTab === 'request' ? 'active' : ''}`}
            onClick={() => setActiveTab('request')}
          >
            {userType === 'employer' ? 'Sent Requests' : 'Received Requests'}
          </button>
          <button 
            className={`nav-tab ${activeTab === 'received' ? 'active' : ''}`}
            onClick={() => setActiveTab('received')}
          >
            Offers
          </button>
        </div>
        
        {/* Using the new UserProfile component */}
        <UserProfile userType={userType} />
      </nav>
      
      {/* Main content */}
      <main className="main-content">
        {/* User type indicator */}
        <div className="user-type-badge">
          {userType === 'employer' ? 'Employer' : 'Job Seeker'}
        </div>
        
        {/* Banner Image with Slogan Overlay */}
        <div className="banner-container" onClick={handleBannerClick}>
          <img 
            src={bannerImages[currentImage]} 
            alt="HelperHub Banner" 
            className="banner-image"
          />
          <div className="banner-slogan">
            <h1>Connecting People, Creating Opportunities</h1>
            <p>Find the right help or offer your services with HelperHub</p>
          </div>
        </div>
        
        {/* Service Cards */}
        <div className="services-section">
          <h2>Our Services</h2>
          <div className="service-cards">
            <div className="service-card" onClick={() => handleServiceClick('house')}>
              <div className="card-image">
                <img src="/images/house-service.avif" alt="House Service" />
              </div>
              <h3>House Service</h3>
              <button className="apply-button">Apply</button>
            </div>
            
            <div className="service-card" onClick={() => handleServiceClick('short-term')}>
              <div className="card-image">
                <img src="/images/short-term.jpg" alt="Short Term Service" />
              </div>
              <h3>Short Term Service</h3>
              <button className="apply-button">Apply</button>
            </div>
            
            <div className="service-card" onClick={() => handleServiceClick('business')}>
              <div className="card-image">
                <img src="/images/business.webp" alt="Business Helper" />
              </div>
              <h3>Business Helper</h3>
              <button className="apply-button">Apply</button>
            </div>
          </div>
        </div>
        
        {/* Tab Content based on active tab */}
        <div className="tab-content">
          {activeTab === 'request' ? (
            <div className="request-section">
              <h2>{userType === 'employer' ? 'Your Sent Requests' : 'Requests From Employers'}</h2>
              
              {userType === 'jobSeeker' ? (
                // Display requests for job seekers
                requests.length > 0 ? (
                  <div className="requests-list">
                    {requests.map(request => (
                      <div key={request.id} className="request-card">
                        <div className="request-header">
                          <h3>Request from {request.employerName}</h3>
                          <span className={`request-status ${request.status}`}>{request.status}</span>
                        </div>
                        <div className="request-details">
                          <p><strong>Service:</strong> {request.serviceType === 'house' ? 'House Service' : 
                                                     request.serviceType === 'short-term' ? 'Short Term Service' : 
                                                     'Business Service'}</p>
                          <p><strong>Contact:</strong> {request.employerEmail} | {request.employerPhone}</p>
                          <p><strong>Date:</strong> {formatDate(request.createdAt)}</p>
                        </div>
                        <div className="request-actions">
                          <button className="accept-button">Accept</button>
                          <button className="decline-button">Decline</button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="empty-state">You haven't received any requests yet.</p>
                )
              ) : (
                // Display sent requests for employers
                sentRequests.length > 0 ? (
                  <div className="requests-list">
                    {sentRequests.map(request => (
                      <div key={request.id} className="request-card">
                        <div className="request-header">
                          <h3>Request to {request.jobSeekerName}</h3>
                          <span className={`request-status ${request.status}`}>{request.status}</span>
                        </div>
                        <div className="request-details">
                          <p><strong>Service:</strong> {request.serviceType === 'house' ? 'House Service' : 
                                                    request.serviceType === 'short-term' ? 'Short Term Service' : 
                                                    'Business Service'}</p>
                          <p><strong>Date:</strong> {formatDate(request.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="empty-state">You haven't sent any requests yet.</p>
                )
              )}
            </div>
          ) : (
            <div className="received-section">
              <h2>Received Offers</h2>
              {/* This would be populated with actual received offers */}
              <p className="empty-state">You haven't received any offers yet.</p>
            </div>
          )}
        </div>
        
        {/* Team Section */}
        <div className="team-section">
          <h2>Developer</h2>
          <div className="team-members">
            {teamMembers.map((member, index) => (
              <div key={index} className="team-member">
                <div className="member-image">
                  <img src={member.image} alt={member.name} />
                </div>
                <h3>{member.name}</h3>
                <p>{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-logo">
            <h3>HelperHub</h3>
            <p>Connecting Helpers with Opportunities</p>
          </div>
          
          <div className="footer-links">
            <div className="footer-section">
              <h4>Company</h4>
              <ul>
                <li><a href="#">About Us</a></li>
                <li><a href="#">Careers</a></li>
                <li><a href="#">Press</a></li>
              </ul>
            </div>
            
            <div className="footer-section">
              <h4>Services</h4>
              <ul>
                <li><a href="#">House Service</a></li>
                <li><a href="#">Short Term Service</a></li>
                <li><a href="#">Business Helper</a></li>
              </ul>
            </div>
            
            <div className="footer-section">
              <h4>Support</h4>
              <ul>
                <li><a href="#">Help Center</a></li>
                <li><a href="#">Safety</a></li>
                <li><a href="#">Contact Us</a></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; 2025 HelperHub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;