import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => (
  <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-blue-200 to-purple-300">
    <h1 className="text-5xl font-bold mb-6">Welcome to RIDE BUDDY 🚖</h1>
    <div className="space-x-4">
      <Link to="/login" className="bg-blue-600 text-white px-6 py-3 rounded-xl shadow-md">Login</Link>
      <Link to="/signup" className="bg-green-600 text-white px-6 py-3 rounded-xl shadow-md">Sign Up</Link>
    </div>
  </div>
);

export default LandingPage;
