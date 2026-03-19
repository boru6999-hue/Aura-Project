import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';

const demos = [
  { role: 'admin', email: 'admin@school.mn', pwd: 'admin123', label: 'Admin', color: '#c77dff', bg: 'rgba(199,125,255,0.12)', border: 'rgba(199,125,255,0.3)' },
  { role: 'teacher', email: 'teacher1@school.mn', pwd: 'teacher123', label: 'Багш', color: '#00d4ff', bg: 'rgba(0,212,255,0.1)', border: 'rgba(0,212,255,0.25)' },
  { role: 'student', email: 'student1@school.mn', pwd: 'student123', label: 'Сурагч', color: '#6bcb77', bg: 'rgba(107,203,119,0.1)', border: 'rgba(107,203,119,0.25)' },
];

const S = {
  root: { minHeight: '100vh', display: 'flex', background: '#0a0e1a', fontFamily: 'Syne, system-ui, sans-serif' },
  left: {
    flex: 1, display: 'none',
    background: 'linear-gradient(155deg,#060a14 0%,#0a1228 40%,#0d1830 100%)',
    flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
    padding: '3rem', position: 'relative', overflow: 'hidden',
  },
  right: {
    width: '100%', maxWidth: 420, background: '#0f1525',
    borderLeft: '1px solid rgba(255,255,255,0.06)',
    display: 'flex', flexDirection: 'column', justifyContent: 'center',
    padding: '2.5rem 2rem',
    boxShadow: '-4px 0 40px rgba(0,0,0,0.6)',
  },
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try { await login(email, password); navigate('/'); }
    catch (err) { setError(err.response?.data?.error || 'Нэвтрэхэд алдаа гарлаа'); }
    finally { setLoading(false); }
  };

  const inputStyle = {
    width: '100%', padding: '11px 14px', fontSize: 13,
    background: '#141c2e', color: '#e8eaf0',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
    outline: 'none', fontFamily: 'Syne, sans-serif', transition: 'all 0.15s',
  };

  return (
    <div style={S.root}>
      {/* Left */}
      <div style={S.left} className="lg-panel">
        {/* Glow orbs */}
        <div style={{ position: 'absolute', top: '15%', left: '20%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle,rgba(0,212,255,0.08) 0%,transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '20%', right: '15%', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle,rgba(199,125,255,0.1) 0%,transparent 70%)', pointerEvents: 'none' }} />

        {/* Grid lines */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', maxWidth: 340, animation: 'fadeIn 0.5s ease both' }}>
          <div style={{
            width: 120, height: 100, borderRadius: 18, margin: '0 auto 24px',
            background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
            boxShadow: '0 0 32px rgba(0,212,255,0.2)',
          }}>
            <img src={logo} alt="Logo" style={{ width: 110, height: 90 }} />
          </div>

          <h2 style={{ fontSize: 26, fontWeight: 800, color: '#e8eaf0', margin: '0 0 10px', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            Сургуулийн<br />удирдлагын систем
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, lineHeight: 1.7, margin: '0 0 36px', fontFamily: "'DM Mono',monospace" }}>
            // Academic Management System
          </p>

        </div>
      </div>

      {/* Right */}
      <div style={S.right}>
        <div style={{ maxWidth: 320, margin: '0 auto', width: '100%', animation: 'fadeIn 0.35s ease both' }}>

          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36 }}>
            <img src={logo} alt="Logo" style={{ width: 50, height: 40 }} />
            <div>
              <div style={{ fontWeight: 800, color: '#e8eaf0', fontSize: 15 }}>Aura School</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 1, fontFamily: "'DM Mono',monospace" }}>// Сургалтын систем</div>
            </div>
          </div>

          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#e8eaf0', margin: '0 0 4px', letterSpacing: '-0.02em' }}>Нэвтрэх</h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, margin: '0 0 24px', fontFamily: "'DM Mono',monospace" }}>Нэвтэрнэ үү</p>

          {error && (
            <div style={{
              padding: '10px 14px', background: 'rgba(255,107,107,0.1)',
              border: '1px solid rgba(255,107,107,0.3)', borderRadius: 12,
              color: '#ff6b6b', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8,
              marginBottom: 18, animation: 'slideDown 0.2s ease both',
            }}>⚠ {error}</div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'DM Mono',monospace" }}>И-мэйл</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com" required autoFocus style={inputStyle}
                onFocus={e => { e.target.style.borderColor = 'rgba(0,212,255,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(0,212,255,0.08)'; }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'DM Mono',monospace" }}>Нууц үг</label>
              <div style={{ position: 'relative' }}>
                <input type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required style={{ ...inputStyle, paddingRight: 40 }}
                  onFocus={e => { e.target.style.borderColor = 'rgba(0,212,255,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(0,212,255,0.08)'; }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
                />
                <button type="button" onClick={() => setShowPwd(v => !v)} style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', fontSize: 14, padding: '2px 4px' }}>{showPwd ? '🙈' : '👁️'}</button>
              </div>
            </div>

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '12px', borderRadius: 12, border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              background: loading ? 'rgba(0,212,255,0.4)' : 'linear-gradient(135deg,#00d4ff,#00b8d9)',
              color: '#001a22', fontWeight: 800, fontSize: 14,
              fontFamily: 'Syne, sans-serif', letterSpacing: '-0.01em',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all 0.15s', marginTop: 4,
              boxShadow: loading ? 'none' : '0 0 24px rgba(0,212,255,0.35)',
            }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.boxShadow = '0 0 36px rgba(0,212,255,0.5)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 0 24px rgba(0,212,255,0.35)'; e.currentTarget.style.transform = ''; }}
            >
              {loading ? (<><span style={{ width: 15, height: 15, border: '2px solid rgba(0,26,34,0.3)', borderTopColor: '#001a22', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} /> Нэвтэрч байна...</>) : 'Нэвтрэх →'}
            </button>
          </form>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Mono:wght@400;500&display=swap');
        @media (min-width:1024px) { .lg-panel { display:flex !important; } }
        @keyframes fadeIn    { from{opacity:0;transform:translateY(8px)}  to{opacity:1;transform:translateY(0)} }
        @keyframes slideDown { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin      { to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}
