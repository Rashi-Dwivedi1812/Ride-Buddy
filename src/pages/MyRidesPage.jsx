import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { toast } from 'react-toastify';

const MyRidesPage = () => {
  const [rides, setRides] = useState([]);
  const socketRef = useRef(null);

  const fetchMyRides = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/rides', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setRides(res.data);

      // Join ride rooms
      res.data.forEach((ride) => {
        socketRef.current.emit('join_room', ride._id);
      });
    } catch (err) {
      console.error('❌ Failed to fetch my rides:', err);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Decode token to get user ID
    const payload = JSON.parse(atob(token.split('.')[1]));
    const userId = payload.id;

    socketRef.current = io('http://localhost:5000');

    fetchMyRides();

    socketRef.current.on('ride_booked', ({ rideId, byUserId, message }) => {
      toast.info(message || `Someone booked your ride (${rideId})`);
      fetchMyRides(); // Refresh rides on booking
      setTimeout(() => {
    window.location.href = `/current-ride/${rideId}`;
  }, 1000);
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h2 className="text-2xl font-semibold mb-6">My Rides</h2>
      {rides.length === 0 ? (
        <p className="text-gray-600">You haven't posted any rides yet.</p>
      ) : (
        rides.map((ride) => (
          <div
            key={ride._id}
            className="bg-white shadow-md rounded-xl p-4 mb-4 border border-gray-200"
          >
            <p><strong>From:</strong> {ride.from}</p>
            <p><strong>To:</strong> {ride.to}</p>
            <p><strong>Date:</strong> {new Date(ride.date).toLocaleDateString()}</p>
            <p><strong>Seats Left:</strong> {ride.seatsAvailable}</p>
            <p><strong>Cost:</strong> ₹{ride.costPerPerson}</p>

            {ride.bookedBy?.length > 0 ? (
              <p><strong>Booked By:</strong> {ride.bookedBy.length} user(s)</p>
            ) : (
              <p className="text-yellow-600 font-medium">
                ⏳ Waiting for someone to book this ride...
              </p>
            )}

            {ride.cabScreenshotUrl && (
              <a
                href={ride.cabScreenshotUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src={ride.cabScreenshotUrl}
                  alt="Cab Screenshot"
                  className="mt-2 max-h-48 object-cover rounded hover:opacity-90 transition"
                />
              </a>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default MyRidesPage;