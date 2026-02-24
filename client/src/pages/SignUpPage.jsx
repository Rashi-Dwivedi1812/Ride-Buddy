import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const SignUpPage = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState('');
  const canvasRef = useRef(null);
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match');
    setLoading(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/auth/register`, {
        name: form.name,
        email: form.email,
        password: form.password,
      });
      localStorage.setItem('token', res.data.token);
      navigate('/home');
    } catch (err) {
      setError(err.response?.data?.msg || 'Sign-up failed');
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
    { name: 'name',            type: 'text',     label: 'Full Name',       placeholder: 'Your full name',    icon: '👤' },
    { name: 'email',           type: 'email',    label: 'College Email',   placeholder: 'you@college.edu',   icon: '✉'  },
    { name: 'password',        type: 'password', label: 'Password',        placeholder: 'Create a password', icon: '🔒' },
    { name: 'confirmPassword', type: 'password', label: 'Confirm Password',placeholder: 'Repeat password',   icon: '🔑' },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .su-root {
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

        canvas.su-canvas { position: absolute; inset: 0; z-index: 0; pointer-events: none; }

        .su-noise {
          position: absolute; inset: 0; z-index: 0; opacity: 0.03;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size: 200px;
        }

        .su-glow-1 {
          position: absolute; width: 600px; height: 600px; border-radius: 50%;
          background: radial-gradient(circle, rgba(99,32,255,0.16) 0%, transparent 70%);
          top: -180px; left: -180px; z-index: 0;
          animation: floatA 8s ease-in-out infinite alternate;
        }
        .su-glow-2 {
          position: absolute; width: 500px; height: 500px; border-radius: 50%;
          background: radial-gradient(circle, rgba(236,72,153,0.12) 0%, transparent 70%);
          bottom: -120px; right: -120px; z-index: 0;
          animation: floatB 10s ease-in-out infinite alternate;
        }
        .su-glow-3 {
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

        .su-card {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 480px;
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

        .su-header {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 24px;
          animation: cardIn 0.75s 0.08s cubic-bezier(0.16,1,0.3,1) both;
        }

        .su-icon-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px; height: 48px;
          border-radius: 14px;
          background: linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.15));
          border: 1px solid rgba(139,92,246,0.25);
          font-size: 22px;
          flex-shrink: 0;
        }

        .su-title {
          font-family: 'Syne', sans-serif;
          font-size: clamp(22px, 3.5vw, 30px);
          font-weight: 800;
          letter-spacing: -0.03em;
          line-height: 1.1;
        }

        .su-title-brand {
          background: linear-gradient(135deg, #818cf8 0%, #c084fc 50%, #f472b6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .su-subtitle {
          font-size: 13px;
          color: rgba(255,255,255,0.3);
          font-weight: 300;
          margin-bottom: 28px;
          animation: cardIn 0.75s 0.12s cubic-bezier(0.16,1,0.3,1) both;
        }

        .su-error {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.25);
          border-radius: 12px;
          padding: 10px 14px;
          font-size: 13px;
          color: #fca5a5;
          margin-bottom: 18px;
          animation: cardIn 0.3s cubic-bezier(0.16,1,0.3,1) both;
        }

        .su-fields {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          margin-bottom: 24px;
        }

        .su-field {
          animation: cardIn 0.75s cubic-bezier(0.16,1,0.3,1) both;
        }
        .su-field:nth-child(1) { animation-delay: 0.16s; }
        .su-field:nth-child(2) { animation-delay: 0.20s; }
        .su-field:nth-child(3) { animation-delay: 0.24s; }
        .su-field:nth-child(4) { animation-delay: 0.28s; }

        .su-field-full { grid-column: 1 / -1; }

        .su-label {
          display: block;
          font-size: 11px;
          font-weight: 500;
          color: rgba(255,255,255,0.35);
          letter-spacing: 0.07em;
          text-transform: uppercase;
          margin-bottom: 7px;
        }

        .su-input-wrap {
          position: relative;
        }

        .su-input-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 13px;
          opacity: 0.3;
          pointer-events: none;
          transition: opacity 0.2s;
        }

        .su-input-wrap.focused .su-input-icon { opacity: 0.8; }

        .su-input {
          width: 100%;
          padding: 12px 12px 12px 36px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          color: #fff;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 400;
          outline: none;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
        }
        .su-input::placeholder { color: rgba(255,255,255,0.18); }
        .su-input:focus {
          border-color: rgba(139,92,246,0.5);
          background: rgba(139,92,246,0.06);
          box-shadow: 0 0 0 3px rgba(139,92,246,0.1);
        }

        .su-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent);
          margin-bottom: 24px;
          animation: cardIn 0.75s 0.3s cubic-bezier(0.16,1,0.3,1) both;
        }

        .su-btn {
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
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          overflow: hidden;
          animation: cardIn 0.75s 0.34s cubic-bezier(0.16,1,0.3,1) both;
        }

        .su-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: rgba(255,255,255,0.08);
          opacity: 0;
          transition: opacity 0.2s;
        }
        .su-btn:hover::before { opacity: 1; }
        .su-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(99,102,241,0.5), 0 0 0 1px rgba(99,102,241,0.4);
        }
        .su-btn:active { transform: translateY(0); }
        .su-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

        .su-btn-arrow {
          display: inline-block;
          transition: transform 0.2s ease;
        }
        .su-btn:not(:disabled):hover .su-btn-arrow { transform: translateX(3px); }

        .su-spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .su-footer {
          text-align: center;
          margin-top: 22px;
          font-size: 13px;
          color: rgba(255,255,255,0.3);
          animation: cardIn 0.75s 0.4s cubic-bezier(0.16,1,0.3,1) both;
        }
        .su-footer a {
          color: #a78bfa;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s;
        }
        .su-footer a:hover { color: #c4b5fd; }

        @media (max-width: 480px) {
          .su-card { padding: 36px 22px; }
          .su-fields { grid-template-columns: 1fr; }
          .su-field-full { grid-column: auto; }
        }
      `}</style>

      <div className="su-root">
        <canvas ref={canvasRef} className="su-canvas" />
        <div className="su-noise" />
        <div className="su-glow-1" />
        <div className="su-glow-2" />
        <div className="su-glow-3" />

        <form className="su-card" onSubmit={handleSubmit} noValidate>
          <div className="su-header">
            <div className="su-icon-wrap">🚖</div>
            <h2 className="su-title">
              Join <span className="su-title-brand">Ride Buddy</span>
            </h2>
          </div>

          <p className="su-subtitle">Create your account and start riding smarter</p>

          {error && (
            <div className="su-error">
              <span>⚠</span>
              {error}
            </div>
          )}

          <div className="su-fields">
            {fields.map((f, i) => (
              <div
                key={f.name}
                className={`su-field${i >= 2 ? ' su-field-full' : ''}`}
              >
                <label className="su-label" htmlFor={f.name}>{f.label}</label>
                <div className={`su-input-wrap ${focused === f.name ? 'focused' : ''}`}>
                  <span className="su-input-icon">{f.icon}</span>
                  <input
                    id={f.name}
                    name={f.name}
                    type={f.type}
                    placeholder={f.placeholder}
                    value={form[f.name]}
                    onChange={handleChange}
                    onFocus={() => setFocused(f.name)}
                    onBlur={() => setFocused('')}
                    className="su-input"
                    required
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="su-divider" />

          <button type="submit" className="su-btn" disabled={loading}>
            {loading ? (
              <>
                <span className="su-spinner" />
                Creating account…
              </>
            ) : (
              <>
                Create Account
                <span className="su-btn-arrow">→</span>
              </>
            )}
          </button>

          <div className="su-footer">
            Already have an account?{' '}
            <a href="/login">Sign in instead</a>
          </div>
        </form>
      </div>
    </>
  );
};

export default SignUpPage;