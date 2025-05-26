import React, { useState } from 'react';
import axios from '../api/axios';
import { useNavigate } from 'react-router-dom';

const SignUpPage = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      return setError('Passwords do not match');
    }

    try {
      const res = await axios.post('/auth/register', {
        name: form.name,
        email: form.email,
        password: form.password
      });

      localStorage.setItem('token', res.data.token);
      navigate('/home');
    } catch (err) {
      setError(err.response?.data?.msg || 'Sign-up failed');
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <form className="bg-white p-8 rounded shadow-md w-full max-w-md" onSubmit={handleSubmit}>
        <h2 className="text-2xl font-bold mb-4">Sign Up</h2>

        {error && <p className="text-red-500 mb-2">{error}</p>}

        <input
          name="name"
          placeholder="Name"
          value={form.name}
          onChange={handleChange}
          className="w-full px-4 py-2 border rounded-md mb-4"
        />
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
        <input
          name="confirmPassword"
          type="password"
          placeholder="Confirm Password"
          value={form.confirmPassword}
          onChange={handleChange}
          className="w-full px-4 py-2 border rounded-md mb-4"
        />

        <button className="w-full bg-blue-600 text-white py-2 mt-4 rounded-xl">Sign Up</button>
      </form>
    </div>
  );
};

export default SignUpPage;
