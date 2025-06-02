import express from 'express';
import auth from '../middleware/authMiddleware.js';
import Message from '../models/Message.js';

const router = express.Router();

// Get chat messages for a ride
router.get('/:rideId', auth, async (req, res) => {
  try {
    const messages = await Message.find({ ride: req.params.rideId })
  .populate('sender', 'name')
  .sort({ createdAt: 1 })
  .lean();

    // Ensure frontend gets consistent format
    const formatted = messages.map(msg => ({
      _id: msg._id,
      senderId: msg.sender._id,
      senderName: msg.sender.name,
      receiverId: msg.receiver,
      rideId: msg.ride,
      text: msg.text, 
      createdAt: msg.createdAt,
    }));

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

export default router;
