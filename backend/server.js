import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';

// Route Imports
import authRoutes from './routes/authRoutes.js';
import rideRoutes from './routes/rideRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import messageRoutes from './routes/messageRoutes.js';

// Load environment variables
dotenv.config();

// Validate environment variables FIRST
const requiredEnv = ['MONGO_URI', 'JWT_SECRET', 'CLOUDINARY_CLOUD_NAME', 
                    'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
requiredEnv.forEach((env) => {
  if (!process.env[env]) {
    console.error(`Missing environment variable: ${env}`);
    process.exit(1);
  }
});

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE']
};

// App and server setup
const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Database connection
const startServer = async () => {
  try {
    await connectDB();
    
    // Routes
    app.use('/api/auth', authRoutes);
    app.use('/api/rides', rideRoutes);
    app.use('/api/chat', chatRoutes);
    app.use('/api/upload', uploadRoutes);
    app.use('/api/messages', messageRoutes);

    // Socket.IO setup
    const io = new Server(server, { 
      cors: corsOptions,
      connectionStateRecovery: {
        maxDisconnectionDuration: 2 * 60 * 1000,
        skipMiddlewares: true
      }
    });

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

      socket.on('disconnect', () => {
        console.log(`🚫 Client disconnected: ${socket.id}`);
      });
    });

    // Start server
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Allowed origins: ${corsOptions.origin}`);
    });

  } catch (error) {
    console.error('Server startup failed:', error);
    process.exit(1);
  }
};

// Start application
startServer();
