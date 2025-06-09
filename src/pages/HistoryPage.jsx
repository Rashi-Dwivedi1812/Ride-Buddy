import React, { useEffect, useState } from 'react';
import axios from 'axios';

const HistoryPage = () => {
  const [rideHistory, setRideHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRides = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };

        const bookedRes = await axios.get('/api/rides/booked', config);
        const postedRes = await axios.get('/api/rides/posted', config);

        const booked = (bookedRes.data || []).map(ride => ({ ...ride, isBooked: true }));
        const posted = (postedRes.data || []).map(ride => ({ ...ride, isBooked: false }));

        const allRides = [...booked, ...posted].sort((a, b) => new Date(b.date) - new Date(a.date));

        setRideHistory(allRides);
      } catch (error) {
        console.error('Error fetching ride history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRides();
  }, []);

  const RideCard = ({ ride, isBooked }) => {
    const departure = new Date(ride.departureTime);
    const formattedDate = isNaN(departure.getTime())
      ? "N/A"
      : departure.toLocaleString(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
        });

    return (
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-5 mb-4 text-white shadow-lg transition hover:scale-[1.02] hover:shadow-xl duration-300">
        <p><span className="font-semibold text-purple-300">Ride Owner:</span> {isBooked ? ride.driver?.name : "You"}</p>
        <p><span className="font-semibold text-purple-300">From:</span> {ride.from}</p>
        <p><span className="font-semibold text-purple-300">To:</span> {ride.to}</p>
        <p><span className="font-semibold text-purple-300">Date:</span> {new Date(ride.date).toLocaleDateString()}</p>
        <p><span className="font-semibold text-purple-300">Seats:</span> {ride.seatsAvailable}</p>
        <p><span className="font-semibold text-purple-300">Fare:</span> ₹{ride.costPerPerson}</p>

        {/* Show passenger names only if it's a posted ride */}
        {!isBooked && ride.bookedBy?.length > 0 && (
          <div className="mt-3 pt-3 border-t border-white/20">
            <p className="font-semibold text-purple-300 mb-1">Passengers:</p>
            <div className="flex flex-wrap gap-2">
              {ride.bookedBy.map((passenger) => (
                <span key={passenger._id} className="bg-green-500/20 text-green-300 px-2 py-1 rounded-lg text-sm">
                  {passenger.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen p-8 bg-gradient-to-b from-black via-gray-900 to-gray-800 text-white">
      <h2 className="text-4xl font-bold text-center mb-10">🧾 Ride History</h2>

      {loading ? (
        <p className="text-center text-gray-300">Loading ride history...</p>
      ) : rideHistory.length === 0 ? (
        <p className="text-center text-gray-400">No ride history found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {rideHistory.map((ride) => (
            <RideCard key={ride._id} ride={ride} isBooked={ride.isBooked} />
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
