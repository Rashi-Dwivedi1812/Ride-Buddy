import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/auth/login`, form);
      localStorage.setItem('token', res.data.token);
      navigate('/home');
    } catch (err) {
      setError(err.response?.data?.msg || 'Login failed');
    }
  };

  return (
    <div className="dark min-h-screen bg-[#0f0f0f] text-white flex items-center justify-center relative overflow-hidden px-4">
      {/* Background grid and blur overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff0d_1px,transparent_1px)] [background-size:20px_20px] z-0" />
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-700 via-purple-700 to-pink-700 opacity-10 blur-2xl z-0" />

      {/* Login Card with hover effect */}
      <form
        onSubmit={handleSubmit}
        className="group relative z-10 w-full max-w-md bg-white/10 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-white/20 text-white
                   transition-all duration-300 hover:shadow-[0_0_30px_#8b5cf6] hover:scale-[1.03] hover:border-purple-400"
      >
        <h2 className="text-3xl font-bold text-center mb-6 text-white">
          Login to <span className="text-blue-400">Ride Buddy</span>
        </h2>

        {error && <p className="text-red-400 mb-4 text-sm text-center">{error}</p>}

        <input
          name="email"
          type="email"
          placeholder="College Email"
          value={form.email}
          onChange={handleChange}
          className="w-full mb-4 px-4 py-3 rounded-xl bg-white/5 border border-white/20 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          className="w-full mb-6 px-4 py-3 rounded-xl bg-white/5 border border-white/20 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
        />

        <button
          type="submit"
          className="group relative w-full bg-blue-600 hover:bg-blue-700 text-white py-3 font-semibold rounded-2xl transition-all duration-300 shadow-lg"
        >
          Login
          <span className="ml-2 transform translate-x-0 group-hover:translate-x-1.5 transition-transform duration-300">→</span>
          <span className="absolute inset-0 rounded-2xl ring-2 ring-blue-400 opacity-0 group-hover:opacity-100 blur-md animate-pulse transition duration-300" />
        </button>
      </form>
    </div>
  );
};

export default LoginPage;