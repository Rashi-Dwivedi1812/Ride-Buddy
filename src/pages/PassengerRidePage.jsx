import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';

const PassengerRidePage = () => {
  const { rideId } = useParams();
  const [ride, setRide] = useState(null);
  const [arrivalTimeLeft, setArrivalTimeLeft] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const socketRef = useRef(null);
  const userRef = useRef(null);

  useEffect(() => {
    const fetchRideAndUser = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        // Get ride
        const rideRes = await axios.get(`http://localhost:5000/api/rides/${rideId}`, { headers });
        setRide(rideRes.data);

        // Get user info (for senderId)
        const userRes = await axios.get(`http://localhost:5000/api/auth/me`, { headers });
        userRef.current = userRes.data;

        // Get previous chat messages
        const msgRes = await axios.get(`http://localhost:5000/api/messages/${rideId}`, { headers });
        setMessages(msgRes.data);

        // Arrival time calculation
        if (res.data.createdAt && res.data.driverArrivingIn) {
          const createdAt = new Date(res.data.createdAt).getTime();
          const now = Date.now();
          const elapsed = Math.floor((now - createdAt) / 1000);
          const remaining = Math.max(res.data.driverArrivingIn * 60 - elapsed, 0);
          setArrivalTimeLeft(remaining);
        }
      } catch (err) {
        console.error('Error loading data:', err);
      }
    };

    fetchRideAndUser();

    socketRef.current = io('http://localhost:5000');
    socketRef.current.emit('join_room', rideId);

    socketRef.current.on('new_message', (msg) => {
      if (msg.rideId === rideId) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [rideId]);

  useEffect(() => {
    const timer = setInterval(() => {
      setArrivalTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const sendMessage = () => {
    if (!newMessage.trim() || !ride || !userRef.current) return;

    const messageData = {
      rideId,
      senderId: userRef.current._id,
      receiverId: ride.createdBy?._id,
      message: newMessage,
    };

    socketRef.current.emit('send_message', messageData);
    setNewMessage('');
  };

   const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  if (!ride) return <p className="text-white p-6">Loading ride details...</p>;

  return (
    <div className="dark min-h-screen bg-[#0f0f0f] text-white flex flex-col items-center px-4 py-10">
      <h2 className="text-3xl font-bold mb-6">🚖 Ride in Progress</h2>

      <div className="bg-white/10 p-6 rounded-xl shadow-md max-w-xl w-full mb-8">
        <p><strong>Ride Owner:</strong> {ride.driver?.name || 'Unknown'}</p>
        <p><strong>From:</strong> {ride.from}</p>
        <p><strong>To:</strong> {ride.to}</p>
        <p><strong>Cost:</strong> ₹{ride.costPerPerson}</p>
        <p><strong>Arriving in:</strong>{formatTime(arrivalTimeLeft || 0)}</p>

        {ride.cabScreenshotUrl && (
          <a
            href={ride.cabScreenshotUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-4 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
          >
            📸 View Cab Screenshot
          </a>
        )}
      </div>

      {/* Chat Section */}
      <div className="bg-white/10 p-4 rounded-xl shadow-md max-w-xl w-full">
        <h3 className="text-xl font-semibold mb-3">💬 Chat with {ride.driver?.name || 'Unknown'}</h3>

        <div className="h-64 overflow-y-auto bg-black/30 p-2 rounded mb-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`my-1 ${
                msg.senderId === userRef.current?._id ? 'text-right' : 'text-left'
              }`}
            >
              <span className="inline-block bg-white/20 px-3 py-1 rounded">
                {msg.message}
              </span>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 rounded px-3 py-2 bg-white/20 text-white placeholder-white"
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          />
          <button
            onClick={sendMessage}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default PassengerRidePage;