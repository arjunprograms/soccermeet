import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from '../../config/firebase';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import { logoutUser } from '../../services/authService';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
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
          setImagePreview(data.profileImage || '');
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

  const handleImageChange = (e) => {
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
    
    setImageFile(file);
    
    // Create local preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target.result;
      setImagePreview(result);
      setFormData(prev => ({
        ...prev,
        profileImage: result
      }));
    };
    reader.readAsDataURL(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const saveProfile = async e => {
    e.preventDefault();
    setError('');
    try {
      // At this point, the image is already in base64 format in formData.profileImage
      const ref = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(ref, { ...formData, updatedAt: new Date() });
      setUser({ ...user, ...formData });
      setEditing(false);
    } catch (error) {
      console.error("Save error:", error);
      setError('Unable to save changes');
    }
  };

  // Fixed label function to handle undefined or null values
  const label = v => {
    if (!v) return ''; // Return empty string for null, undefined or empty values
    return v.charAt(0).toUpperCase() + v.slice(1);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4">Your Profile</h1>
        
        {/* Profile Image */}
        <div className="flex justify-center mb-6">
          {imagePreview ? (
            <img 
              src={imagePreview} 
              alt="Profile" 
              className="w-24 h-24 rounded-full object-cover border-2 border-green-500 shadow-md"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center text-white text-2xl font-bold shadow-md">
              {formData.username ? formData.username.charAt(0).toUpperCase() : 'U'}
            </div>
          )}
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          {editing ? (
            <form onSubmit={saveProfile} className="space-y-6">
              {/* Profile Image Upload */}
              <div>
                <h2 className="text-lg font-medium mb-2">Profile Picture</h2>
                <div className="flex items-center justify-center mb-4">
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
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                    </svg>
                    <span>Upload Photo</span>
                  </button>
                </div>
              </div>

              {/* Basic Information */}
              <div>
                <h2 className="text-lg font-medium mb-2">Basic Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label>Username</label>
                    <input
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      className="block w-full border rounded p-2 focus:outline-none focus:ring-1 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label>Gender</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="block w-full border rounded p-2 focus:outline-none focus:ring-1 focus:ring-green-500"
                    >
                      <option value="not_specified">Prefer not to say</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label>Location</label>
                    <input
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="City, Area"
                      className="block w-full border rounded p-2 focus:outline-none focus:ring-1 focus:ring-green-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label>Bio</label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      rows={3}
                      className="block w-full border rounded p-2 focus:outline-none focus:ring-1 focus:ring-green-500"
                    />
                  </div>
                </div>
              </div>

              {/* Soccer Preferences */}
              <div>
                <h2 className="text-lg font-medium mb-2">Soccer Preferences</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label>Skill Level</label>
                    <select
                      name="skillLevel"
                      value={formData.skillLevel}
                      onChange={handleChange}
                      className="block w-full border rounded p-2 focus:outline-none focus:ring-1 focus:ring-green-500"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                  <div>
                    <label>Radius: {formData.preferredRadius} mi</label>
                    <input
                      type="range"
                      name="preferredRadius"
                      min={1}
                      max={50}
                      value={formData.preferredRadius}
                      onChange={handleChange}
                      className="w-full"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label>Preferred Time</label>
                    <select
                      name="preferredTime"
                      value={formData.preferredTime}
                      onChange={handleChange}
                      className="block w-full border rounded p-2 focus:outline-none focus:ring-1 focus:ring-green-500"
                    >
                      <option value="morning">Morning</option>
                      <option value="afternoon">Afternoon</option>
                      <option value="evening">Evening</option>
                      <option value="night">Night</option>
                      <option value="any">No preference</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-4 justify-end">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="px-4 py-2 bg-gray-200 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded"
                >
                  Save
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              {/* Display Mode */}
              <div>
                <h2 className="text-lg font-medium mb-2">Basic Information</h2>
                <div className="space-y-2">
                  <p><strong>Email:</strong> {user?.email || ''}</p>
                  <p><strong>Username:</strong> {user?.username || ''}</p>
                  <p><strong>Gender:</strong> {label(user?.gender)}</p>
                  <p><strong>Location:</strong> {user?.location || ''}</p>
                  <p><strong>Bio:</strong> {user?.bio || ''}</p>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-medium mb-2">Soccer Preferences</h2>
                <div className="space-y-2">
                  <p><strong>Skill:</strong> {label(user?.skillLevel)}</p>
                  <p><strong>Radius:</strong> {user?.preferredRadius || 0} mi</p>
                  <p><strong>Time:</strong> {label(user?.preferredTime)}</p>
                </div>
              </div>

              <div className="flex space-x-4 justify-end">
                <button
                  onClick={() => setEditing(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded"
                >
                  Edit Profile
                </button>
                
                <button
                  onClick={logoutUser}
                  className="px-4 py-2 bg-gray-200 rounded"
                >
                  Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;