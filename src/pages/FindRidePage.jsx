import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';

const FindRidePage = () => {
  const [rides, setRides] = useState([]);
  const socketRef = useRef(null);
  const [countdowns, setCountdowns] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRides = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/rides');
        const availableRides = res.data.filter(ride => ride.seatsAvailable > 0);
        setRides(availableRides);

        const initialCountdowns = {};
        availableRides.forEach(ride => {
          const timeInSeconds = parseInt(ride.driverArrivingIn) * 60;
          const createdAt = new Date(ride.createdAt).getTime();
          const now = Date.now();
          const elapsed = Math.floor((now - createdAt) / 1000);
          const remaining = Math.max(timeInSeconds - elapsed, 0);
          initialCountdowns[ride._id] = remaining;
        });
        setCountdowns(initialCountdowns);
      } catch (err) {
        console.error('Error fetching rides:', err);
      }
    };

    fetchRides();
    socketRef.current = io('http://localhost:5000');

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdowns(prev => {
        const updated = { ...prev };
        for (const rideId in updated) {
          if (updated[rideId] > 0) updated[rideId] -= 1;
        }
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  const handleAccept = async (rideId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return alert('Please log in first.');

      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.id;
      const userName = payload.name;

      const res = await axios.post(
        `http://localhost:5000/api/rides/${rideId}/accept`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedRide = res.data;

      socketRef.current.emit('ride_booked', {
        rideId,
        byUserId: userId,
        message: `${userName || 'Someone'} accepted your ride.`,
      });

      if (updatedRide.seatsAvailable === 0) {
        setRides(prev => prev.filter(ride => ride._id !== rideId));
      } else {
        setRides(prev =>
          prev.map(ride => (ride._id === rideId ? updatedRide : ride))
        );
      }

      navigate(`/current-ride/${rideId}`);
    } catch (error) {
      const errMsg = error.response?.data?.msg || 'Failed to accept ride.';
      alert(`❌ ${errMsg}`);
      console.error('Accept ride error:', err);
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
        {rides.length === 0 ? (
          <p className="text-gray-400 text-center">No rides available at the moment.</p>
        ) : (
          rides.map((ride) => (
            <div
              key={ride._id}
              className="group relative z-10 w-full max-w-xl bg-white/10 backdrop-blur-md p-10 rounded-2xl shadow-2xl border border-white/20
                      hover:shadow-[0_0_30px_#8b5cf6] hover:scale-[1.02] hover:border-purple-400 transition-all duration-300"
            >
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-200">
                <p><span className="font-semibold text-green-400">Driver:</span> {ride.driver?.name || 'Unknown'}</p>
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
              )}

              <div className="flex gap-4 mt-6">
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
          ))
        )}
      </div>
    </div>
  );
};

export default FindRidePage;
