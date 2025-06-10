import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
      heartbeatFrequencyMS: 30000,
      socketTimeoutMS: 45000,
      keepAlive: true,
      keepAliveInitialDelay: 300000, // 5 minutes
    });

    mongoose.connection.on('disconnected', () => {
      console.log('❌ Lost MongoDB connection. Retrying...');
      setTimeout(connectDB, 5000);
    });

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
      setTimeout(connectDB, 5000);
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1); // Exit process with failure
  }
};

export default connectDB;