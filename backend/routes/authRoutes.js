import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import validator from 'validator'; // added
import User from '../models/User.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Helper function to validate and sanitize input
function validateAndSanitizeAuthInput({ name, email, password }) {
  const errors = [];

  if (name !== undefined && (typeof name !== 'string' || !name.trim())) {
    errors.push('Name must be a non-empty string');
  }

  if (!email || typeof email !== 'string' || !validator.isEmail(email)) {
    errors.push('Invalid email');
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }

  return {
    isValid: errors.length === 0,
    sanitized: {
      name: name?.trim(),
      email: validator.normalizeEmail(email),
      password,
    },
    errors,
  };
}

// @route   POST /api/auth/register
// @desc    Register a new user
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  const { isValid, sanitized, errors } = validateAndSanitizeAuthInput({ name, email, password });

  if (!isValid) return res.status(400).json({ msg: 'Invalid input', errors });

  try {
    const user = await User.findOne({ email: sanitized.email });
    if (user) return res.status(400).json({ msg: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(sanitized.password, salt);

    const newUser = new User({
      name: sanitized.name,
      email: sanitized.email,
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
  const { isValid, sanitized, errors } = validateAndSanitizeAuthInput({ email, password });

  if (!isValid) return res.status(400).json({ msg: 'Invalid input', errors });

  try {
    const user = await User.findOne({ email: sanitized.email });
    if (!user) return res.status(400).json({ msg: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(sanitized.password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

export default router;