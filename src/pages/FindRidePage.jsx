import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const FindRidePage = () => {
  const [rides, setRides] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('http://localhost:5000/api/rides')
      .then((res) => setRides(res.data))
      .catch((err) => console.error('Error fetching rides:', err));
  }, []);

  const handleAccept = async (rideId) => {
    try {
      await axios.post(`http://localhost:5000/api/rides/${rideId}/accept`);
      alert('✅ Ride accepted!');
    } catch (error) {
      console.error('Error accepting ride:', error);
      alert('❌ Failed to accept ride.');
    }
  };

  const handleReject = async (rideId) => {
  try {
    const token = localStorage.getItem('token');
    await axios.post(
      `http://localhost:5000/api/rides/${rideId}/reject`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    alert('🚫 Ride rejected.');
    setRides((prevRides) => prevRides.filter((ride) => ride._id !== rideId));
  } catch (error) {
    console.error('Error rejecting ride:', error.response?.data || error.message);
    alert('❌ Failed to reject ride.');
  }
};



  const handleChat = (driverId) => {
    navigate(`/chat/${driverId}`);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Available Rides</h2>
      <div className="grid gap-4">
        {rides.length === 0 ? (
          <p>No rides available.</p>
        ) : (
          rides.map((ride) => (
            <div key={ride._id} className="bg-white p-4 rounded shadow flex gap-4 items-start">
              {ride.driver?.photo && (
                <img
                  src={ride.driver.photo}
                  alt={`${ride.driver.name}'s profile`}
                  className="w-20 h-20 object-cover rounded-full border"
                />
              )}
              <div className="flex-1">
                <p><strong>Name:</strong> {ride.driver?.name}</p>
                <p><strong>From:</strong> {ride.from}</p>
                <p><strong>To:</strong> {ride.to}</p>
                <p><strong>Date:</strong> {ride.date}</p>
                <p><strong>Driver arriving in:</strong> {ride.driverArrivingIn}</p>
                <p><strong>Cost per person:</strong> ₹{ride.costPerPerson}</p>
                <p><strong>Seats Available:</strong> {ride.seatsAvailable}</p>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleAccept(ride._id)}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-1 rounded"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleReject(ride._id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-1 rounded"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleChat(ride.driver?._id)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded"
                  >
                    Chat
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FindRidePage;