import { BrowserRouter as Router, Route, Routes } from "react-router-dom"
import Login from "./Login"
import Register from "./Register"
import Profile from "./Profile"
import GamesList from "./GamesList"
import CreateGame from "./CreateGame"
import GameDetails from "./GameDetails"
import GameManagement from "./GameManagement"
import Notifications from "./Notifications"
import EditGame from "./EditGame"
import Navbar from "./Navbar"

function AppRouter() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<GamesList />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/games" element={<GamesList />} />
        <Route path="/games/create" element={<CreateGame />} />
        <Route path="/games/:gameId" element={<GameDetails />} />
        <Route path="/games/:gameId/manage" element={<GameManagement />} />
        <Route path="/games/:gameId/edit" element={<EditGame />} />
        <Route path="/notifications" element={<Notifications />} />
      </Routes>
    </Router>
  )
}

export default AppRouter
