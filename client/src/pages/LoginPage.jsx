import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState('');
  const canvasRef = useRef(null);
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/auth/login`, form);
      localStorage.setItem('token', res.data.token);
      navigate('/home');
    } catch (err) {
      setError(err.response?.data?.msg || 'Login failed');
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
        p.x += p.dx;
        p.y += p.dy;
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

        .lg-root {
          font-family: 'DM Sans', sans-serif;
          min-height: 100vh;
          background: #080810;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          color: #fff;
          padding: 24px 16px;
        }

        canvas.lg-canvas {
          position: absolute;
          inset: 0;
          z-index: 0;
          pointer-events: none;
        }

        .lg-noise {
          position: absolute;
          inset: 0;
          z-index: 0;
          opacity: 0.03;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size: 200px;
        }

        .lg-glow-1 {
          position: absolute; width: 600px; height: 600px; border-radius: 50%;
          background: radial-gradient(circle, rgba(99,32,255,0.16) 0%, transparent 70%);
          top: -180px; left: -180px; z-index: 0;
          animation: floatA 8s ease-in-out infinite alternate;
        }
        .lg-glow-2 {
          position: absolute; width: 500px; height: 500px; border-radius: 50%;
          background: radial-gradient(circle, rgba(236,72,153,0.12) 0%, transparent 70%);
          bottom: -120px; right: -120px; z-index: 0;
          animation: floatB 10s ease-in-out infinite alternate;
        }
        .lg-glow-3 {
          position: absolute; width: 280px; height: 280px; border-radius: 50%;
          background: radial-gradient(circle, rgba(56,189,248,0.09) 0%, transparent 70%);
          top: 35%; left: 65%; z-index: 0;
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

        .lg-card {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 460px;
          padding: 52px 44px;
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

        .lg-icon-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 52px; height: 52px;
          border-radius: 16px;
          background: linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.15));
          border: 1px solid rgba(139,92,246,0.25);
          font-size: 24px;
          margin-bottom: 24px;
          animation: cardIn 0.75s 0.08s cubic-bezier(0.16,1,0.3,1) both;
        }

        .lg-title {
          font-family: 'Syne', sans-serif;
          font-size: clamp(26px, 4vw, 34px);
          font-weight: 800;
          letter-spacing: -0.03em;
          line-height: 1.1;
          margin-bottom: 8px;
          animation: cardIn 0.75s 0.12s cubic-bezier(0.16,1,0.3,1) both;
        }

        .lg-title-brand {
          background: linear-gradient(135deg, #818cf8 0%, #c084fc 50%, #f472b6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .lg-subtitle {
          font-size: 14px;
          color: rgba(255,255,255,0.35);
          font-weight: 300;
          margin-bottom: 36px;
          animation: cardIn 0.75s 0.16s cubic-bezier(0.16,1,0.3,1) both;
        }

        .lg-error {
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

        .lg-field {
          margin-bottom: 16px;
          animation: cardIn 0.75s 0.2s cubic-bezier(0.16,1,0.3,1) both;
        }
        .lg-field:nth-child(2) { animation-delay: 0.24s; }

        .lg-label {
          display: block;
          font-size: 12px;
          font-weight: 500;
          color: rgba(255,255,255,0.4);
          letter-spacing: 0.06em;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .lg-input-wrap {
          position: relative;
        }

        .lg-input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 15px;
          opacity: 0.35;
          pointer-events: none;
          transition: opacity 0.2s;
        }

        .lg-input-wrap.focused .lg-input-icon { opacity: 0.8; }

        .lg-input {
          width: 100%;
          padding: 13px 14px 13px 40px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 14px;
          color: #fff;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 400;
          outline: none;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
        }
        .lg-input::placeholder { color: rgba(255,255,255,0.2); }
        .lg-input:focus {
          border-color: rgba(139,92,246,0.5);
          background: rgba(139,92,246,0.06);
          box-shadow: 0 0 0 3px rgba(139,92,246,0.1);
        }

        .lg-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent);
          margin: 28px 0;
          animation: cardIn 0.75s 0.28s cubic-bezier(0.16,1,0.3,1) both;
        }

        .lg-btn {
          position: relative;
          width: 100%;
          padding: 15px;
          border: none;
          border-radius: 14px;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: #fff;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 4px 20px rgba(99,102,241,0.35), 0 0 0 1px rgba(99,102,241,0.25);
          transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s;
          overflow: hidden;
          animation: cardIn 0.75s 0.32s cubic-bezier(0.16,1,0.3,1) both;
        }

        .lg-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: rgba(255,255,255,0.08);
          opacity: 0;
          transition: opacity 0.2s;
        }
        .lg-btn:hover::before { opacity: 1; }
        .lg-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(99,102,241,0.5), 0 0 0 1px rgba(99,102,241,0.4);
        }
        .lg-btn:active { transform: translateY(0); }
        .lg-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

        .lg-btn-arrow {
          display: inline-block;
          transition: transform 0.2s ease;
        }
        .lg-btn:not(:disabled):hover .lg-btn-arrow { transform: translateX(3px); }

        .lg-spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .lg-footer {
          text-align: center;
          margin-top: 24px;
          font-size: 13px;
          color: rgba(255,255,255,0.3);
          animation: cardIn 0.75s 0.38s cubic-bezier(0.16,1,0.3,1) both;
        }

        .lg-footer a {
          color: #a78bfa;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s;
        }
        .lg-footer a:hover { color: #c4b5fd; }

        @media (max-width: 480px) {
          .lg-card { padding: 40px 26px; }
        }
      `}</style>

      <div className="lg-root">
        <canvas ref={canvasRef} className="lg-canvas" />
        <div className="lg-noise" />
        <div className="lg-glow-1" />
        <div className="lg-glow-2" />
        <div className="lg-glow-3" />

        <form className="lg-card" onSubmit={handleSubmit} noValidate>
          <div className="lg-icon-wrap">🚖</div>

          <h2 className="lg-title">
            Welcome back to{' '}
            <span className="lg-title-brand">Ride Buddy</span>
          </h2>
          <p className="lg-subtitle">Sign in to continue your commute journey</p>

          {error && (
            <div className="lg-error">
              <span>⚠</span>
              {error}
            </div>
          )}

          <div className="lg-field">
            <label className="lg-label" htmlFor="email">College Email</label>
            <div className={`lg-input-wrap ${focused === 'email' ? 'focused' : ''}`}>
              <span className="lg-input-icon">✉</span>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@college.edu"
                value={form.email}
                onChange={handleChange}
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused('')}
                className="lg-input"
                required
              />
            </div>
          </div>

          <div className="lg-field">
            <label className="lg-label" htmlFor="password">Password</label>
            <div className={`lg-input-wrap ${focused === 'password' ? 'focused' : ''}`}>
              <span className="lg-input-icon">🔒</span>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused('')}
                className="lg-input"
                required
              />
            </div>
          </div>

          <div className="lg-divider" />

          <button type="submit" className="lg-btn" disabled={loading}>
            {loading ? (
              <>
                <span className="lg-spinner" />
                Signing in…
              </>
            ) : (
              <>
                Login
                <span className="lg-btn-arrow">→</span>
              </>
            )}
          </button>

          <div className="lg-footer">
            Don't have an account?{' '}
            <a href="/signup">Sign up for free</a>
          </div>
        </form>
      </div>
    </>
  );
};

export default LoginPage;