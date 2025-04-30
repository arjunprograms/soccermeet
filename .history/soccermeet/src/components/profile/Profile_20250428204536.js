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
      sunday: true,
    },
    bio: '',
  });

  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!auth.currentUser) return navigate('/login');
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
            availableDays: data.availableDays || formData.availableDays,
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
            availableDays: formData.availableDays,
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
    fetchProfile();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'preferredRadius' ? +value : value,
    }));
  };

  const toggleDay = (day) => {
    setFormData((prev) => ({
      ...prev,
      availableDays: {
        ...prev.availableDays,
        [day]: !prev.availableDays[day],
      },
    }));
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const ref = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(ref, { ...formData, updatedAt: new Date() });
      setUser({ ...user, ...formData });
      setEditing(false);
    } catch (e) {
      setError('Unable to save changes');
    }
  };

  const getLabel = (v) => v.charAt(0).toUpperCase() + v.slice(1);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><p className="bg-white p-4 rounded shadow text-red-600">{error}</p></div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-semibold text-gray-800">Profile</h1>
          {!editing && (
            <div className="w-24 h-24 mx-auto rounded-full bg-gray-200 flex items-center justify-center text-xl font-bold text-gray-600">
              {user.username?.[0]?.toUpperCase()}
            </div>
          )}
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          {editing ? (
            <form onSubmit={saveProfile} className="space-y-6">
              {/* Basic Info */}
              <section className="space-y-4">
                <h2 className="text-xl font-medium text-gray-700">Basic Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-600">Username</label>
                    <input
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      required
                      className="mt-1 w-full border-gray-300 rounded shadow-sm focus:ring focus:ring-green-200"
                    />
                  </div>
                  <div>
                    <label className="text-gray-600">Gender</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="mt-1 w-full border-gray-300 rounded shadow-sm focus:ring focus:ring-green-200"
                    >
                      <option value="not_specified">Prefer not to say</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-gray-600">Location</label>
                    <input
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="City, Area"
                      className="mt-1 w-full border-gray-300 rounded shadow-sm focus:ring focus:ring-green-200"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-gray-600">Bio</label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      rows={3}
                      className="mt-1 w-full border-gray-300 rounded shadow-sm focus:ring focus:ring-green-200"
                    />
                  </div>
                </div>
              </section>

              {/* Soccer Preferences */}
              <section className="space-y-4">
                <h2 className="text-xl font-medium text-gray-700">Soccer Preferences</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-600">Skill Level</label>
                    <select
                      name="skillLevel"
                      value={formData.skillLevel}
                      onChange={handleChange}
                      className="mt-1 w-full border-gray-300 rounded shadow-sm focus:ring focus:ring-green-200"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-gray-600">Search Radius: {formData.preferredRadius} mi</label>
                    <input
                      type="range"
                      name="preferredRadius"
                      min={1}
                      max={50}
                      value={formData.preferredRadius}
                      onChange={handleChange}
                      className="mt-2 w-full"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-gray-600">Preferred Time</label>
                    <select
                      name="preferredTime"
                      value={formData.preferredTime}
                      onChange={handleChange}
                      className="mt-1 w-full border-gray-300 rounded shadow-sm focus:ring focus:ring-green-200"
                    >
                      <option value="morning">Morning</option>
                      <option value="afternoon">Afternoon</option>
                      <option value="evening">Evening</option>
                      <option value="night">Night</option>
                      <option value="any">No preference</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* Availability */}
              <section className="space-y-2">
                <h2 className="text-xl font-medium text-gray-700">Availability</h2>
                <div className="grid grid-cols-7 gap-2">
                  {Object.keys(formData.availableDays).map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`py-2 rounded ${
                        formData.availableDays[day]
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {getLabel(day).slice(0, 3)}
                    </button>
                  ))}
                </div>
              </section>

              {/* Actions */}
              <div className="flex justify-end space-x-4"> 
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="px-4 py-2 bg-gray-200 rounded shadow hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded shadow hover:bg-green-700 transition"
                >
                  Save
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              {/* Basic Info Display */}
              <section className="space-y-3">
                <h2 className="text-lg font-medium text-gray-700">Basic Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-900">
                  <div>
                    <p className="text-gray-600">Email</p>
                    <p>{user.email}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Username</p>
                    <p>{user.username || '-'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Gender</p>
                    <p>{getLabel(user.gender)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Location</p>
                    <p>{user.location || '-'}</p>
                  </div>
                  {user.bio && (
                    <div className="md:col-span-2">
                      <p className="text-gray-600">Bio</p>
                      <p>{user.bio}</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Preferences Display */}
              <section className="space-y-3">
                <h2 className="text-lg font-medium text-gray-700">Soccer Preferences</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-gray-900">
                  <div>
                    <p className="text-gray-600">Skill</p>
                    <span className="inline-block px-2 py-1 bg-blue-100 rounded">{getLabel(user.skillLevel)}</span>
                  </div>
                  <div>
                    <p className="text-gray-600">Radius</p>
                    <p>{user.preferredRadius || '-'} mi</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Time</p>
                    <p>{getLabel(user.preferredTime)}</p>
                  </div>
                </div>
              </section>

              {/* Availability Display */}
              <section>
                <h2 className="text-lg font-medium text-gray-700 mb-2">Availability</h2>
                <div className="flex gap-2">
                  {Object.keys(user.availableDays).map((day) => (
                    <div
                      key={day}
                      className={`px-3 py-1 rounded-full text-xs ${
                        user.availableDays[day]
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {getLabel(day).slice(0,3)}
                    </div>
                  ))}
                </div>
              </section>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setEditing(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded shadow hover:bg-green-700 transition"
                >
                  Edit Profile
                </button>
                <Link
                  to="/games"
                  className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition"
                >
                  View Games
                </Link>
                <button
                  onClick={logoutUser}
                  className="px-4 py-2 bg-gray-200 rounded shadow hover:bg-gray-300 transition"
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
