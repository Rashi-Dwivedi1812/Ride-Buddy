import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

const { id } = useParams();
const [ride, setRide] = useState(null);

useEffect(() => {
  api.get(`/rides/${id}`)
    .then(res => setRide(res.data))
    .catch(err => console.error(err));
}, [id]);


const RideDetailPage = () => {
  const { id } = useParams();
  // Fetch ride details using `id`
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold">Ride Details</h2>
      <div className="bg-white p-4 rounded shadow my-4">
        <p><strong>Driver:</strong> Aman</p>
        <p><strong>From:</strong> Sector 62</p>
        <p><strong>To:</strong> Sector 128</p>
        <p><strong>Time:</strong> 5:00 PM</p>
        <p><strong>Cost per person:</strong> ₹80</p>
        {ride?.screenshotUrl && (
  <div className="my-4">
    <p className="font-semibold mb-1">Cab Fare Screenshot:</p>
    <img
      src={ride.screenshotUrl}
      alt="Fare Screenshot"
      className="w-full max-w-sm border rounded shadow"
    />
  </div>
)}

        <div className="mt-4">
          <Link to={`/chat/${id}`} className="bg-blue-500 text-white px-4 py-2 rounded-xl">💬 Chat with Driver</Link>
        </div>
      </div>
    </div>
  );
};

export default RideDetailPage;
