import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getDatabase, ref, get, push, set } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { FaArrowLeft, FaStar, FaRegStar, FaPhone, FaEnvelope, FaPaperPlane } from 'react-icons/fa';
import '../styles/ServiceProvidersPage.css';

const ServiceProvidersPage = () => {
  const { serviceType } = useParams();
  const navigate = useNavigate();
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [userType, setUserType] = useState('');
  const [requestSent, setRequestSent] = useState({});
  const [requestLoading, setRequestLoading] = useState({});
  const auth = getAuth();

  // House help categories
  const categories = [
    { id: 'all', name: 'All Categories' },
    { id: 'maid', name: 'Maid/Housekeeping' },
    { id: 'babysitter', name: 'Babysitter' },
    { id: 'caregiver', name: 'Elderly Caregiver' },
    { id: 'cook', name: 'Cook' },
    { id: 'petcare', name: 'Pet Caretaker' },
    { id: 'gardener', name: 'Gardener' },
    { id: 'handyman', name: 'Handyman' }
  ];

  // Convert service type from URL parameter to a more readable format
  const getServiceTitle = () => {
    switch(serviceType) {
      case 'house':
        return 'House Service Providers';
      case 'short-term':
        return 'Short Term Service Providers';
      case 'business':
        return 'Business Service Providers';
      default:
        return 'Service Providers';
    }
  };

  useEffect(() => {
    // Fetch current user type
    const checkUserType = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          navigate('/');
          return;
        }

        const db = getDatabase();
        const employerRef = ref(db, `users/employer/${currentUser.uid}`);
        const jobSeekerRef = ref(db, `users/jobSeeker/${currentUser.uid}`);
        
        const employerSnapshot = await get(employerRef);
        const jobSeekerSnapshot = await get(jobSeekerRef);
        
        if (employerSnapshot.exists()) {
          setUserType('employer');
        } else if (jobSeekerSnapshot.exists()) {
          setUserType('jobSeeker');
        }
      } catch (error) {
        console.error("Error checking user type:", error);
      }
    };

    checkUserType();
  }, [auth, navigate]);

  useEffect(() => {
    const fetchServiceProviders = async () => {
      try {
        const db = getDatabase();
        const usersRef = ref(db, 'users');
        const snapshot = await get(usersRef);
        
        if (snapshot.exists()) {
          const data = snapshot.val();
          const providersData = [];
          
          // Loop through all users
          for (const userId in data) {
            const user = data[userId];
            
            // Check if profile exists and if it's a job seeker
            if (user.profile && user.profile.userType === 'jobSeeker') {
              // Check if the profile has the required service type
              // For house service, we check if they have selected categories
              if (serviceType === 'house' && 
                  user.profile.selectedCategories && 
                  user.profile.selectedCategories.length > 0) {
                
                // Add mock reviews for demonstration
                const mockReviews = generateMockReviews();
                
                providersData.push({
                  id: userId,
                  ...user.profile,
                  reviews: mockReviews,
                  averageRating: calculateAverageRating(mockReviews)
                });
              }
            }
          }
          
          setProviders(providersData);
        } else {
          console.log("No service providers found");
          setProviders([]);
        }
      } catch (error) {
        console.error("Error fetching service providers:", error);
        setError("Failed to load service providers. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchServiceProviders();
  }, [serviceType]);

  // Generate mock reviews for demonstration
  const generateMockReviews = () => {
    const numberOfReviews = Math.floor(Math.random() * 5) + 1; // 1-5 reviews
    const reviews = [];
    
    for (let i = 0; i < numberOfReviews; i++) {
      reviews.push({
        id: `review-${i}`,
        userName: getRandomName(),
        rating: Math.floor(Math.random() * 5) + 1, // 1-5 stars
        comment: getRandomComment(),
        date: getRandomDate()
      });
    }
    
    return reviews;
  };

  // Helper function to calculate average rating
  const calculateAverageRating = (reviews) => {
    if (!reviews || reviews.length === 0) return 0;
    
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return (total / reviews.length).toFixed(1);
  };

  // Random names for mock reviews
  const getRandomName = () => {
    const names = [
      'Isha Chauhan', 'Disha', 'Anu', 'Pratha',
      'Aditi', 'Tejas', 'Om', 'Lisa'
    ];
    return names[Math.floor(Math.random() * names.length)];
  };

  // Random comments for mock reviews
  const getRandomComment = () => {
    const comments = [
      'Excellent service! Very professional and reliable.',
      'Good work, but arrived a bit late.',
      'Great attitude and attention to detail.',
      'The service was satisfactory, would hire again.',
      'Very thorough and efficient, highly recommend!',
      'Pleasant to work with and did a good job overall.'
    ];
    return comments[Math.floor(Math.random() * comments.length)];
  };

  // Random date within the last month
  const getRandomDate = () => {
    const today = new Date();
    const pastDate = new Date(today);
    pastDate.setDate(today.getDate() - Math.floor(Math.random() * 30));
    return pastDate.toLocaleDateString();
  };

  // Handle sending a service request
  // Handle sending a service request
  const handleSendRequest = async (provider) => {
    try {
      setRequestLoading(prev => ({ ...prev, [provider.id]: true }));
      
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("You must be logged in to send a request");
      }
      
      // Fetch minimal employer profile info
      const db = getDatabase();
      const userProfileRef = ref(db, `users/${currentUser.uid}/profile`);
      const profileSnapshot = await get(userProfileRef);
      
      // If profile doesn't exist, use basic auth user info
      const employerProfile = profileSnapshot.exists() ? profileSnapshot.val() : {
        firstName: currentUser.displayName || 'Employer',
        lastName: '',
        email: currentUser.email,
        phone: currentUser.phoneNumber || 'Not provided'
      };
      
      // Create request in the database
      const requestsRef = ref(db, 'requests');
      const newRequestRef = push(requestsRef);
      
      await set(newRequestRef, {
        employerId: currentUser.uid,
        jobSeekerId: provider.id,
        serviceType: serviceType,
        employerName: `${employerProfile.firstName} ${employerProfile.lastName}`.trim(),
        employerEmail: employerProfile.email,
        employerPhone: employerProfile.phone,
        jobSeekerName: `${provider.firstName} ${provider.lastName}`,
        jobSeekerCategories: provider.selectedCategories,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      
      // Show success message
      setRequestSent(prev => ({ ...prev, [provider.id]: true }));
      
      // Reset after 3 seconds
      setTimeout(() => {
        setRequestSent(prev => ({ ...prev, [provider.id]: false }));
      }, 3000);
      
    } catch (error) {
      console.error("Error sending request:", error);
      alert(error.message || "Failed to send request. Please try again.");
    } finally {
      setRequestLoading(prev => ({ ...prev, [provider.id]: false }));
    }
  };

  // Filter providers based on selected category
  const filteredProviders = providers.filter(provider => {
    if (selectedCategory === 'all') return true;
    return provider.selectedCategories && provider.selectedCategories.includes(selectedCategory);
  });

  // Render star rating
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<FaStar key={i} className="star filled" />);
      } else {
        stars.push(<FaRegStar key={i} className="star" />);
      }
    }
    
    return stars;
  };

  if (loading) {
    return <div className="loading-screen">Loading service providers...</div>;
  }

  return (
    <div className="service-providers-container">
      <div className="service-providers-header">
        <div className="back-button" onClick={() => navigate('/home')}>
          <FaArrowLeft /> Back to Home
        </div>
        <h1>{getServiceTitle()}</h1>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="filter-section">
        <h3>Filter by Category:</h3>
        <div className="category-filters">
          {categories.map(category => (
            <button
              key={category.id}
              className={`category-filter ${selectedCategory === category.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      <div className="providers-grid">
        {filteredProviders.length > 0 ? (
          filteredProviders.map(provider => (
            <div key={provider.id} className="provider-card">
              <div className="provider-header">
                <div className="provider-image">
                  {provider.profileImage ? (
                    <img src={provider.profileImage} alt={`${provider.firstName} ${provider.lastName}`} />
                  ) : (
                    <div className="default-avatar">
                      {provider.firstName ? provider.firstName.charAt(0).toUpperCase() : '?'}
                    </div>
                  )}
                </div>
                <div className="provider-info">
                  <h3>{provider.firstName} {provider.lastName}</h3>
                  <div className="rating-container">
                    {renderStars(provider.averageRating)}
                    <span className="rating-text">({provider.averageRating})</span>
                  </div>
                  <p className="experience-level">
                    {provider.experienceLevel === 'beginner' && 'Beginner (0-1 years)'}
                    {provider.experienceLevel === 'intermediate' && 'Intermediate (1-3 years)'}
                    {provider.experienceLevel === 'expert' && 'Expert (3+ years)'}
                  </p>
                </div>
              </div>
              
              <div className="provider-categories">
                {provider.selectedCategories && provider.selectedCategories.map(catId => {
                  const category = categories.find(c => c.id === catId);
                  return category ? (
                    <span key={catId} className="category-tag">
                      {category.name}
                    </span>
                  ) : null;
                })}
              </div>
              
              <div className="provider-bio">
                <p>{provider.bio || 'No bio provided.'}</p>
              </div>
              
              <div className="provider-contact">
                <button className="contact-button">
                  <FaPhone /> Call
                </button>
                <button className="contact-button">
                  <FaEnvelope /> Message
                </button>
                
                {/* Show Send Request button only for employers */}
                {userType === 'employer' && (
                  <button 
                    className={`send-request-button ${requestSent[provider.id] ? 'sent' : ''}`}
                    onClick={() => handleSendRequest(provider)}
                    disabled={requestLoading[provider.id] || requestSent[provider.id]}
                  >
                    {requestLoading[provider.id] ? (
                      'Sending...'
                    ) : requestSent[provider.id] ? (
                      'Request Sent!'
                    ) : (
                      <><FaPaperPlane /> Send Request</>
                    )}
                  </button>
                )}
              </div>
              
              <div className="provider-reviews">
                <h4>Reviews ({provider.reviews.length})</h4>
                <div className="reviews-list">
                  {provider.reviews.slice(0, 2).map(review => (
                    <div key={review.id} className="review-item">
                      <div className="review-header">
                        <span className="reviewer-name">{review.userName}</span>
                        <span className="review-date">{review.date}</span>
                      </div>
                      <div className="review-stars">
                        {renderStars(review.rating)}
                      </div>
                      <p className="review-comment">{review.comment}</p>
                    </div>
                  ))}
                  {provider.reviews.length > 2 && (
                    <button className="view-all-reviews">
                      View all {provider.reviews.length} reviews
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="no-providers-message">
            <p>No service providers found for this category.</p>
            <p>Be the first to offer this service by updating your profile!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceProvidersPage;