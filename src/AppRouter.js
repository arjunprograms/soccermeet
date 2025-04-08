import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './config/firebase';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Profile from './components/profile/Profile';
import CreateGame from './components/games/CreateGame';
import GamesList from './components/games/GamesList';
import GameDetails from './components/games/GameDetails';
import GameManagement from './components/games/GameManagement';
import NotificationList from './components/notifications/NotificationList';
import Navbar from './components/layout/Navbar';

const AppRouter = () => {
  const [currentUser, setCurrentUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      {currentUser && <Navbar />}
      <Routes>
        <Route path="/login" element={currentUser ? <Navigate to="/profile" /> : <Login />} />
        <Route path="/register" element={currentUser ? <Navigate to="/profile" /> : <Register />} />
        <Route path="/profile" element={currentUser ? <Profile /> : <Navigate to="/login" />} />
        <Route path="/games" element={currentUser ? <GamesList /> : <Navigate to="/login" />} />
        <Route path="/create-game" element={currentUser ? <CreateGame /> : <Navigate to="/login" />} />
        <Route path="/games/:gameId" element={currentUser ? <GameDetails /> : <Navigate to="/login" />} />
        <Route path="/games/:gameId/manage" element={currentUser ? <GameManagement /> : <Navigate to="/login" />} />
        <Route path="/notifications" element={currentUser ? <NotificationList /> : <Navigate to="/login" />} />
        <Route path="/" element={<Navigate to={currentUser ? "/games" : "/login"} />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;