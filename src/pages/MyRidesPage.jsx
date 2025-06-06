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
      const res = await axios.get('http://localhost:5000/api/rides/mine', {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Double filter to make absolutely sure
      const filteredRides = res.data.filter((ride) => ride.driver._id === userId);

      setRides(filteredRides);

      const initialCountdowns = {};
      res.data.forEach((ride) => {
        if (!ride.bookedBy || ride.bookedBy.length === 0) {
          const timeLeft = calculateCountdown(ride);
          initialCountdowns[ride._id] = timeLeft;
        }
      });

      setCountdowns(initialCountdowns);
    } catch (err) {
      console.error('❌ Failed to fetch my rides:', err);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const decoded = JSON.parse(atob(token.split('.')[1]));
    const userId = decoded.id || decoded._id;

    socketRef.current = io('http://localhost:5000');
    socketRef.current.emit('join_driver_room', userId); // only driver's own room

    fetchMyRides();

    // Handle real-time booking notifications
    socketRef.current.on('ride_booked', ({ rideId, byUserId, message, driverId }) => {
      if (String(driverId) !== String(userId)) return;

      toast.info(message || `Someone booked your ride (${rideId})`);
      fetchMyRides();

      if (!location.pathname.includes(`/current-ride/${rideId}`)) {
        setTimeout(() => {
          navigate(`/current-ride/${rideId}`);
        }, 1000);
      }
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, []);

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