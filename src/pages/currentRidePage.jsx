import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';

const CurrentRidePage = () => {
  const { rideId } = useParams();
  const [ride, setRide] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [arrivalTimeLeft, setArrivalTimeLeft] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    const fetchRide = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`http://localhost:5000/api/rides/${rideId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRide(res.data);

        if (res.data.driverArrivingIn) {
          const createdAt = new Date(res.data.createdAt).getTime();
          const now = Date.now();
          const elapsed = Math.floor((now - createdAt) / 1000);
          const remaining = Math.max(res.data.driverArrivingIn * 60 - elapsed, 0);
          setArrivalTimeLeft(remaining);
        }
      } catch (err) {
        console.error('Failed to fetch ride:', err);
      }
    };

    fetchRide();

    socketRef.current = io('http://localhost:5000');
    socketRef.current.emit('join_room', rideId);

    socketRef.current.on('chat_message', (msg) => {
      setChatMessages((prev) => [...prev, msg]);
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [rideId]);

  useEffect(() => {
    const interval = setInterval(() => {
      setArrivalTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    const token = localStorage.getItem('token');
    const payload = JSON.parse(atob(token.split('.')[1]));
    const messageData = {
      rideId,
      senderName: payload.name,
      text: newMessage,
    };
    socketRef.current.emit('chat_message', messageData);
    setNewMessage('');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  if (!ride) return <p className="p-6">Loading ride...</p>;

  return (
    <div className="p-6 min-h-screen bg-gray-100">
      <h2 className="text-2xl font-bold mb-4">Current Ride</h2>

      {/* Ride Owner Info */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <p><strong>Ride Owner:</strong> {ride.driver?.name}</p>
        <p><strong>From:</strong> {ride.from}</p>
        <p><strong>To:</strong> {ride.to}</p>
        <p><strong>Date:</strong> {new Date(ride.date).toLocaleDateString()}</p>
        <p><strong>Driver Arriving In:</strong> {formatTime(arrivalTimeLeft || 0)}</p>

        {ride.cabScreenshotUrl && (
          <div className="mt-4">
            <p><strong>Cab Screenshot:</strong></p>
            <a href={ride.cabScreenshotUrl} target="_blank" rel="noopener noreferrer">
              <img
                src={ride.cabScreenshotUrl}
                alt="Cab Screenshot"
                className="w-48 h-auto mt-2 rounded cursor-pointer border"
              />
            </a>
          </div>
        )}
      </div>

      {/* Passenger Cards */}
      {Array.isArray(ride.bookedBy) && ride.bookedBy.length > 0 ? (
        ride.bookedBy.map((passenger) => (
          <div
            key={passenger._id}
            className="bg-white p-4 rounded shadow mb-4"
          >
            <p><strong>Passenger:</strong> {passenger.name}</p>
            {/* You can add more passenger-specific data here if needed */}
          </div>
        ))
      ) : (
        <div className="bg-white p-4 rounded shadow mb-4">
          <p><strong>Passenger:</strong> None yet</p>
        </div>
      )}

      {/* Chat Section */}
      <div className="bg-white p-4 rounded shadow mt-6">
        <h3 className="text-xl font-semibold mb-2">Chat</h3>
        <div className="h-40 overflow-y-auto border rounded p-2 mb-2">
          {chatMessages.map((msg, index) => (
            <p key={index}><strong>{msg.senderName}:</strong> {msg.text}</p>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            className="flex-1 border px-3 py-1 rounded"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message"
          />
          <button
            onClick={handleSendMessage}
            className="bg-blue-600 text-white px-4 py-1 rounded"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default CurrentRidePage;