import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const FindRidePage = () => {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);
  const [countdowns, setCountdowns] = useState({});
  const navigate = useNavigate();
  const refreshIntervalRef = useRef(null);

  // Try to load cached rides on initial render
  useEffect(() => {
    const cachedRides = localStorage.getItem('cachedRides');
    if (cachedRides) {
      setRides(JSON.parse(cachedRides));
      setLoading(false);
    }
  }, []);

  const fetchRides = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5000/api/rides');
      const now = Date.now();
        // Keep rides visible for at least 10 minutes from creation
      const availableRides = res.data.filter(ride => {
        const createdAt = new Date(ride.createdAt).getTime();
        const acceptedAt = ride.acceptedAt ? new Date(ride.acceptedAt).getTime() : null;
        const displayStartTime = acceptedAt || createdAt;
        const ageInMinutes = (now - displayStartTime) / (1000 * 60);
        const hasAvailableSeats = ride.seatsAvailable > 0;
        
        // Always show for at least 10 minutes
        const isWithinMinimumTime = ageInMinutes <= 10;
        
        // Check if ride has a custom display time
        const hasCustomDisplayTime = ride.minimumDisplayTime && (now < new Date(ride.minimumDisplayTime).getTime());
        
        // Show if within minimum time or has custom display time
        return hasAvailableSeats && (isWithinMinimumTime || hasCustomDisplayTime);
      });
      
      setRides(availableRides);
      // Cache the rides
      localStorage.setItem('cachedRides', JSON.stringify(availableRides));      // Update countdowns for all rides
      const initialCountdowns = {};
      availableRides.forEach(ride => {
        const createdAt = new Date(ride.createdAt).getTime();
        const acceptedAt = ride.acceptedAt ? new Date(ride.acceptedAt).getTime() : null;
        const displayStartTime = acceptedAt || createdAt;
        const timeElapsedSeconds = Math.floor((now - displayStartTime) / 1000);
        
        // Set minimum display time to 10 minutes
        const minimumDisplaySeconds = 10 * 60;
        
        // If ride has custom display time, use the longer duration
        const customDisplayTime = ride.minimumDisplayTime ? 
          Math.max(minimumDisplaySeconds, Math.floor((new Date(ride.minimumDisplayTime).getTime() - displayStartTime) / 1000)) :
          minimumDisplaySeconds;
          
        const remaining = Math.max(customDisplayTime - timeElapsedSeconds, 0);
        initialCountdowns[ride._id] = remaining;
      });
      setCountdowns(initialCountdowns);
    } catch (err) {
      console.error('Error fetching rides:', err);
      toast.error('Failed to fetch rides. Retrying...');
    } finally {
      setLoading(false);
    }
  };  useEffect(() => {
    fetchRides(); // Initial fetch

    // Initialize socket with better connection handling
    socketRef.current = io('http://localhost:5000', {
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000
    });

    // Socket event handlers
    socketRef.current.on('connect', () => {
      console.log('Socket connected');
      fetchRides(); // Refresh rides on reconnection
    });

    socketRef.current.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      toast.error('Connection lost. Trying to reconnect...');
    });

    // Listen for new rides and updates
    socketRef.current.on('newRide', () => {
      fetchRides();
    });

    socketRef.current.on('rideUpdated', () => {
      fetchRides();
    });

    // Set up auto-refresh every 15 seconds to ensure consistent updates
    refreshIntervalRef.current = setInterval(fetchRides, 15000);

    // Cleanup function
    return () => {
      socketRef.current?.disconnect();
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);
  // Handle countdown updates with improved precision
  useEffect(() => {
    const countdownInterval = setInterval(() => {
      setCountdowns(prevCountdowns => {
        const now = Date.now();
        const newCountdowns = { ...prevCountdowns };
        let updated = false;        rides.forEach(ride => {
          const createdAt = new Date(ride.createdAt).getTime();
          const acceptedAt = ride.acceptedAt ? new Date(ride.acceptedAt).getTime() : null;
          const displayStartTime = acceptedAt || createdAt;
          const timeElapsedSeconds = Math.floor((now - displayStartTime) / 1000);
          
          // Minimum 10 minutes display time
          const minimumDisplaySeconds = 10 * 60;
          
          // Use custom display time if it's longer than minimum
          const customDisplayTime = ride.minimumDisplayTime ? 
            Math.max(minimumDisplaySeconds, Math.floor((new Date(ride.minimumDisplayTime).getTime() - displayStartTime) / 1000)) :
            minimumDisplaySeconds;
            
          const remaining = Math.max(customDisplayTime - timeElapsedSeconds, 0);
          
          // Only update if the countdown has changed
          if (newCountdowns[ride._id] !== remaining) {
            newCountdowns[ride._id] = remaining;
            updated = true;
          }
          
          // Remove ride from display if countdown reaches 0
          if (remaining === 0 && rides.find(r => r._id === ride._id)) {
            setRides(prev => prev.filter(r => r._id !== ride._id));
          }
        });

        return updated ? newCountdowns : prevCountdowns;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, []);
  const formatTime = (seconds) => {
    if (seconds <= 0) return 'Expired';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')} remaining`;
  };

  const handleRideClick = (rideId) => {
    navigate(`/ride/${rideId}`);
  };

  const handleAccept = async (rideId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return alert('Please log in first.');

      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.id;
      const userName = payload.name;

      console.log('🚗 Accepting ride:', rideId);
      const res = await axios.post(
        `http://localhost:5000/api/rides/${rideId}/accept`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedRide = res.data;
      console.log('✅ Ride accepted:', updatedRide);

      // Remove this ride from the available rides list
      setRides(prev => prev.filter(ride => ride._id !== rideId));

      // Navigate to passenger view
      navigate(`/passenger-ride/${rideId}`);
    } catch (error) {
      const errMsg = error.response?.data?.message || 'Failed to accept ride.';
      toast.error(`❌ ${errMsg}`);
      console.error('Accept ride error:', error);
    }
  };

  const handleReject = async (rideId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:5000/api/rides/${rideId}/reject`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('🚫 Ride rejected.');
      setRides(prev => prev.filter(ride => ride._id !== rideId));
    } catch (error) {
      console.error('Reject ride error:', error.response?.data || error.message);
      alert('❌ Failed to reject ride.');
    }
  };
  return (
    <div className="dark min-h-screen bg-[#0f0f0f] text-white flex flex-col items-center px-4 py-10 relative overflow-hidden">
      {/* Background Grid and Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff0d_1px,transparent_1px)] [background-size:20px_20px] z-0" />
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-700 via-purple-700 to-pink-700 opacity-10 blur-2xl z-0" />

      {/* Heading */}
      <h2 className="z-10 text-4xl font-extrabold mb-8 text-white drop-shadow text-center">
        🔍 Available Rides
      </h2>

      {/* Rides List */}
      <div className="z-10 w-full max-w-4xl space-y-6">
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        ) : rides.length === 0 ? (
          <p className="text-gray-400 text-center">No rides available at the moment.</p>
        ) : rides.map((ride) => (
          <div
            key={ride._id}
            className="group relative z-10 w-full max-w-xl bg-white/10 backdrop-blur-md p-10 rounded-2xl shadow-2xl border border-white/20
                    hover:shadow-[0_0_30px_#8b5cf6] hover:scale-[1.02] hover:border-purple-400 transition-all duration-300"
          >
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-200">
              <p><span className="font-semibold text-green-400">Ride Owner:</span> {ride.driver?.name || 'Unknown'}</p>
              <p><span className="font-semibold text-green-400">From:</span> {ride.from}</p>
              <p><span className="font-semibold text-green-400">To:</span> {ride.to}</p>
              <p><span className="font-semibold text-green-400">Date:</span> {new Date(ride.date).toLocaleDateString()}</p>
              <p>
                <span className="font-semibold text-green-400">Arriving in:</span>{' '}
                {countdowns[ride._id] > 0 ? formatTime(countdowns[ride._id]) : 'Arrived'}
              </p>
              <p><span className="font-semibold text-green-400">Cost:</span> ₹{ride.costPerPerson}</p>
              <p><span className="font-semibold text-green-400">Seats:</span> {ride.seatsAvailable}</p>
            </div>

            {ride.cabScreenshotUrl && (
              <div className="mt-4">
                <button
                  onClick={() => window.open(ride.cabScreenshotUrl, '_blank')}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition"
                >
                  📷 View Cab Screenshot
                </button>
              </div>
            )}              <div className="flex gap-4 mt-6">
              <button
                onClick={() => handleAccept(ride._id)}
                className="relative px-6 py-2 rounded-xl font-semibold bg-green-600 hover:bg-green-700 text-white transition-all duration-300"
              >
                ✅ Accept
                <span className="absolute inset-0 rounded-xl ring-2 ring-green-400 opacity-0 group-hover:opacity-100 blur-md animate-pulse transition" />
              </button>
              <button
                onClick={() => handleReject(ride._id)}
                className="relative px-6 py-2 rounded-xl font-semibold bg-red-600 hover:bg-red-700 text-white transition-all duration-300"
              >
                ❌ Reject
                <span className="absolute inset-0 rounded-xl ring-2 ring-red-400 opacity-0 group-hover:opacity-100 blur-md animate-pulse transition" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FindRidePage;