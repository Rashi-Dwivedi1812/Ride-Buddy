import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

import axios from 'axios'; // Adjust path if needed

const FindRidePage = () => {
  const [rides, setRides] = useState([]);

  useEffect(() => {
    api.get('/rides')
      .then((res) => setRides(res.data))
      .catch((err) => console.error('Error fetching rides:', err));
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Available Rides</h2>
      <div className="grid gap-4">
        {rides.length === 0 ? (
          <p>No rides available.</p>
        ) : (
          rides.map((ride) => (
            <div key={ride.id} className="bg-white p-4 rounded shadow">
              <p><strong>Driver:</strong> {ride.driver}</p>
              <p><strong>Time:</strong> {ride.time}</p>
              <p><strong>Cost:</strong> ₹{ride.cost}</p>
              <p><strong>Seats:</strong> {ride.seats}</p>
              <Link to={`/ride/${ride.id}`} className="text-blue-600 underline">View Details</Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FindRidePage;
