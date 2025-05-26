import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';

const socket = io('http://localhost:5000'); // or your backend URL

const ChatPage = () => {
  const { rideId } = useParams(); // this is the roomId
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState([]);

  useEffect(() => {
    socket.emit('join_room', rideId);

    socket.on('receive_message', (data) => {
      setChat((prev) => [...prev, data]);
    });

    return () => {
      socket.disconnect();
    };
  }, [rideId]);

  const sendMessage = () => {
    if (message.trim() === '') return;

    const msgData = {
      room: rideId,
      sender: 'You', // replace with current user
      message,
      timestamp: new Date().toLocaleTimeString()
    };

    socket.emit('send_message', msgData);
    setChat((prev) => [...prev, msgData]);
    setMessage('');
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-2">Chat Room for Ride ID: {rideId}</h2>
      <div className="border h-64 overflow-y-scroll mb-4 p-2 bg-gray-100 rounded">
        {chat.map((msg, idx) => (
          <div key={idx} className="mb-1">
            <strong>{msg.sender}:</strong> {msg.message} <span className="text-xs text-gray-500">({msg.timestamp})</span>
          </div>
        ))}
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
