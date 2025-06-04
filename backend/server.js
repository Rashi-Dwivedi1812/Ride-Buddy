import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import connectDB from './config/db.js';
import path from 'path';

import authRoutes from './routes/authRoutes.js';
import rideRoutes from './routes/rideRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';

import Message from './models/Message.js';

// Validate required env vars
const requiredEnv = ['MONGO_URI', 'JWT_SECRET'];
requiredEnv.forEach((env) => {
  if (!process.env[env]) {
    console.error(`Missing environment variable: ${env}`);
    process.exit(1);
  }
});

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173'];

const app = express();
const server = http.createServer(app);

const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use('/api/upload', uploadRoutes);
app.use('/uploads', express.static(path.resolve('uploads')));

// Helper: Generate unique private room ID
const getPrivateRoomId = (rideId, userId1, userId2) =>
  [rideId, userId1, userId2].sort().join('_');

const startServer = async () => {
  try {
    await connectDB();

    app.use('/api/auth', authRoutes);
    app.use('/api/rides', rideRoutes);
    app.use('/api/messages', chatRoutes);

    const io = new Server(server, {
      cors: {
        origin: allowedOrigins,
        credentials: true,
      },
      connectionStateRecovery: {
        maxDisconnectionDuration: 2 * 60 * 1000,
        skipMiddlewares: true,
      },
    });

    app.set('io', io);

    io.on('connection', (socket) => {
      console.log(`⚡ New client connected: ${socket.id}`);

      // Join public ride chat room
      socket.on('join_room', (roomId) => {
        socket.join(roomId);
        console.log(`User ${socket.id} joined room ${roomId}`);
      });

      // Join private 1-on-1 chat room
      socket.on('join_private_chat', ({ rideId, userId1, userId2 }) => {
        const roomId = getPrivateRoomId(rideId, userId1, userId2);
        socket.join(roomId);
        console.log(`🔒 User ${socket.id} joined private room ${roomId}`);
      });

      // Handle private message
      // Handle private message
socket.on('private_message', async (data) => {
  const roomId = getPrivateRoomId(data.rideId, data.senderId, data.receiverId);
  try {
    // Save to DB
    const savedMessage = await Message.create({
      ride: data.rideId,
      sender: data.senderId,
      receiver: data.receiverId,
      text: data.text,
    });

    const populatedMsg = await savedMessage.populate('sender', 'name');

    const payload = {
      _id: savedMessage._id,
      rideId: data.rideId,
      senderId: populatedMsg.sender._id,
      senderName: populatedMsg.sender.name,
      receiverId: data.receiverId,
      text: data.text,
      createdAt: savedMessage.createdAt,
    };

    io.to(roomId).emit('private_message', payload);
  } catch (err) {
    console.error('❌ Error saving private message:', err);
    socket.emit('message_error', { error: err.message });
  }
});


      // Handle public ride chat message
      socket.on('chat_message', async (data) => {
        try {
          console.log('📨 Incoming chat data:', data);
          const savedMessage = await Message.create({
            ride: data.rideId,
            sender: data.senderId,
            receiver: data.receiverId,
            text: data.text,
          });

          const populatedMsg = await savedMessage.populate('sender', 'name');

          const payload = {
            _id: savedMessage._id,
            rideId: data.rideId,
            senderId: populatedMsg.sender._id,
            senderName: populatedMsg.sender.name,
            receiverId: data.receiverId,
            text: data.text,
            createdAt: savedMessage.createdAt,
          };

          io.to(data.room).emit('chat_message', payload);
        } catch (err) {
          console.error('❌ Error saving message:', err);
          socket.emit('message_error', { error: err.message });
        }
      });

      // Ride booked notification
      socket.on('ride_booked', ({ rideId, byUserId, message }) => {
        console.log(`📣 Ride booked: ${rideId} by ${byUserId}`);

        const payload = {
          rideId,
          byUserId,
          message: message || 'Your ride was booked!',
        };

        io.to(rideId).emit('ride_booked', payload);
        io.to(rideId).emit('passenger_updated');
      });

      socket.on('disconnect', () => {
        console.log(`🚫 Client disconnected: ${socket.id}`);
      });
    });

    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌐 Allowed origins: ${allowedOrigins.join(', ')}`);
    });

    // Optional: Graceful shutdown
    process.on('SIGINT', () => {
      console.log('🛑 Gracefully shutting down...');
      server.close(() => process.exit(0));
    });

  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
};

startServer();