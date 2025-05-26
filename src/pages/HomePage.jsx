import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen space-y-6 bg-gray-100">
      <h1 className="text-3xl font-bold mb-4">Welcome to RIDE BUDDY 🚗</h1>

      <Link to="/find">
        <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg text-lg">
          🔍 Find a Ride
        </button>
      </Link>

      <Link to="/post">
        <button className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg text-lg">
          ✏️ Post a Ride
        </button>
      </Link>
    </div>
  );
};

export default HomePage;
