import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

import axios from 'axios'; // Make sure this path is correct

const RideDetailPage = () => {
  const { id } = useParams();
  const [ride, setRide] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/rides/${id}`)
      .then(res => setRide(res.data))
      .catch(err => {
        console.error(err);
        setError('Failed to load ride details');
      });
  }, [id]);

  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (!ride) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Ride Details</h2>
      <div className="bg-white p-4 rounded shadow my-4">
        <p><strong>Driver:</strong> {ride.driverName || 'Unknown'}</p>
        <p><strong>From:</strong> {ride.from}</p>
        <p><strong>To:</strong> {ride.to}</p>
        <p><strong>Time:</strong> {new Date(ride.departureTime).toLocaleString()}</p>
        <p><strong>Cost per person:</strong> ₹{ride.costPerPerson}</p>

        {ride.cabScreenshotUrl && (
          <div className="my-4">
            <p className="font-semibold mb-1">Cab Fare Screenshot:</p>
            <img
              src={ride.cabScreenshotUrl}
              alt="Fare Screenshot"
              className="w-full max-w-sm border rounded shadow"
            />
          </div>
        )}

        <div className="mt-4">
          <Link
            to={`/chat/${id}`}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl"
          >
            💬 Chat with Driver
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RideDetailPage;
