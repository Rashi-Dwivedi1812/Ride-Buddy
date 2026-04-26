import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import { toast } from 'react-toastify';

const PassengerRidePage = () => {
  const { rideId } = useParams();
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [arrivalTimeLeft, setArrivalTimeLeft] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const socketRef = useRef(null);
  const userRef = useRef(null);
  const messagesEndRef = useRef(null);
  const shownMessagesRef = useRef(new Set());
  const notificationSoundRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const cachedRide = localStorage.getItem(`ride_${rideId}`);
    const cachedMessages = localStorage.getItem(`messages_${rideId}`);
    if (cachedRide) { setRide(JSON.parse(cachedRide)); setLoading(false); }
    if (cachedMessages) setMessages(JSON.parse(cachedMessages));
  }, [rideId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL.replace('/api', ''), {
      transports: ['websocket', 'polling'],
      reconnection: true, reconnectionAttempts: Infinity,
      reconnectionDelay: 1000, reconnectionDelayMax: 5000,
      timeout: 90000, autoConnect: true, forceNew: true,
      auth: { token: localStorage.getItem('token') },
    });
    socketRef.current = socket;

    const handleMessage = (msg) => {
      if (msg.rideId === rideId) {
        setMessages(prev => {
          const newMessages = [...prev, msg];
          localStorage.setItem(`messages_${rideId}`, JSON.stringify(newMessages));
          const uid = `${msg.senderId}_${msg.text}_${msg.createdAt || ''}`;
          if (msg.senderId !== userRef.current?._id && !shownMessagesRef.current.has(uid)) {
            shownMessagesRef.current.add(uid);
            notificationSoundRef.current?.play().catch(() => {});
            toast.info(`💬 ${msg.senderName}: ${msg.text.slice(0, 50)}${msg.text.length > 50 ? '...' : ''}`, {
              position: 'top-right', autoClose: 3000,
            });
          }
          return newMessages;
        });
      }
    };

    const handleRideUpdate = (updatedRide) => {
      if (updatedRide._id === rideId) {
        setRide(updatedRide);
        localStorage.setItem(`ride_${rideId}`, JSON.stringify(updatedRide));
      }
    };

    const fetchRideAndUser = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        const [rideRes, userRes, msgRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/rides/${rideId}`, { headers }),
          axios.get(`${import.meta.env.VITE_API_URL}/auth/me`, { headers }),
          axios.get(`${import.meta.env.VITE_API_URL}/messages/${rideId}`, { headers }),
        ]);
        setRide(rideRes.data);
        userRef.current = userRes.data;
        setMessages(msgRes.data);
        localStorage.setItem(`ride_${rideId}`, JSON.stringify(rideRes.data));
        localStorage.setItem('currentUser', JSON.stringify(userRes.data));
        localStorage.setItem(`messages_${rideId}`, JSON.stringify(msgRes.data));
        socket.emit('join_room', rideId);
        setLoading(false);
      } catch (err) {
        toast.error('Failed to load ride data. Retrying...');
      }
    };

    socket.on('connect', fetchRideAndUser);
    socket.on('chat_message', handleMessage);
    socket.on('ride_update', handleRideUpdate);
    socket.on('disconnect', () => toast.warn('Connection lost. Trying to reconnect...'));
    socket.on('connect_error', () => toast.error('Connection error. Retrying...'));
    fetchRideAndUser();

    return () => {
      ['connect','chat_message','ride_update','disconnect','connect_error'].forEach(e => socket.off(e));
      socket.disconnect();
    };
  }, [rideId]);

  useEffect(() => {
    if (!ride?.createdAt || !ride?.driverArrivingIn) return;
    const arrivalDeadline = new Date(ride.createdAt).getTime() + ride.driverArrivingIn * 60 * 1000;
    const update = () => setArrivalTimeLeft(Math.max(Math.floor((arrivalDeadline - Date.now()) / 1000), 0));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [ride]);

  // Particle canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    const pts = Array.from({ length: 55 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.4,
      dx: (Math.random() - 0.5) * 0.35, dy: (Math.random() - 0.5) * 0.35,
      o: Math.random() * 0.45 + 0.08,
    }));
    let animId;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pts.forEach(p => {
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(139,92,246,${p.o})`; ctx.fill();
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

  const sendMessage = () => {
    if (!newMessage.trim() || !ride || !userRef.current) return;
    const messageData = {
      rideId, senderId: userRef.current._id,
      receiverId: ride.driver?._id,
      senderName: userRef.current.name,
      text: newMessage.trim(), room: rideId,
    };
    socketRef.current?.emit('chat_message', messageData);
    setNewMessage('');
  };

  const formatTime = (seconds) => {
    if (seconds == null || isNaN(seconds)) return 'Calculating…';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }

    .pr-root { font-family: 'DM Sans', sans-serif; min-height: 100vh; background: #080810; display: flex; flex-direction: column; align-items: center; position: relative; overflow: hidden; color: #fff; padding: 52px 20px 80px; }
    canvas.pr-canvas { position: absolute; inset: 0; z-index: 0; pointer-events: none; }
    .pr-noise { position: absolute; inset: 0; z-index: 0; opacity: 0.03; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); background-size: 200px; }
    .pr-glow-1 { position: absolute; width: 600px; height: 600px; border-radius: 50%; background: radial-gradient(circle, rgba(99,32,255,0.15) 0%, transparent 70%); top: -200px; left: -200px; z-index: 0; animation: floatA 9s ease-in-out infinite alternate; }
    .pr-glow-2 { position: absolute; width: 500px; height: 500px; border-radius: 50%; background: radial-gradient(circle, rgba(236,72,153,0.11) 0%, transparent 70%); bottom: -140px; right: -140px; z-index: 0; animation: floatB 11s ease-in-out infinite alternate; }
    .pr-glow-3 { position: absolute; width: 300px; height: 300px; border-radius: 50%; background: radial-gradient(circle, rgba(56,189,248,0.08) 0%, transparent 70%); top: 35%; left: 70%; z-index: 0; animation: floatA 13s ease-in-out infinite alternate-reverse; }
    @keyframes floatA { from { transform: translate(0,0) scale(1); } to { transform: translate(40px,30px) scale(1.1); } }
    @keyframes floatB { from { transform: translate(0,0) scale(1); } to { transform: translate(-30px,-40px) scale(1.08); } }
    @keyframes fadeUp  { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes pulse   { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.7); } }
    @keyframes spin    { to { transform: rotate(360deg); } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }

    /* Header */
    .pr-header { position: relative; z-index: 10; display: flex; flex-direction: column; align-items: center; margin-bottom: 40px; animation: fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) both; }
    .pr-badge { display: inline-flex; align-items: center; gap: 6px; padding: 5px 14px; border-radius: 100px; background: rgba(139,92,246,0.12); border: 1px solid rgba(139,92,246,0.25); font-size: 12px; font-weight: 500; color: #a78bfa; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 16px; }
    .pr-dot { width: 6px; height: 6px; border-radius: 50%; background: #a78bfa; animation: pulse 2s infinite; }
    .pr-title { font-family: 'Syne', sans-serif; font-size: clamp(26px, 4vw, 38px); font-weight: 800; letter-spacing: -0.03em; text-align: center; }
    .pr-title-accent { background: linear-gradient(135deg, #818cf8 0%, #c084fc 50%, #f472b6 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }

    /* Content */
    .pr-content { position: relative; z-index: 10; width: 100%; max-width: 760px; display: flex; flex-direction: column; gap: 20px; }

    /* Card */
    .pr-card { position: relative; padding: 28px 30px; border-radius: 22px; background: linear-gradient(145deg, rgba(255,255,255,0.065) 0%, rgba(255,255,255,0.02) 100%); border: 1px solid rgba(255,255,255,0.09); box-shadow: 0 0 0 1px rgba(139,92,246,0.06), 0 16px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06); backdrop-filter: blur(20px); animation: fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) both; }
    .pr-card-bar { position: absolute; top: 0; left: 30px; right: 30px; height: 2px; border-radius: 0 0 4px 4px; background: linear-gradient(90deg, transparent, rgba(139,92,246,0.5), transparent); }

    /* Route */
    .pr-route-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 20px; }
    .pr-route-from { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 800; color: #c084fc; }
    .pr-route-to   { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 800; color: #818cf8; }
    .pr-route-arrow { color: rgba(255,255,255,0.22); font-size: 18px; }

    /* Info grid */
    .pr-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 18px; }
    .pr-info-item { display: flex; flex-direction: column; gap: 4px; padding: 13px 15px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; }
    .pr-info-label { font-size: 10px; font-weight: 500; color: rgba(255,255,255,0.3); letter-spacing: 0.07em; text-transform: uppercase; }
    .pr-info-value { font-size: 14px; font-weight: 500; color: rgba(255,255,255,0.85); }

    /* Countdown */
    .pr-countdown { display: flex; align-items: center; gap: 10px; padding: 11px 16px; border-radius: 12px; background: rgba(139,92,246,0.07); border: 1px solid rgba(139,92,246,0.15); margin-bottom: 20px; }
    .pr-countdown-label { font-size: 12px; color: rgba(255,255,255,0.38); }
    .pr-countdown-val { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; color: #a78bfa; margin-left: auto; }

    /* Divider */
    .pr-divider { height: 1px; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent); margin: 18px 0; }

    /* Footer actions */
    .pr-actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .pr-screenshot-link { display: inline-flex; align-items: center; gap: 6px; padding: 9px 18px; border-radius: 11px; cursor: pointer; background: rgba(139,92,246,0.12); border: 1px solid rgba(139,92,246,0.22); color: #a78bfa; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; text-decoration: none; transition: background 0.2s, transform 0.2s; }
    .pr-screenshot-link:hover { background: rgba(139,92,246,0.24); transform: translateY(-1px); }

    .pr-chat-toggle { display: inline-flex; align-items: center; gap: 7px; padding: 9px 20px; border-radius: 12px; border: none; cursor: pointer; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500; transition: transform 0.2s, box-shadow 0.2s; box-shadow: 0 4px 16px rgba(99,102,241,0.3); }
    .pr-chat-toggle:hover { transform: translateY(-2px); box-shadow: 0 6px 22px rgba(99,102,241,0.45); }
    .pr-chat-toggle.open { background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.25); color: #f87171; box-shadow: none; }
    .pr-chat-toggle.open:hover { background: rgba(239,68,68,0.25); transform: translateY(-1px); }

    /* Status chip */
    .pr-status-chip { display: inline-flex; align-items: center; gap: 6px; padding: 5px 13px; border-radius: 100px; background: rgba(52,211,153,0.1); border: 1px solid rgba(52,211,153,0.22); font-size: 12px; font-weight: 500; color: #34d399; letter-spacing: 0.04em; }
    .pr-status-dot { width: 5px; height: 5px; border-radius: 50%; background: #34d399; animation: pulse 1.8s infinite; }

    /* Chat panel */
    .pr-chat-panel { position: fixed; bottom: 20px; right: 20px; width: 360px; max-width: calc(100vw - 32px); border-radius: 20px; background: linear-gradient(145deg, rgba(18,18,30,0.98), rgba(12,12,24,0.98)); border: 1px solid rgba(139,92,246,0.3); box-shadow: 0 24px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(139,92,246,0.15), 0 0 30px rgba(139,92,246,0.08); backdrop-filter: blur(24px); z-index: 50; animation: slideUp 0.3s cubic-bezier(0.16,1,0.3,1) both; overflow: hidden; }

    .pr-chat-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; border-bottom: 1px solid rgba(255,255,255,0.07); background: rgba(139,92,246,0.06); }
    .pr-chat-header-left { display: flex; align-items: center; gap: 10px; }
    .pr-chat-avatar { width: 32px; height: 32px; border-radius: 9px; background: linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.15)); border: 1px solid rgba(139,92,246,0.25); display: flex; align-items: center; justify-content: center; font-size: 14px; }
    .pr-chat-name { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; color: #fff; }
    .pr-chat-subtitle { font-size: 11px; color: rgba(255,255,255,0.35); }

    .pr-chat-close { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border-radius: 8px; border: none; cursor: pointer; background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.5); font-size: 14px; transition: background 0.2s, color 0.2s; }
    .pr-chat-close:hover { background: rgba(239,68,68,0.15); color: #f87171; }

    .pr-chat-messages { height: 180px; overflow-y: auto; padding: 14px 16px; display: flex; flex-direction: column; gap: 8px; }
    .pr-chat-messages::-webkit-scrollbar { width: 4px; }
    .pr-chat-messages::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.3); border-radius: 4px; }

    .pr-chat-empty { font-size: 12px; color: rgba(255,255,255,0.25); font-style: italic; margin: auto; }

    .pr-msg { display: flex; flex-direction: column; max-width: 85%; gap: 2px; }
    .pr-msg.mine   { align-self: flex-end; }
    .pr-msg.theirs { align-self: flex-start; }
    .pr-msg-name { font-size: 10px; color: rgba(255,255,255,0.35); padding: 0 4px; }
    .pr-msg-bubble { padding: 8px 12px; border-radius: 12px; font-size: 13px; line-height: 1.45; word-break: break-word; }
    .pr-msg.mine   .pr-msg-bubble { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; border-bottom-right-radius: 4px; }
    .pr-msg.theirs .pr-msg-bubble { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.85); border-bottom-left-radius: 4px; border: 1px solid rgba(255,255,255,0.08); }

    .pr-chat-input-row { display: flex; gap: 8px; padding: 12px 14px; border-top: 1px solid rgba(255,255,255,0.07); }
    .pr-chat-input { flex: 1; padding: 10px 14px; border-radius: 11px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.04); color: #fff; font-family: 'DM Sans', sans-serif; font-size: 13px; outline: none; transition: border-color 0.2s, box-shadow 0.2s; }
    .pr-chat-input::placeholder { color: rgba(255,255,255,0.2); }
    .pr-chat-input:focus { border-color: rgba(139,92,246,0.5); box-shadow: 0 0 0 3px rgba(139,92,246,0.1); }
    .pr-send-btn { padding: 10px 16px; border-radius: 11px; border: none; cursor: pointer; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; transition: transform 0.2s, box-shadow 0.2s; box-shadow: 0 3px 12px rgba(99,102,241,0.3); white-space: nowrap; }
    .pr-send-btn:hover { transform: translateY(-1px); box-shadow: 0 5px 16px rgba(99,102,241,0.45); }

    /* Loading / error */
    .pr-loading { position: relative; z-index: 10; display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 80px 0; }
    .pr-spinner { width: 44px; height: 44px; border: 3px solid rgba(139,92,246,0.2); border-top-color: #a78bfa; border-radius: 50%; animation: spin 0.8s linear infinite; }
    .pr-loading-text { font-size: 14px; color: rgba(255,255,255,0.3); }

    .pr-error-wrap { position: relative; z-index: 10; display: flex; flex-direction: column; align-items: center; gap: 14px; }
    .pr-error-emoji { font-size: 52px; }
    .pr-error-title { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; color: #f87171; }
    .pr-error-sub { font-size: 14px; color: rgba(255,255,255,0.35); }
    .pr-back-btn { padding: 12px 24px; border-radius: 13px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500; text-decoration: none; transition: transform 0.2s; display: inline-block; }
    .pr-back-btn:hover { transform: translateY(-2px); }

    @media (max-width: 560px) {
      .pr-grid { grid-template-columns: 1fr 1fr; }
      .pr-card { padding: 22px 18px; }
      .pr-chat-panel { width: calc(100vw - 24px); right: 12px; bottom: 12px; }
    }
  `;

  // ── Error / not found ──
  if (!loading && (ride === 'not_found' || ride === 'expired' || ride === null)) {
    return (
      <>
        <style>{css}</style>
        <div className="pr-root">
          <canvas ref={canvasRef} className="pr-canvas" />
          <div className="pr-noise" /><div className="pr-glow-1" /><div className="pr-glow-2" /><div className="pr-glow-3" />
          <div className="pr-error-wrap">
            <span className="pr-error-emoji">🚫</span>
            <p className="pr-error-title">{ride === 'expired' ? 'This ride has ended.' : 'Ride not found.'}</p>
            <p className="pr-error-sub">This ride may have been completed or removed.</p>
            <Link to="/find" className="pr-back-btn">← Back to Available Rides</Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{css}</style>
      <div className="pr-root">
        <canvas ref={canvasRef} className="pr-canvas" />
        <div className="pr-noise" /><div className="pr-glow-1" /><div className="pr-glow-2" /><div className="pr-glow-3" />
        <audio ref={notificationSoundRef} src="/preview.mp3" preload="auto" />

        {/* Page Header */}
        <div className="pr-header">
          <div className="pr-badge"><span className="pr-dot" />Ride in Progress</div>
          <h2 className="pr-title">Your <span className="pr-title-accent">Ride</span> 🚖</h2>
        </div>

        {loading ? (
          <div className="pr-loading">
            <div className="pr-spinner" />
            <p className="pr-loading-text">Loading ride details…</p>
          </div>
        ) : ride && (
          <div className="pr-content">

            {/* Ride Info Card */}
            <div className="pr-card" style={{ animationDelay: '0s' }}>
              <div className="pr-card-bar" />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
                <div className="pr-route-row" style={{ margin: 0 }}>
                  <span className="pr-route-from">{ride.from}</span>
                  <span className="pr-route-arrow">→</span>
                  <span className="pr-route-to">{ride.to}</span>
                </div>
                <div className="pr-status-chip">
                  <span className="pr-status-dot" />
                  Active
                </div>
              </div>

              <div className="pr-grid">
                <div className="pr-info-item">
                  <span className="pr-info-label">👤 Owner</span>
                  <span className="pr-info-value">{ride.driver?.name || 'Unknown'}</span>
                </div>
                <div className="pr-info-item">
                  <span className="pr-info-label">📅 Date</span>
                  <span className="pr-info-value">{new Date(ride.date).toLocaleDateString()}</span>
                </div>
                <div className="pr-info-item">
                  <span className="pr-info-label">💰 Cost</span>
                  <span className="pr-info-value">₹{ride.costPerPerson}</span>
                </div>
              </div>

              <div className="pr-countdown">
                <span className="pr-countdown-label">⏱ Driver arrives in</span>
                <span className="pr-countdown-val">{formatTime(arrivalTimeLeft)}</span>
              </div>

              <div className="pr-divider" />

              <div className="pr-actions">
                {ride.cabScreenshotUrl && (
                  <a href={ride.cabScreenshotUrl} target="_blank" rel="noopener noreferrer" className="pr-screenshot-link">
                    📸 View Screenshot
                  </a>
                )}
                <button
                  className={`pr-chat-toggle ${chatOpen ? 'open' : ''}`}
                  onClick={() => setChatOpen(p => !p)}
                >
                  {chatOpen ? '✕ Close Chat' : '💬 Chat with Driver'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Floating Chat Panel */}
        {chatOpen && ride && (
          <div className="pr-chat-panel">
            <div className="pr-chat-header">
              <div className="pr-chat-header-left">
                <div className="pr-chat-avatar">💬</div>
                <div>
                  <p className="pr-chat-name">{ride.driver?.name || 'Driver'}</p>
                  <p className="pr-chat-subtitle">Ride Owner</p>
                </div>
              </div>
              <button className="pr-chat-close" onClick={() => setChatOpen(false)}>✕</button>
            </div>

            <div className="pr-chat-messages">
              {messages.length === 0 ? (
                <span className="pr-chat-empty">No messages yet. Say hello! 👋</span>
              ) : (
                messages.map((msg, idx) => {
                  const isMine = msg.senderId === userRef.current?._id;
                  return (
                    <div key={idx} className={`pr-msg ${isMine ? 'mine' : 'theirs'}`}>
                      {!isMine && <span className="pr-msg-name">{msg.senderName}</span>}
                      <div className="pr-msg-bubble">{msg.text}</div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="pr-chat-input-row">
              <input
                type="text"
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder="Type a message…"
                className="pr-chat-input"
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
              />
              <button className="pr-send-btn" onClick={sendMessage}>Send →</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default PassengerRidePage;
