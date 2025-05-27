import React, { useState, useEffect } from 'react';

import axios from 'axios';

const ProfilePage = () => {
  const [postedRides, setPostedRides] = useState([]);
  const [bookedRides, setBookedRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    api.get('/users/me')
      .then(res => {
        setPostedRides(res.data.postedRides || []);
        setBookedRides(res.data.bookedRides || []);
        setLoading(false);
      })
      .catch(err => {
        setError(err.response?.data?.msg || 'Failed to load profile');
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Your Profile</h2>
      <div className="mb-6">
        <h3 className="text-xl font-semibold">Posted Rides</h3>
        <ul className="list-disc list-inside">
          {postedRides.length > 0 ? (
            postedRides.map((ride, i) => <li key={i}>{ride.from} to {ride.to} at {new Date(ride.departureTime).toLocaleString()}</li>)
          ) : (
            <li>No posted rides</li>
          )}
        </ul>
      </div>
      <div>
        <h3 className="text-xl font-semibold">Booked Rides</h3>
        <ul className="list-disc list-inside">
          {bookedRides.length > 0 ? (
            bookedRides.map((ride, i) => <li key={i}>{ride.from} to {ride.to} at {new Date(ride.departureTime).toLocaleString()}</li>)
          ) : (
            <li>No booked rides</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default ProfilePage;