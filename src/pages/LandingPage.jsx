import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div className="dark min-h-screen bg-[#0f0f0f] text-white flex items-center justify-center relative overflow-hidden px-4">
      {/* Background grid & blur gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff0d_1px,transparent_1px)] [background-size:20px_20px] z-0" />
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-700 via-purple-700 to-pink-700 opacity-10 blur-2xl z-0" />

      {/* Centered Card */}
      <div className="group relative z-10 w-full max-w-xl bg-white/10 backdrop-blur-md p-10 rounded-2xl shadow-2xl border border-white/20
                      hover:shadow-[0_0_30px_#8b5cf6] hover:scale-[1.02] hover:border-purple-400 transition-all duration-300">
        
        <h1 className="text-4xl sm:text-5xl font-extrabold text-center mb-6 text-white drop-shadow">
          Welcome to <span className="text-blue-400">RIDE BUDDY</span> 🚖
        </h1>

        <p className="text-lg sm:text-xl text-gray-300 text-center mb-10 max-w-xl">
          Seamlessly connect with fellow riders for your college commutes. Safe, fast, and efficient.
        </p>

        {/* Buttons */}
        <div className="flex flex-wrap justify-center gap-6">
          <Link
            to="/login"
            className="group relative inline-flex items-center px-8 py-3 font-semibold rounded-2xl bg-blue-600 text-white shadow-md hover:bg-blue-700 transition-all duration-300"
          >
            Login
            <span className="ml-2 transform translate-x-0 group-hover:translate-x-1.5 transition-transform duration-300">
              →
            </span>
            <span className="absolute inset-0 rounded-2xl ring-2 ring-blue-400 opacity-0 group-hover:opacity-100 blur-md animate-pulse transition duration-300" />
          </Link>

          <Link
            to="/signup"
            className="group relative inline-flex items-center px-8 py-3 font-semibold rounded-2xl bg-green-600 text-white shadow-md hover:bg-green-700 transition-all duration-300"
          >
            Sign Up
            <span className="ml-2 transform translate-x-0 group-hover:translate-x-1.5 transition-transform duration-300">
              →
            </span>
            <span className="absolute inset-0 rounded-2xl ring-2 ring-green-400 opacity-0 group-hover:opacity-100 blur-md animate-pulse transition duration-300" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;