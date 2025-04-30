import React, { useState, useEffect } from 'react';
import { auth, db } from '../../config/firebase';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import { logoutUser } from '../../services/authService';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    gender: 'not_specified',
    location: '',
    skillLevel: 'beginner',
    preferredRadius: 10,
    preferredTime: 'evening',
    availableDays: {
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: true,
      sunday: true
    },
    bio: ''
  });
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        if (auth.currentUser) {
          const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
          
          if (userDoc.exists()) {
            setUser(userDoc.data());
            setFormData({
              username: userDoc.data().username || '',
              gender: userDoc.data().gender || 'not_specified',
              location: userDoc.data().location || '',
              skillLevel: userDoc.data().skillLevel || 'beginner',
              preferredRadius: userDoc.data().preferredRadius || 10,
              preferredTime: userDoc.data().preferredTime || 'evening',
              availableDays: userDoc.data().availableDays || {
                monday: false,
                tuesday: false,
                wednesday: false,
                thursday: false,
                friday: false,
                saturday: true,
                sunday: true
              },
              bio: userDoc.data().bio || ''
            });
          } else {
            // Create a default profile if one doesn't exist
            console.log("No profile found, creating a default one");
            const defaultProfile = {
              username: auth.currentUser.email.split('@')[0],
              email: auth.currentUser.email,
              gender: 'not_specified',
              location: '',
              skillLevel: 'beginner',
              preferredRadius: 10,
              preferredTime: 'evening',
              availableDays: {
                monday: false,
                tuesday: false,
                wednesday: false,
                thursday: false,
                friday: false,
                saturday: true,
                sunday: true
              },
              bio: '',
              gamesCount: 0,
              createdAt: new Date()
            };
            
            // Save the default profile to Firestore
            await setDoc(doc(db, "users", auth.currentUser.uid), defaultProfile);
            
            // Update state with the new profile
            setUser(defaultProfile);
            setFormData({
              username: defaultProfile.username,
              gender: defaultProfile.gender,
              location: defaultProfile.location,
              skillLevel: defaultProfile.skillLevel,
              preferredRadius: defaultProfile.preferredRadius,
              preferredTime: defaultProfile.preferredTime,
              availableDays: defaultProfile.availableDays,
              bio: defaultProfile.bio
            });
          }
        } else {
          navigate('/login');
        }
      } catch (error) {
        setError('Error fetching profile: ' + error.message);
        console.error("Profile error:", error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchUserProfile();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate('/login');
    } catch (error) {
      setError('Failed to log out');
      console.error(error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'preferredRadius') {
      setFormData({
        ...formData,
        [name]: parseInt(value)
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  const handleDayChange = (day) => {
    setFormData({
      ...formData,
      availableDays: {
        ...formData.availableDays,
        [day]: !formData.availableDays[day]
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const userRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userRef, {
        username: formData.username,
        gender: formData.gender,
        location: formData.location,
        skillLevel: formData.skillLevel,
        preferredRadius: formData.preferredRadius,
        preferredTime: formData.preferredTime,
        availableDays: formData.availableDays,
        bio: formData.bio,
        updatedAt: new Date()
      });
      
      setUser({
        ...user,
        ...formData
      });
      
      setEditing(false);
    } catch (error) {
      setError('Failed to update profile');
      console.error(error);
    }
  };

  if (loading) return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p>Loading profile...</p>
    </div>
  );
  
  if (error) return (
    <div className="error-container">
      <div className="error-icon">⚠️</div>
      <p>Error: {error}</p>
      <button onClick={() => window.location.reload()} className="retry-btn">Retry</button>
    </div>
  );
  
  if (!user) return <div>No user data found</div>;

  const getDayLabel = (day) => {
    return day.charAt(0).toUpperCase() + day.slice(1);
  };

  const getGenderLabel = (gender) => {
    switch(gender) {
      case 'male': return 'Male';
      case 'female': return 'Female';
      case 'other': return 'Other';
      default: return 'Prefer not to say';
    }
  };

  const getTimeLabel = (time) => {
    switch(time) {
      case 'morning': return 'Morning (6AM-12PM)';
      case 'afternoon': return 'Afternoon (12PM-5PM)';
      case 'evening': return 'Evening (5PM-9PM)';
      case 'night': return 'Night (9PM-12AM)';
      default: return 'No preference';
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h2>Your Profile</h2>
        {!editing && (
          <div className="profile-avatar">
            {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
          </div>
        )}
      </div>
      
      {editing ? (
        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-section">
            <h3>Basic Information</h3>
            
            <div className="form-group">
              <label>Username</label>
              <input 
                type="text" 
                name="username" 
                value={formData.username} 
                onChange={handleChange}
                required 
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label>Gender</label>
              <select 
                name="gender" 
                value={formData.gender}
                onChange={handleChange}
                className="form-select"
              >
                <option value="not_specified">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Location</label>
              <input 
                type="text" 
                name="location" 
                value={formData.location} 
                onChange={handleChange}
                className="form-input"
                placeholder="City, Area, etc."
              />
            </div>
            
            <div className="form-group">
              <label>Bio</label>
              <textarea 
                name="bio" 
                value={formData.bio} 
                onChange={handleChange}
                className="form-textarea"
                placeholder="Tell others about yourself as a player..."
                rows="3"
              />
            </div>
          </div>
          
          <div className="form-section">
            <h3>Soccer Preferences</h3>
            
            <div className="form-group">
              <label>Skill Level</label>
              <select 
                name="skillLevel" 
                value={formData.skillLevel} 
                onChange={handleChange}
                className="form-select"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Preferred Search Radius (miles)</label>
              <input
                type="range"
                name="preferredRadius"
                min="1"
                max="50"
                value={formData.preferredRadius}
                onChange={handleChange}
                className="range-slider"
              />
              <span className="range-value">{formData.preferredRadius} miles</span>
            </div>
            
            <div className="form-group">
              <label>Preferred Time to Play</label>
              <select 
                name="preferredTime" 
                value={formData.preferredTime} 
                onChange={handleChange}
                className="form-select"
              >
                <option value="morning">Morning (6AM-12PM)</option>
                <option value="afternoon">Afternoon (12PM-5PM)</option>
                <option value="evening">Evening (5PM-9PM)</option>
                <option value="night">Night (9PM-12AM)</option>
                <option value="any">No preference</option>
              </select>
            </div>
          </div>
          
          <div className="form-section">
            <h3>Availability</h3>
            <p className="form-helper-text">Select days you're typically available to play</p>
            
            <div className="day-selector">
              {Object.keys(formData.availableDays).map(day => (
                <div 
                  key={day} 
                  className={`day-option ${formData.availableDays[day] ? 'selected' : ''}`}
                  onClick={() => handleDayChange(day)}
                >
                  {getDayLabel(day).substring(0, 3)}
                </div>
              ))}
            </div>
          </div>
          
          <div className="button-group">
            <button type="submit" className="save-btn">Save Profile</button>
            <button type="button" onClick={() => setEditing(false)} className="cancel-btn">Cancel</button>
          </div>
        </form>
      ) : (
        <div className="profile-info">
          <div className="profile-section">
            <h3>Basic Information</h3>
            <div className="info-grid">
              <div className="info-row">
                <span className="info-label">Email:</span>
                <span className="info-value">{user.email}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Username:</span>
                <span className="info-value">{user.username || 'Not set'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Gender:</span>
                <span className="info-value">{getGenderLabel(user.gender)}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Location:</span>
                <span className="info-value">{user.location || 'Not set'}</span>
              </div>
              {user.bio && (
                <div className="info-row full-width">
                  <span className="info-label">Bio:</span>
                  <span className="info-value bio">{user.bio}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="profile-section">
            <h3>Soccer Preferences</h3>
            <div className="info-grid">
              <div className="info-row">
                <span className="info-label">Skill Level:</span>
                <span className="info-value">
                  <span className={`skill-badge ${user.skillLevel}`}>
                    {user.skillLevel.charAt(0).toUpperCase() + user.skillLevel.slice(1)}
                  </span>
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">Search Radius:</span>
                <span className="info-value">{user.preferredRadius || 10} miles</span>
              </div>
              <div className="info-row">
                <span className="info-label">Preferred Time:</span>
                <span className="info-value">{getTimeLabel(user.preferredTime)}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Games Played:</span>
                <span className="info-value games-count">{user.gamesCount || 0}</span>
              </div>
            </div>
          </div>
          
          <div className="profile-section">
            <h3>Availability</h3>
            <div className="availability-display">
              {Object.keys(user.availableDays || {}).map(day => (
                <div 
                  key={day} 
                  className={`day-indicator ${user.availableDays && user.availableDays[day] ? 'available' : 'unavailable'}`}
                  title={user.availableDays && user.availableDays[day] ? 'Available' : 'Unavailable'}
                >
                  {getDayLabel(day).substring(0, 3)}
                </div>
              ))}
            </div>
          </div>
          
          <div className="button-group">
            <button onClick={() => setEditing(true)} className="edit-btn">Edit Profile</button>
            <button onClick={handleLogout} className="logout-btn">Log Out</button>
            <Link to="/games" className="view-games-btn">View Games</Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;