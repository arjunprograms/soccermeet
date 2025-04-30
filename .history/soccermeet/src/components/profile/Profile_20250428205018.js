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
    bio: '',
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

  const saveProfile = async e => {
    e.preventDefault();
    setError('');
    try {
      const ref = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(ref, { ...formData, updatedAt: new Date() });
      setUser({ ...user, ...formData });
      setEditing(false);
    } catch {
      setError('Unable to save changes');
    }
  };

  const label = v => v.charAt(0).toUpperCase() + v.slice(1);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="bg-gray-50 py-8 px-4">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-semibold mb-4">Your Profile</h1>
        <div className="bg-white p-6 rounded-lg shadow-md">
          {editing ? (
            <form onSubmit={saveProfile} className="space-y-6">

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
                      className="block w-full border rounded p-2 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label>Gender</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="block w-full border rounded p-2 focus:outline-none"
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
                      className="block w-full border rounded p-2 focus:outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label>Bio</label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      rows={3}
                      className="block w-full border rounded p-2 focus:outline-none"
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
                      className="block w-full border rounded p-2 focus:outline-none"
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
                      className="block w-full border rounded p-2 focus:outline-none"
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
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>Username:</strong> {user.username}</p>
                  <p><strong>Gender:</strong> {label(user.gender)}</p>
                  <p><strong>Location:</strong> {user.location}</p>
                  <p><strong>Bio:</strong> {user.bio}</p>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-medium mb-2">Soccer Preferences</h2>
                <div className="space-y-2">
                  <p><strong>Skill:</strong> {label(user.skillLevel)}</p>
                  <p><strong>Radius:</strong> {user.preferredRadius} mi</p>
                  <p><strong>Time:</strong> {label(user.preferredTime)}</p>
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
