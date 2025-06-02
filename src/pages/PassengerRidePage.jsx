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
  const [chatOpen, setChatOpen] = useState(false);
  const socketRef = useRef(null);
  const userRef = useRef(null);

  useEffect(() => {
    const fetchRideAndUser = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        const rideRes = await axios.get(`http://localhost:5000/api/rides/${rideId}`, { headers });
        setRide(rideRes.data);

        const userRes = await axios.get(`http://localhost:5000/api/auth/me`, { headers });
        userRef.current = userRes.data;

        const msgRes = await axios.get(`http://localhost:5000/api/messages/${rideId}`, { headers });
        setMessages(msgRes.data);
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
    if (!ride?.createdAt || !ride?.driverArrivingIn) return;

    const createdAt = new Date(ride.createdAt).getTime();
    const arrivalDeadline = createdAt + ride.driverArrivingIn * 60 * 1000;

    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(Math.floor((arrivalDeadline - now) / 1000), 0);
      setArrivalTimeLeft(remaining);
    };

    updateTimer();
    const intervalId = setInterval(updateTimer, 1000);

    return () => clearInterval(intervalId);
  }, [ride]);

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
    if (seconds == null || isNaN(seconds)) return 'Calculating...';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  if (!ride) return <p className="p-6 text-white">Loading ride...</p>;

  return (
    <div className="dark min-h-screen bg-[#0f0f0f] text-white flex flex-col items-center px-4 py-10 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff0d_1px,transparent_1px)] [background-size:20px_20px] z-0" />
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-700 via-purple-700 to-pink-700 opacity-10 blur-2xl z-0" />

      <h2 className="z-10 text-4xl font-extrabold mb-8 text-white drop-shadow text-center">
        🚖 Ride in Progress
      </h2>

      <div className="z-10 w-full max-w-4xl space-y-8">
        {/* Ride Info */}
       <div
  className="group relative w-full bg-white/10 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-white/20 
             hover:shadow-[0_0_30px_#8b5cf6] hover:scale-[1.01] hover:border-purple-400 transition-all duration-300"
>

          <div className="grid grid-cols-2 gap-4 text-sm text-gray-200">
            <p>
              <span className="font-semibold text-purple-400">Ride Owner:</span> {ride.driver?.name || 'Unknown'}
            </p>
            <p>
              <span className="font-semibold text-purple-400">Date:</span> {new Date(ride.date).toLocaleDateString()}
            </p>
            <p>
              <span className="font-semibold text-purple-400">From:</span> {ride.from}
            </p>
            <p>
              <span className="font-semibold text-purple-400">To:</span> {ride.to}
            </p>
            <p>
              <span className="font-semibold text-purple-400">Driver Arrives In:</span> {formatTime(arrivalTimeLeft)}
            </p>
            <p>
              <span className="font-semibold text-purple-400">Cab Price:</span> ₹{ride.costPerPerson}
            </p>
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

          <div className="mt-4">
            <button
              onClick={() => setChatOpen((prev) => !prev)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              💬 {chatOpen ? 'Close Chat' : 'Open Chat'}
            </button>
          </div>
        </div>

        {/* Chat Box */}
        {chatOpen && (
          <div className="fixed bottom-4 right-4 w-96 bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-purple-500 z-50 shadow-xl">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-white font-semibold">Chat with {ride.driver?.name || 'Unknown'}</h4>
              <button
                onClick={() => setChatOpen(false)}
                className="text-red-300 font-bold"
              >
                ✕
              </button>
            </div>
            <div className="h-40 overflow-y-auto bg-black/30 text-white text-sm p-2 rounded mb-3">
              {messages.length === 0 ? (
                <p className="text-gray-400 italic">No messages yet.</p>
              ) : (
                messages.map((msg, idx) => (
                  <p
                    key={idx}
                    className={`${msg.senderId === userRef.current?._id ? 'text-right' : 'text-left'}`}
                  >
                    <span className="inline-block bg-white/20 px-3 py-1 rounded">
                      {msg.message}
                    </span>
                  </p>
                ))
              )}
            </div>
            <div className="flex gap-2">
              <input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message"
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                className="flex-1 px-3 py-2 rounded bg-black/40 border border-white/20 text-white"
              />
              <button
                onClick={sendMessage}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold"
              >
                Send
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PassengerRidePage;