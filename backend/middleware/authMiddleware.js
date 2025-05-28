import jwt from 'jsonwebtoken';

const auth = (req, res, next) => {
  const authHeader = req.header('Authorization');
  console.log('🛡️ Authorization Header:', authHeader);

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('❌ Missing or invalid Authorization header');
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  const token = authHeader.split(' ')[1];
  console.log('🔑 Extracted Token:', token);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ JWT Verified:', decoded);
    req.user = decoded.id;
    next();
  } catch (err) {
    console.log('❌ JWT verification failed:', err.message);
    return res.status(401).json({ msg: 'Token is not valid' });
  }
};



export default auth;