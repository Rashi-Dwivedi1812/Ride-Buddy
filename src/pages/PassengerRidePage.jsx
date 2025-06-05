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

  // Fetch ride, user, messages, and set up socket
  useEffect(() => {
    let socket;

    const fetchRideAndUser = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch ride
        const rideRes = await axios.get(`http://localhost:5000/api/rides/${rideId}`, { headers });
        setRide(rideRes.data);

        // Fetch current user
        const userRes = await axios.get(`http://localhost:5000/api/auth/me`, { headers });
        userRef.current = userRes.data;

        const msgRes = await axios.get(`http://localhost:5000/api/messages/${rideId}`, { headers });
        setMessages(msgRes.data);

        // Connect socketMore actions
        socket = io('http://localhost:5000', {
          transports: ['websocket'],
          reconnection: true,
          reconnectionAttempts: 10,
          withCredentials: true,
        });
        socket.emit('join_room', rideId);
        socketRef.current = socket;

        const handleMessage = (msg) => {
          if (msg.rideId === rideId) {
            setMessages((prev) => [...prev, msg]);
          }
        };

        socket.on('chat_message', handleMessage);
        return () => {
          socket.off('chat_message', handleMessage); // ✅ remove this specific handler
          socket.disconnect();
        };

      } catch (err) {
        console.error('Error loading data:', err);
        if (err.response && err.response.status === 404) {
           setRide('not_found');
        }
      }
    };
    const cleanupPromise = fetchRideAndUser();

    // cleanup runs on rideId change or unmount
    return () => {
      cleanupPromise.then((cleanup) => {
        if (typeof cleanup === 'function') cleanup(); // call the inner cleanup
      });
    };
  }, [rideId]);

  // Arrival countdown
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
      receiverId: ride.driver?._id,
      senderName: userRef.current.name,
      text: newMessage.trim(),
      room: rideId,
    };

    socketRef.current.emit('chat_message', messageData);
    setNewMessage('');
  };

  const formatTime = (seconds) => {
    if (seconds == null || isNaN(seconds)) return 'Calculating...';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

 if (ride === 'not_found') {
  return (
    <div className="text-center text-red-500 mt-10">
      Ride not found or has ended. Please return to home.
    </div>
  );
}

if (!ride) {
  return <div className="text-center mt-10 text-white">Loading ride details...</div>;
}
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
                    className={`${msg.senderId === userRef.current?._id ? 'text-right' : 'text-left'}`}>
                    <span className="text-green-300 font-semibold">{msg.senderName}:</span> {msg.text}
                  </p>
                ))
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 p-2 rounded bg-gray-900 border border-gray-600 text-white"
                placeholder="Type your message..."
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
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