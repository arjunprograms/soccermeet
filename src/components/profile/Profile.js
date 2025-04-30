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
    preferredRadius: 10 // default 10 miles/km
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
              preferredRadius: userDoc.data().preferredRadius || 10
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
              preferredRadius: defaultProfile.preferredRadius
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
    setFormData({
      ...formData,
      [name]: name === 'preferredRadius' ? parseInt(value) : value
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

  if (loading) return <div>Loading profile...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!user) return <div>No user data found</div>;

  return (
    <div className="profile-container">
      <h2>Your Profile</h2>
      
      {editing ? (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input 
              type="text" 
              name="username" 
              value={formData.username} 
              onChange={handleChange}
              required 
            />
          </div>
          
          <div className="form-group">
            <label>Gender</label>
            <select 
              name="gender" 
              value={formData.gender}
              onChange={handleChange}
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
            />
          </div>
          
          <div className="form-group">
            <label>Skill Level</label>
            <select 
              name="skillLevel" 
              value={formData.skillLevel} 
              onChange={handleChange}
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Preferred Radius (miles)</label>
            <input
              type="number"
              name="preferredRadius"
              min="1"
              max="50"
              value={formData.preferredRadius}
              onChange={handleChange}
            />
          </div>
          
          <div className="button-group">
            <button type="submit">Save</button>
            <button type="button" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </form>
      ) : (
        <div className="profile-info">
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Username:</strong> {user.username || 'Not set'}</p>
          <p><strong>Gender:</strong> {
            user.gender === 'male' ? 'Male' : 
            user.gender === 'female' ? 'Female' : 
            user.gender === 'other' ? 'Other' : 
            'Not specified'
          }</p>
          <p><strong>Location:</strong> {user.location || 'Not set'}</p>
          <p><strong>Skill Level:</strong> {user.skillLevel || 'Beginner'}</p>
          <p><strong>Preferred Radius:</strong> {user.preferredRadius || 10} miles</p>
          <p><strong>Games Participated:</strong> {user.gamesCount || 0}</p>
          
          <div className="button-group">
            <button onClick={() => setEditing(true)}>Edit Profile</button>
            <button onClick={handleLogout}>Log Out</button>
            <Link to="/games" className="view-games-btn">View Games</Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;