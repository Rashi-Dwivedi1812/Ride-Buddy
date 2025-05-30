import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';

const FindRidePage = () => {
  const [rides, setRides] = useState([]);
  const socketRef = useRef(null);
  const [countdowns, setCountdowns] = useState({});
  const navigate = useNavigate();

  // Fetch rides and initialize countdown timers
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

  // Countdown timer updates
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
    return `${mins}m ${secs}s`;
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

      // Notify driver via socket
      socketRef.current.emit('ride_booked', {
        rideId,
        byUserId: userId,
        message: `${userName || 'Someone'} accepted your ride.`,
      });

      // Update UI
      if (updatedRide.seatsAvailable === 0) {
        setRides(prev => prev.filter(ride => ride._id !== rideId));
      } else {
        setRides(prev =>
          prev.map(ride => (ride._id === rideId ? updatedRide : ride))
        );
      }

      // Navigate to CurrentRidePage
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
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Available Rides</h2>
      <div className="grid gap-4">
        {rides.length === 0 ? (
          <p>No rides available.</p>
        ) : (
          rides.map((ride) => (
            <div key={ride._id} className="bg-white p-4 rounded shadow flex gap-4 items-start">
              {ride.cabScreenshotUrl && (
                <a href={ride.cabScreenshotUrl} target="_blank" rel="noopener noreferrer">
                  <img
                    src={ride.cabScreenshotUrl}
                    alt="Cab Screenshot"
                    className="w-24 h-24 object-cover rounded mb-2"
                  />
                </a>
              )}
              <div className="flex-1">
                <p><strong>Name:</strong> {ride.driver?.name || 'Unknown'}</p>
                <p><strong>From:</strong> {ride.from}</p>
                <p><strong>To:</strong> {ride.to}</p>
                <p><strong>Date:</strong> {new Date(ride.date).toLocaleDateString()}</p>
                <p title={`Arrives in ${ride.driverArrivingIn} minute(s)`}>
                  <strong>Driver arriving in:</strong>{' '}
                  {countdowns[ride._id] > 0 ? formatTime(countdowns[ride._id]) : 'Arrived'}
                </p>
                <p><strong>Cost per person:</strong> ₹{ride.costPerPerson}</p>
                <p><strong>Seats Available:</strong> {ride.seatsAvailable}</p>

                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleAccept(ride._id)}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-1 rounded"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleReject(ride._id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-1 rounded"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FindRidePage;