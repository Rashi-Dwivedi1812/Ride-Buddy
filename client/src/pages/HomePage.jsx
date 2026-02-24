import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMoreVertical, FiHome, FiClock, FiMessageSquare, FiLogOut } from 'react-icons/fi';
import { BsChatDots } from 'react-icons/bs';

const HomePage = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef();
  const canvasRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = Array.from({ length: 60 }, () => ({
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

  const handleNavigation = (path) => { navigate(path); setOpen(false); };

  const navItems = [
    { path: '/home',     icon: <FiHome />,         label: 'Home',     color: '#6366f1', bg: 'rgba(99,102,241,0.08)' },
    { path: '/history',  icon: <FiClock />,         label: 'History',  color: '#a78bfa', bg: 'rgba(167,139,250,0.08)' },
    { path: '/feedback', icon: <FiMessageSquare />, label: 'Feedback', color: '#34d399', bg: 'rgba(52,211,153,0.08)' },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .hp-root {
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

        canvas.hp-canvas { position: absolute; inset: 0; z-index: 0; pointer-events: none; }

        .hp-noise {
          position: absolute; inset: 0; z-index: 0; opacity: 0.03;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size: 200px;
        }

        .hp-glow-1 {
          position: absolute; width: 650px; height: 650px; border-radius: 50%;
          background: radial-gradient(circle, rgba(99,32,255,0.16) 0%, transparent 70%);
          top: -200px; left: -200px; z-index: 0;
          animation: floatA 8s ease-in-out infinite alternate;
        }
        .hp-glow-2 {
          position: absolute; width: 500px; height: 500px; border-radius: 50%;
          background: radial-gradient(circle, rgba(236,72,153,0.12) 0%, transparent 70%);
          bottom: -120px; right: -120px; z-index: 0;
          animation: floatB 10s ease-in-out infinite alternate;
        }
        .hp-glow-3 {
          position: absolute; width: 300px; height: 300px; border-radius: 50%;
          background: radial-gradient(circle, rgba(56,189,248,0.09) 0%, transparent 70%);
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

        /* ── Navbar ── */
        .hp-navbar {
          position: fixed;
          top: 16px; left: 16px;
          z-index: 40;
        }

        .hp-menu-btn {
          width: 40px; height: 40px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 12px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          color: #fff;
          cursor: pointer;
          backdrop-filter: blur(12px);
          transition: background 0.2s, border-color 0.2s, transform 0.2s;
        }
        .hp-menu-btn:hover {
          background: rgba(139,92,246,0.15);
          border-color: rgba(139,92,246,0.35);
          transform: scale(1.05);
        }

        .hp-dropdown {
          position: absolute;
          top: calc(100% + 10px);
          left: 0;
          width: 220px;
          background: linear-gradient(145deg, rgba(20,20,35,0.98) 0%, rgba(14,14,26,0.98) 100%);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 18px;
          box-shadow: 0 24px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(139,92,246,0.1);
          backdrop-filter: blur(24px);
          overflow: hidden;
          animation: dropIn 0.2s cubic-bezier(0.16,1,0.3,1) both;
        }

        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        .hp-dropdown-header {
          padding: 16px 18px 12px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .hp-dropdown-label {
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          background: linear-gradient(135deg, #818cf8, #c084fc);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hp-nav-items { padding: 8px; }

        .hp-nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 10px 12px;
          border-radius: 11px;
          border: none;
          background: transparent;
          color: rgba(255,255,255,0.7);
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 400;
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
          text-align: left;
        }
        .hp-nav-item:hover { color: #fff; }

        .hp-nav-icon {
          width: 30px; height: 30px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 8px;
          font-size: 14px;
          flex-shrink: 0;
          transition: transform 0.2s;
        }
        .hp-nav-item:hover .hp-nav-icon { transform: scale(1.1); }

        .hp-nav-sep {
          height: 1px;
          background: rgba(255,255,255,0.06);
          margin: 6px 8px;
        }

        .hp-nav-logout {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 10px 12px;
          border-radius: 11px;
          border: none;
          background: transparent;
          color: #f87171;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 400;
          cursor: pointer;
          transition: background 0.15s;
          text-align: left;
        }
        .hp-nav-logout:hover { background: rgba(239,68,68,0.1); }

        .hp-logout-icon {
          width: 30px; height: 30px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 8px;
          background: rgba(239,68,68,0.12);
          font-size: 14px;
          flex-shrink: 0;
        }

        /* ── Main Card ── */
        .hp-card {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 580px;
          padding: 56px 52px;
          border-radius: 28px;
          background: linear-gradient(145deg, rgba(255,255,255,0.065) 0%, rgba(255,255,255,0.02) 100%);
          border: 1px solid rgba(255,255,255,0.1);
          box-shadow: 0 0 0 1px rgba(139,92,246,0.08), 0 40px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.07);
          backdrop-filter: blur(24px);
          animation: cardIn 0.8s cubic-bezier(0.16,1,0.3,1) both;
        }

        @keyframes cardIn {
          from { opacity: 0; transform: translateY(30px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        .hp-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 14px;
          border-radius: 100px;
          background: rgba(139,92,246,0.12);
          border: 1px solid rgba(139,92,246,0.25);
          font-size: 12px;
          font-weight: 500;
          color: #a78bfa;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          margin-bottom: 24px;
          animation: cardIn 0.8s 0.08s cubic-bezier(0.16,1,0.3,1) both;
        }

        .hp-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #a78bfa;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%,100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.4; transform: scale(0.7); }
        }

        .hp-title {
          font-family: 'Syne', sans-serif;
          font-size: clamp(32px, 5vw, 48px);
          font-weight: 800;
          letter-spacing: -0.03em;
          line-height: 1.08;
          margin-bottom: 14px;
          animation: cardIn 0.8s 0.12s cubic-bezier(0.16,1,0.3,1) both;
        }

        .hp-title-brand {
          background: linear-gradient(135deg, #818cf8 0%, #c084fc 50%, #f472b6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hp-emoji {
          -webkit-text-fill-color: initial;
          display: inline-block;
          animation: bounce 2.5s ease-in-out infinite;
          vertical-align: middle;
          margin-left: 6px;
        }
        @keyframes bounce {
          0%,100% { transform: translateY(0) rotate(-3deg); }
          50%      { transform: translateY(-6px) rotate(3deg); }
        }

        .hp-desc {
          font-size: 16px;
          color: rgba(255,255,255,0.4);
          line-height: 1.7;
          font-weight: 300;
          margin-bottom: 44px;
          animation: cardIn 0.8s 0.16s cubic-bezier(0.16,1,0.3,1) both;
        }
        .hp-desc strong { color: rgba(255,255,255,0.7); font-weight: 500; }

        .hp-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent);
          margin-bottom: 36px;
          animation: cardIn 0.8s 0.2s cubic-bezier(0.16,1,0.3,1) both;
        }

        .hp-actions {
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
          animation: cardIn 0.8s 0.24s cubic-bezier(0.16,1,0.3,1) both;
        }

        .hp-btn {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          flex: 1;
          min-width: 150px;
          padding: 15px 24px;
          border-radius: 16px;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 500;
          text-decoration: none;
          overflow: hidden;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          cursor: pointer;
        }

        .hp-btn::before {
          content: '';
          position: absolute; inset: 0;
          background: rgba(255,255,255,0.08);
          opacity: 0;
          transition: opacity 0.2s;
        }
        .hp-btn:hover::before { opacity: 1; }
        .hp-btn:hover { transform: translateY(-2px); }
        .hp-btn:active { transform: translateY(0); }

        .hp-btn-find {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: #fff;
          box-shadow: 0 4px 20px rgba(99,102,241,0.35), 0 0 0 1px rgba(99,102,241,0.25);
        }
        .hp-btn-find:hover {
          box-shadow: 0 8px 30px rgba(99,102,241,0.5), 0 0 0 1px rgba(99,102,241,0.4);
        }

        .hp-btn-post {
          background: linear-gradient(135deg, #059669 0%, #10b981 100%);
          color: #fff;
          box-shadow: 0 4px 20px rgba(16,185,129,0.3), 0 0 0 1px rgba(16,185,129,0.2);
        }
        .hp-btn-post:hover {
          box-shadow: 0 8px 30px rgba(16,185,129,0.45), 0 0 0 1px rgba(16,185,129,0.35);
        }

        .hp-btn-arrow {
          display: inline-block;
          transition: transform 0.2s;
        }
        .hp-btn:hover .hp-btn-arrow { transform: translateX(3px); }

        /* ── Stats ── */
        .hp-stats {
          display: flex;
          gap: 24px;
          margin-top: 40px;
          padding-top: 32px;
          border-top: 1px solid rgba(255,255,255,0.06);
          animation: cardIn 0.8s 0.3s cubic-bezier(0.16,1,0.3,1) both;
        }
        .hp-stat { display: flex; flex-direction: column; gap: 2px; }
        .hp-stat-num {
          font-family: 'Syne', sans-serif;
          font-size: 22px;
          font-weight: 700;
          background: linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.6) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .hp-stat-label {
          font-size: 12px;
          color: rgba(255,255,255,0.3);
          font-weight: 400;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        .hp-stat-sep { width: 1px; background: rgba(255,255,255,0.07); align-self: stretch; }

        /* ── Chat FAB ── */
        .hp-fab {
          position: fixed;
          bottom: 24px; right: 24px;
          z-index: 40;
          width: 48px; height: 48px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 14px;
          background: linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.15));
          border: 1px solid rgba(139,92,246,0.3);
          backdrop-filter: blur(16px);
          box-shadow: 0 8px 24px rgba(99,102,241,0.25);
          transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s;
          color: #a78bfa;
          animation: cardIn 0.8s 0.4s cubic-bezier(0.16,1,0.3,1) both;
        }
        .hp-fab:hover {
          transform: translateY(-3px) scale(1.05);
          background: linear-gradient(135deg, rgba(99,102,241,0.35), rgba(139,92,246,0.25));
          box-shadow: 0 12px 30px rgba(99,102,241,0.4);
        }
        .hp-fab:active { transform: translateY(0) scale(1); }

        @media (max-width: 520px) {
          .hp-card { padding: 40px 26px; }
          .hp-stats { gap: 18px; }
          .hp-actions { flex-direction: column; }
        }
      `}</style>

      <div className="hp-root">
        <canvas ref={canvasRef} className="hp-canvas" />
        <div className="hp-noise" />
        <div className="hp-glow-1" />
        <div className="hp-glow-2" />
        <div className="hp-glow-3" />

        {/* Navbar Dropdown */}
        <div className="hp-navbar" ref={dropdownRef}>
          <button className="hp-menu-btn" onClick={() => setOpen(!open)}>
            <FiMoreVertical size={18} />
          </button>

          {open && (
            <div className="hp-dropdown">
              <div className="hp-dropdown-header">
                <span className="hp-dropdown-label">Ride Buddy</span>
              </div>
              <div className="hp-nav-items">
                {navItems.map(item => (
                  <button
                    key={item.path}
                    className="hp-nav-item"
                    onClick={() => handleNavigation(item.path)}
                    style={{ '--item-bg': item.bg }}
                    onMouseEnter={e => e.currentTarget.style.background = item.bg}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <span className="hp-nav-icon" style={{ background: item.bg, color: item.color }}>
                      {item.icon}
                    </span>
                    {item.label}
                  </button>
                ))}

                <div className="hp-nav-sep" />

                <button className="hp-nav-logout" onClick={() => handleNavigation('/')}>
                  <span className="hp-logout-icon">
                    <FiLogOut />
                  </span>
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Main Card */}
        <div className="hp-card">
          <div className="hp-badge">
            <span className="hp-dot" />
            College Commute Network
          </div>

          <h1 className="hp-title">
            Welcome to{' '}
            <span className="hp-title-brand">RIDE BUDDY</span>
            <span className="hp-emoji">🚖</span>
          </h1>

          <p className="hp-desc">
            Find or offer a ride with fellow college mates.{' '}
            <strong>Quick, safe, and reliable</strong> — every single day.
          </p>

          <div className="hp-divider" />

          <div className="hp-actions">
            <Link to="/find" className="hp-btn hp-btn-find">
              🔍 Find a Ride
              <span className="hp-btn-arrow">→</span>
            </Link>
            <Link to="/post" className="hp-btn hp-btn-post">
              ✏️ Post a Ride
              <span className="hp-btn-arrow">→</span>
            </Link>
          </div>

          <div className="hp-stats">
            <div className="hp-stat">
              <span className="hp-stat-num">12K+</span>
              <span className="hp-stat-label">Students</span>
            </div>
            <div className="hp-stat-sep" />
            <div className="hp-stat">
              <span className="hp-stat-num">50+</span>
              <span className="hp-stat-label">Colleges</span>
            </div>
            <div className="hp-stat-sep" />
            <div className="hp-stat">
              <span className="hp-stat-num">98%</span>
              <span className="hp-stat-label">Safe rides</span>
            </div>
          </div>
        </div>

        {/* Chat FAB */}
        <Link to="/feedback" title="Feedback" className="hp-fab">
          <BsChatDots size={20} />
        </Link>
      </div>
    </>
  );
};

export default HomePage;