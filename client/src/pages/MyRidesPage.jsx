import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { toast } from 'react-toastify';
import { useNavigate, useLocation } from 'react-router-dom';

const MyRidesPage = () => {
  const [rides, setRides] = useState([]);
  const [countdowns, setCountdowns] = useState({});
  const [showImageRideId, setShowImageRideId] = useState(null);
  const socketRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  const calculateCountdown = (ride) => {
    const createdAt = new Date(ride.createdAt).getTime();
    const arrivingInSeconds = ride.driverArrivingIn * 60;
    const serverTarget = createdAt + arrivingInSeconds * 1000;
    const now = Date.now();
    const diffSeconds = Math.floor((serverTarget - now) / 1000);
    return diffSeconds > 0 ? diffSeconds : 0;
  };

  const fetchMyRides = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      console.log('🔍 Fetching rides for user:', userId);
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/rides/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('📦 Raw response data:', res.data);      // We don't need to filter since the backend already filters by driver
      console.log('✨ Rides:', res.data);
      setRides(res.data);

      const initialCountdowns = {};
      res.data.forEach((ride) => {
        if (!ride.bookedBy || ride.bookedBy.length === 0) {
          const timeLeft = calculateCountdown(ride);
          initialCountdowns[ride._id] = timeLeft;
        }
      });

      setCountdowns(initialCountdowns);    } catch (err) {
      console.error('❌ Failed to fetch my rides:', err);
      const errorMessage = err.response?.data?.message || 'Failed to fetch rides. Please try again.';
      toast.error(errorMessage);
      // Set empty rides array to show the "no rides" message
      setRides([]);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const decoded = JSON.parse(atob(token.split('.')[1]));
    const userId = decoded.id || decoded._id;
    console.log('👤 User ID:', userId);

    socketRef.current = io(import.meta.env.VITE_API_URL.replace('/api', ''), {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 90000, // 1.5 minutes timeout
      autoConnect: true,
      forceNew: true,
      auth: {
        token
      }
    });

    // Initial fetch - don't wait for socket connection
    console.log('🔄 Initial fetch');
    fetchMyRides(userId);

    // Add connection event handlers
    socketRef.current.on('connect', () => {
      console.log('✅ Socket connected');
      socketRef.current.emit('join_driver_room', userId);
    });

    socketRef.current.on('reconnect', (attempt) => {
      console.log('🔄 Socket reconnected after', attempt, 'attempts');
      socketRef.current.emit('join_driver_room', userId);
      fetchMyRides(userId); // Refresh data after reconnect
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      toast.error('Connection error. Retrying...');
    });

    // Handle real-time booking notifications
    socketRef.current.on('ride_booked', async ({ rideId, byUserId, message, driverId, ride }) => {
      console.log('🎯 Received ride_booked event:', { rideId, byUserId, message, driverId, ride });
      
      // Only handle booking notifications for rides owned by the current user
      if (String(driverId) !== String(userId)) {
        console.log('❌ Not the ride owner, ignoring event');
        return;
      }

      // Show notification
      toast.success(message || `Someone booked your ride!`);
      
      // Navigate BEFORE updating state to ensure it happens
      console.log('🚗 Navigating to:', `/current-ride/${rideId}`);
      navigate(`/current-ride/${rideId}`, { replace: true });
      
      // Then update rides list with new data
      setRides(prev => prev.map(r => r._id === rideId ? ride : r));
    });

    // Handle ride updates (new rides, modifications)
    socketRef.current.on('ride_update', ({ driverId: updatedDriverId, action, ride }) => {
      // Only update if the update is for the current user's rides
      if (String(updatedDriverId) === String(userId)) {
        if (action === 'create') {
          console.log('✅ Received new ride:', ride);
          setRides(prev => [...prev, ride]);
          
          // Always set countdown for new rides
          const timeLeft = calculateCountdown(ride);
          setCountdowns(prev => ({ ...prev, [ride._id]: timeLeft }));
        } else {
          // For other updates, fetch all rides to ensure consistency
          fetchMyRides(userId);
        }
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.off('connect');
        socketRef.current.off('reconnect');
        socketRef.current.off('connect_error');
        socketRef.current.off('ride_booked');
        socketRef.current.off('ride_update');
        socketRef.current.disconnect();
      }
    };
  }, [navigate, location.pathname]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdowns((prev) => {
        const updated = { ...prev };
        for (const id in updated) {
          if (updated[id] > 0) {
            updated[id] -= 1;
          }
        }
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="dark min-h-screen bg-[#0f0f0f] text-white flex flex-col items-center px-4 py-10 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff0d_1px,transparent_1px)] [background-size:20px_20px] z-0" />
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-700 via-purple-700 to-pink-700 opacity-10 blur-2xl z-0" />

      {showImageRideId && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-black p-4 rounded-lg shadow-lg relative max-w-4xl w-full">
            <button
              className="absolute top-2 right-2 text-white text-2xl"
              onClick={() => setShowImageRideId(null)}
            >
              &times;
            </button>
            <img
              src={rides.find(r => r._id === showImageRideId)?.cabScreenshotUrl}
              alt="Cab Screenshot"
              className="w-full h-auto rounded-xl"
            />
          </div>
        </div>
      )}

      <h2 className="z-10 text-4xl font-extrabold mb-8 text-white drop-shadow text-center">
        🚗 Recent Rides
      </h2>

      <div className="z-10 w-full max-w-4xl space-y-6">
        {rides.length === 0 ? (
          <p className="text-gray-400 text-center">You haven't posted any rides yet.</p>
        ) : (
          rides.map((ride) => (
            <div
              key={ride._id}
              className="group relative w-full bg-white/10 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-white/20
                         hover:shadow-[0_0_30px_#8b5cf6] hover:scale-[1.01] hover:border-purple-400 transition-all duration-300"
            >
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-200">
                <p><span className="font-semibold text-purple-400">From:</span> {ride.from}</p>
                <p><span className="font-semibold text-purple-400">To:</span> {ride.to}</p>
                <p><span className="font-semibold text-purple-400">Date:</span> {new Date(ride.date).toLocaleDateString()}</p>
                <p><span className="font-semibold text-purple-400">Seats Left:</span> {ride.seatsAvailable}</p>
                <p><span className="font-semibold text-purple-400">Cost:</span> ₹{ride.costPerPerson}</p>
                <p>
                  <span className="font-semibold text-purple-400">Driver arriving in:</span>{' '}
                  {ride.bookedBy?.length > 0
                    ? '⏸️ Paused (Ride Booked)'
                    : (countdowns[ride._id] > 0
                      ? formatTime(countdowns[ride._id])
                      : 'Arrived')}
                </p>
              </div>

              <div className="mt-4">
                {ride.bookedBy?.length > 0 ? (
                  <p className="text-green-400 font-medium">✅ Booked by {ride.bookedBy.length} user(s)</p>
                ) : (
                  <p className="text-yellow-400 font-medium">⏳ Waiting for someone to book this ride...</p>
                )}
              </div>

              {ride.cabScreenshotUrl && (
                <button
                  onClick={() => setShowImageRideId(ride._id)}
                  className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition"
                >
                  📷 View Cab Screenshot
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MyRidesPage;