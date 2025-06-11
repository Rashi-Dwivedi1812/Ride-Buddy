import React, { useState } from 'react';
import ImageUploader from '../components/imageUploader';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const PostRidePage = () => {
  const [form, setForm] = useState({
    from: '',
    to: '',
    date: '',
    driverArrivingIn: '',
    seatsAvailable: '',
    costPerPerson: '',
    cabScreenshotUrl: '',
  });
  const [error, setError] = useState('');
  const [screenshotUploaded, setScreenshotUploaded] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.from || !form.to) return setError('From and To fields are required');

    if (!form.date || new Date(form.date) < new Date().setHours(0, 0, 0, 0)) {
      return setError('Date must be today or in the future');
    }

    if (!form.driverArrivingIn || Number(form.driverArrivingIn) <= 0) {
      return setError('Please specify a valid driver arrival time in minutes');
    }

    if (!form.seatsAvailable || Number(form.seatsAvailable) <= 0) {
      return setError('Seats available must be positive');
    }

    if (!form.costPerPerson || Number(form.costPerPerson) <= 0) {
      return setError('Cost per person must be positive');
    }

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/rides`,
        {
          ...form,
          driverArrivingIn: Number(form.driverArrivingIn),
          seatsAvailable: Number(form.seatsAvailable),
          costPerPerson: Number(form.costPerPerson),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success('Ride posted successfully!');
      navigate('/my-rides');
    } catch (err) {
      setError(err.response?.data?.msg || 'Error posting ride');
      console.error('Ride post error:', err);
    }
  };

  return (
    <div className="dark min-h-screen bg-[#0f0f0f] text-white flex items-center justify-center relative px-4">
      {/* Glowing background */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff0d_1px,transparent_1px)] [background-size:20px_20px] z-0" />
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-700 via-purple-700 to-pink-700 opacity-10 blur-2xl z-0" />

      {/* Card with hover glow */}
      <form
        onSubmit={handleSubmit}
        className="group relative z-10 w-full max-w-xl bg-white/10 backdrop-blur-md p-10 rounded-2xl shadow-2xl border border-white/20
                      hover:shadow-[0_0_30px_#8b5cf6] hover:scale-[1.02] hover:border-purple-400 transition-all duration-300"
      >
        <h2 className="text-3xl font-bold text-center mb-6 text-white">Post a Ride 🚖</h2>
        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}

        <input
          name="from"
          placeholder="From (e.g. Sector 62)"
          className="w-full px-4 py-2 bg-white/10 border border-gray-300 text-white rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-green-400"
          value={form.from}
          onChange={handleChange}
        />
        <input
          name="to"
          placeholder="To (e.g. Sector 128)"
          className="w-full px-4 py-2 bg-white/10 border border-gray-300 text-white rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-green-400"
          value={form.to}
          onChange={handleChange}
        />
        <input
          name="date"
          type="date"
          className="w-full px-4 py-2 bg-white/10 border border-gray-300 text-white rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-green-400"
          value={form.date}
          onChange={handleChange}
        />
        <input
          name="driverArrivingIn"
          type="number"
          placeholder="Driver arriving in (minutes)"
          className="w-full px-4 py-2 bg-white/10 border border-gray-300 text-white rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-green-400"
          value={form.driverArrivingIn}
          onChange={handleChange}
        />
        <input
          name="seatsAvailable"
          type="number"
          placeholder="Seats Available"
          className="w-full px-4 py-2 bg-white/10 border border-gray-300 text-white rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-green-400"
          value={form.seatsAvailable}
          onChange={handleChange}
        />
        <input
          name="costPerPerson"
          type="number"
          placeholder="Cab Price (₹)"
          className="w-full px-4 py-2 bg-white/10 border border-gray-300 text-white rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-green-400"
          value={form.costPerPerson}
          onChange={handleChange}
        />

        <ImageUploader
          onUpload={(url) => {
            setForm({ ...form, cabScreenshotUrl: url });
            setScreenshotUploaded(true);
          }}
          uploaded={screenshotUploaded}
        />

        <button
          type="submit"
          className="group relative w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 mt-6 rounded-xl transition-all duration-300"
        >
          Post Ride ✏️
          <span className="absolute inset-0 rounded-xl ring-2 ring-green-400 opacity-0 group-hover:opacity-100 blur-md animate-pulse transition duration-300" />
        </button>
      </form>
    </div>
  );
};

export default PostRidePage;
