import React, { useState, useEffect, useRef } from 'react';
import ImageUploader from '../components/imageUploader';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const PostRidePage = () => {
  const [form, setForm] = useState({
    from: '', to: '', date: '', driverArrivingIn: '',
    seatsAvailable: '', costPerPerson: '', cabScreenshotUrl: '',
  });
  const [error, setError] = useState('');
  const [screenshotUploaded, setScreenshotUploaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState('');
  const canvasRef = useRef(null);
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.from || !form.to) return setError('From and To fields are required');
    if (!form.date || new Date(form.date) < new Date().setHours(0, 0, 0, 0))
      return setError('Date must be today or in the future');
    if (!form.driverArrivingIn || Number(form.driverArrivingIn) <= 0)
      return setError('Please specify a valid driver arrival time in minutes');
    if (!form.seatsAvailable || Number(form.seatsAvailable) <= 0)
      return setError('Seats available must be positive');
    if (!form.costPerPerson || Number(form.costPerPerson) <= 0)
      return setError('Cost per person must be positive');

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${import.meta.env.VITE_API_URL}/rides`,
        { ...form, driverArrivingIn: Number(form.driverArrivingIn), seatsAvailable: Number(form.seatsAvailable), costPerPerson: Number(form.costPerPerson) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Ride posted successfully!');
      navigate('/my-rides');
    } catch (err) {
      setError(err.response?.data?.msg || 'Error posting ride');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const particles = Array.from({ length: 55 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.4, dx: (Math.random() - 0.5) * 0.35,
      dy: (Math.random() - 0.5) * 0.35, opacity: Math.random() * 0.45 + 0.08,
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

  const fields = [
    { name: 'from',             type: 'text',   label: 'From',                    placeholder: 'e.g. Sector 62',   icon: '📍' },
    { name: 'to',               type: 'text',   label: 'To',                      placeholder: 'e.g. Sector 128',  icon: '🏁' },
    { name: 'date',             type: 'date',   label: 'Date',                    placeholder: '',                 icon: '📅' },
    { name: 'driverArrivingIn', type: 'number', label: 'Driver Arriving In (min)', placeholder: 'e.g. 10',          icon: '⏱' },
    { name: 'seatsAvailable',   type: 'number', label: 'Seats Available',         placeholder: 'e.g. 3',           icon: '💺' },
    { name: 'costPerPerson',    type: 'number', label: 'Cab Price (₹)',            placeholder: 'e.g. 150',         icon: '₹'  },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .pr-root {
          font-family: 'DM Sans', sans-serif;
          min-height: 100vh;
          background: #080810;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          color: #fff;
          padding: 32px 16px;
        }

        canvas.pr-canvas { position: absolute; inset: 0; z-index: 0; pointer-events: none; }

        .pr-noise {
          position: absolute; inset: 0; z-index: 0; opacity: 0.03;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size: 200px;
        }

        .pr-glow-1 {
          position: absolute; width: 600px; height: 600px; border-radius: 50%;
          background: radial-gradient(circle, rgba(99,32,255,0.16) 0%, transparent 70%);
          top: -180px; left: -180px; z-index: 0;
          animation: floatA 8s ease-in-out infinite alternate;
        }
        .pr-glow-2 {
          position: absolute; width: 500px; height: 500px; border-radius: 50%;
          background: radial-gradient(circle, rgba(16,185,129,0.13) 0%, transparent 70%);
          bottom: -120px; right: -120px; z-index: 0;
          animation: floatB 10s ease-in-out infinite alternate;
        }
        .pr-glow-3 {
          position: absolute; width: 280px; height: 280px; border-radius: 50%;
          background: radial-gradient(circle, rgba(56,189,248,0.08) 0%, transparent 70%);
          top: 30%; left: 70%; z-index: 0;
          animation: floatA 13s ease-in-out infinite alternate-reverse;
        }

        @keyframes floatA {
          from { transform: translate(0,0) scale(1); }
          to   { transform: translate(40px,30px) scale(1.1); }
        }
        @keyframes floatB {
          from { transform: translate(0,0) scale(1); }
          to   { transform: translate(-30px,-40px) scale(1.08); }
        }

        .pr-card {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 580px;
          padding: 48px 44px;
          border-radius: 28px;
          background: linear-gradient(145deg, rgba(255,255,255,0.065) 0%, rgba(255,255,255,0.02) 100%);
          border: 1px solid rgba(255,255,255,0.1);
          box-shadow: 0 0 0 1px rgba(139,92,246,0.08), 0 40px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.07);
          backdrop-filter: blur(24px);
          animation: cardIn 0.75s cubic-bezier(0.16,1,0.3,1) both;
        }

        @keyframes cardIn {
          from { opacity: 0; transform: translateY(28px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        .pr-header {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 8px;
          animation: cardIn 0.75s 0.08s cubic-bezier(0.16,1,0.3,1) both;
        }

        .pr-icon-wrap {
          width: 50px; height: 50px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 15px;
          background: linear-gradient(135deg, rgba(16,185,129,0.22), rgba(5,150,105,0.12));
          border: 1px solid rgba(16,185,129,0.28);
          font-size: 22px;
          flex-shrink: 0;
        }

        .pr-title {
          font-family: 'Syne', sans-serif;
          font-size: clamp(24px, 4vw, 32px);
          font-weight: 800;
          letter-spacing: -0.03em;
          line-height: 1.1;
        }

        .pr-title-accent {
          background: linear-gradient(135deg, #34d399 0%, #10b981 60%, #6ee7b7 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .pr-subtitle {
          font-size: 13px;
          color: rgba(255,255,255,0.3);
          font-weight: 300;
          margin-bottom: 30px;
          padding-left: 64px;
          animation: cardIn 0.75s 0.12s cubic-bezier(0.16,1,0.3,1) both;
        }

        .pr-error {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.25);
          border-radius: 12px;
          padding: 10px 14px;
          font-size: 13px;
          color: #fca5a5;
          margin-bottom: 20px;
          animation: cardIn 0.3s cubic-bezier(0.16,1,0.3,1) both;
        }

        .pr-section-label {
          font-size: 11px;
          font-weight: 500;
          color: rgba(255,255,255,0.25);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 12px;
        }

        .pr-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          margin-bottom: 24px;
        }

        .pr-field { animation: cardIn 0.75s cubic-bezier(0.16,1,0.3,1) both; }
        .pr-field:nth-child(1) { animation-delay: 0.15s; }
        .pr-field:nth-child(2) { animation-delay: 0.18s; }
        .pr-field:nth-child(3) { animation-delay: 0.21s; }
        .pr-field:nth-child(4) { animation-delay: 0.24s; }
        .pr-field:nth-child(5) { animation-delay: 0.27s; }
        .pr-field:nth-child(6) { animation-delay: 0.30s; }

        .pr-label {
          display: block;
          font-size: 11px;
          font-weight: 500;
          color: rgba(255,255,255,0.35);
          letter-spacing: 0.07em;
          text-transform: uppercase;
          margin-bottom: 7px;
        }

        .pr-input-wrap { position: relative; }

        .pr-input-icon {
          position: absolute;
          left: 12px; top: 50%;
          transform: translateY(-50%);
          font-size: 13px;
          opacity: 0.3;
          pointer-events: none;
          transition: opacity 0.2s;
        }
        .pr-input-wrap.focused .pr-input-icon { opacity: 0.85; }

        .pr-input {
          width: 100%;
          padding: 12px 12px 12px 36px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          color: #fff;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
          -webkit-appearance: none;
        }
        .pr-input::placeholder { color: rgba(255,255,255,0.18); }
        .pr-input::-webkit-calendar-picker-indicator { filter: invert(0.6); cursor: pointer; }
        .pr-input:focus {
          border-color: rgba(16,185,129,0.5);
          background: rgba(16,185,129,0.05);
          box-shadow: 0 0 0 3px rgba(16,185,129,0.1);
        }

        .pr-upload-wrap {
          margin-bottom: 4px;
          animation: cardIn 0.75s 0.33s cubic-bezier(0.16,1,0.3,1) both;
        }

        .pr-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent);
          margin: 24px 0;
          animation: cardIn 0.75s 0.35s cubic-bezier(0.16,1,0.3,1) both;
        }

        .pr-btn {
          position: relative;
          width: 100%;
          padding: 15px;
          border: none;
          border-radius: 14px;
          background: linear-gradient(135deg, #059669 0%, #10b981 100%);
          color: #fff;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 4px 20px rgba(16,185,129,0.35), 0 0 0 1px rgba(16,185,129,0.2);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          overflow: hidden;
          animation: cardIn 0.75s 0.38s cubic-bezier(0.16,1,0.3,1) both;
        }
        .pr-btn::before {
          content: ''; position: absolute; inset: 0;
          background: rgba(255,255,255,0.08); opacity: 0; transition: opacity 0.2s;
        }
        .pr-btn:hover::before { opacity: 1; }
        .pr-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(16,185,129,0.5), 0 0 0 1px rgba(16,185,129,0.35);
        }
        .pr-btn:active { transform: translateY(0); }
        .pr-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

        .pr-btn-arrow { display: inline-block; transition: transform 0.2s; }
        .pr-btn:not(:disabled):hover .pr-btn-arrow { transform: translateX(3px); }

        .pr-spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 520px) {
          .pr-card { padding: 36px 22px; }
          .pr-grid { grid-template-columns: 1fr; }
          .pr-subtitle { padding-left: 0; }
        }
      `}</style>

      <div className="pr-root">
        <canvas ref={canvasRef} className="pr-canvas" />
        <div className="pr-noise" />
        <div className="pr-glow-1" />
        <div className="pr-glow-2" />
        <div className="pr-glow-3" />

        <form className="pr-card" onSubmit={handleSubmit} noValidate>

          <div className="pr-header">
            <div className="pr-icon-wrap">🚖</div>
            <h2 className="pr-title">
              Post a <span className="pr-title-accent">Ride</span>
            </h2>
          </div>
          <p className="pr-subtitle">Share your cab and split the cost with college mates</p>

          {error && (
            <div className="pr-error">
              <span>⚠</span> {error}
            </div>
          )}

          <p className="pr-section-label">Route Details</p>

          <div className="pr-grid">
            {fields.map((f) => (
              <div key={f.name} className="pr-field">
                <label className="pr-label" htmlFor={f.name}>{f.label}</label>
                <div className={`pr-input-wrap ${focused === f.name ? 'focused' : ''}`}>
                  <span className="pr-input-icon">{f.icon}</span>
                  <input
                    id={f.name}
                    name={f.name}
                    type={f.type}
                    placeholder={f.placeholder}
                    value={form[f.name]}
                    onChange={handleChange}
                    onFocus={() => setFocused(f.name)}
                    onBlur={() => setFocused('')}
                    className="pr-input"
                    min={f.type === 'number' ? 1 : undefined}
                  />
                </div>
              </div>
            ))}
          </div>

          <p className="pr-section-label">Cab Screenshot (optional)</p>
          <div className="pr-upload-wrap">
            <ImageUploader
              onUpload={(url) => { setForm({ ...form, cabScreenshotUrl: url }); setScreenshotUploaded(true); }}
              uploaded={screenshotUploaded}
            />
          </div>

          <div className="pr-divider" />

          <button type="submit" className="pr-btn" disabled={loading}>
            {loading ? (
              <><span className="pr-spinner" /> Posting Ride…</>
            ) : (
              <>Post Ride ✏️ <span className="pr-btn-arrow">→</span></>
            )}
          </button>
        </form>
      </div>
    </>
  );
};

export default PostRidePage;