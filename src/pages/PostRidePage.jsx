import React, { useState } from 'react';
import ImageUploader from '../components/imageUploader';
import axios from 'axios';

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

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.from || !form.to) {
      return setError('From and To fields are required');
    }

    if (!form.date || new Date(form.date) < new Date().setHours(0, 0, 0, 0)) {
      return setError('Date must be today or in the future');
    }

    if (!form.driverArrivingIn) {
      return setError('Please specify when the driver is arriving');
    }

    if (!form.seatsAvailable || Number(form.seatsAvailable) <= 0) {
      return setError('Seats available must be positive');
    }

    if (!form.costPerPerson || Number(form.costPerPerson) <= 0) {
      return setError('Cost per person must be positive');
    }

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        'http://localhost:5000/api/rides',
        {
          ...form,
          seatsAvailable: Number(form.seatsAvailable),
          costPerPerson: Number(form.costPerPerson),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert('Ride posted successfully!');
      setForm({
        from: '',
        to: '',
        date: '',
        driverArrivingIn: '',
        seatsAvailable: '',
        costPerPerson: '',
        cabScreenshotUrl: '',
      });
    } catch (err) {
      setError(err.response?.data?.msg || 'Error posting ride');
      console.error('Ride post error:', err);
    }
  };

  return (
    <div className="flex justify-center py-10 bg-gray-100">
      <form
        className="bg-white p-6 rounded shadow-md w-full max-w-lg"
        onSubmit={handleSubmit}
      >
        <h2 className="text-xl font-semibold mb-4">Post a Ride</h2>
        {error && <p className="text-red-500 mb-2">{error}</p>}
        <input
          name="from"
          placeholder="From (e.g. Sector 62)"
          className="input w-full px-4 py-2 border rounded-md mb-4"
          value={form.from}
          onChange={handleChange}
        />
        <input
          name="to"
          placeholder="To (e.g. Sector 128)"
          className="input w-full px-4 py-2 border rounded-md mb-4"
          value={form.to}
          onChange={handleChange}
        />
        <input
          name="date"
          type="date"
          className="input w-full px-4 py-2 border rounded-md mb-4"
          value={form.date}
          onChange={handleChange}
        />
        <input
          name="driverArrivingIn"
          placeholder="Driver arriving in (e.g. 10 mins)"
          className="input w-full px-4 py-2 border rounded-md mb-4"
          value={form.driverArrivingIn}
          onChange={handleChange}
        />
        <input
          name="seatsAvailable"
          type="number"
          placeholder="Seats Available"
          className="input w-full px-4 py-2 border rounded-md mb-4"
          value={form.seatsAvailable}
          onChange={handleChange}
        />
        <input
          name="costPerPerson"
          type="number"
          placeholder="Cost per Person (₹)"
          className="input w-full px-4 py-2 border rounded-md mb-4"
          value={form.costPerPerson}
          onChange={handleChange}
        />
        <ImageUploader
          onUpload={(url) => setForm({ ...form, cabScreenshotUrl: url })}
        />
        <button className="bg-green-600 text-white w-full py-2 rounded-xl">
          Post Ride
        </button>
      </form>
    </div>
  );
};

export default PostRidePage;