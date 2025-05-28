import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  ride: { type: mongoose.Schema.Types.ObjectId, ref: 'Ride', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

// Add index on ride and timestamp for efficient querying and sorting
MessageSchema.index({ ride: 1, timestamp: 1 });

const Message = mongoose.model('Message', MessageSchema);
export default Message;