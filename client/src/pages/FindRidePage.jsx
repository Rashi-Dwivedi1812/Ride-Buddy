import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const getRemainingDisplayTime = (ride, now) => {
  const createdAt = new Date(ride.createdAt).getTime();
  const acceptedAt = ride.acceptedAt ? new Date(ride.acceptedAt).getTime() : null;
  const displayStartTime = acceptedAt || createdAt;
  const timeElapsedSeconds = Math.floor((now - displayStartTime) / 1000);
  const minimumDisplaySeconds = 10 * 60;
  const customDisplayTime = ride.minimumDisplayTime
    ? Math.max(
        minimumDisplaySeconds,
        Math.floor((new Date(ride.minimumDisplayTime).getTime() - displayStartTime) / 1000)
      )
    : minimumDisplaySeconds;
  return Math.max(customDisplayTime - timeElapsedSeconds, 0);
};

const shouldDisplayRide = (ride, now) => {
  const createdAt = new Date(ride.createdAt).getTime();
  const acceptedAt = ride.acceptedAt ? new Date(ride.acceptedAt).getTime() : null;
  const displayStartTime = acceptedAt || createdAt;
  const ageInMinutes = (now - displayStartTime) / (1000 * 60);
  const hasAvailableSeats = ride.seatsAvailable > 0;
  const isWithinMinimumTime = ageInMinutes <= 10;
  const hasCustomDisplayTime = ride.minimumDisplayTime && (now < new Date(ride.minimumDisplayTime).getTime());
  return hasAvailableSeats && (isWithinMinimumTime || hasCustomDisplayTime);
};

const FindRidePage = () => {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);
  const [countdowns, setCountdowns] = useState({});
  const navigate = useNavigate();
  const refreshIntervalRef = useRef(null);

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
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/rides`);
      const now = Date.now();
      const availableRides = res.data.filter((ride) => shouldDisplayRide(ride, now));
      setRides(availableRides);
      localStorage.setItem('cachedRides', JSON.stringify(availableRides));
      const initialCountdowns = {};
      availableRides.forEach((ride) => {
        initialCountdowns[ride._id] = getRemainingDisplayTime(ride, now);
      });
      setCountdowns(initialCountdowns);
    } catch (err) {
      console.error('Error fetching rides:', err);
      toast.error('Failed to fetch rides. Retrying...');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRides();
    socketRef.current = io(import.meta.env.VITE_API_URL.replace('/api', ''), {
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    socketRef.current.on('connect', () => {
      console.log('Socket connected');
      fetchRides();
    });

    socketRef.current.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      toast.error('Connection lost. Trying to reconnect...');
    });

    socketRef.current.on('newRide', fetchRides);
    socketRef.current.on('rideUpdated', fetchRides);

    refreshIntervalRef.current = setInterval(fetchRides, 15000);

    return () => {
      socketRef.current?.disconnect();
      clearInterval(refreshIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    const countdownInterval = setInterval(() => {
      setCountdowns((prevCountdowns) => {
        const now = Date.now();
        const newCountdowns = { ...prevCountdowns };
        let updated = false;

        rides.forEach((ride) => {
          const remaining = getRemainingDisplayTime(ride, now);

          if (newCountdowns[ride._id] !== remaining) {
            newCountdowns[ride._id] = remaining;
            updated = true;
          }

          if (remaining === 0) {
            setRides((prev) => prev.filter((r) => r._id !== ride._id));
          }
        });

        return updated ? newCountdowns : prevCountdowns;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [rides]);

  const formatTime = (seconds) => {
    if (seconds <= 0) return 'Expired';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')} remaining`;
  };

  const handleRideClick = (rideId) => navigate(`/ride/${rideId}`);

  const handleAccept = async (rideId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return alert('Please log in first.');

      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('🚗 Accepting ride:', rideId);

      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/rides/${rideId}/accept`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('✅ Ride accepted:', res.data);
      setRides((prev) => prev.filter((ride) => ride._id !== rideId));
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
        `${import.meta.env.VITE_API_URL}/rides/${rideId}/reject`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('🚫 Ride rejected.');
      setRides((prev) => prev.filter((ride) => ride._id !== rideId));
    } catch (error) {
      console.error('Reject ride error:', error.response?.data || error.message);
      alert('❌ Failed to reject ride.');
    }
  };

  return (
    <div className="dark min-h-screen bg-[#0f0f0f] text-white flex flex-col items-center px-4 py-10 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff0d_1px,transparent_1px)] [background-size:20px_20px] z-0" />
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-700 via-purple-700 to-pink-700 opacity-10 blur-2xl z-0" />
      <h2 className="z-10 text-4xl font-extrabold mb-8 text-white drop-shadow text-center">🔍 Available Rides</h2>
      <div className="z-10 w-full max-w-4xl space-y-6">
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        ) : rides.length === 0 ? (
          <p className="text-gray-400 text-center">No rides available at the moment.</p>
        ) : (
          rides.map((ride) => (
            <div
              key={ride._id}
              className="group relative z-10 w-full max-w-xl bg-white/10 backdrop-blur-md p-10 rounded-2xl shadow-2xl border border-white/20 hover:shadow-[0_0_30px_#8b5cf6] hover:scale-[1.02] hover:border-purple-400 transition-all duration-300"
            >
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-200">
                <p><span className="font-semibold text-green-400">Ride Owner:</span> {ride.driver?.name || 'Unknown'}</p>
                <p><span className="font-semibold text-green-400">From:</span> {ride.from}</p>
                <p><span className="font-semibold text-green-400">To:</span> {ride.to}</p>
                <p><span className="font-semibold text-green-400">Date:</span> {new Date(ride.date).toLocaleDateString()}</p>
                <p><span className="font-semibold text-green-400">Arriving in:</span> {countdowns[ride._id] > 0 ? formatTime(countdowns[ride._id]) : 'Arrived'}</p>
                <p><span className="font-semibold text-green-400">Cost:</span> ₹{ride.costPerPerson}</p>
                <p><span className="font-semibold text-green-400">Seats:</span> {ride.seatsAvailable}</p>
              </div>
              {ride.cabScreenshotUrl && (
                <div className="mt-4">
                  <button
                    onClick={() => window.open(ride.cabScreenshotUrl, '_blank')}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition"
                  >📷 View Cab Screenshot</button>
                </div>
              )}
              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => handleAccept(ride._id)}
                  className="relative px-6 py-2 rounded-xl font-semibold bg-green-600 hover:bg-green-700 text-white transition-all duration-300"
                >✅ Accept<span className="absolute inset-0 rounded-xl ring-2 ring-green-400 opacity-0 group-hover:opacity-100 blur-md animate-pulse transition" /></button>
                <button
                  onClick={() => handleReject(ride._id)}
                  className="relative px-6 py-2 rounded-xl font-semibold bg-red-600 hover:bg-red-700 text-white transition-all duration-300"
                >❌ Reject<span className="absolute inset-0 rounded-xl ring-2 ring-red-400 opacity-0 group-hover:opacity-100 blur-md animate-pulse transition" /></button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FindRidePage;