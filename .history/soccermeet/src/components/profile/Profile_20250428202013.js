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
    location: '',
    skillLevel: 'beginner'
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
              location: userDoc.data().location || '',
              skillLevel: userDoc.data().skillLevel || 'beginner'
            });
          } else {
            // Create a default profile if one doesn't exist
            console.log("No profile found, creating a default one");
            const defaultProfile = {
              username: auth.currentUser.email.split('@')[0],
              email: auth.currentUser.email,
              location: '',
              skillLevel: 'beginner',
              createdAt: new Date()
            };
            
            // Save the default profile to Firestore
            await setDoc(doc(db, "users", auth.currentUser.uid), defaultProfile);
            
            // Update state with the new profile
            setUser(defaultProfile);
            setFormData({
              username: defaultProfile.username,
              location: defaultProfile.location,
              skillLevel: defaultProfile.skillLevel
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
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const userRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userRef, {
        username: formData.username,
        location: formData.location,
        skillLevel: formData.skillLevel,
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
          
          <div className="button-group">
            <button type="submit">Save</button>
            <button type="button" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </form>
      ) : (
        <div className="profile-info">
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Username:</strong> {user.username || 'Not set'}</p>
          <p><strong>Location:</strong> {user.location || 'Not set'}</p>
          <p><strong>Skill Level:</strong> {user.skillLevel || 'Beginner'}</p>
          
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