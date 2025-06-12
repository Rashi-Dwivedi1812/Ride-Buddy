import React, { useEffect, useState } from 'react';
import axios from 'axios';

// ✅ RideCard component to display each ride's details
const RideCard = ({ ride, isBooked }) => {
  return (
    <div className="bg-white/5 rounded-xl p-6 shadow-md">
      <div className="mb-2 flex justify-between items-center">
        <h3 className="text-lg font-bold text-white">
          {ride.source} → {ride.destination}
        </h3>
        <span
          className={`px-3 py-1 text-xs rounded-full font-semibold ${
            isBooked ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'
          }`}
        >
          {isBooked ? 'Booked' : 'Posted'}
        </span>
      </div>
      <div className="text-sm text-gray-300 space-y-1">
        <p>
          <strong>Date:</strong> {new Date(ride.date).toLocaleDateString()}
        </p>
        <p>
          <strong>Time:</strong> {new Date(ride.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
        <p>
          <strong>Passengers:</strong> {ride.passengers?.length || 0}
        </p>
        <p>
          <strong>Status:</strong>{' '}
          <span className="capitalize">{ride.status || (new Date(ride.date) < new Date() ? 'completed' : 'pending')}</span>
        </p>
      </div>
    </div>
  );
};

const HistoryPage = () => {
  const [rideHistory, setRideHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRides = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };

        const historyRes = await axios.get('/api/rides/history', config);

        const allRides = Array.isArray(historyRes.data)
          ? historyRes.data
          : historyRes.data.rides || [];

        setRideHistory(allRides);
      } catch (error) {
        console.error('Error fetching ride history:', error);
        setError(error.response?.data?.message || 'Failed to fetch ride history');

        try {
          const token = localStorage.getItem('token');
          const config = { headers: { Authorization: `Bearer ${token}` } };
          const [bookedRes, postedRes] = await Promise.all([
            axios.get('/api/rides/booked', config),
            axios.get('/api/rides/posted', config),
          ]);

          const booked = (bookedRes.data || []).map((ride) => ({
            ...ride,
            isBooked: true,
          }));
          const posted = (postedRes.data || []).map((ride) => ({
            ...ride,
            isBooked: false,
            isPostedByUser: true,
          }));

          const fallbackRides = [...booked, ...posted].sort(
            (a, b) => new Date(b.date) - new Date(a.date)
          );

          setRideHistory(fallbackRides);
          setError(null);
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchRides();
  }, []);

  const handleRefresh = async () => {
    try {
      setError(null);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const historyRes = await axios.get('/api/rides/history', config);
      const rides = Array.isArray(historyRes.data)
        ? historyRes.data
        : historyRes.data.rides || [];
      setRideHistory(rides);
    } catch (error) {
      console.error('Error refreshing ride history:', error);
      setError(error.response?.data?.message || 'Failed to refresh ride history');
    }
  };

  const safeRideHistory = Array.isArray(rideHistory) ? rideHistory : [];
  const uniqueRides = Array.from(new Map(safeRideHistory.map((ride) => [ride._id, ride])).values());

  return (
    <div className="min-h-screen p-8 bg-gradient-to-b from-black via-gray-900 to-gray-800 text-white">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-4xl font-bold">🧾 Ride History</h2>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
            <p className="text-red-300 text-sm">
              <strong>Error:</strong> {error}
            </p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
            <p className="ml-4 text-gray-300">Loading ride history...</p>
          </div>
        ) : safeRideHistory.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🚗</div>
            <p className="text-xl text-gray-400">No ride history found.</p>
            <p className="text-sm text-gray-500 mt-2">
              Your completed rides will appear here.
            </p>
            <button
              onClick={handleRefresh}
              className="mt-4 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors duration-200"
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6 flex flex-wrap gap-4 text-sm">
              <div className="bg-white/5 rounded-lg px-4 py-2">
                <span className="text-gray-400">Total Rides:</span>
                <span className="ml-2 font-bold text-white">{safeRideHistory.length}</span>
              </div>
              <div className="bg-white/5 rounded-lg px-4 py-2">
                <span className="text-gray-400">Booked:</span>
                <span className="ml-2 font-bold text-blue-300">
                  {safeRideHistory.filter((ride) => ride.rideType === 'booked').length}
                </span>
              </div>
              <div className="bg-white/5 rounded-lg px-4 py-2">
                <span className="text-gray-400">Posted:</span>
                <span className="ml-2 font-bold text-green-300">
                  {safeRideHistory.filter((ride) => ride.rideType === 'posted').length}
                </span>
              </div>
              <div className="bg-white/5 rounded-lg px-4 py-2">
                <span className="text-gray-400">Completed:</span>
                <span className="ml-2 font-bold text-gray-300">
                  {
                    safeRideHistory.filter(
                      (ride) =>
                        ride.status === 'completed' || new Date(ride.date) < new Date()
                    ).length
                  }
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {uniqueRides.map((ride) => (
                <RideCard key={ride._id} ride={ride} isBooked={ride.isBooked} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;