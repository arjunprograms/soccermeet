import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from '../../config/firebase';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useNavigate, Link } from 'react-router-dom';
import { logoutUser } from '../../services/authService';

// Initialize Firebase Storage
const storage = getStorage();

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    username: '',
    gender: 'not_specified',
    location: '',
    skillLevel: 'beginner',
    preferredRadius: 10,
    preferredTime: 'evening',
    bio: '',
    profileImage: '',
  });

  const navigate = useNavigate();

  useEffect(() => {
    const loadProfile = async () => {
      if (!auth.currentUser) return navigate('/login');
      try {
        const ref = doc(db, 'users', auth.currentUser.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          setUser(data);
          setFormData({
            username: data.username || '',
            gender: data.gender || 'not_specified',
            location: data.location || '',
            skillLevel: data.skillLevel || 'beginner',
            preferredRadius: data.preferredRadius || 10,
            preferredTime: data.preferredTime || 'evening',
            bio: data.bio || '',
            profileImage: data.profileImage || '',
          });
        } else {
          const def = {
            username: auth.currentUser.email.split('@')[0],
            email: auth.currentUser.email,
            gender: 'not_specified',
            location: '',
            skillLevel: 'beginner',
            preferredRadius: 10,
            preferredTime: 'evening',
            bio: '',
            profileImage: '',
            gamesCount: 0,
            createdAt: new Date(),
          };
          await setDoc(ref, def);
          setUser(def);
          setFormData(def);
        }
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [navigate]);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'preferredRadius' ? +value : value,
    }));
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // File validation
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid image file (JPEG, PNG, WebP, or GIF)');
      return;
    }
    
    if (file.size > maxSize) {
      setError('Image size must be less than 5MB');
      return;
    }
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target.result);
    };
    reader.readAsDataURL(file);
    
    try {
      setImageLoading(true);
      setError('');
      
      // Upload to Firebase Storage
      const storageRef = ref(storage, `profile_images/${auth.currentUser.uid}`);
      await uploadBytes(storageRef, file);
      
      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);
      
      // Update form data
      setFormData(prev => ({
        ...prev,
        profileImage: downloadURL
      }));
      
    } catch (error) {
      console.error("Error uploading image:", error);
      setError('Failed to upload image. Please try again.');
    } finally {
      setImageLoading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const saveProfile = async e => {
    e.preventDefault();
    setError('');
    try {
      const ref = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(ref, { ...formData, updatedAt: new Date() });
      setUser({ ...user, ...formData });
      setEditing(false);
      setPreviewImage(null);
    } catch (error) {
      console.error("Save error:", error);
      setError('Unable to save changes');
    }
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

  const getSkillLevelColor = (level) => {
    switch(level) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-blue-100 text-blue-800';
      case 'advanced': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="p-6 bg-white rounded-lg shadow-md text-center">
        <div className="w-16 h-16 border-t-4 border-green-500 border-solid rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-700">Loading profile...</p>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="p-6 bg-white rounded-lg shadow-md text-center max-w-md">
        <div className="text-5xl text-yellow-500 mb-4">⚠️</div>
        <p className="text-red-600 mb-4">{error}</p>
        <button 
          onClick={() => {
            setError('');
            window.location.reload();
          }} 
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          Retry
        </button>
      </div>
    </div>
  );
  
  if (!user) return <div className="text-center p-6">No user data found</div>;

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-green-500 to-teal-500 p-6 text-white">
          <h2 className="text-2xl font-bold text-center mb-4">Your Profile</h2>
          {!editing && (
            <div className="flex justify-center">
              {user.profileImage ? (
                <img 
                  src={user.profileImage} 
                  alt="Profile" 
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-white text-green-500 flex items-center justify-center text-3xl font-bold shadow-lg">
                  {getInitial(user.username)}
                </div>
              )}
            </div>
          )}
        </div>
        
        {editing ? (
          <form onSubmit={saveProfile} className="p-6">
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">Profile Picture</h3>
              
              <div className="flex flex-col items-center mb-6">
                <div className="relative mb-4">
                  {imageLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 rounded-full">
                      <div className="w-8 h-8 border-t-2 border-white border-solid rounded-full animate-spin"></div>
                    </div>
                  )}
                  
                  {previewImage || formData.profileImage ? (
                    <img 
                      src={previewImage || formData.profileImage} 
                      alt="Profile Preview" 
                      className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center text-4xl text-gray-500 font-bold">
                      {getInitial(formData.username)}
                    </div>
                  )}
                </div>
                
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*" 
                  className="hidden"
                />
                
                <button 
                  type="button" 
                  onClick={triggerFileInput}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center gap-2"
                  disabled={imageLoading}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                  </svg>
                  {imageLoading ? 'Uploading...' : 'Upload Photo'}
                </button>
              </div>
            </div>
            
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                
                <div className="mb-4 md:col-span-2">
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
                
                <div className="mb-4 md:col-span-2">
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
            </div>
            
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">Soccer Preferences</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                
                <div className="mb-4 md:col-span-2">
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
            </div>
            
            <div className="flex flex-wrap gap-4 justify-center">
              <button 
                type="submit" 
                className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                disabled={imageLoading}
              >
                {imageLoading ? 'Please wait...' : 'Save Profile'}
              </button>
              <button 
                type="button" 
                onClick={() => {
                  setEditing(false);
                  setPreviewImage(null);
                }} 
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
                      {user.skillLevel?.charAt(0).toUpperCase() + user.skillLevel?.slice(1)}
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
                onClick={logoutUser} 
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