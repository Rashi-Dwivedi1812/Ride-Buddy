import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const CurrentRidePage = () => {
  const { rideId } = useParams();
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [arrivalTimeLeft, setArrivalTimeLeft] = useState(null);
  const [selectedPassenger, setSelectedPassenger] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [isRideOwner, setIsRideOwner] = useState(false);
  const socketRef = useRef(null);
  const selectedPassengerRef = useRef(null);
  const currentUserRef = useRef(null);
  const shownMessagesRef = useRef(new Set());
  const notificationSoundRef = useRef(null);
  const messagesEndRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const cachedRide = localStorage.getItem(`ride_${rideId}`);
    const cachedMessages = localStorage.getItem(`messages_${rideId}`);
    const cachedUser = localStorage.getItem('currentUser');
    if (cachedRide) {
      const parsedRide = JSON.parse(cachedRide);
      setRide(parsedRide);
      if (cachedUser) {
        const parsedUser = JSON.parse(cachedUser);
        setCurrentUser(parsedUser);
        setIsRideOwner(parsedRide.creator?._id === parsedUser._id);
      }
      setLoading(false);
    }
    if (cachedMessages) setChatMessages(JSON.parse(cachedMessages));
  }, [rideId]);

  const parseToken = () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;
      return JSON.parse(atob(token.split('.')[1]));
    } catch (err) { return null; }
  };

  const fetchRide = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/rides/${rideId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRide(res.data);
      localStorage.setItem(`ride_${rideId}`, JSON.stringify(res.data));
      if (res.data.creator?._id === currentUser?._id) setIsRideOwner(true);
      if (res.data.createdAt && res.data.driverArrivingIn) {
        const createdAt = new Date(res.data.createdAt).getTime();
        const elapsed = Math.floor((Date.now() - createdAt) / 1000);
        setArrivalTimeLeft(Math.max(res.data.driverArrivingIn * 60 - elapsed, 0));
      }
    } catch (err) {
      toast.error('Failed to load ride data. Retrying...');
      if (err.response?.status === 404) setRide(null);
    } finally { setLoading(false); }
  };

  const fetchMessages = async (receiverId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/messages/${rideId}?receiverId=${receiverId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setChatMessages(res.data);
      localStorage.setItem(`messages_${rideId}`, JSON.stringify(res.data));
    } catch (err) { console.error('Failed to fetch messages:', err); }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    const user = parseToken();
    setCurrentUser(user);
    const socket = io(import.meta.env.VITE_API_URL.replace('/api', ''), {
      transports: ['websocket', 'polling'],
      reconnection: true, reconnectionAttempts: Infinity,
      reconnectionDelay: 1000, reconnectionDelayMax: 5000,
      timeout: 120000, autoConnect: true, forceNew: true,
      auth: { token: localStorage.getItem('token') },
    });
    socketRef.current = socket;
    socket.on('connect', () => { socket.emit('join_room', rideId); fetchRide(); });
    socket.on('reconnect', () => { socket.emit('join_room', rideId); fetchRide(); });
    socket.on('disconnect', (reason) => { if (reason === 'io server disconnect') socket.connect(); });
    socket.on('connect_error', () => setTimeout(() => socket.connect(), 1000));
    socket.on('chat_message', (msg) => {
      const currentUserId = currentUserRef.current?._id?.toString();
      const senderId = msg?.senderId?.toString();
      const receiverId = msg?.receiverId?.toString();
      const passengerId = selectedPassengerRef.current?._id?.toString();
      const isRelevant = (senderId === currentUserId || receiverId === currentUserId) &&
        (senderId === passengerId || receiverId === passengerId);
      const isOther = senderId !== currentUserId;
      if (isRelevant) setChatMessages(prev => [...prev, msg]);
      const uid = `${msg.senderId}_${msg.text}_${msg.createdAt || ''}`;
      if (isRelevant && isOther && !shownMessagesRef.current.has(uid)) {
        shownMessagesRef.current.add(uid);
        notificationSoundRef.current?.play().catch(() => {});
        toast.info(`💬 ${msg.senderName}: ${msg.text.slice(0, 50)}${msg.text.length > 50 ? '...' : ''}`, {
          position: 'top-right', autoClose: 3000,
        });
      }
    });
    socket.on('passenger_updated', fetchRide);
    fetchRide();
    return () => {
      ['connect','reconnect','disconnect','connect_error','chat_message','passenger_updated'].forEach(e => socket.off(e));
      socket.disconnect();
    };
  }, [rideId]);

  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);
  useEffect(() => {
    selectedPassengerRef.current = selectedPassenger;
    if (selectedPassenger) fetchMessages(selectedPassenger._id);
  }, [selectedPassenger]);

  useEffect(() => {
    const interval = setInterval(() => setArrivalTimeLeft(p => p > 0 ? p - 1 : 0), 1000);
    return () => clearInterval(interval);
  }, []);

  // Particle canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    const particles = Array.from({ length: 55 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.4,
      dx: (Math.random() - 0.5) * 0.35, dy: (Math.random() - 0.5) * 0.35,
      opacity: Math.random() * 0.45 + 0.08,
    }));
    let animId;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(139,92,246,${p.opacity})`; ctx.fill();
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

  const handleSendMessage = () => {
    if (!newMessage.trim() || !currentUser || !selectedPassenger) return;
    const messageData = {
      rideId, senderName: currentUser.name,
      senderId: ride.driver?._id, receiverId: selectedPassenger._id,
      text: newMessage.trim(), room: rideId,
    };
    socketRef.current?.emit('chat_message', messageData);
    setChatMessages(prev => [...prev, messageData]);
    setNewMessage('');
  };

  const formatTime = (seconds) => {
    if (!seconds && seconds !== 0) return '—';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  const chatTargets = ride
    ? isRideOwner
      ? ride.bookedBy?.filter(p => p._id !== currentUser?._id) || []
      : [ride.driver]
    : [];

  // ── Not found ──
  if (ride === null && !loading) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap');
          * { box-sizing: border-box; margin: 0; padding: 0; }
          .cr-404 { font-family: 'DM Sans', sans-serif; min-height: 100vh; background: #080810; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 20px; color: #fff; }
          .cr-404-emoji { font-size: 56px; }
          .cr-404-title { font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 800; color: #f87171; }
          .cr-404-sub { font-size: 14px; color: rgba(255,255,255,0.35); }
          .cr-404-btn { padding: 12px 24px; border-radius: 13px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500; text-decoration: none; transition: transform 0.2s; }
          .cr-404-btn:hover { transform: translateY(-2px); }
        `}</style>
        <div className="cr-404">
          <span className="cr-404-emoji">🚫</span>
          <p className="cr-404-title">Ride not found or has ended</p>
          <p className="cr-404-sub">This ride may have been completed or removed.</p>
          <a href="/my-rides" className="cr-404-btn">← Back to My Rides</a>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .cr-root {
          font-family: 'DM Sans', sans-serif;
          min-height: 100vh; background: #080810;
          display: flex; flex-direction: column; align-items: center;
          position: relative; overflow: hidden; color: #fff;
          padding: 52px 20px 80px;
        }

        canvas.cr-canvas { position: absolute; inset: 0; z-index: 0; pointer-events: none; }
        .cr-noise { position: absolute; inset: 0; z-index: 0; opacity: 0.03; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); background-size: 200px; }
        .cr-glow-1 { position: absolute; width: 600px; height: 600px; border-radius: 50%; background: radial-gradient(circle, rgba(99,32,255,0.15) 0%, transparent 70%); top: -200px; left: -200px; z-index: 0; animation: floatA 9s ease-in-out infinite alternate; }
        .cr-glow-2 { position: absolute; width: 500px; height: 500px; border-radius: 50%; background: radial-gradient(circle, rgba(236,72,153,0.11) 0%, transparent 70%); bottom: -140px; right: -140px; z-index: 0; animation: floatB 11s ease-in-out infinite alternate; }
        .cr-glow-3 { position: absolute; width: 300px; height: 300px; border-radius: 50%; background: radial-gradient(circle, rgba(56,189,248,0.08) 0%, transparent 70%); top: 35%; left: 70%; z-index: 0; animation: floatA 13s ease-in-out infinite alternate-reverse; }

        @keyframes floatA { from { transform: translate(0,0) scale(1); } to { transform: translate(40px,30px) scale(1.1); } }
        @keyframes floatB { from { transform: translate(0,0) scale(1); } to { transform: translate(-30px,-40px) scale(1.08); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.7); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }

        /* ── Header ── */
        .cr-header { position: relative; z-index: 10; display: flex; flex-direction: column; align-items: center; margin-bottom: 40px; animation: fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) both; }
        .cr-badge { display: inline-flex; align-items: center; gap: 6px; padding: 5px 14px; border-radius: 100px; background: rgba(139,92,246,0.12); border: 1px solid rgba(139,92,246,0.25); font-size: 12px; font-weight: 500; color: #a78bfa; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 16px; }
        .cr-dot { width: 6px; height: 6px; border-radius: 50%; background: #a78bfa; animation: pulse 2s infinite; }
        .cr-title { font-family: 'Syne', sans-serif; font-size: clamp(26px, 4vw, 38px); font-weight: 800; letter-spacing: -0.03em; text-align: center; }
        .cr-title-accent { background: linear-gradient(135deg, #818cf8 0%, #c084fc 50%, #f472b6 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }

        /* ── Content wrapper ── */
        .cr-content { position: relative; z-index: 10; width: 100%; max-width: 780px; display: flex; flex-direction: column; gap: 20px; }

        /* ── Section card ── */
        .cr-card { position: relative; padding: 28px 30px; border-radius: 22px; background: linear-gradient(145deg, rgba(255,255,255,0.065) 0%, rgba(255,255,255,0.02) 100%); border: 1px solid rgba(255,255,255,0.09); box-shadow: 0 0 0 1px rgba(139,92,246,0.06), 0 16px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06); backdrop-filter: blur(20px); animation: fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) both; }
        .cr-card-bar { position: absolute; top: 0; left: 30px; right: 30px; height: 2px; border-radius: 0 0 4px 4px; background: linear-gradient(90deg, transparent, rgba(139,92,246,0.5), transparent); }

        /* ── Section heading ── */
        .cr-section-title { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; color: rgba(255,255,255,0.85); margin-bottom: 20px; display: flex; align-items: center; gap: 8px; }

        /* ── Ride info ── */
        .cr-route-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 20px; }
        .cr-route-from { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 800; color: #c084fc; }
        .cr-route-to   { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 800; color: #818cf8; }
        .cr-route-arrow { color: rgba(255,255,255,0.22); font-size: 18px; }

        .cr-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
        .cr-info-item { display: flex; flex-direction: column; gap: 4px; padding: 13px 15px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; }
        .cr-info-label { font-size: 10px; font-weight: 500; color: rgba(255,255,255,0.3); letter-spacing: 0.07em; text-transform: uppercase; }
        .cr-info-value { font-size: 14px; font-weight: 500; color: rgba(255,255,255,0.85); }

        /* countdown chip */
        .cr-countdown { display: inline-flex; align-items: center; gap: 8px; padding: 10px 16px; border-radius: 12px; background: rgba(139,92,246,0.08); border: 1px solid rgba(139,92,246,0.18); margin-bottom: 18px; }
        .cr-countdown-label { font-size: 12px; color: rgba(255,255,255,0.38); }
        .cr-countdown-val { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; color: #a78bfa; margin-left: auto; }

        /* screenshot */
        .cr-screenshot-btn { display: inline-flex; align-items: center; gap: 6px; padding: 9px 18px; border-radius: 11px; cursor: pointer; background: rgba(139,92,246,0.12); border: 1px solid rgba(139,92,246,0.22); color: #a78bfa; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; text-decoration: none; transition: background 0.2s, transform 0.2s; }
        .cr-screenshot-btn:hover { background: rgba(139,92,246,0.24); transform: translateY(-1px); }

        /* ── Passengers list ── */
        .cr-passenger-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-radius: 13px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); margin-bottom: 10px; transition: border-color 0.2s; }
        .cr-passenger-row:hover { border-color: rgba(139,92,246,0.25); }
        .cr-passenger-left { display: flex; align-items: center; gap: 10px; }
        .cr-passenger-avatar { width: 34px; height: 34px; border-radius: 10px; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.12)); border: 1px solid rgba(139,92,246,0.2); font-size: 15px; flex-shrink: 0; }
        .cr-passenger-name { font-size: 14px; font-weight: 500; color: rgba(255,255,255,0.8); }

        .cr-chat-btn { display: inline-flex; align-items: center; gap: 5px; padding: 7px 14px; border-radius: 10px; border: none; cursor: pointer; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; transition: transform 0.2s, box-shadow 0.2s; box-shadow: 0 3px 12px rgba(99,102,241,0.3); }
        .cr-chat-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(99,102,241,0.45); }

        .cr-empty-passengers { font-size: 13px; color: rgba(255,255,255,0.3); font-style: italic; }

        /* ── Chat panel ── */
        .cr-chat-panel {
          position: fixed; bottom: 20px; right: 20px;
          width: 360px; max-width: calc(100vw - 32px);
          border-radius: 20px;
          background: linear-gradient(145deg, rgba(18,18,30,0.98), rgba(12,12,24,0.98));
          border: 1px solid rgba(139,92,246,0.3);
          box-shadow: 0 24px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(139,92,246,0.15), 0 0 30px rgba(139,92,246,0.08);
          backdrop-filter: blur(24px);
          z-index: 50;
          animation: slideUp 0.3s cubic-bezier(0.16,1,0.3,1) both;
          overflow: hidden;
        }

        .cr-chat-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 18px;
          border-bottom: 1px solid rgba(255,255,255,0.07);
          background: rgba(139,92,246,0.06);
        }
        .cr-chat-header-left { display: flex; align-items: center; gap: 10px; }
        .cr-chat-avatar { width: 32px; height: 32px; border-radius: 9px; background: linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.15)); border: 1px solid rgba(139,92,246,0.25); display: flex; align-items: center; justify-content: center; font-size: 14px; }
        .cr-chat-name { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; color: #fff; }
        .cr-chat-subtitle { font-size: 11px; color: rgba(255,255,255,0.35); }

        .cr-chat-header-right { display: flex; align-items: center; gap: 6px; }
        .cr-chat-icon-btn { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border-radius: 8px; border: none; cursor: pointer; background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.5); font-size: 14px; transition: background 0.2s, color 0.2s; }
        .cr-chat-icon-btn:hover { background: rgba(255,255,255,0.12); color: #fff; }
        .cr-chat-icon-btn.close:hover { background: rgba(239,68,68,0.15); color: #f87171; }

        .cr-chat-messages { height: 180px; overflow-y: auto; padding: 14px 16px; display: flex; flex-direction: column; gap: 8px; }
        .cr-chat-messages::-webkit-scrollbar { width: 4px; }
        .cr-chat-messages::-webkit-scrollbar-track { background: transparent; }
        .cr-chat-messages::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.3); border-radius: 4px; }

        .cr-chat-empty { font-size: 12px; color: rgba(255,255,255,0.25); font-style: italic; margin: auto; }

        .cr-msg { display: flex; flex-direction: column; max-width: 85%; gap: 2px; }
        .cr-msg.mine { align-self: flex-end; }
        .cr-msg.theirs { align-self: flex-start; }
        .cr-msg-name { font-size: 10px; color: rgba(255,255,255,0.35); padding: 0 4px; }
        .cr-msg-bubble { padding: 8px 12px; border-radius: 12px; font-size: 13px; line-height: 1.45; word-break: break-word; }
        .cr-msg.mine .cr-msg-bubble { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; border-bottom-right-radius: 4px; }
        .cr-msg.theirs .cr-msg-bubble { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.85); border-bottom-left-radius: 4px; border: 1px solid rgba(255,255,255,0.08); }

        .cr-chat-input-row { display: flex; gap: 8px; padding: 12px 14px; border-top: 1px solid rgba(255,255,255,0.07); }
        .cr-chat-input { flex: 1; padding: 10px 14px; border-radius: 11px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.04); color: #fff; font-family: 'DM Sans', sans-serif; font-size: 13px; outline: none; transition: border-color 0.2s, box-shadow 0.2s; }
        .cr-chat-input::placeholder { color: rgba(255,255,255,0.2); }
        .cr-chat-input:focus { border-color: rgba(139,92,246,0.5); box-shadow: 0 0 0 3px rgba(139,92,246,0.1); }

        .cr-send-btn { padding: 10px 16px; border-radius: 11px; border: none; cursor: pointer; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; transition: transform 0.2s, box-shadow 0.2s; box-shadow: 0 3px 12px rgba(99,102,241,0.3); white-space: nowrap; }
        .cr-send-btn:hover { transform: translateY(-1px); box-shadow: 0 5px 16px rgba(99,102,241,0.45); }

        /* ── Loading ── */
        .cr-loading { position: relative; z-index: 10; display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 80px 0; }
        .cr-spinner { width: 44px; height: 44px; border: 3px solid rgba(139,92,246,0.2); border-top-color: #a78bfa; border-radius: 50%; animation: spin 0.8s linear infinite; }
        .cr-loading-text { font-size: 14px; color: rgba(255,255,255,0.3); }

        .cr-divider { height: 1px; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent); margin: 18px 0; }

        @media (max-width: 560px) {
          .cr-grid { grid-template-columns: 1fr 1fr; }
          .cr-card { padding: 22px 18px; }
          .cr-chat-panel { width: calc(100vw - 24px); right: 12px; bottom: 12px; }
        }
      `}</style>

      <div className="cr-root">
        <canvas ref={canvasRef} className="cr-canvas" />
        <div className="cr-noise" />
        <div className="cr-glow-1" />
        <div className="cr-glow-2" />
        <div className="cr-glow-3" />

        <ToastContainer
          position="top-right"
          toastStyle={{
            background: 'rgba(20,20,35,0.95)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#fff',
            backdropFilter: 'blur(16px)',
            borderRadius: '14px',
          }}
        />
        <audio ref={notificationSoundRef} src="/preview.mp3" preload="auto" />

        {/* Page Header */}
        <div className="cr-header">
          <div className="cr-badge"><span className="cr-dot" />Live Ride</div>
          <h2 className="cr-title">Current <span className="cr-title-accent">Ride</span> 🚖</h2>
        </div>

        {loading && !ride ? (
          <div className="cr-loading">
            <div className="cr-spinner" />
            <p className="cr-loading-text">Loading ride details…</p>
          </div>
        ) : ride && (
          <div className="cr-content">

            {/* ── Ride Info Card ── */}
            <div className="cr-card" style={{ animationDelay: '0s' }}>
              <div className="cr-card-bar" />

              <div className="cr-route-row">
                <span className="cr-route-from">{ride.from}</span>
                <span className="cr-route-arrow">→</span>
                <span className="cr-route-to">{ride.to}</span>
              </div>

              <div className="cr-grid">
                <div className="cr-info-item">
                  <span className="cr-info-label">👤 Owner</span>
                  <span className="cr-info-value">{ride.driver?.name || 'Unknown'}</span>
                </div>
                <div className="cr-info-item">
                  <span className="cr-info-label">📅 Date</span>
                  <span className="cr-info-value">{new Date(ride.date).toLocaleDateString()}</span>
                </div>
                <div className="cr-info-item">
                  <span className="cr-info-label">💰 Cost</span>
                  <span className="cr-info-value">₹{ride.costPerPerson}</span>
                </div>
              </div>

              <div className="cr-countdown">
                <span className="cr-countdown-label">⏱ Driver arrives in</span>
                <span className="cr-countdown-val">{formatTime(arrivalTimeLeft || 0)}</span>
              </div>

              {ride.cabScreenshotUrl && (
                <a href={ride.cabScreenshotUrl} target="_blank" rel="noopener noreferrer" className="cr-screenshot-btn">
                  📸 View Cab Screenshot
                </a>
              )}
            </div>

            {/* ── Passengers / Chat targets Card ── */}
            <div className="cr-card" style={{ animationDelay: '0.1s' }}>
              <div className="cr-card-bar" />
              <p className="cr-section-title">
                {isRideOwner ? '🧍 Passengers' : '💬 Chat with Ride Owner'}
              </p>

              {chatTargets.length > 0 ? (
                chatTargets.map(user => (
                  <div key={user._id} className="cr-passenger-row">
                    <div className="cr-passenger-left">
                      <div className="cr-passenger-avatar">👤</div>
                      <span className="cr-passenger-name">{user.name}</span>
                    </div>
                    <button className="cr-chat-btn" onClick={() => setSelectedPassenger(user)}>
                      💬 Chat
                    </button>
                  </div>
                ))
              ) : (
                <p className="cr-empty-passengers">
                  {isRideOwner ? 'No passengers yet.' : 'Waiting for ride owner…'}
                </p>
              )}

              <div className="cr-divider" />
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)', fontStyle: 'italic' }}>
                Tip: press ⟳ in the chat window to refresh messages manually.
              </p>
            </div>
          </div>
        )}

        {/* ── Floating Chat Panel ── */}
        {selectedPassenger && (
          <div className="cr-chat-panel">
            <div className="cr-chat-header">
              <div className="cr-chat-header-left">
                <div className="cr-chat-avatar">💬</div>
                <div>
                  <p className="cr-chat-name">{selectedPassenger.name}</p>
                  <p className="cr-chat-subtitle">Active conversation</p>
                </div>
              </div>
              <div className="cr-chat-header-right">
                <button
                  className="cr-chat-icon-btn"
                  title="Refresh messages"
                  onClick={() => fetchMessages(selectedPassenger._id)}
                >⟳</button>
                <button
                  className="cr-chat-icon-btn close"
                  title="Close chat"
                  onClick={() => setSelectedPassenger(null)}
                >✕</button>
              </div>
            </div>

            <div className="cr-chat-messages">
              {chatMessages.length === 0 ? (
                <span className="cr-chat-empty">No messages yet. Say hello! 👋</span>
              ) : (
                chatMessages.map((msg, idx) => {
                  const isMine = msg.senderId?.toString() === currentUser?._id?.toString();
                  return (
                    <div key={idx} className={`cr-msg ${isMine ? 'mine' : 'theirs'}`}>
                      {!isMine && <span className="cr-msg-name">{msg.senderName}</span>}
                      <div className="cr-msg-bubble">{msg.text}</div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="cr-chat-input-row">
              <input
                type="text"
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder="Type a message…"
                className="cr-chat-input"
                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
              />
              <button className="cr-send-btn" onClick={handleSendMessage}>Send →</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CurrentRidePage;
