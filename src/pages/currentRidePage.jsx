import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';

const CurrentRidePage = () => {
  const { rideId } = useParams();
  const [ride, setRide] = useState(null);
  const [arrivalTimeLeft, setArrivalTimeLeft] = useState(null);
  const [selectedPassenger, setSelectedPassenger] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [isRideOwner, setIsRideOwner] = useState(false);
  const socketRef = useRef(null);
  const selectedPassengerRef = useRef(null); // <-- track latest passenger

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

  const fetchRide = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5000/api/rides/${rideId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRide(res.data);
      if (res.data.creator?._id === currentUser?._id) {
        setIsRideOwner(true);
      }
      if (res.data.createdAt && res.data.driverArrivingIn) {
        const createdAt = new Date(res.data.createdAt).getTime();
        const now = Date.now();
        const elapsed = Math.floor((now - createdAt) / 1000);
        const remaining = Math.max(res.data.driverArrivingIn * 60 - elapsed, 0);
        setArrivalTimeLeft(remaining);
      }
    } catch (err) {
      console.error('Failed to fetch ride:', err);
      if (err.response && err.response.status === 404) {
        setRide(null); // mark ride as not found
      }
    }
  };

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const fetchMessages = async (receiverId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(
        `http://localhost:5000/api/messages/${rideId}?receiverId=${receiverId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setChatMessages(res.data);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  };

  useEffect(() => {
    const user = parseToken();
    setCurrentUser(user);

    const socket = io('http://localhost:5000', {
      transports: ['polling', 'websocket'],
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.emit('join_room', rideId);

    socket.on('chat_message', (msg) => {
      const currentPassenger = selectedPassengerRef.current;
      if (
        (msg.senderId === user?._id || msg.receiverId === user?._id) &&
        (msg.senderId === currentPassenger?._id || msg.receiverId === currentPassenger?._id)
      ) {
        setChatMessages((prev) => [...prev, msg]);
      }
    });

    socket.on('passenger_updated', fetchRide);

    fetchRide();

    return () => {
      socket.disconnect();
    };
  }, [rideId]);

  useEffect(() => {
    selectedPassengerRef.current = selectedPassenger;
    if (selectedPassenger) {
      fetchMessages(selectedPassenger._id);
    }
  }, [selectedPassenger]);

  useEffect(() => {
    const interval = setInterval(() => {
      setArrivalTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !currentUser || !selectedPassenger) return;

    const messageData = {
      rideId,
      senderName: currentUser.name,
      senderId: ride.driver?._id,
      receiverId: selectedPassenger._id,
      text: newMessage.trim(),
      room: rideId,
    };

    socketRef.current?.emit('chat_message', messageData);
    setChatMessages((prev) => [...prev, messageData]); // Optional: can remove this if relying on echo
    setNewMessage('');
  };

  const handleOpenChat = (user) => {
    setSelectedPassenger(user);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };
  

  if (ride === null) {
    return (
      <div className="text-center text-white mt-10">
        <p className="text-red-400">Ride not found or may have expired.</p>
        <button
          className="mt-4 px-4 py-2 bg-purple-600 rounded"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }
const chatTargets = isRideOwner
    ? ride.bookedBy.filter((p) => p._id !== currentUser?._id)
    : [ride.driver];
  return (
    <div className="dark min-h-screen bg-[#0f0f0f] text-white flex flex-col items-center px-4 py-10 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff0d_1px,transparent_1px)] [background-size:20px_20px] z-0" />
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-700 via-purple-700 to-pink-700 opacity-10 blur-2xl z-0" />

      <h2 className="z-10 text-4xl font-extrabold mb-8 text-white drop-shadow text-center">
        Current Ride Details
      </h2>

      <div className="z-10 w-full max-w-4xl space-y-8">
        {/* Ride Info */}
        <div className="group relative w-full bg-white/10 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-white/20 hover:shadow-[0_0_30px_#8b5cf6] hover:scale-[1.01] hover:border-purple-400 transition-all duration-300">
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-200">
            <p><span className="font-semibold text-purple-400">Ride Owner:</span> {ride.driver?.name || 'Unknown'}</p>
            <p><span className="font-semibold text-purple-400">Date:</span> {new Date(ride.date).toLocaleDateString()}</p>
            <p><span className="font-semibold text-purple-400">From:</span> {ride.from}</p>
            <p><span className="font-semibold text-purple-400">To:</span> {ride.to}</p>
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

        {/* Passengers / Chat Targets */}
        <div className="group relative w-full bg-white/10 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-white/20 hover:shadow-[0_0_30px_#8b5cf6] hover:scale-[1.01] hover:border-purple-400 transition-all duration-300">
          <h3 className="text-xl font-semibold text-white mb-4">
            {isRideOwner ? '🧍‍♂️ Passengers' : '💬 Chat with Ride Owner'}
          </h3>
          {chatTargets.length > 0 ? (
            chatTargets.map((user) => (
              <div key={user._id} className="flex justify-between items-center text-green-300 mb-2">
                <span>Name: {user.name}</span>
                <button
                  onClick={() => handleOpenChat(user)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-1 rounded font-semibold"
                >
                  Chat
                </button>
              </div>
            ))
          ) : (
            <p className="text-gray-400">
              {isRideOwner ? 'No passengers yet.' : 'Waiting for ride owner.'}
            </p>
          )}
        </div>

        {/* Chat Box */}
        {selectedPassenger && (
          <div className="fixed bottom-4 right-4 w-96 bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-purple-500 z-50 shadow-xl">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-white font-semibold">Chat with {selectedPassenger.name}</h4>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchMessages(selectedPassenger._id)}
                  className="text-blue-300 font-bold hover:text-blue-500"
                  title="Refresh Messages"
                >
                  ⟳
                </button>
                <button
                  onClick={() => setSelectedPassenger(null)}
                  className="text-red-300 font-bold hover:text-red-500"
                  title="Close Chat"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="h-40 overflow-y-auto bg-black/30 text-white text-sm p-2 rounded mb-3">
              {chatMessages.length === 0 ? (
                <p className="text-gray-400 italic">No messages yet.</p>
              ) : (
                chatMessages.map((msg, idx) => (
                  <p key={idx}>
                    <span className="text-green-300 font-semibold">{msg.senderName}:</span> {msg.text}
                  </p>
                ))
              )}
                <div ref={messagesEndRef} />
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message"
                className="flex-1 p-2 rounded bg-gray-900 border border-gray-600 text-white"
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <button
                onClick={handleSendMessage}
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

export default CurrentRidePage;
