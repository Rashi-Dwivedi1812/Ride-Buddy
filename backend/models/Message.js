import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  ride: { type: mongoose.Schema.Types.ObjectId, ref: 'Ride', required: true  },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' , required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' , required: true },
 text: { type: String, required: true },
}, { timestamps: true });

messageSchema.index({ ride: 1, createdAt: 1 }); // update the index accordingly

const Message = mongoose.model('Message', messageSchema);
export default Message;