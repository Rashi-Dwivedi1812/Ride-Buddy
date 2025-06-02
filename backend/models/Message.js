import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  ride: { type: mongoose.Schema.Types.ObjectId, ref: 'Ride' },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  text: String,
}, { timestamps: true });

messageSchema.index({ ride: 1, createdAt: 1 }); // update the index accordingly

const Message = mongoose.model('Message', messageSchema);
export default Message;