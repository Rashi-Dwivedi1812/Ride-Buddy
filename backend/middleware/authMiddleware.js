import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

const auth = async (req, res, next) => {
  const authHeader = req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ msg: 'User not found' });

    // ✅ Attach both _id and id for compatibility
    req.user = {
      _id: user._id,
      id: user._id.toString(), // added for code using req.user.id
      name: user.name,
      email: user.email,
    };

    next();
  } catch (err) {
    console.error('Token verification error:', err);
    return res.status(401).json({ msg: 'Token is not valid' });
  }
};

export default auth;