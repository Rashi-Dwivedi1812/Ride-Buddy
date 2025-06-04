import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import connectDB from './config/db.js';
import path from 'path';

// Route Imports
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

// Default to localhost:5173 if ALLOWED_ORIGINS not set
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173'];

// Express setup
const app = express();
const server = http.createServer(app);

const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
};


// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use('/api/upload', uploadRoutes);
app.use('/uploads', express.static(path.resolve('uploads')));

// Connect to DB and start server
const startServer = async () => {
  try {
    await connectDB();

    // Routes
    app.use('/api/auth', authRoutes);
    app.use('/api/rides', rideRoutes);
    app.use('/api/messages', chatRoutes);

    // Socket.io setup
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


    app.set('io', io); // For controllers that need access to io

    io.on('connection', (socket) => {
      console.log(`⚡ New client connected: ${socket.id}`);

      socket.on('join_room', (roomId) => {
        socket.join(roomId);
        console.log(`User ${socket.id} joined room ${roomId}`);
      });

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

      // Ride booked event
      socket.on('ride_booked', ({ rideId, byUserId, message }) => {
        console.log(`📣 Ride booked: ${rideId} by ${byUserId}`);

        const payload = {
          rideId,
          byUserId,
          message: message || 'Your ride was booked!',
        };

        io.to(rideId).emit('ride_booked', payload);
        io.to(rideId).emit('passenger_updated'); // triggers frontend to refetch
      });

      socket.on('disconnect', () => {
        console.log(`🚫 Client disconnected: ${socket.id}`);
      });
    });

    // Start server
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌐 Allowed origins: ${allowedOrigins.join(', ')}`);
    });
  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
};

startServer();