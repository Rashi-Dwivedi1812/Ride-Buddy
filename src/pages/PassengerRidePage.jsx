import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import { toast } from 'react-toastify';

const PassengerRidePage = () => {
  const { rideId } = useParams();
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [arrivalTimeLeft, setArrivalTimeLeft] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const socketRef = useRef(null);
  const userRef = useRef(null);
  const messagesEndRef = useRef(null);
  const shownMessagesRef = useRef(new Set());
  const notificationSoundRef = useRef(null);


  // Load cached data on mount
  useEffect(() => {
    const cachedRide = localStorage.getItem(`ride_${rideId}`);
    const cachedMessages = localStorage.getItem(`messages_${rideId}`);
    if (cachedRide) {
      setRide(JSON.parse(cachedRide));
      setLoading(false);
    }
    if (cachedMessages) {
      setMessages(JSON.parse(cachedMessages));
    }
  }, [rideId]);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Socket setup
  useEffect(() => {
    const socket = io('http://localhost:5000', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 90000,
      autoConnect: true,
      forceNew: true,
      auth: { token: localStorage.getItem('token') }
    });

    socketRef.current = socket;    
    
    

const handleMessage = (msg) => {
  if (msg.rideId === rideId) {
    setMessages(prev => {
      const newMessages = [...prev, msg];
      localStorage.setItem(`messages_${rideId}`, JSON.stringify(newMessages));

      

      // Only show toast if it's from another user AND hasn't been shown before
      const uniqueId = `${msg.senderId}_${msg.text}_${msg.createdAt || ''}`;
      if (msg.senderId !== userRef.current?._id && !shownMessagesRef.current.has(uniqueId)) {
        shownMessagesRef.current.add(uniqueId);

        // 🔊 Play sound
  notificationSoundRef.current?.play().catch(err => {
    console.warn('Notification sound failed:', err);
  });
  
        toast.info(`💬 ${msg.senderName}: ${msg.text.slice(0, 50)}${msg.text.length > 50 ? '...' : ''}`, {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
        });
      }

      return newMessages;
    });
  }
};

    const handleRideUpdate = (updatedRide) => {
      if (updatedRide._id === rideId) {
        setRide(updatedRide);
        localStorage.setItem(`ride_${rideId}`, JSON.stringify(updatedRide));
      }
    };

    socket.on('connect', () => {
      console.log('Socket connected');
      fetchRideAndUser();
    });

    socket.on('chat_message', handleMessage);
    socket.on('ride_update', handleRideUpdate);
    socket.on('disconnect', () => toast.warn('Connection lost. Trying to reconnect...'));
    socket.on('connect_error', () => toast.error('Connection error. Retrying...'));

    const fetchRideAndUser = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        const [rideRes, userRes, msgRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/rides/${rideId}`, { headers }),
          axios.get(`http://localhost:5000/api/auth/me`, { headers }),
          axios.get(`http://localhost:5000/api/messages/${rideId}`, { headers })
        ]);

        setRide(rideRes.data);
        userRef.current = userRes.data;
        setMessages(msgRes.data);

        localStorage.setItem(`ride_${rideId}`, JSON.stringify(rideRes.data));
        localStorage.setItem('currentUser', JSON.stringify(userRes.data));
        localStorage.setItem(`messages_${rideId}`, JSON.stringify(msgRes.data));

        socket.emit('join_room', rideId);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        toast.error('Failed to load ride data. Retrying...');
      }
    };

    // Initial fetch
    fetchRideAndUser();

    // Cleanup
    return () => {
      socket.off('connect');
      socket.off('chat_message');
      socket.off('ride_update');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.disconnect();
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

    socketRef.current?.emit('chat_message', messageData);
    setNewMessage('');
  };

  const formatTime = (seconds) => {
    if (seconds == null || isNaN(seconds)) return 'Calculating...';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  // Render loading and error states
  if (loading) {
    return (
      <div className="dark min-h-screen bg-[#0f0f0f] text-white flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
        <p className="text-gray-400">Loading ride details...</p>
      </div>
    );
  }

  if (ride === 'not_found' || ride === 'expired') {
    return (
      <div className="dark min-h-screen bg-[#0f0f0f] text-white flex flex-col items-center justify-center px-4">
        <div className="text-center text-red-400 mb-4">
          {ride === 'expired' ? 'This ride has ended.' : 'Ride not found.'}
        </div>
        <Link 
          to="/find" 
          className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-xl text-white transition-all"
        >
          ← Back to Available Rides
        </Link>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="text-center mt-10 text-white">No ride found</div>
    );
  }
  return (
    <div className="dark min-h-screen bg-[#0f0f0f] text-white flex flex-col items-center px-4 py-10 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff0d_1px,transparent_1px)] [background-size:20px_20px] z-0" />
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-700 via-purple-700 to-pink-700 opacity-10 blur-2xl z-0" />

      {/* Title */}
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
            </div>            <div className="h-40 overflow-y-auto bg-black/30 text-white text-sm p-2 rounded mb-3">
              {messages.length === 0 ? (
                <p className="text-gray-400 italic">No messages yet.</p>
              ) : (
                <>
                  {messages.map((msg, idx) => (
                    <p
                      key={idx}
                      className={`${msg.senderId === userRef.current?._id ? 'text-right' : 'text-left'} mb-1`}
                    >
                      <span className="text-green-300 font-semibold">{msg.senderName}:</span> {msg.text}
                    </p>
                  ))}
                  <div ref={messagesEndRef} />
                </>              )}
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
        <audio ref={notificationSoundRef} src="/preview.mp3" preload="auto" />
      </div>
    </div>
  );
};

export default PassengerRidePage;