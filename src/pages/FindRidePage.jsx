import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';

const FindRidePage = () => {
  const [rides, setRides] = useState([]);
  const socketRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('http://localhost:5000/api/rides')
      .then((res) => setRides(res.data))
      .catch((err) => console.error('Error fetching rides:', err));

    // Initialize socket
    socketRef.current = io('http://localhost:5000');

    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  const handleAccept = async (rideId) => {
    try {
      const token = localStorage.getItem('token');
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.id;
      const userName = payload.name;

      await axios.post(`http://localhost:5000/api/rides/${rideId}/accept`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // ✅ Notify ride owner via socket
      socketRef.current.emit('ride_booked', {
        rideId,
        byUserId: userId,
        message: `${userName || 'Someone'} accepted your ride.`,
      });

      // ✅ Redirect to /current-ride
      navigate(`/current-ride/${rideId}`);
  } catch (error) {
    console.error('Error accepting ride:', error);
    alert('❌ Failed to accept ride.');
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
      setRides((prevRides) => prevRides.filter((ride) => ride._id !== rideId));
    } catch (error) {
      console.error('Error rejecting ride:', error.response?.data || error.message);
      alert('❌ Failed to reject ride.');
    }
  };

  const handleChat = (rideId) => {
    navigate(`/chat/${rideId}`);
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
                <p><strong>Name:</strong> {ride.driver?.name}</p>
                <p><strong>From:</strong> {ride.from}</p>
                <p><strong>To:</strong> {ride.to}</p>
                <p><strong>Date:</strong> {ride.date}</p>
                <p><strong>Driver arriving in:</strong> {ride.driverArrivingIn}</p>
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
                  <button
                    onClick={() => handleChat(ride._id)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded"
                  >
                    Chat
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