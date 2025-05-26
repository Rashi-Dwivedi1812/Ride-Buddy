const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const Message = require('../models/Message');

// Get chat messages for a ride
router.get('/:rideId', auth, async (req, res) => {
  try {
    const messages = await Message.find({ ride: req.params.rideId }).populate('sender', 'name');
    res.json(messages);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
