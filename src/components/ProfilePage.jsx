import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { auth, database, storage } from '../firebase';
import { ref as dbRef, get, set, update } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { onAuthStateChanged } from 'firebase/auth';
import '../styles/ProfilePage.css';
import { FaArrowLeft, FaUser, FaBroom, FaBaby, FaHospital, FaUtensils, FaDog, FaHome, FaTools } from 'react-icons/fa';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { serviceType } = useParams();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    bio: '',
    userType: 'jobSeeker',
    profileImage: '',
    selectedCategories: [],
    experienceLevel: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // House help categories with icons
  const categories = [
    { id: 'maid', name: 'Maid/Housekeeping', icon: <FaBroom /> },
    { id: 'babysitter', name: 'Babysitter', icon: <FaBaby /> },
    { id: 'caregiver', name: 'Elderly Caregiver', icon: <FaHospital /> },
    { id: 'cook', name: 'Cook', icon: <FaUtensils /> },
    { id: 'petcare', name: 'Pet Caretaker', icon: <FaDog /> },
    { id: 'gardener', name: 'Gardener', icon: <FaHome /> },
    { id: 'handyman', name: 'Handyman', icon: <FaTools /> }
  ];

  const experienceLevels = [
    { id: 'beginner', name: 'Beginner (0-1 years)' },
    { id: 'intermediate', name: 'Intermediate (1-3 years)' },
    { id: 'expert', name: 'Expert (3+ years)' }
  ];

  useEffect(() => {
    console.log("Auth state checking...");
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log("Auth state changed, user:", currentUser?.uid);
      if (currentUser) {
        setUser(currentUser);
        fetchUserProfile(currentUser.uid);
      } else {
        console.log("No user authenticated, redirecting to landing page");
        navigate('/');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const fetchUserProfile = async (userId) => {
    console.log("Fetching profile for user:", userId);
    try {
      const userProfileRef = dbRef(database, `users/${userId}/profile`);
      const snapshot = await get(userProfileRef);
      
      if (snapshot.exists()) {
        console.log("Profile data found:", snapshot.val());
        const profileData = snapshot.val();
        setProfile((prev) => ({
          ...prev,
          ...profileData,
          selectedCategories: profileData.selectedCategories || [],
          experienceLevel: profileData.experienceLevel || ''
        }));
      } else {
        console.log("No existing profile found for this user");
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setError("Failed to load profile. Please try again.");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleCategoryToggle = (categoryId) => {
    setProfile(prev => {
      const selectedCategories = [...prev.selectedCategories];
      
      if (selectedCategories.includes(categoryId)) {
        // Remove if already selected
        return {
          ...prev,
          selectedCategories: selectedCategories.filter(id => id !== categoryId)
        };
      } else {
        // Add if not selected
        return {
          ...prev,
          selectedCategories: [...selectedCategories, categoryId]
        };
      }
    });
  };

  const handleExperienceSelect = (levelId) => {
    setProfile(prev => ({
      ...prev,
      experienceLevel: levelId
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    // Debug the form data being submitted
    console.log("Submitting profile data:", profile);
    console.log("Current user:", user?.uid);

    try {
      // Check if user is authenticated
      if (!user || !user.uid) {
        throw new Error("You must be logged in to update your profile");
      }

      // Validation
      if (!profile.firstName || !profile.lastName || !profile.phone) {
        throw new Error("Please fill in all required fields");
      }

      if (profile.userType === 'jobSeeker' && profile.selectedCategories.length === 0) {
        throw new Error("Please select at least one service category");
      }

      // Upload image if selected
      let imageUrl = profile.profileImage;
      if (imageFile) {
        console.log("Uploading profile image...");
        const imageRef = storageRef(storage, `profileImages/${user.uid}`);
        const snapshot = await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(snapshot.ref);
        console.log("Image uploaded successfully:", imageUrl);
      }

      // Prepare profile data for saving
      const profileData = {
        ...profile,
        email: user.email, // Ensure email is synchronized with auth
        profileImage: imageUrl,
        updatedAt: new Date().toISOString()
      };

      // Save profile data using update() instead of set() to merge with existing data
      const userProfileRef = dbRef(database, `users/${user.uid}/profile`);
      await update(userProfileRef, profileData);

      console.log("Profile updated successfully");
      setSuccess("Profile updated successfully!");
      
      // Refetch the profile data to confirm it was saved
      await fetchUserProfile(user.uid);

    } catch (error) {
      console.error("Error updating profile:", error);
      setError(error.message || "Failed to update profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="loading-screen">Loading profile...</div>;
  }

  return (
    <div className="profile-page-container">
      <div className="profile-header">
        <h1>My Profile</h1>
        <div className="back-button" onClick={() => navigate('/home')}>
          <FaArrowLeft /> Back to Home
        </div>
        {profile.userType === 'jobSeeker' && (
          <div className="job-seeker-badge">Service Provider</div>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="profile-content">
        <div className="profile-left-section">
          <div className="profile-image-section">
            <div className="profile-image-container">
              {profile.profileImage ? (
                <img src={profile.profileImage} alt="Profile" className="profile-picture" />
              ) : (
                <div className="profile-placeholder">
                  <FaUser />
                </div>
              )}
            </div>
            <label className="upload-button">
              Change Photo
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageChange} 
                style={{ display: 'none' }} 
              />
            </label>
          </div>

          {profile.userType === 'jobSeeker' && (
            <div className="service-info-card">
              <h3>Service Provider Info</h3>
              <p>Complete your profile to help customers find you for the services you provide.</p>
            </div>
          )}
        </div>

        <div className="profile-form-section">
          <form onSubmit={handleSubmit}>
            <div className="form-section">
              <h3>Personal Information</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>First Name*</label>
                  <input
                    type="text"
                    name="firstName"
                    value={profile.firstName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Last Name*</label>
                  <input
                    type="text"
                    name="lastName"
                    value={profile.lastName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={profile.email || user?.email || ''}
                    disabled
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number*</label>
                  <input
                    type="tel"
                    name="phone"
                    value={profile.phone}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Address</h3>
              <div className="form-group full-width">
                <label>Street Address</label>
                <input
                  type="text"
                  name="address"
                  value={profile.address}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>City</label>
                  <input
                    type="text"
                    name="city"
                    value={profile.city}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>State</label>
                  <input
                    type="text"
                    name="state"
                    value={profile.state}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>ZIP Code</label>
                  <input
                    type="text"
                    name="zip"
                    value={profile.zip}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            {profile.userType === 'jobSeeker' && (
              <>
                <div className="categories-section">
                  <h3>House Help Categories</h3>
                  <p>Select the services you offer:</p>
                  <div className="categories-list">
                    {categories.map(category => (
                      <div 
                        key={category.id}
                        className={`category-item ${profile.selectedCategories.includes(category.id) ? 'selected' : ''}`}
                        onClick={() => handleCategoryToggle(category.id)}
                      >
                        <span className="category-icon">{category.icon}</span>
                        {category.name}
                      </div>
                    ))}
                  </div>
                  
                  <h3 style={{ marginTop: '20px' }}>Experience Level</h3>
                  <div className="experience-levels">
                    {experienceLevels.map(level => (
                      <div 
                        key={level.id}
                        className={`experience-level ${level.id} ${profile.experienceLevel === level.id ? 'selected' : ''}`}
                        onClick={() => handleExperienceSelect(level.id)}
                      >
                        {level.name}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="form-section">
                  <h3>About Yourself</h3>
                  <div className="form-group full-width">
                    <label>Bio / Services Description</label>
                    <textarea
                      name="bio"
                      value={profile.bio}
                      onChange={handleInputChange}
                      placeholder="Tell clients about yourself, your experience, and the services you provide..."
                    ></textarea>
                  </div>
                </div>
              </>
            )}

            <div className="form-actions">
              <button 
                type="button" 
                className="cancel-button"
                onClick={() => navigate('/home')}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="submit-button"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;