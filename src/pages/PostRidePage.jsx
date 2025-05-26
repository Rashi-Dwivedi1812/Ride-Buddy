import React, { useState } from 'react';
import ImageUploader from '../components/imageUploader';
import api from '../api/axios';

const PostRidePage = () => {
  const [form, setForm] = useState({
    from: '',
    to: '',
    departureTime: '',
    seatsAvailable: '',
    costPerPerson: '',
    cabScreenshotUrl: '',
  });
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');

  if (!form.from || !form.to) {
    return setError('From and To fields are required');
  }
  if (!form.departureTime || new Date(form.departureTime) <= new Date()) {
    return setError('Departure time must be in the future');
  }
  if (!form.seatsAvailable || Number(form.seatsAvailable) <= 0) {
    return setError('Seats available must be positive');
  }
  if (!form.costPerPerson || Number(form.costPerPerson) <= 0) {
    return setError('Cost per person must be positive');
  }

  // Optional: Require image
  // if (!form.cabScreenshotUrl) return setError('Cab screenshot is required');

  try {
    const res = await api.post('/rides', {
      ...form,
      seatsAvailable: Number(form.seatsAvailable),
      costPerPerson: Number(form.costPerPerson),
    });
    alert('Ride posted successfully!');
    setForm({
      from: '',
      to: '',
      departureTime: '',
      seatsAvailable: '',
      costPerPerson: '',
      cabScreenshotUrl: '',
    });
  } catch (err) {
    setError(err.response?.data?.msg || 'Error posting ride');
  }
};


  return (
    <div className="flex justify-center py-10 bg-gray-100">
      <form className="bg-white p-6 rounded shadow-md w-full max-w-lg" onSubmit={handleSubmit}>
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
          name="departureTime"
          type="datetime-local"
          className="input w-full px-4 py-2 border rounded-md mb-4"
          value={form.departureTime}
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
        <ImageUploader onUpload={(url) => setForm({ ...form, cabScreenshotUrl: url })} />
        <button className="bg-green-600 text-white w-full py-2 rounded-xl">Post Ride</button>
      </form>
    </div>
  );
};

export default PostRidePage;