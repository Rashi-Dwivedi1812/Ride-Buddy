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

  const parseToken = () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;
      return JSON.parse(atob(token.split('.')[1]));
    } catch (err) {
      console.error('Invalid token:', err);
      return null;
    }
  };

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
      socketRef.current?.disconnect();
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

    const payload = parseToken();
    if (!payload) {
      alert('❌ You must be logged in to send messages.');
      return;
    }

    const messageData = {
      rideId,
      senderName: payload.name,
      text: newMessage.trim(),
    };

    socketRef.current?.emit('chat_message', messageData);
    setNewMessage('');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  if (!ride) return <p className="p-6 text-white">Loading ride...</p>;

  return (
    <div className="dark min-h-screen bg-[#0f0f0f] text-white flex flex-col items-center px-4 py-10 relative overflow-hidden">
      {/* Background grid & blur */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff0d_1px,transparent_1px)] [background-size:20px_20px] z-0" />
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-700 via-purple-700 to-pink-700 opacity-10 blur-2xl z-0" />

      <h2 className="z-10 text-4xl font-extrabold mb-8 text-white drop-shadow text-center">
         Current Ride Details
      </h2>

      <div className="z-10 w-full max-w-4xl space-y-8">
        {/* Ride Info Card */}
        <div className="group relative w-full bg-white/10 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-white/20
                       hover:shadow-[0_0_30px_#8b5cf6] hover:scale-[1.01] hover:border-purple-400 transition-all duration-300">
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-200">
            <p><span className="font-semibold text-purple-400">Ride Owner:</span> {ride.driver?.name || 'Unknown'}</p>
            <p><span className="font-semibold text-purple-400">From:</span> {ride.from}</p>
            <p><span className="font-semibold text-purple-400">To:</span> {ride.to}</p>
            <p><span className="font-semibold text-purple-400">Date:</span> {new Date(ride.date).toLocaleDateString()}</p>
            <p><span className="font-semibold text-purple-400">Driver Arrives In:</span> {formatTime(arrivalTimeLeft || 0)}</p>
            <p><span className="font-semibold text-purple-400">Cab Price:</span> ₹{ride.costPerPerson}</p>
          </div>

          {ride.cabScreenshotUrl && (
  <div className="mt-6">
    <a
      href={ride.cabScreenshotUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-block px-6 py-2 rounded-xl font-semibold bg-purple-600 hover:bg-purple-700 text-white transition-all duration-300 shadow-lg"
    >
      📸 View Screenshot
    </a>
  </div>
)}
        </div>

        {/* Passenger List */}
        <div className="group relative w-full bg-white/10 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-white/20
                       hover:shadow-[0_0_30px_#8b5cf6] hover:scale-[1.01] hover:border-purple-400 transition-all duration-300">
          <h3 className="text-xl font-semibold text-white mb-4">🧍‍♂️ Passengers</h3>
          {Array.isArray(ride.bookedBy) && ride.bookedBy.length > 0 ? (
            ride.bookedBy.map((passenger) => (
              <p key={passenger._id} className="text-green-300"> Name : {passenger.name}</p>
            ))
          ) : (
            <p className="text-gray-400">No passengers yet.</p>
          )}
        </div>

        {/* Chat Section */}
        <div className="group relative w-full bg-white/10 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-white/20
                       hover:shadow-[0_0_30px_#8b5cf6] hover:scale-[1.01] hover:border-purple-400 transition-all duration-300">
          <h3 className="text-xl font-semibold text-white mb-4">💬 Chat</h3>
          <div className="h-40 overflow-y-auto border border-white/10 rounded p-3 bg-black/20 text-sm text-white space-y-1">
            {chatMessages.length === 0 ? (
              <p className="text-gray-400 italic">No messages yet.</p>
            ) : (
              chatMessages.map((msg, idx) => (
                <p key={idx}><span className="text-green-300 font-semibold">{msg.senderName}:</span> {msg.text}</p>
              ))
            )}
          </div>
          <div className="flex gap-2 mt-4">
            <input
              className="flex-1 border border-white/20 bg-black/40 text-white px-3 py-2 rounded focus:outline-none"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message"
            />
            <button
              onClick={handleSendMessage}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl font-semibold transition-all"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurrentRidePage;