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
      const res = await axios.post('http://localhost:5000/api/auth/login', form);

      localStorage.setItem('token', res.data.token); // Save token
      navigate('/home'); // Redirect to home
    } catch (err) {
      setError(err.response?.data?.msg || 'Login failed');
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <form className="bg-white p-8 rounded shadow-md w-full max-w-md" onSubmit={handleSubmit}>
        <h2 className="text-2xl font-bold mb-4">Login</h2>

        {error && <p className="text-red-500 mb-2">{error}</p>}

        <input
          name="email"
          type="email"
          placeholder="College Email"
          value={form.email}
          onChange={handleChange}
          className="w-full px-4 py-2 border rounded-md mb-4"
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          className="w-full px-4 py-2 border rounded-md mb-4"
        />
        <button className="w-full bg-blue-600 text-white py-2 mt-4 rounded-xl">Login</button>
      </form>
    </div>
  );
};

export default LoginPage;
