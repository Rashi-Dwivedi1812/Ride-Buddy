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
import feedbackRoutes from './routes/feedbackRoutes.js';
import Message from './models/Message.js';

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
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
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
    await connectDB();    // Socket.io setup
    const io = new Server(server, {
      cors: {
        origin: allowedOrigins,
        credentials: true,
      },
      pingTimeout: 120000, // 2 minute ping timeout
      pingInterval: 30000, // 30 second ping interval
      connectionStateRecovery: {
        maxDisconnectionDuration: 2 * 60 * 60 * 1000, // 2 hours max disconnection
        skipMiddlewares: true,
      },
      transports: ['websocket', 'polling'], // prefer websocket
      allowEIO3: true, // Enable compatibility mode
      maxHttpBufferSize: 1e8, // Increase buffer size
      cookie: {
        name: 'io',
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 2 * 60 * 60 * 1000 // 2 hours
      }
    });

    // Make io accessible from req.app.get('io') inside controllers
    app.set('io', io);

    // REST API routes
    app.use('/api/auth', authRoutes);
    app.use('/api/rides', rideRoutes);
    app.use('/api/feedback', feedbackRoutes);
    app.use('/api/messages', chatRoutes);    // Socket.io connection
    io.on('connection', (socket) => {
      console.log(`⚡ New client connected: ${socket.id}`);

      // Handle connection errors
      socket.on('error', (error) => {
        console.error('Socket error:', error);
      });

      // Join ride chat room
      socket.on('join_room', (roomId) => {
        socket.join(roomId);
        console.log(`User ${socket.id} joined public room ${roomId}`);
      });

      // Join driver notification room
      socket.on('join_driver_room', (driverId) => {
        socket.join(`driver_${driverId}`);
        console.log(`🚕 Driver ${driverId} joined room driver_${driverId}`);
      });

      // ========== Private Message (1:1) ==========
      socket.on('private_message', async (data) => {
        const roomId = getPrivateRoomId(data.rideId, data.senderId, data.receiverId);
        try {
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

      // ========== Public Chat Message (Ride Room) ==========
      socket.on('chat_message', async (data) => {
        try {
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

      // Clean up
      socket.on('disconnect', () => {
        console.log(`🚫 Client disconnected: ${socket.id}`);
      });
    });

    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌐 Allowed origins: ${allowedOrigins.join(', ')}`);
    });

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