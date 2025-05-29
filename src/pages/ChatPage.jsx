import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';

const ChatPage = () => {
  const { rideId } = useParams();
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState([]);
  const [rideOwnerName, setRideOwnerName] = useState('');
  const socketRef = useRef(null);
  const chatEndRef = useRef(null);

  const currentUser = JSON.parse(localStorage.getItem('user'));
  const currentUserId = currentUser?._id;

  useEffect(() => {
    const fetchRideDetails = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/rides/${rideId}`);
        setRideOwnerName(res.data.driver?.name || 'User');
      } catch (err) {
        console.error('Failed to fetch ride details:', err);
        setRideOwnerName('User');
      }
    };

    fetchRideDetails();
  }, [rideId]);

  useEffect(() => {
    socketRef.current = io('http://localhost:5000');
    socketRef.current.emit('join_room', rideId);

    socketRef.current.on('receive_message', (data) => {
      setChat((prev) => [...prev, data]);
    });

    return () => {
      socketRef.current.emit('leave_room', rideId);
      socketRef.current.off('receive_message');
      socketRef.current.disconnect();
    };
  }, [rideId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);

  const sendMessage = () => {
    if (message.trim() === '') return;

    const msgData = {
      room: rideId,
      sender: currentUserId,
      message,
      timestamp: new Date().toISOString(),
    };

    socketRef.current.emit('send_message', msgData);

    // Show message optimistically
    setChat((prev) => [...prev, {
      ...msgData,
      sender: { _id: currentUserId, name: 'You' }
    }]);

    setMessage('');
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-2">Chat with {rideOwnerName}:</h2>
      <div className="border h-64 overflow-y-scroll mb-4 p-2 bg-gray-100 rounded">
        {chat.map((msg, idx) => {
          const senderName = msg.sender._id === currentUserId ? 'You' : msg.sender.name;
          return (
            <div key={idx} className="mb-1">
              <strong>{senderName}:</strong> {msg.message}{' '}
              <span className="text-xs text-gray-500">
                ({new Date(msg.timestamp).toLocaleTimeString()})
              </span>
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>

      <div className="flex">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="border p-2 w-full mr-2 rounded"
          placeholder="Type a message..."
        />
        <button onClick={sendMessage} className="bg-blue-500 text-white px-4 rounded">
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatPage;