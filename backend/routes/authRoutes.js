// backend/routes/authRoutes.js
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Helper function to validate email and password
function validateAuthInput({ name, email, password }) {
  if (name && typeof name !== 'string') return false;
  if (!email || typeof email !== 'string') return false;
  if (!password || typeof password !== 'string' || password.length < 6) return false;
  return true;
}

// @route   POST /api/auth/register
// @desc    Register a new user
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!validateAuthInput({ name, email, password })) {
    return res.status(400).json({ msg: 'Invalid input' });
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();

    // Use parameterized query execution (`exec()`)
    const user = await User.findOne({ email: normalizedEmail }).exec();
    if (user) return res.status(400).json({ msg: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword
    });

    await newUser.save();

    const token = jwt.sign({ id: newUser._id }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/auth/login
// @desc    Login user and get token
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!validateAuthInput({ email, password })) {
    return res.status(400).json({ msg: 'Invalid input' });
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();

    // Use parameterized query execution (`exec()`)
    const user = await User.findOne({ email: normalizedEmail }).exec();
    if (!user) return res.status(400).json({ msg: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

export default router;