import React, { useEffect, useState } from 'react';
import axios from 'axios';

const RideCard = ({ ride, isBooked }) => {
  const status = {
    text: ride.status === 'completed' ? 'Completed' : 'Scheduled',
    color: ride.status === 'completed' ? 'gray' : 'yellow',
  };

  const formattedDate = new Date(ride.date).toLocaleDateString();

  return (
    <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-5 mb-4 text-white shadow-lg transition hover:scale-[1.02] hover:shadow-xl duration-300">
      <div className="flex justify-between items-start mb-3">
        <div className="flex gap-2 flex-wrap">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              ride.rideType === 'booked'
                ? 'bg-blue-500/20 text-blue-300'
                : 'bg-green-500/20 text-green-300'
            }`}
          >
            {ride.rideType === 'booked' ? 'Booked Ride' : 'Posted Ride'}
          </span>

          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold bg-${status.color}-500/20 text-${status.color}-300`}
          >
            {status.text}
          </span>
        </div>
        <span className="text-sm text-gray-400">{formattedDate}</span>
      </div>

      <div className="space-y-2">
        <p>
          <span className="font-semibold text-purple-300">Ride Type:</span>{' '}
          {ride.rideType === 'booked' ? 'Booked Ride' : 'Posted Ride'}
        </p>
        <p>
          <span className="font-semibold text-purple-300">Ride Owner:</span>{' '}
          {ride.driver?.name}
        </p>

        <p>
          <span className="font-semibold text-purple-300">From:</span> {ride.from}
        </p>
        <p>
          <span className="font-semibold text-purple-300">To:</span> {ride.to}
        </p>
        <p>
          <span className="font-semibold text-purple-300">Fare:</span> ₹{ride.costPerPerson}
        </p>
      </div>

      {!isBooked && ride.bookedBy?.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/20">
          <p className="font-semibold text-purple-300 mb-2">
            Passengers ({ride.bookedBy.length}):
          </p>
          <div className="flex flex-wrap gap-2">
            {ride.bookedBy.map((user) => (
              <span
                key={user._id}
                className="bg-green-500/20 text-green-300 px-3 py-1 rounded-lg text-sm"
              >
                {user.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {ride.completedAt && (
        <div className="mt-3 pt-3 border-t border-white/20">
          <p className="text-sm text-gray-400">
            <span className="font-semibold text-purple-300">Completed:</span>{' '}
            {new Date(ride.completedAt).toLocaleString()}
          </p>
        </div>
      )}
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
        const allRides = historyRes.data || [];

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
      setRideHistory(historyRes.data || []);
    } catch (error) {
      console.error('Error refreshing ride history:', error);
      setError(error.response?.data?.message || 'Failed to refresh ride history');
    }
  };

  const uniqueRides = Array.from(
    new Map(rideHistory.map((ride) => [ride._id, ride])).values()
  );

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
        ) : rideHistory.length === 0 ? (
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
                <span className="ml-2 font-bold text-white">{rideHistory.length}</span>
              </div>
              <div className="bg-white/5 rounded-lg px-4 py-2">
                <span className="text-gray-400">Booked:</span>
                <span className="ml-2 font-bold text-blue-300">
                  {rideHistory.filter((ride) => ride.rideType === 'booked').length}
                </span>
              </div>
              <div className="bg-white/5 rounded-lg px-4 py-2">
                <span className="text-gray-400">Posted:</span>
                <span className="ml-2 font-bold text-green-300">
                  {rideHistory.filter((ride) => ride.rideType === 'posted').length}
                </span>
              </div>
              <div className="bg-white/5 rounded-lg px-4 py-2">
                <span className="text-gray-400">Completed:</span>
                <span className="ml-2 font-bold text-gray-300">
                  {
                    rideHistory.filter(
                      (ride) => ride.status === 'completed' || new Date(ride.date) < new Date()
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