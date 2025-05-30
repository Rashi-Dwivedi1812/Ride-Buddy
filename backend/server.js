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
import Message from './models/Message.js'; // Needed for saving chat messages

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
  : ['http://localhost:5173']; // ✅ frontend dev port

// Express setup
const app = express();
const server = http.createServer(app);

const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
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
    app.use('/api/chat', chatRoutes);

    // Socket.io setup
    const io = new Server(server, {
      cors: corsOptions,
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

      socket.on('send_message', async (data) => {
        try {
          const message = new Message({
            ride: data.room,
            sender: data.sender,
            text: data.text,
          });
          await message.save();
          io.to(data.room).emit('receive_message', data);
        } catch (err) {
          console.error('Error saving message:', err);
          socket.emit('message_error', { error: err.message });
        }
      });

      // ✅ NEW: Ride Booked Notification
      socket.on('ride_booked', ({ rideId, byUserId, message }) => {
        console.log(`📣 Ride booked: ${rideId} by ${byUserId}`);
        io.to(rideId).emit('ride_booked', {
          rideId,
          byUserId,
          message: message || 'Your ride was booked!',
        });
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

// Launch app
startServer();