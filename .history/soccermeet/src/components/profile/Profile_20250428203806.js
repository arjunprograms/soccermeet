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
  
  // Improved day change handler
  const handleDayChange = (day) => {
    setFormData(prevData => ({
      ...prevData,
      availableDays: {
        ...prevData.availableDays,
        [day]: !prevData.availableDays[day]
      }
    }));
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
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="p-6 bg-white rounded-lg shadow-md text-center">
        <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-700">Loading profile...</p>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="p-6 bg-white rounded-lg shadow-md text-center max-w-md">
        <div className="text-5xl text-yellow-500 mb-4">⚠️</div>
        <p className="text-red-600 mb-4">Error: {error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          Retry
        </button>
      </div>
    </div>
  );
  
  if (!user) return <div className="text-center p-6">No user data found</div>;

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

  // Get skill level color
  const getSkillLevelColor = (level) => {
    switch(level) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-blue-100 text-blue-800';
      case 'advanced': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-green-500 to-teal-500 p-6 text-white">
          <h2 className="text-2xl font-bold text-center mb-4">Your Profile</h2>
          {!editing && (
            <div className="w-24 h-24 rounded-full bg-white text-green-500 flex items-center justify-center text-3xl font-bold mx-auto shadow-lg">
              {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
            </div>
          )}
        </div>
        
        {editing ? (
          <form onSubmit={handleSubmit} className="p-6">
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">Basic Information</h3>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Username</label>
                <input 
                  type="text" 
                  name="username" 
                  value={formData.username} 
                  onChange={handleChange}
                  required 
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Gender</label>
                <select 
                  name="gender" 
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="not_specified">Prefer not to say</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Location</label>
                <input 
                  type="text" 
                  name="location" 
                  value={formData.location} 
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="City, Area, etc."
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Bio</label>
                <textarea 
                  name="bio" 
                  value={formData.bio} 
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Tell others about yourself as a player..."
                  rows="3"
                />
              </div>
            </div>
            
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">Soccer Preferences</h3>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Skill Level</label>
                <select 
                  name="skillLevel" 
                  value={formData.skillLevel} 
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">
                  Preferred Search Radius: <span className="font-bold text-green-600">{formData.preferredRadius} miles</span>
                </label>
                <input
                  type="range"
                  name="preferredRadius"
                  min="1"
                  max="50"
                  value={formData.preferredRadius}
                  onChange={handleChange}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-500"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1 mile</span>
                  <span>25 miles</span>
                  <span>50 miles</span>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Preferred Time to Play</label>
                <select 
                  name="preferredTime" 
                  value={formData.preferredTime} 
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="morning">Morning (6AM-12PM)</option>
                  <option value="afternoon">Afternoon (12PM-5PM)</option>
                  <option value="evening">Evening (5PM-9PM)</option>
                  <option value="night">Night (9PM-12AM)</option>
                  <option value="any">No preference</option>
                </select>
              </div>
            </div>
            
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">Availability</h3>
              <p className="text-sm text-gray-600 mb-4">Select days you're typically available to play</p>
              
              <div className="grid grid-cols-7 gap-2 mb-4">
                {Object.keys(formData.availableDays).map(day => (
                  <button 
                    key={day} 
                    type="button"
                    className={`p-3 rounded-md transition-colors focus:outline-none ${
                      formData.availableDays[day] 
                        ? 'bg-green-500 text-white font-medium' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    onClick={() => handleDayChange(day)}
                  >
                    {getDayLabel(day).substring(0, 3)}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4 justify-center">
              <button 
                type="submit" 
                className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
              >
                Save Profile
              </button>
              <button 
                type="button" 
                onClick={() => setEditing(false)} 
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6">
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">Basic Information</h3>
              <div className="space-y-4">
                <div className="flex flex-wrap md:flex-nowrap">
                  <span className="w-full md:w-1/3 text-gray-600 font-medium">Email:</span>
                  <span className="w-full md:w-2/3 text-gray-900">{user.email}</span>
                </div>
                <div className="flex flex-wrap md:flex-nowrap">
                  <span className="w-full md:w-1/3 text-gray-600 font-medium">Username:</span>
                  <span className="w-full md:w-2/3 text-gray-900">{user.username || 'Not set'}</span>
                </div>
                <div className="flex flex-wrap md:flex-nowrap">
                  <span className="w-full md:w-1/3 text-gray-600 font-medium">Gender:</span>
                  <span className="w-full md:w-2/3 text-gray-900">{getGenderLabel(user.gender)}</span>
                </div>
                <div className="flex flex-wrap md:flex-nowrap">
                  <span className="w-full md:w-1/3 text-gray-600 font-medium">Location:</span>
                  <span className="w-full md:w-2/3 text-gray-900">{user.location || 'Not set'}</span>
                </div>
                {user.bio && (
                  <div className="flex flex-wrap md:flex-nowrap">
                    <span className="w-full md:w-1/3 text-gray-600 font-medium">Bio:</span>
                    <span className="w-full md:w-2/3 text-gray-900">{user.bio}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">Soccer Preferences</h3>
              <div className="space-y-4">
                <div className="flex flex-wrap md:flex-nowrap items-center">
                  <span className="w-full md:w-1/3 text-gray-600 font-medium">Skill Level:</span>
                  <span className="w-full md:w-2/3">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm ${getSkillLevelColor(user.skillLevel)}`}>
                      {user.skillLevel.charAt(0).toUpperCase() + user.skillLevel.slice(1)}
                    </span>
                  </span>
                </div>
                <div className="flex flex-wrap md:flex-nowrap">
                  <span className="w-full md:w-1/3 text-gray-600 font-medium">Search Radius:</span>
                  <span className="w-full md:w-2/3 text-gray-900">{user.preferredRadius || 10} miles</span>
                </div>
                <div className="flex flex-wrap md:flex-nowrap">
                  <span className="w-full md:w-1/3 text-gray-600 font-medium">Preferred Time:</span>
                  <span className="w-full md:w-2/3 text-gray-900">{getTimeLabel(user.preferredTime)}</span>
                </div>
                <div className="flex flex-wrap md:flex-nowrap">
                  <span className="w-full md:w-1/3 text-gray-600 font-medium">Games Played:</span>
                  <span className="w-full md:w-2/3">
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {user.gamesCount || 0}
                    </span>
                  </span>
                </div>
              </div>
            </div>
            
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">Availability</h3>
              <div className="grid grid-cols-7 gap-2">
                {Object.keys(user.availableDays || {}).map(day => (
                  <div 
                    key={day} 
                    className={`p-3 rounded-md text-center ${
                      user.availableDays && user.availableDays[day] 
                        ? 'bg-green-100 text-green-800 border border-green-300' 
                        : 'bg-gray-100 text-gray-400'
                    }`}
                    title={user.availableDays && user.availableDays[day] ? 'Available' : 'Unavailable'}
                  >
                    {getDayLabel(day).substring(0, 3)}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4 justify-center">
              <button 
                onClick={() => setEditing(true)} 
                className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
                Edit Profile
              </button>
              
              <Link 
                to="/games" 
                className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                View Games
              </Link>
              
              <button 
                onClick={handleLogout} 
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H3zm11 4a1 1 0 10-2 0v4a1 1 0 102 0V7z" clipRule="evenodd" />
                  <path d="M11 9a1 1 0 11-2 0 1 1 0 012 0z" />
                </svg>
                Log Out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;