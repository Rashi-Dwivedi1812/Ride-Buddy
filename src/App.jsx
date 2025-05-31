import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import HomePage from './pages/HomePage';
import PostRidePage from './pages/PostRidePage';
import FindRidePage from './pages/FindRidePage';
import ChatPage from './pages/ChatPage';
import ProfilePage from './pages/ProfilePage';
import MyRidesPage from './pages/MyRidesPage';
import { ToastContainer } from 'react-toastify';
import CurrentRidePage from './pages/currentRidePage';
import 'react-toastify/dist/ReactToastify.css';


const App = () => {
  return (
    
    <Router>
      <>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/post" element={<PostRidePage />} />
          <Route path="/my-rides" element={<MyRidesPage />} />
          <Route path="/find" element={<FindRidePage />} />
          <Route path="/chat/:rideId" element={<ChatPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/current-ride/:rideId" element={<CurrentRidePage />} />

        </Routes>
        <ToastContainer position="top-center" autoClose={3000} />
      </>
    </Router>
  );
};

export default App;