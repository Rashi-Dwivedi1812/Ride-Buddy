import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import HomePage from './pages/HomePage';
import PostRidePage from './pages/PostRidePage';
import FindRidePage from './pages/FindRidePage';
import RideDetailPage from './pages/RideDetailPage';
import ChatPage from './pages/ChatPage';
import ProfilePage from './pages/ProfilePage';


const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/post" element={<PostRidePage />} />
        <Route path="/find" element={<FindRidePage />} />
        <Route path="/ride/:id" element={<RideDetailPage />} />
        <Route path="/chat/:rideId" element={<ChatPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
    </Router>
  );
}

export default App;
