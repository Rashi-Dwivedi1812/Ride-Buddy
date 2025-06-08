import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiMoreVertical,
  FiHome,
  FiClock,
  FiMessageSquare,
  FiLogOut
} from 'react-icons/fi';

const HomePage = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef();

  // Auto-close on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavigation = (path) => {
    navigate(path);
    setOpen(false);
  };

  return (
    <div className="dark min-h-screen bg-[#0f0f0f] text-white flex items-center justify-center relative overflow-hidden px-4">

      {/* Dropdown Menu - Top Left */}
      <div className="absolute top-4 left-4 z-30" ref={dropdownRef}>
        <div className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="p-2 rounded-md border border-white/20 bg-white/10 hover:bg-white/20 transition-all"
          >
            <FiMoreVertical size={20} className="text-white" />
          </button>

          {open && (
  <div className="absolute left-0 mt-2 w-52 bg-white rounded-xl shadow-xl ring-1 ring-black/10 animate-fade-in">
    <ul className="py-2 text-sm font-medium text-gray-700">
      <li>
        <button
          onClick={() => handleNavigation('/home')}
          className="flex items-center gap-3 px-5 py-3 w-full text-left hover:bg-blue-50 transition rounded-md"
        >
          <FiHome className="text-blue-500" /> Home
        </button>
      </li>
      <li>
        <button
          onClick={() => handleNavigation('/history')}
          className="flex items-center gap-3 px-5 py-3 w-full text-left hover:bg-blue-50 transition rounded-md"
        >
          <FiClock className="text-purple-500" /> History
        </button>
      </li>
      <li>
        <button
          onClick={() => handleNavigation('/feedback')}
          className="flex items-center gap-3 px-5 py-3 w-full text-left hover:bg-blue-50 transition rounded-md"
        >
          <FiMessageSquare className="text-green-500" /> Feedback
        </button>
      </li>
      <li>
        <button
          onClick={() => handleNavigation('/')}
          className="flex items-center gap-3 px-5 py-3 w-full text-left text-red-600 hover:bg-red-50 transition rounded-md"
        >
          <FiLogOut className="text-red-600" /> Logout
        </button>
      </li>
    </ul>
  </div>
)}
        </div>
      </div>

      {/* Background grid & blur */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff0d_1px,transparent_1px)] [background-size:20px_20px] z-0" />
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-700 via-purple-700 to-pink-700 opacity-10 blur-2xl z-0" />

      {/* Main Card */}
      <div className="group relative z-10 w-full max-w-xl bg-white/10 backdrop-blur-md p-10 rounded-2xl shadow-2xl border border-white/20
                      hover:shadow-[0_0_30px_#8b5cf6] hover:scale-[1.02] hover:border-purple-400 transition-all duration-300">

        <h1 className="text-4xl font-extrabold text-center text-white drop-shadow mb-2">
          Welcome to <span className="text-blue-400">RIDE BUDDY</span>
        </h1>

        <p className="text-center text-gray-300 text-lg mb-8">
          Find or offer a ride with fellow college mates. <br />Quick, safe, and reliable!
        </p>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
          <Link
            to="/find"
            className="group relative inline-flex items-center px-8 py-3 font-semibold rounded-2xl bg-blue-600 text-white shadow-md hover:bg-blue-700 transition-all duration-300"
          >
            🔍 Find a Ride
            <span className="ml-2 transform group-hover:translate-x-1.5 transition-transform duration-300">→</span>
            <span className="absolute inset-0 rounded-2xl ring-2 ring-blue-400 opacity-0 group-hover:opacity-100 blur-md animate-pulse transition duration-300" />
          </Link>

          <Link
            to="/post"
            className="group relative inline-flex items-center px-8 py-3 font-semibold rounded-2xl bg-green-600 text-white shadow-md hover:bg-green-700 transition-all duration-300"
          >
            ✏️ Post a Ride
            <span className="ml-2 transform group-hover:translate-x-1.5 transition-transform duration-300">→</span>
            <span className="absolute inset-0 rounded-2xl ring-2 ring-green-400 opacity-0 group-hover:opacity-100 blur-md animate-pulse transition duration-300" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HomePage;