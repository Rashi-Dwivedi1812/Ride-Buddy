import express from 'express';
import Feedback from '../models/Feedback.js';

const router = express.Router();

router.post('/', async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    // Save feedback to DB
    const feedback = new Feedback({ name, email, message });
    await feedback.save();

    console.log('✅ Feedback saved:', { name, email, message });

    res.status(200).json({ message: 'Feedback submitted successfully.' });
  } catch (error) {
    console.error('❌ Error saving feedback:', error);
    res.status(500).json({ error: 'Server error while saving feedback' });
  }
});

export default router;