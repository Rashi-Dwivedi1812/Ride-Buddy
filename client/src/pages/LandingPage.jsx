import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.5,
      dx: (Math.random() - 0.5) * 0.4,
      dy: (Math.random() - 0.5) * 0.4,
      opacity: Math.random() * 0.5 + 0.1,
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

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .rb-root {
          font-family: 'DM Sans', sans-serif;
          min-height: 100vh;
          background: #080810;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          color: #fff;
        }

        canvas.rb-canvas {
          position: absolute;
          inset: 0;
          z-index: 0;
          pointer-events: none;
        }

        .rb-noise {
          position: absolute;
          inset: 0;
          z-index: 0;
          opacity: 0.03;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-repeat: repeat;
          background-size: 200px;
        }

        .rb-glow-1 {
          position: absolute;
          width: 600px; height: 600px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(99,32,255,0.18) 0%, transparent 70%);
          top: -150px; left: -150px;
          z-index: 0;
          animation: floatA 8s ease-in-out infinite alternate;
        }
        .rb-glow-2 {
          position: absolute;
          width: 500px; height: 500px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(236,72,153,0.14) 0%, transparent 70%);
          bottom: -100px; right: -100px;
          z-index: 0;
          animation: floatB 10s ease-in-out infinite alternate;
        }
        .rb-glow-3 {
          position: absolute;
          width: 300px; height: 300px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(56,189,248,0.1) 0%, transparent 70%);
          top: 40%; left: 60%;
          z-index: 0;
          animation: floatA 12s ease-in-out infinite alternate-reverse;
        }

        @keyframes floatA {
          from { transform: translate(0,0) scale(1); }
          to   { transform: translate(40px, 30px) scale(1.1); }
        }
        @keyframes floatB {
          from { transform: translate(0,0) scale(1); }
          to   { transform: translate(-30px, -40px) scale(1.08); }
        }

        .rb-card {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 580px;
          padding: 56px 52px;
          border-radius: 28px;
          background: linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%);
          border: 1px solid rgba(255,255,255,0.1);
          box-shadow: 0 0 0 1px rgba(139,92,246,0.1), 0 40px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08);
          backdrop-filter: blur(20px);
          animation: cardIn 0.8s cubic-bezier(0.16,1,0.3,1) both;
        }

        @keyframes cardIn {
          from { opacity: 0; transform: translateY(30px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        .rb-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 14px;
          border-radius: 100px;
          background: rgba(139,92,246,0.15);
          border: 1px solid rgba(139,92,246,0.3);
          font-size: 12px;
          font-weight: 500;
          color: #a78bfa;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          margin-bottom: 28px;
          animation: cardIn 0.8s 0.1s cubic-bezier(0.16,1,0.3,1) both;
        }

        .rb-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #a78bfa;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(0.7); }
        }

        .rb-title {
          font-family: 'Syne', sans-serif;
          font-size: clamp(36px, 5vw, 52px);
          font-weight: 800;
          line-height: 1.08;
          letter-spacing: -0.03em;
          margin-bottom: 18px;
          animation: cardIn 0.8s 0.15s cubic-bezier(0.16,1,0.3,1) both;
        }

        .rb-title-brand {
          background: linear-gradient(135deg, #818cf8 0%, #c084fc 40%, #f472b6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          display: inline;
        }

        .rb-emoji {
          -webkit-text-fill-color: initial;
          font-size: 44px;
          line-height: 1;
          display: inline-block;
          animation: bounce 2.5s ease-in-out infinite;
          vertical-align: middle;
          margin-left: 6px;
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0) rotate(-3deg); }
          50%       { transform: translateY(-6px) rotate(3deg); }
        }

        .rb-desc {
          font-size: 16px;
          color: rgba(255,255,255,0.45);
          line-height: 1.7;
          font-weight: 300;
          max-width: 420px;
          margin-bottom: 44px;
          animation: cardIn 0.8s 0.2s cubic-bezier(0.16,1,0.3,1) both;
        }

        .rb-desc strong {
          color: rgba(255,255,255,0.7);
          font-weight: 500;
        }

        .rb-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
          margin-bottom: 36px;
          animation: cardIn 0.8s 0.25s cubic-bezier(0.16,1,0.3,1) both;
        }

        .rb-actions {
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
          animation: cardIn 0.8s 0.3s cubic-bezier(0.16,1,0.3,1) both;
        }

        .rb-btn {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 14px 28px;
          border-radius: 14px;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 500;
          text-decoration: none;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          overflow: hidden;
          cursor: pointer;
        }

        .rb-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          opacity: 0;
          transition: opacity 0.2s ease;
          background: rgba(255,255,255,0.08);
        }
        .rb-btn:hover::before { opacity: 1; }
        .rb-btn:hover { transform: translateY(-2px); }
        .rb-btn:active { transform: translateY(0); }

        .rb-btn-primary {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: #fff;
          box-shadow: 0 4px 20px rgba(99,102,241,0.35), 0 0 0 1px rgba(99,102,241,0.3);
          flex: 1;
          justify-content: center;
          min-width: 140px;
        }
        .rb-btn-primary:hover {
          box-shadow: 0 8px 30px rgba(99,102,241,0.5), 0 0 0 1px rgba(99,102,241,0.5);
        }

        .rb-btn-secondary {
          background: rgba(255,255,255,0.05);
          color: rgba(255,255,255,0.85);
          border: 1px solid rgba(255,255,255,0.12);
          box-shadow: 0 4px 16px rgba(0,0,0,0.2);
          flex: 1;
          justify-content: center;
          min-width: 140px;
        }
        .rb-btn-secondary:hover {
          border-color: rgba(255,255,255,0.25);
          box-shadow: 0 8px 24px rgba(0,0,0,0.3);
        }

        .rb-btn-arrow {
          display: inline-block;
          transition: transform 0.2s ease;
        }
        .rb-btn:hover .rb-btn-arrow {
          transform: translateX(3px);
        }

        .rb-stats {
          display: flex;
          gap: 28px;
          margin-top: 40px;
          padding-top: 32px;
          border-top: 1px solid rgba(255,255,255,0.06);
          animation: cardIn 0.8s 0.4s cubic-bezier(0.16,1,0.3,1) both;
        }

        .rb-stat {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .rb-stat-num {
          font-family: 'Syne', sans-serif;
          font-size: 22px;
          font-weight: 700;
          background: linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.6) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .rb-stat-label {
          font-size: 12px;
          color: rgba(255,255,255,0.3);
          font-weight: 400;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .rb-stat-sep {
          width: 1px;
          background: rgba(255,255,255,0.07);
          align-self: stretch;
        }

        @media (max-width: 520px) {
          .rb-card { padding: 40px 28px; }
          .rb-stats { gap: 20px; }
        }
      `}</style>

      <div className="rb-root">
        <canvas ref={canvasRef} className="rb-canvas" />
        <div className="rb-noise" />
        <div className="rb-glow-1" />
        <div className="rb-glow-2" />
        <div className="rb-glow-3" />

        <div className="rb-card">
          <div className="rb-badge">
            <span className="rb-dot" />
            College Commute Network
          </div>

          <h1 className="rb-title">
            Welcome to{' '}
            <span className="rb-title-brand">RIDE BUDDY</span>
            <span className="rb-emoji">🚖</span>
          </h1>

          <p className="rb-desc">
            Seamlessly connect with fellow riders for your college commutes.{' '}
            <strong>Safe, fast, and efficient</strong> — built for students, by students.
          </p>

          <div className="rb-divider" />

          <div className="rb-actions">
            <Link to="/login" className="rb-btn rb-btn-primary">
              Login
              <span className="rb-btn-arrow">→</span>
            </Link>
            <Link to="/signup" className="rb-btn rb-btn-secondary">
              Sign Up
              <span className="rb-btn-arrow">→</span>
            </Link>
          </div>

          <div className="rb-stats">
            <div className="rb-stat">
              <span className="rb-stat-num">12K+</span>
              <span className="rb-stat-label">Students</span>
            </div>
            <div className="rb-stat-sep" />
            <div className="rb-stat">
              <span className="rb-stat-num">50+</span>
              <span className="rb-stat-label">Colleges</span>
            </div>
            <div className="rb-stat-sep" />
            <div className="rb-stat">
              <span className="rb-stat-num">98%</span>
              <span className="rb-stat-label">Safe rides</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LandingPage;