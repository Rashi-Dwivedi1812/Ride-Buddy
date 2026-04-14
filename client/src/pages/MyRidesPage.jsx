import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { toast } from 'react-toastify';
import { useNavigate, useLocation } from 'react-router-dom';

const MyRidesPage = () => {
  const [rides, setRides] = useState([]);
  const [countdowns, setCountdowns] = useState({});
  const [showImageRideId, setShowImageRideId] = useState(null);
  const socketRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  const calculateCountdown = (ride) => {
    const createdAt = new Date(ride.createdAt).getTime();
    const arrivingInSeconds = ride.driverArrivingIn * 60;
    const serverTarget = createdAt + arrivingInSeconds * 1000;
    const diffSeconds = Math.floor((serverTarget - Date.now()) / 1000);
    return diffSeconds > 0 ? diffSeconds : 0;
  };

  const fetchMyRides = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/rides/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRides(res.data);
      const initialCountdowns = {};
      res.data.forEach((ride) => {
        if (!ride.bookedBy || ride.bookedBy.length === 0) {
          initialCountdowns[ride._id] = calculateCountdown(ride);
        }
      });
      setCountdowns(initialCountdowns);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to fetch rides. Please try again.');
      setRides([]);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const decoded = JSON.parse(atob(token.split('.')[1]));
    const userId = decoded.id || decoded._id;

    socketRef.current = io(import.meta.env.VITE_API_URL.replace('/api', ''), {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 90000,
      autoConnect: true,
      forceNew: true,
      auth: { token },
    });

    fetchMyRides(userId);

    socketRef.current.on('connect', () => {
      socketRef.current.emit('join_driver_room', userId);
    });
    socketRef.current.on('reconnect', () => {
      socketRef.current.emit('join_driver_room', userId);
      fetchMyRides(userId);
    });
    socketRef.current.on('connect_error', () => toast.error('Connection error. Retrying...'));
    socketRef.current.on('ride_booked', async ({ rideId, byUserId, message, driverId, ride }) => {
      if (String(driverId) !== String(userId)) return;
      toast.success(message || 'Someone booked your ride!');
      navigate(`/current-ride/${rideId}`, { replace: true });
      setRides(prev => prev.map(r => r._id === rideId ? ride : r));
    });
    socketRef.current.on('ride_update', ({ driverId: updatedDriverId, action, ride }) => {
      if (String(updatedDriverId) === String(userId)) {
        if (action === 'create') {
          setRides(prev => [...prev, ride]);
          setCountdowns(prev => ({ ...prev, [ride._id]: calculateCountdown(ride) }));
        } else {
          fetchMyRides(userId);
        }
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.off('connect');
        socketRef.current.off('reconnect');
        socketRef.current.off('connect_error');
        socketRef.current.off('ride_booked');
        socketRef.current.off('ride_update');
        socketRef.current.disconnect();
      }
    };
  }, [navigate, location.pathname]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdowns((prev) => {
        const updated = { ...prev };
        for (const id in updated) {
          if (updated[id] > 0) updated[id] -= 1;
        }
        return updated;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const particles = Array.from({ length: 55 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.4,
      dx: (Math.random() - 0.5) * 0.35,
      dy: (Math.random() - 0.5) * 0.35,
      opacity: Math.random() * 0.45 + 0.08,
    }));
    let animId;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(139,92,246,${p.opacity})`;
        ctx.fill();
        p.x += p.dx; p.y += p.dy;
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    window.addEventListener('resize', resize);
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .mr-root {
          font-family: 'DM Sans', sans-serif;
          min-height: 100vh;
          background: #080810;
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          overflow: hidden;
          color: #fff;
          padding: 52px 20px 64px;
        }

        canvas.mr-canvas { position: absolute; inset: 0; z-index: 0; pointer-events: none; }

        .mr-noise {
          position: absolute; inset: 0; z-index: 0; opacity: 0.03;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size: 200px;
        }

        .mr-glow-1 { position: absolute; width: 600px; height: 600px; border-radius: 50%; background: radial-gradient(circle, rgba(99,32,255,0.15) 0%, transparent 70%); top: -200px; left: -200px; z-index: 0; animation: floatA 9s ease-in-out infinite alternate; }
        .mr-glow-2 { position: absolute; width: 500px; height: 500px; border-radius: 50%; background: radial-gradient(circle, rgba(236,72,153,0.11) 0%, transparent 70%); bottom: -140px; right: -140px; z-index: 0; animation: floatB 11s ease-in-out infinite alternate; }
        .mr-glow-3 { position: absolute; width: 300px; height: 300px; border-radius: 50%; background: radial-gradient(circle, rgba(56,189,248,0.08) 0%, transparent 70%); top: 35%; left: 70%; z-index: 0; animation: floatA 13s ease-in-out infinite alternate-reverse; }

        @keyframes floatA { from { transform: translate(0,0) scale(1); } to { transform: translate(40px,30px) scale(1.1); } }
        @keyframes floatB { from { transform: translate(0,0) scale(1); } to { transform: translate(-30px,-40px) scale(1.08); } }
        @keyframes fadeUp  { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse   { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.7); } }
        @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalIn { from { opacity: 0; transform: scale(0.95) translateY(16px); } to { opacity: 1; transform: scale(1) translateY(0); } }

        /* ── Page header ── */
        .mr-header {
          position: relative; z-index: 10;
          display: flex; flex-direction: column; align-items: center;
          margin-bottom: 44px;
          animation: fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) both;
        }

        .mr-badge {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 5px 14px; border-radius: 100px;
          background: rgba(139,92,246,0.12);
          border: 1px solid rgba(139,92,246,0.25);
          font-size: 12px; font-weight: 500; color: #a78bfa;
          letter-spacing: 0.05em; text-transform: uppercase;
          margin-bottom: 16px;
        }
        .mr-dot {
          width: 6px; height: 6px; border-radius: 50%; background: #a78bfa;
          animation: pulse 2s infinite;
        }
        .mr-title {
          font-family: 'Syne', sans-serif;
          font-size: clamp(28px, 4vw, 42px);
          font-weight: 800; letter-spacing: -0.03em; text-align: center;
        }
        .mr-title-accent {
          background: linear-gradient(135deg, #818cf8 0%, #c084fc 50%, #f472b6 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }

        /* ── List ── */
        .mr-list {
          position: relative; z-index: 10;
          width: 100%; max-width: 780px;
          display: flex; flex-direction: column; gap: 18px;
        }

        /* ── Empty ── */
        .mr-empty {
          display: flex; flex-direction: column; align-items: center; gap: 12px;
          padding: 64px 24px; border-radius: 24px;
          background: linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%);
          border: 1px dashed rgba(255,255,255,0.1);
          animation: fadeUp 0.8s 0.1s cubic-bezier(0.16,1,0.3,1) both;
        }
        .mr-empty-emoji { font-size: 48px; }
        .mr-empty-title { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 700; color: rgba(255,255,255,0.6); }
        .mr-empty-sub   { font-size: 14px; color: rgba(255,255,255,0.3); font-weight: 300; }

        /* ── Ride card ── */
        .mr-card {
          position: relative;
          padding: 28px 30px;
          border-radius: 22px;
          background: linear-gradient(145deg, rgba(255,255,255,0.065) 0%, rgba(255,255,255,0.02) 100%);
          border: 1px solid rgba(255,255,255,0.09);
          box-shadow: 0 0 0 1px rgba(139,92,246,0.06), 0 16px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06);
          backdrop-filter: blur(20px);
          transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s;
          animation: fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) both;
        }
        .mr-card:hover {
          transform: translateY(-3px);
          border-color: rgba(139,92,246,0.3);
          box-shadow: 0 0 0 1px rgba(139,92,246,0.2), 0 24px 50px rgba(0,0,0,0.5), 0 0 32px rgba(139,92,246,0.1);
        }
        .mr-card.booked { border-color: rgba(52,211,153,0.18); }
        .mr-card.booked:hover {
          border-color: rgba(52,211,153,0.35);
          box-shadow: 0 0 0 1px rgba(52,211,153,0.2), 0 24px 50px rgba(0,0,0,0.5), 0 0 28px rgba(52,211,153,0.1);
        }

        /* thin accent line at top of card */
        .mr-card-bar {
          position: absolute; top: 0; left: 30px; right: 30px; height: 2px;
          border-radius: 0 0 4px 4px;
          background: linear-gradient(90deg, transparent, rgba(139,92,246,0.5), transparent);
        }
        .mr-card.booked .mr-card-bar {
          background: linear-gradient(90deg, transparent, rgba(52,211,153,0.5), transparent);
        }

        /* card top row: route + status badge */
        .mr-card-top {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 20px; gap: 12px; flex-wrap: wrap;
        }
        .mr-route { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .mr-route-from { font-family: 'Syne', sans-serif; font-size: 17px; font-weight: 700; color: #c084fc; }
        .mr-route-to   { font-family: 'Syne', sans-serif; font-size: 17px; font-weight: 700; color: #818cf8; }
        .mr-route-arrow { color: rgba(255,255,255,0.22); font-size: 15px; }

        .mr-status-badge {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 4px 13px; border-radius: 100px;
          font-size: 11px; font-weight: 500; letter-spacing: 0.05em;
          text-transform: uppercase; white-space: nowrap;
        }
        .mr-status-waiting { background: rgba(251,191,36,0.12); border: 1px solid rgba(251,191,36,0.25); color: #fbbf24; }
        .mr-status-booked  { background: rgba(52,211,153,0.12); border: 1px solid rgba(52,211,153,0.25); color: #34d399; }

        /* 3-col info chips */
        .mr-grid {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 12px; margin-bottom: 18px;
        }
        .mr-info-item {
          display: flex; flex-direction: column; gap: 4px;
          padding: 13px 15px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px;
        }
        .mr-info-label {
          font-size: 10px; font-weight: 500; color: rgba(255,255,255,0.3);
          letter-spacing: 0.07em; text-transform: uppercase;
        }
        .mr-info-value {
          font-size: 14px; font-weight: 500; color: rgba(255,255,255,0.85);
        }

        /* countdown pill */
        .mr-countdown-wrap {
          display: flex; align-items: center; gap: 10px;
          padding: 11px 16px; border-radius: 12px;
          background: rgba(139,92,246,0.07);
          border: 1px solid rgba(139,92,246,0.15);
          margin-bottom: 18px;
        }
        .mr-countdown-wrap.paused {
          background: rgba(52,211,153,0.06);
          border-color: rgba(52,211,153,0.15);
        }
        .mr-countdown-label { font-size: 12px; color: rgba(255,255,255,0.38); }
        .mr-countdown-val {
          font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700;
          color: #a78bfa; margin-left: auto;
        }
        .mr-countdown-wrap.paused .mr-countdown-val { color: #34d399; }

        /* footer row */
        .mr-card-footer {
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 10px;
        }
        .mr-booking-info { font-size: 13px; font-weight: 400; }
        .mr-booking-info.booked  { color: #34d399; }
        .mr-booking-info.waiting { color: rgba(255,255,255,0.32); }

        .mr-screenshot-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 16px; border-radius: 10px; cursor: pointer;
          background: rgba(139,92,246,0.14);
          border: 1px solid rgba(139,92,246,0.25);
          color: #a78bfa;
          font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500;
          transition: background 0.2s, transform 0.2s;
        }
        .mr-screenshot-btn:hover { background: rgba(139,92,246,0.26); transform: translateY(-1px); }

        /* ── Image modal ── */
        .mr-modal-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.85);
          backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          z-index: 50;
          animation: fadeIn 0.2s ease both;
        }
        .mr-modal {
          position: relative;
          background: linear-gradient(145deg, rgba(20,20,35,0.98), rgba(14,14,26,0.98));
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 22px; padding: 20px;
          max-width: min(720px, 92vw); width: 100%;
          box-shadow: 0 40px 80px rgba(0,0,0,0.8);
          animation: modalIn 0.25s cubic-bezier(0.16,1,0.3,1) both;
        }
        .mr-modal-close {
          position: absolute; top: 14px; right: 16px;
          width: 30px; height: 30px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 8px; border: none; cursor: pointer;
          background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.6);
          font-size: 18px; line-height: 1;
          transition: background 0.2s, color 0.2s;
        }
        .mr-modal-close:hover { background: rgba(255,255,255,0.15); color: #fff; }
        .mr-modal img { width: 100%; height: auto; border-radius: 14px; display: block; margin-top: 8px; }

        @media (max-width: 560px) {
          .mr-grid { grid-template-columns: 1fr 1fr; }
          .mr-card { padding: 22px 18px; }
        }
      `}</style>

      <div className="mr-root">
        <canvas ref={canvasRef} className="mr-canvas" />
        <div className="mr-noise" />
        <div className="mr-glow-1" />
        <div className="mr-glow-2" />
        <div className="mr-glow-3" />

        {/* Image Modal */}
        {showImageRideId && (
          <div className="mr-modal-overlay" onClick={() => setShowImageRideId(null)}>
            <div className="mr-modal" onClick={e => e.stopPropagation()}>
              <button className="mr-modal-close" onClick={() => setShowImageRideId(null)}>&times;</button>
              <img
                src={rides.find(r => r._id === showImageRideId)?.cabScreenshotUrl}
                alt="Cab Screenshot"
              />
            </div>
          </div>
        )}

        {/* Page Header */}
        <div className="mr-header">
          <div className="mr-badge">
            <span className="mr-dot" />
            Driver Dashboard
          </div>
          <h2 className="mr-title">
            My <span className="mr-title-accent">Rides</span> 🚗
          </h2>
        </div>

        {/* Rides */}
        <div className="mr-list">
          {rides.length === 0 ? (
            <div className="mr-empty">
              <span className="mr-empty-emoji">🚖</span>
              <p className="mr-empty-title">No rides posted yet</p>
              <p className="mr-empty-sub">Head back to Home and post your first ride!</p>
            </div>
          ) : (
            rides.map((ride, i) => {
              const isBooked = ride.bookedBy?.length > 0;
              const countdown = countdowns[ride._id];
              return (
                <div
                  key={ride._id}
                  className={`mr-card ${isBooked ? 'booked' : ''}`}
                  style={{ animationDelay: `${i * 0.07}s` }}
                >
                  <div className="mr-card-bar" />

                  {/* Route + Status */}
                  <div className="mr-card-top">
                    <div className="mr-route">
                      <span className="mr-route-from">{ride.from}</span>
                      <span className="mr-route-arrow">→</span>
                      <span className="mr-route-to">{ride.to}</span>
                    </div>
                    <span className={`mr-status-badge ${isBooked ? 'mr-status-booked' : 'mr-status-waiting'}`}>
                      {isBooked ? '✅ Booked' : '⏳ Waiting'}
                    </span>
                  </div>

                  {/* Info chips */}
                  <div className="mr-grid">
                    <div className="mr-info-item">
                      <span className="mr-info-label">📅 Date</span>
                      <span className="mr-info-value">{new Date(ride.date).toLocaleDateString()}</span>
                    </div>
                    <div className="mr-info-item">
                      <span className="mr-info-label">💺 Seats Left</span>
                      <span className="mr-info-value">{ride.seatsAvailable}</span>
                    </div>
                    <div className="mr-info-item">
                      <span className="mr-info-label">💰 Cost</span>
                      <span className="mr-info-value">₹{ride.costPerPerson}</span>
                    </div>
                  </div>

                  {/* Countdown */}
                  <div className={`mr-countdown-wrap ${isBooked ? 'paused' : ''}`}>
                    <span className="mr-countdown-label">⏱ Driver arriving in</span>
                    <span className="mr-countdown-val">
                      {isBooked
                        ? '⏸ Paused — Ride Booked'
                        : countdown > 0 ? formatTime(countdown) : '🟢 Arrived'}
                    </span>
                  </div>

                  {/* Footer */}
                  <div className="mr-card-footer">
                    <span className={`mr-booking-info ${isBooked ? 'booked' : 'waiting'}`}>
                      {isBooked
                        ? `✅ Booked by ${ride.bookedBy.length} user(s)`
                        : 'Waiting for someone to book…'}
                    </span>
                    {ride.cabScreenshotUrl && (
                      <button
                        className="mr-screenshot-btn"
                        onClick={() => setShowImageRideId(ride._id)}
                      >
                        📷 View Screenshot
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
};

export default MyRidesPage;