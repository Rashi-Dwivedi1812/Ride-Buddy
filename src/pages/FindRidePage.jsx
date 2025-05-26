import React from 'react';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

const [rides, setRides] = useState([]);

useEffect(() => {
  api.get('/rides')
    .then(res => setRides(res.data))
    .catch(err => console.error(err));
}, []);


const FindRidePage = () => {
  const rides = [
    { id: 1, driver: 'Aman', time: '5:00 PM', cost: 80, seats: 2 },
    { id: 2, driver: 'Priya', time: '5:30 PM', cost: 70, seats: 1 }
  ];

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Available Rides</h2>
      <div className="grid gap-4">
        {rides.map((ride) => (
          <div key={ride.id} className="bg-white p-4 rounded shadow">
            <p><strong>Driver:</strong> {ride.driver}</p>
            <p><strong>Time:</strong> {ride.time}</p>
            <p><strong>Cost:</strong> ₹{ride.cost}</p>
            <p><strong>Seats:</strong> {ride.seats}</p>
            <Link to={`/ride/${ride.id}`} className="text-blue-600 underline">View Details</Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FindRidePage;