import express from 'express';
import auth from '../middleware/authMiddleware.js';
import Message from '../models/Message.js';

const router = express.Router();

// Get chat messages for a ride
router.get('/:rideId', auth, async (req, res) => {
  try {
    const messages = await Message.find({ ride: req.params.rideId }).populate('sender', 'name');
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

export default router;
