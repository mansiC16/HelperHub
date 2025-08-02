import React, { useState, useRef, useEffect } from 'react';
import { getAuth, signOut } from 'firebase/auth';
import { getDatabase, ref, get, set } from 'firebase/database';
import { useNavigate } from 'react-router-dom';
import '../styles/UserProfile.css';

const BusinessInfoModal = ({ isOpen, onClose, onSave, initialData }) => {
  const [businessInfo, setBusinessInfo] = useState({
    companyName: initialData?.companyName || '',
    businessType: initialData?.businessType || '',
    location: initialData?.location || '',
    description: initialData?.description || ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBusinessInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = () => {
    onSave(businessInfo);
  };

  if (!isOpen) return null;

  return (
    <div className="business-info-modal">
      <div className="modal-content">
        <h2>Business Information</h2>
        <div className="form-group">
          <label>Company Name</label>
          <input
            type="text"
            name="companyName"
            value={businessInfo.companyName}
            onChange={handleChange}
            placeholder="Enter company name"
          />
        </div>
        <div className="form-group">
          <label>Business Type</label>
          <select
            name="businessType"
            value={businessInfo.businessType}
            onChange={handleChange}
          >
            <option value="">Select Business Type</option>
            <option value="house-services">House Services</option>
            <option value="short-term">Short Term Services</option>
            <option value="business-support">Business Support</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="form-group">
          <label>Location</label>
          <input
            type="text"
            name="location"
            value={businessInfo.location}
            onChange={handleChange}
            placeholder="Enter business location"
          />
        </div>
        <div className="form-group">
          <label>Business Description</label>
          <textarea
            name="description"
            value={businessInfo.description}
            onChange={handleChange}
            placeholder="Describe your business"
          ></textarea>
        </div>
        <div className="modal-actions">
          <button onClick={onClose} className="cancel-button">Cancel</button>
          <button onClick={handleSubmit} className="save-button">Save</button>
        </div>
      </div>
    </div>
  );
};

const UserProfile = ({ userType }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const [businessData, setBusinessData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isBusinessModalOpen, setIsBusinessModalOpen] = useState(false);
  const profileRef = useRef(null);
  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const currentUser = auth.currentUser;
        
        if (currentUser) {
          const db = getDatabase();
          
          // Fetch user profile data
          const userRef = ref(db, `users/${userType}/${currentUser.uid}`);
          const userSnapshot = await get(userRef);
          
          // Fetch business info
          const businessRef = ref(db, `businessinfo/${currentUser.uid}`);
          const businessSnapshot = await get(businessRef);
          
          if (userSnapshot.exists()) {
            setUserData(userSnapshot.val());
          }
          
          if (businessSnapshot.exists()) {
            setBusinessData(businessSnapshot.val());
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [auth, userType]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleBusinessInfoSave = async (businessInfo) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const db = getDatabase();
      const userRef = ref(db, `businessinfo/${currentUser.uid}`);
      
      // Add timestamp to track when business info was added/updated
      const businessInfoWithTimestamp = {
        ...businessInfo,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Use set() to store the entire business info object
      await set(userRef, businessInfoWithTimestamp);
      
      // Update local state
      setBusinessData(businessInfoWithTimestamp);

      // Close modal
      setIsBusinessModalOpen(false);
      setIsOpen(false);

      // Optional: Show success message
      alert("Business information saved successfully!");
    } catch (error) {
      console.error("Error saving business info:", error);
      alert("Failed to save business information");
    }
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  if (loading) {
    return (
      <div className="profile-icon">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="user-profile-container" ref={profileRef}>
      <div 
        className="profile-icon" 
        onClick={toggleDropdown}
      >
        {userData?.profileImageUrl ? (
          <img 
            src={userData.profileImageUrl} 
            alt="Profile" 
            className="profile-image" 
          />
        ) : (
          <span className="user-initial">
            {userData?.name ? userData.name.charAt(0).toUpperCase() : '?'}
          </span>
        )}
      </div>
      
      {isOpen && (
        <div className="profile-dropdown">
          <div className="profile-header">
            <h3>{userData?.name || 'User'}</h3>
            <p className="user-type">{userType === 'employer' ? 'Employer' : 'Job Seeker'}</p>
          </div>
          
          <div className="profile-details">
            <div className="profile-item">
              <span className="profile-label">Email:</span>
              <span className="profile-value">{userData?.email || 'Not available'}</span>
            </div>
            <div className="profile-item">
              <span className="profile-label">Phone:</span>
              <span className="profile-value">{userData?.phone || 'Not available'}</span>
            </div>
            <div className="profile-item">
              <span className="profile-label">Joined:</span>
              <span className="profile-value">
                {userData?.createdAt 
                  ? new Date(userData.createdAt).toLocaleDateString() 
                  : 'Not available'}
              </span>
            </div>
          </div>
          
          {/* Only show Edit Profile for job seekers */}
          {userType === 'jobSeeker' && (
            <button className="edit-profile-button" onClick={() => navigate('/edit-profile')}>
              Edit Profile
            </button>
          )}
          
          {/* Conditional Business Info Button for Employers */}
          {userType === 'employer' && (
            <button 
              className="business-info-button" 
              onClick={() => setIsBusinessModalOpen(true)}
            >
              {businessData ? 'Update Business Info' : 'Add Business Info'}
            </button>
          )}
          
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      )}

      {/* Business Info Modal */}
      <BusinessInfoModal
        isOpen={isBusinessModalOpen}
        onClose={() => setIsBusinessModalOpen(false)}
        onSave={handleBusinessInfoSave}
        initialData={businessData || {}}
      />
    </div>
  );
};

export default UserProfile;