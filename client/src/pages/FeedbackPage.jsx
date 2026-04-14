import React, { useRef, useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import { Mail, Phone, MapPin } from 'lucide-react';
import emailjs from '@emailjs/browser';
import 'react-toastify/dist/ReactToastify.css';

const FeedbackPage = () => {
  const formRef = useRef();
  const canvasRef = useRef(null);
  const [focused, setFocused] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const form = formRef.current;
    const name = form.user_name.value;
    const email = form.user_email.value;
    const message = form.message.value;

    if (!name || !email || !message) {
      toast.error('Please fill out all fields!');
      return;
    }

    setLoading(true);
    emailjs
      .sendForm('service_l706o46', 'template_161z8pz', formRef.current, '3JTfA611Fz8aSD5O2')
      .then(
        () => {
          toast.success('Feedback submitted successfully!');
          form.reset();
          setLoading(false);
        },
        (error) => {
          console.error('Error sending feedback:', error);
          toast.error('Failed to send feedback. Please try again.');
          setLoading(false);
        }
      );
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

  const contacts = [
    { icon: Mail,   label: 'Email',    value: 'rashidwivedi1812@gmail.com', color: '#818cf8', bg: 'rgba(99,102,241,0.1)'  },
    { icon: Phone,  label: 'Phone',    value: '+91 8287800041',              color: '#34d399', bg: 'rgba(52,211,153,0.1)'  },
    { icon: MapPin, label: 'Location', value: 'JIIT, Noida',                 color: '#f472b6', bg: 'rgba(244,114,182,0.1)' },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .fb-root {
          font-family: 'DM Sans', sans-serif;
          min-height: 100vh;
          background: #080810;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          color: #fff;
          padding: 40px 20px;
        }

        canvas.fb-canvas { position: absolute; inset: 0; z-index: 0; pointer-events: none; }

        .fb-noise {
          position: absolute; inset: 0; z-index: 0; opacity: 0.03;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size: 200px;
        }

        .fb-glow-1 {
          position: absolute; width: 600px; height: 600px; border-radius: 50%;
          background: radial-gradient(circle, rgba(99,32,255,0.15) 0%, transparent 70%);
          top: -180px; left: -180px; z-index: 0;
          animation: floatA 9s ease-in-out infinite alternate;
        }
        .fb-glow-2 {
          position: absolute; width: 500px; height: 500px; border-radius: 50%;
          background: radial-gradient(circle, rgba(236,72,153,0.11) 0%, transparent 70%);
          bottom: -120px; right: -120px; z-index: 0;
          animation: floatB 11s ease-in-out infinite alternate;
        }
        .fb-glow-3 {
          position: absolute; width: 300px; height: 300px; border-radius: 50%;
          background: radial-gradient(circle, rgba(56,189,248,0.08) 0%, transparent 70%);
          top: 30%; left: 68%; z-index: 0;
          animation: floatA 14s ease-in-out infinite alternate-reverse;
        }

        @keyframes floatA {
          from { transform: translate(0,0) scale(1); }
          to   { transform: translate(40px,30px) scale(1.1); }
        }
        @keyframes floatB {
          from { transform: translate(0,0) scale(1); }
          to   { transform: translate(-30px,-40px) scale(1.08); }
        }

        /* ── Layout ── */
        .fb-layout {
          position: relative; z-index: 10;
          display: flex;
          align-items: flex-start;
          gap: 28px;
          width: 100%;
          max-width: 920px;
        }

        /* ── Form Card ── */
        .fb-card {
          flex: 1;
          padding: 50px 44px;
          border-radius: 28px;
          background: linear-gradient(145deg, rgba(255,255,255,0.065) 0%, rgba(255,255,255,0.02) 100%);
          border: 1px solid rgba(255,255,255,0.1);
          box-shadow: 0 0 0 1px rgba(139,92,246,0.08), 0 40px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.07);
          backdrop-filter: blur(24px);
          animation: cardIn 0.8s cubic-bezier(0.16,1,0.3,1) both;
        }

        @keyframes cardIn {
          from { opacity: 0; transform: translateY(28px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        .fb-header {
          display: flex; align-items: center; gap: 14px;
          margin-bottom: 8px;
          animation: cardIn 0.8s 0.08s cubic-bezier(0.16,1,0.3,1) both;
        }

        .fb-icon-wrap {
          width: 50px; height: 50px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 15px;
          background: linear-gradient(135deg, rgba(99,102,241,0.22), rgba(139,92,246,0.14));
          border: 1px solid rgba(139,92,246,0.25);
          font-size: 22px; flex-shrink: 0;
        }

        .fb-title {
          font-family: 'Syne', sans-serif;
          font-size: clamp(22px, 3vw, 30px);
          font-weight: 800;
          letter-spacing: -0.03em;
          line-height: 1.1;
        }

        .fb-title-accent {
          background: linear-gradient(135deg, #818cf8 0%, #c084fc 50%, #f472b6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .fb-subtitle {
          font-size: 13px;
          color: rgba(255,255,255,0.3);
          font-weight: 300;
          margin-bottom: 32px;
          animation: cardIn 0.8s 0.12s cubic-bezier(0.16,1,0.3,1) both;
        }

        /* Fields */
        .fb-field {
          margin-bottom: 14px;
          animation: cardIn 0.8s cubic-bezier(0.16,1,0.3,1) both;
        }
        .fb-field:nth-child(1) { animation-delay: 0.14s; }
        .fb-field:nth-child(2) { animation-delay: 0.18s; }
        .fb-field:nth-child(3) { animation-delay: 0.22s; }

        .fb-label {
          display: block;
          font-size: 11px; font-weight: 500;
          color: rgba(255,255,255,0.35);
          letter-spacing: 0.07em;
          text-transform: uppercase;
          margin-bottom: 7px;
        }

        .fb-input-wrap { position: relative; }

        .fb-input-icon {
          position: absolute; left: 13px; top: 50%;
          transform: translateY(-50%);
          font-size: 13px; opacity: 0.28; pointer-events: none;
          transition: opacity 0.2s;
        }
        .fb-textarea-icon {
          position: absolute; left: 13px; top: 14px;
          font-size: 13px; opacity: 0.28; pointer-events: none;
          transition: opacity 0.2s;
        }
        .fb-input-wrap.focused .fb-input-icon,
        .fb-input-wrap.focused .fb-textarea-icon { opacity: 0.85; }

        .fb-input, .fb-textarea {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          color: #fff;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
        }
        .fb-input { padding: 12px 12px 12px 36px; }
        .fb-textarea { padding: 12px 12px 12px 36px; resize: vertical; min-height: 110px; }
        .fb-input::placeholder, .fb-textarea::placeholder { color: rgba(255,255,255,0.18); }
        .fb-input:focus, .fb-textarea:focus {
          border-color: rgba(139,92,246,0.5);
          background: rgba(139,92,246,0.05);
          box-shadow: 0 0 0 3px rgba(139,92,246,0.1);
        }

        .fb-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent);
          margin: 22px 0;
          animation: cardIn 0.8s 0.28s cubic-bezier(0.16,1,0.3,1) both;
        }

        .fb-btn {
          position: relative; width: 100%;
          padding: 15px; border: none; border-radius: 14px;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: #fff;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px; font-weight: 500;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          box-shadow: 0 4px 20px rgba(99,102,241,0.35), 0 0 0 1px rgba(99,102,241,0.25);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          overflow: hidden;
          animation: cardIn 0.8s 0.32s cubic-bezier(0.16,1,0.3,1) both;
        }
        .fb-btn::before {
          content: ''; position: absolute; inset: 0;
          background: rgba(255,255,255,0.08); opacity: 0; transition: opacity 0.2s;
        }
        .fb-btn:hover::before { opacity: 1; }
        .fb-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(99,102,241,0.5), 0 0 0 1px rgba(99,102,241,0.4);
        }
        .fb-btn:active { transform: translateY(0); }
        .fb-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .fb-btn-arrow { display: inline-block; transition: transform 0.2s; }
        .fb-btn:not(:disabled):hover .fb-btn-arrow { transform: translateX(3px); }

        .fb-spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Contact sidebar ── */
        .fb-sidebar {
          display: flex; flex-direction: column; gap: 14px;
          width: 280px; flex-shrink: 0;
          padding-top: 10px;
          animation: cardIn 0.8s 0.2s cubic-bezier(0.16,1,0.3,1) both;
        }

        .fb-contact-card {
          display: flex; align-items: center; gap: 14px;
          padding: 18px 18px;
          border-radius: 18px;
          background: linear-gradient(145deg, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0.015) 100%);
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 8px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06);
          backdrop-filter: blur(16px);
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s;
          cursor: default;
        }
        .fb-contact-card:hover {
          transform: translateY(-3px);
          border-color: rgba(255,255,255,0.14);
          box-shadow: 0 14px 32px rgba(0,0,0,0.4);
        }

        .fb-contact-icon {
          width: 42px; height: 42px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 12px; flex-shrink: 0;
          transition: transform 0.2s;
        }
        .fb-contact-card:hover .fb-contact-icon { transform: scale(1.1); }

        .fb-contact-label {
          font-size: 11px; font-weight: 500;
          color: rgba(255,255,255,0.35);
          letter-spacing: 0.07em;
          text-transform: uppercase;
          margin-bottom: 3px;
        }

        .fb-contact-value {
          font-size: 13px;
          color: rgba(255,255,255,0.75);
          font-weight: 400;
          word-break: break-all;
          line-height: 1.4;
        }

        /* ── Responsive ── */
        @media (max-width: 760px) {
          .fb-layout { flex-direction: column; align-items: stretch; }
          .fb-sidebar { width: 100%; flex-direction: row; flex-wrap: wrap; }
          .fb-contact-card { flex: 1; min-width: 200px; }
          .fb-card { padding: 38px 24px; }
        }
        @media (max-width: 480px) {
          .fb-sidebar { flex-direction: column; }
        }
      `}</style>

      <div className="fb-root">
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
        <canvas ref={canvasRef} className="fb-canvas" />
        <div className="fb-noise" />
        <div className="fb-glow-1" />
        <div className="fb-glow-2" />
        <div className="fb-glow-3" />

        <div className="fb-layout">
          {/* Form */}
          <form ref={formRef} onSubmit={handleSubmit} className="fb-card" noValidate>
            <div className="fb-header">
              <div className="fb-icon-wrap">💬</div>
              <h2 className="fb-title">
                Your <span className="fb-title-accent">Feedback</span>
              </h2>
            </div>
            <p className="fb-subtitle">We'd love to hear what you think — every message helps us improve</p>

            <div className="fb-field">
              <label className="fb-label" htmlFor="user_name">Your Name</label>
              <div className={`fb-input-wrap ${focused === 'user_name' ? 'focused' : ''}`}>
                <span className="fb-input-icon">👤</span>
                <input
                  id="user_name"
                  name="user_name"
                  type="text"
                  placeholder="e.g. Aryan Sharma"
                  className="fb-input"
                  onFocus={() => setFocused('user_name')}
                  onBlur={() => setFocused('')}
                />
              </div>
            </div>

            <div className="fb-field">
              <label className="fb-label" htmlFor="user_email">Email Address</label>
              <div className={`fb-input-wrap ${focused === 'user_email' ? 'focused' : ''}`}>
                <span className="fb-input-icon">✉</span>
                <input
                  id="user_email"
                  name="user_email"
                  type="email"
                  placeholder="you@example.com"
                  className="fb-input"
                  onFocus={() => setFocused('user_email')}
                  onBlur={() => setFocused('')}
                />
              </div>
            </div>

            <div className="fb-field">
              <label className="fb-label" htmlFor="message">Message</label>
              <div className={`fb-input-wrap ${focused === 'message' ? 'focused' : ''}`}>
                <span className="fb-textarea-icon">✍</span>
                <textarea
                  id="message"
                  name="message"
                  placeholder="Share your thoughts, suggestions, or report an issue…"
                  className="fb-textarea"
                  onFocus={() => setFocused('message')}
                  onBlur={() => setFocused('')}
                />
              </div>
            </div>

            <div className="fb-divider" />

            <button type="submit" className="fb-btn" disabled={loading}>
              {loading ? (
                <>
                  <span className="fb-spinner" />
                  Sending…
                </>
              ) : (
                <>
                  Submit Feedback
                  <span className="fb-btn-arrow">→</span>
                </>
              )}
            </button>
          </form>

          {/* Contact Sidebar */}
          <div className="fb-sidebar">
            {contacts.map(({ icon: Icon, label, value, color, bg }) => (
              <div className="fb-contact-card" key={label}>
                <div className="fb-contact-icon" style={{ background: bg }}>
                  <Icon size={18} style={{ color }} />
                </div>
                <div>
                  <p className="fb-contact-label">{label}</p>
                  <p className="fb-contact-value">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default FeedbackPage;