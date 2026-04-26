import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const getRemainingDisplayTime = (ride, now) => {
  const createdAt = new Date(ride.createdAt).getTime();
  const acceptedAt = ride.acceptedAt ? new Date(ride.acceptedAt).getTime() : null;
  const displayStartTime = acceptedAt || createdAt;
  const timeElapsedSeconds = Math.floor((now - displayStartTime) / 1000);
  const minimumDisplaySeconds = 10 * 60;
  const customDisplayTime = ride.minimumDisplayTime
    ? Math.max(
        minimumDisplaySeconds,
        Math.floor((new Date(ride.minimumDisplayTime).getTime() - displayStartTime) / 1000)
      )
    : minimumDisplaySeconds;
  return Math.max(customDisplayTime - timeElapsedSeconds, 0);
};

const shouldDisplayRide = (ride, now) => {
  const createdAt = new Date(ride.createdAt).getTime();
  const acceptedAt = ride.acceptedAt ? new Date(ride.acceptedAt).getTime() : null;
  const displayStartTime = acceptedAt || createdAt;
  const ageInMinutes = (now - displayStartTime) / (1000 * 60);
  const hasAvailableSeats = ride.seatsAvailable > 0;
  const isWithinMinimumTime = ageInMinutes <= 10;
  const hasCustomDisplayTime = ride.minimumDisplayTime && now < new Date(ride.minimumDisplayTime).getTime();
  return hasAvailableSeats && (isWithinMinimumTime || hasCustomDisplayTime);
};

