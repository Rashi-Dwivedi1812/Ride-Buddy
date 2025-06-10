import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import HomePage from './pages/HomePage';
import PostRidePage from './pages/PostRidePage';
import FindRidePage from './pages/FindRidePage';
import MyRidesPage from './pages/MyRidesPage';
import { ToastContainer } from 'react-toastify';
import CurrentRidePage from './pages/currentRidePage';
import 'react-toastify/dist/ReactToastify.css';
import PassengerRidePage from './pages/PassengerRidePage';
import FeedbackPage from './pages/FeedbackPage';
import HistoryPage from './pages/HistoryPage';

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
          <Route path="/current-ride/:rideId" element={<CurrentRidePage />} />
          <Route path="/passenger-ride/:rideId" element={<PassengerRidePage />} />
          <Route path='/feedback' element={<FeedbackPage/>}/>
          <Route path='/history' element={<HistoryPage/>}/>
        </Routes>
        <ToastContainer position="top-center" autoClose={3000} />
      </>
    </Router>
  );
};

export default App;