const FindRidePage = () => {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [countdowns, setCountdowns] = useState({});
  const socketRef = useRef(null);
  const canvasRef = useRef(null);
  const refreshIntervalRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const cachedRides = localStorage.getItem('cachedRides');
    if (cachedRides) {
      setRides(JSON.parse(cachedRides));
      setLoading(false);
    }
  }, []);

  const fetchRides = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/rides`);
      const now = Date.now();
      const availableRides = res.data.filter((ride) => shouldDisplayRide(ride, now));
      setRides(availableRides);
      localStorage.setItem('cachedRides', JSON.stringify(availableRides));
      const initialCountdowns = {};
      availableRides.forEach((ride) => {
        initialCountdowns[ride._id] = getRemainingDisplayTime(ride, now);
      });
      setCountdowns(initialCountdowns);
    } catch (err) {
      console.error('Error fetching rides:', err);
      toast.error('Failed to fetch rides. Retrying...');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRides();
    socketRef.current = io(import.meta.env.VITE_API_URL.replace('/api', ''), {
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });
    socketRef.current.on('connect', fetchRides);
    socketRef.current.on('connect_error', () => toast.error('Connection lost. Trying to reconnect...'));
    socketRef.current.on('newRide', fetchRides);
    socketRef.current.on('rideUpdated', fetchRides);
    refreshIntervalRef.current = setInterval(fetchRides, 15000);
    return () => {
      socketRef.current?.disconnect();
      clearInterval(refreshIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    const countdownInterval = setInterval(() => {
      setCountdowns((prevCountdowns) => {
        const now = Date.now();
        const newCountdowns = { ...prevCountdowns };
        let updated = false;
        rides.forEach((ride) => {
          const remaining = getRemainingDisplayTime(ride, now);
          if (newCountdowns[ride._id] !== remaining) { newCountdowns[ride._id] = remaining; updated = true; }
          if (remaining === 0) setRides((prev) => prev.filter((r) => r._id !== ride._id));
        });
        return updated ? newCountdowns : prevCountdowns;
      });
    }, 1000);
    return () => clearInterval(countdownInterval);
  }, [rides]);

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

  const formatTime = (seconds) => {
    if (seconds <= 0) return 'Expired';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')} left`;
  };

  const handleAccept = async (rideId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return alert('Please log in first.');
      await axios.post(
        `${import.meta.env.VITE_API_URL}/rides/${rideId}/accept`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRides((prev) => prev.filter((ride) => ride._id !== rideId));
      navigate(`/passenger-ride/${rideId}`);
    } catch (error) {
      toast.error(`❌ ${error.response?.data?.message || 'Failed to accept ride.'}`);
    }
  };

  const handleReject = async (rideId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${import.meta.env.VITE_API_URL}/rides/${rideId}/reject`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRides((prev) => prev.filter((ride) => ride._id !== rideId));
    } catch (error) {
      toast.error('❌ Failed to reject ride.');
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .fr-root {
          font-family: 'DM Sans', sans-serif;
          min-height: 100vh; background: #080810;
          display: flex; flex-direction: column; align-items: center;
          position: relative; overflow: hidden; color: #fff;
          padding: 52px 20px 64px;
        }

        canvas.fr-canvas { position: absolute; inset: 0; z-index: 0; pointer-events: none; }
        .fr-noise {
          position: absolute; inset: 0; z-index: 0; opacity: 0.03;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size: 200px;
        }
        .fr-glow-1 { position: absolute; width: 600px; height: 600px; border-radius: 50%; background: radial-gradient(circle, rgba(99,32,255,0.15) 0%, transparent 70%); top: -200px; left: -200px; z-index: 0; animation: floatA 9s ease-in-out infinite alternate; }
        .fr-glow-2 { position: absolute; width: 500px; height: 500px; border-radius: 50%; background: radial-gradient(circle, rgba(236,72,153,0.11) 0%, transparent 70%); bottom: -140px; right: -140px; z-index: 0; animation: floatB 11s ease-in-out infinite alternate; }
        .fr-glow-3 { position: absolute; width: 300px; height: 300px; border-radius: 50%; background: radial-gradient(circle, rgba(56,189,248,0.08) 0%, transparent 70%); top: 35%; left: 70%; z-index: 0; animation: floatA 13s ease-in-out infinite alternate-reverse; }

        @keyframes floatA { from { transform: translate(0,0) scale(1); } to { transform: translate(40px,30px) scale(1.1); } }
        @keyframes floatB { from { transform: translate(0,0) scale(1); } to { transform: translate(-30px,-40px) scale(1.08); } }
        @keyframes fadeUp  { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse   { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.7); } }
        @keyframes spin    { to { transform: rotate(360deg); } }

        /* ── Page header ── */
        .fr-header {
          position: relative; z-index: 10;
          display: flex; flex-direction: column; align-items: center;
          margin-bottom: 44px;
          animation: fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) both;
        }
        .fr-badge {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 5px 14px; border-radius: 100px;
          background: rgba(139,92,246,0.12); border: 1px solid rgba(139,92,246,0.25);
          font-size: 12px; font-weight: 500; color: #a78bfa;
          letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 16px;
        }
        .fr-dot { width: 6px; height: 6px; border-radius: 50%; background: #a78bfa; animation: pulse 2s infinite; }
        .fr-title { font-family: 'Syne', sans-serif; font-size: clamp(28px, 4vw, 42px); font-weight: 800; letter-spacing: -0.03em; text-align: center; }
        .fr-title-accent { background: linear-gradient(135deg, #818cf8 0%, #c084fc 50%, #f472b6 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }

        /* ── List ── */
        .fr-list { position: relative; z-index: 10; width: 100%; max-width: 780px; display: flex; flex-direction: column; gap: 18px; }

        /* ── Loading ── */
        .fr-loading {
          display: flex; flex-direction: column; align-items: center; gap: 16px;
          padding: 64px 24px;
        }
        .fr-spinner {
          width: 44px; height: 44px;
          border: 3px solid rgba(139,92,246,0.2);
          border-top-color: #a78bfa;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        .fr-loading-text { font-size: 14px; color: rgba(255,255,255,0.3); font-weight: 300; }

        /* ── Empty ── */
        .fr-empty {
          display: flex; flex-direction: column; align-items: center; gap: 12px;
          padding: 64px 24px; border-radius: 24px;
          background: linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%);
          border: 1px dashed rgba(255,255,255,0.1);
          animation: fadeUp 0.8s 0.1s cubic-bezier(0.16,1,0.3,1) both;
        }
        .fr-empty-emoji { font-size: 48px; }
        .fr-empty-title { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 700; color: rgba(255,255,255,0.6); }
        .fr-empty-sub   { font-size: 14px; color: rgba(255,255,255,0.3); font-weight: 300; }

        /* ── Ride card ── */
        .fr-card {
          position: relative; padding: 28px 30px; border-radius: 22px;
          background: linear-gradient(145deg, rgba(255,255,255,0.065) 0%, rgba(255,255,255,0.02) 100%);
          border: 1px solid rgba(255,255,255,0.09);
          box-shadow: 0 0 0 1px rgba(139,92,246,0.06), 0 16px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06);
          backdrop-filter: blur(20px);
          transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s;
          animation: fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) both;
        }
        .fr-card:hover {
          transform: translateY(-3px); border-color: rgba(139,92,246,0.3);
          box-shadow: 0 0 0 1px rgba(139,92,246,0.2), 0 24px 50px rgba(0,0,0,0.5), 0 0 32px rgba(139,92,246,0.1);
        }

        /* top accent bar */
        .fr-card-bar {
          position: absolute; top: 0; left: 30px; right: 30px; height: 2px;
          border-radius: 0 0 4px 4px;
          background: linear-gradient(90deg, transparent, rgba(99,102,241,0.5), transparent);
        }

        /* card top: driver avatar + route + timer badge */
        .fr-card-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 20px; gap: 14px; flex-wrap: wrap; }

        .fr-driver-row { display: flex; align-items: center; gap: 10px; }
        .fr-avatar {
          width: 38px; height: 38px; border-radius: 11px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          background: linear-gradient(135deg, rgba(99,102,241,0.22), rgba(139,92,246,0.14));
          border: 1px solid rgba(139,92,246,0.25);
          font-size: 17px;
        }
        .fr-driver-info { display: flex; flex-direction: column; gap: 1px; }
        .fr-driver-label { font-size: 10px; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 500; }
        .fr-driver-name { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; color: rgba(255,255,255,0.9); }

        .fr-timer-badge {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 5px 12px; border-radius: 100px;
          background: rgba(251,191,36,0.1); border: 1px solid rgba(251,191,36,0.22);
          font-size: 12px; font-weight: 500; color: #fbbf24; white-space: nowrap;
          font-family: 'Syne', sans-serif;
        }
        .fr-timer-dot { width: 5px; height: 5px; border-radius: 50%; background: #fbbf24; animation: pulse 1.5s infinite; }

        /* route display */
        .fr-route-row { display: flex; align-items: center; gap: 10px; margin-bottom: 18px; flex-wrap: wrap; }
        .fr-route-from { font-family: 'Syne', sans-serif; font-size: 17px; font-weight: 700; color: #c084fc; }
        .fr-route-to   { font-family: 'Syne', sans-serif; font-size: 17px; font-weight: 700; color: #818cf8; }
        .fr-route-arrow { color: rgba(255,255,255,0.22); font-size: 15px; }

        /* info chips */
        .fr-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
        .fr-info-item { display: flex; flex-direction: column; gap: 4px; padding: 13px 15px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; }
        .fr-info-label { font-size: 10px; font-weight: 500; color: rgba(255,255,255,0.3); letter-spacing: 0.07em; text-transform: uppercase; }
        .fr-info-value { font-size: 14px; font-weight: 500; color: rgba(255,255,255,0.85); }

        /* divider */
        .fr-divider { height: 1px; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent); margin-bottom: 18px; }

        /* screenshot btn */
        .fr-screenshot-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 16px; border-radius: 10px; cursor: pointer;
          background: rgba(139,92,246,0.12); border: 1px solid rgba(139,92,246,0.22);
          color: #a78bfa; font-family: 'DM Sans', sans-serif;
          font-size: 13px; font-weight: 500;
          transition: background 0.2s, transform 0.2s;
          margin-bottom: 16px;
        }
        .fr-screenshot-btn:hover { background: rgba(139,92,246,0.24); transform: translateY(-1px); }

        /* action buttons */
        .fr-actions { display: flex; gap: 12px; flex-wrap: wrap; }

        .fr-btn {
          position: relative; flex: 1; min-width: 120px;
          padding: 13px 20px; border: none; border-radius: 13px;
          font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500;
          cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;
          transition: transform 0.2s ease, box-shadow 0.2s ease; overflow: hidden;
        }
        .fr-btn::before { content: ''; position: absolute; inset: 0; background: rgba(255,255,255,0.08); opacity: 0; transition: opacity 0.2s; }
        .fr-btn:hover::before { opacity: 1; }
        .fr-btn:hover { transform: translateY(-2px); }
        .fr-btn:active { transform: translateY(0); }

        .fr-btn-accept {
          background: linear-gradient(135deg, #059669 0%, #10b981 100%);
          color: #fff;
          box-shadow: 0 4px 18px rgba(16,185,129,0.3), 0 0 0 1px rgba(16,185,129,0.2);
        }
        .fr-btn-accept:hover { box-shadow: 0 8px 26px rgba(16,185,129,0.45), 0 0 0 1px rgba(16,185,129,0.35); }

        .fr-btn-reject {
          background: rgba(239,68,68,0.12);
          border: 1px solid rgba(239,68,68,0.25);
          color: #f87171;
        }
        .fr-btn-reject:hover { background: rgba(239,68,68,0.2); border-color: rgba(239,68,68,0.4); transform: translateY(-2px); }

        @media (max-width: 560px) {
          .fr-grid { grid-template-columns: 1fr 1fr; }
          .fr-card { padding: 22px 18px; }
          .fr-actions { flex-direction: column; }
        }
      `}</style>

      <div className="fr-root">
        <canvas ref={canvasRef} className="fr-canvas" />
        <div className="fr-noise" />
        <div className="fr-glow-1" />
        <div className="fr-glow-2" />
        <div className="fr-glow-3" />

        {/* Page Header */}
        <div className="fr-header">
          <div className="fr-badge"><span className="fr-dot" />Live Rides</div>
          <h2 className="fr-title">
            Find a <span className="fr-title-accent">Ride</span> 🔍
          </h2>
        </div>

        {/* List */}
        <div className="fr-list">
          {loading ? (
            <div className="fr-loading">
              <div className="fr-spinner" />
              <p className="fr-loading-text">Looking for available rides…</p>
            </div>
          ) : rides.length === 0 ? (
            <div className="fr-empty">
              <span className="fr-empty-emoji">🚖</span>
              <p className="fr-empty-title">No rides available right now</p>
              <p className="fr-empty-sub">Check back shortly — new rides appear in real time!</p>
            </div>
          ) : (
            rides.map((ride, i) => {
              const countdown = countdowns[ride._id];
              return (
                <div
                  key={ride._id}
                  className="fr-card"
                  style={{ animationDelay: `${i * 0.07}s` }}
                >
                  <div className="fr-card-bar" />

                  {/* Driver + Timer */}
                  <div className="fr-card-top">
                    <div className="fr-driver-row">
                      <div className="fr-avatar">👤</div>
                      <div className="fr-driver-info">
                        <span className="fr-driver-label">Ride Owner</span>
                        <span className="fr-driver-name">{ride.driver?.name || 'Unknown'}</span>
                      </div>
                    </div>
                    <div className="fr-timer-badge">
                      <span className="fr-timer-dot" />
                      {countdown > 0 ? formatTime(countdown) : 'Arrived'}
                    </div>
                  </div>

                  {/* Route */}
                  <div className="fr-route-row">
                    <span className="fr-route-from">{ride.from}</span>
                    <span className="fr-route-arrow">→</span>
                    <span className="fr-route-to">{ride.to}</span>
                  </div>

                  {/* Info chips */}
                  <div className="fr-grid">
                    <div className="fr-info-item">
                      <span className="fr-info-label">📅 Date</span>
                      <span className="fr-info-value">{new Date(ride.date).toLocaleDateString()}</span>
                    </div>
                    <div className="fr-info-item">
                      <span className="fr-info-label">💺 Seats</span>
                      <span className="fr-info-value">{ride.seatsAvailable}</span>
                    </div>
                    <div className="fr-info-item">
                      <span className="fr-info-label">💰 Cost</span>
                      <span className="fr-info-value">₹{ride.costPerPerson}</span>
                    </div>
                  </div>

                  <div className="fr-divider" />

                  {/* Screenshot */}
                  {ride.cabScreenshotUrl && (
                    <button
                      className="fr-screenshot-btn"
                      onClick={() => window.open(ride.cabScreenshotUrl, '_blank')}
                    >
                      📷 View Cab Screenshot
                    </button>
                  )}

                  {/* Actions */}
                  <div className="fr-actions">
                    <button className="fr-btn fr-btn-accept" onClick={() => handleAccept(ride._id)}>
                      ✅ Accept Ride
                    </button>
                    <button className="fr-btn fr-btn-reject" onClick={() => handleReject(ride._id)}>
                      ✕ Reject
                    </button>
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

export default FindRidePage;
