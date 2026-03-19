import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';

const ADMIN_NAV = [
  { to: '/', label: 'Dashboard', icon: '▦' },
  { to: '/students', label: 'Сурагчид', icon: '◉' },
  { to: '/teachers', label: 'Багш нар', icon: '◎' },
  { to: '/courses', label: 'Хичээлүүд', icon: '◈' },
  { to: '/enrollments', label: 'Бүртгэл', icon: '◆' },
  { to: '/schedule', label: 'Хуваарь', icon: '◷' },
  { to: '/schedule-requests', label: 'Хуваарийн хүсэлт', icon: '◑' },
  { to: '/grades', label: 'Дүнгүүд', icon: '◈' },
  { to: '/attendance', label: 'Ирц', icon: '◐' },
];
const TEACHER_NAV = [
  { to: '/', label: 'Dashboard', icon: '▦' },
  { to: '/students', label: 'Сурагчид', icon: '◉' },
  { to: '/courses', label: 'Хичээлүүд', icon: '◈' },
  { to: '/enrollments', label: 'Бүртгэл', icon: '◆' },
  { to: '/schedule', label: 'Хуваарь', icon: '◷' },
  { to: '/my-requests', label: 'Миний хүсэлт', icon: '◑' },
  { to: '/grades', label: 'Дүнгүүд', icon: '◈' },
  { to: '/attendance', label: 'Ирц', icon: '◐' },
];
const STUDENT_NAV = [{ to: '/my', label: 'Миний хуудас', icon: '◉' }];

const ROLE_CFG = {
  ADMIN: { color: '#c77dff', bg: 'rgba(199,125,255,0.1)', label: 'Админ' },
  TEACHER: { color: '#00d4ff', bg: 'rgba(0,212,255,0.1)', label: 'Багш' },
  STUDENT: { color: '#6bcb77', bg: 'rgba(107,203,119,0.1)', label: 'Сурагч' },
};

export default function Layout() {
  const { user, logout, isAdmin, isTeacher } = useAuth();
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(0);
  const cfg = ROLE_CFG[user?.role] || ROLE_CFG.STUDENT;
  const navItems = isAdmin ? ADMIN_NAV : isTeacher ? TEACHER_NAV : STUDENT_NAV;

  useEffect(() => {
    if (!isAdmin) return;
    const fetch = async () => { try { const r = await api.get('/schedule-requests/pending-count'); setPendingCount(r.data.count || 0); } catch { } };
    fetch();
    const iv = setInterval(fetch, 30000);
    return () => clearInterval(iv);
  }, [isAdmin]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0e1a' }}>
      {/* ── Sidebar ── */}
      <aside style={{
        position: 'fixed', top: 0, left: 0, height: '100vh', width: 224,
        background: '#0f1525',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', flexDirection: 'column',
        boxShadow: '4px 0 24px rgba(0,0,0,0.5)',
        zIndex: 20,
      }}>
        {/* Logo */}
        <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src={logo} alt="Logo" style={{ width: 40, height: 32 }} />
            <div>
              <div style={{ fontWeight: 800, color: '#e8eaf0', fontSize: 13, letterSpacing: '-0.01em' }}>Aura School</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 500, marginTop: 1, fontFamily: "'DM Mono',monospace" }}>Manager </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <div style={{ padding: '10px 8px', flex: 1, overflowY: 'auto' }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '6px 8px 4px', fontFamily: "'DM Mono',monospace" }}>
            Цэс
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {navItems.map(({ to, label, icon }) => (
              <NavLink key={to} to={to} end={to === '/' || to === '/my'}
                style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: 9,
                  padding: '8px 10px', borderRadius: 10,
                  fontSize: 13, fontWeight: isActive ? 700 : 500,
                  textDecoration: 'none', transition: 'all 0.12s',
                  background: isActive ? 'rgba(0,212,255,0.1)' : 'transparent',
                  color: isActive ? '#00d4ff' : 'rgba(255,255,255,0.55)',
                  borderLeft: isActive ? '2px solid #00d4ff' : '2px solid transparent',
                })}>
                <span style={{ fontSize: 11, opacity: 0.7, flexShrink: 0 }}>{icon}</span>
                <span style={{ flex: 1 }}>{label}</span>
                {(to === '/schedule-requests' || to === '/my-requests') && pendingCount > 0 && (
                  <span style={{
                    background: '#ff6b6b', color: '#fff',
                    fontSize: 9, fontWeight: 800, borderRadius: 999,
                    padding: '1px 6px', fontFamily: "'DM Mono',monospace",
                  }}>{pendingCount}</span>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* User */}
        <div style={{ padding: '10px 8px 12px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{
            background: cfg.bg, borderRadius: 12, padding: '9px 11px',
            marginBottom: 4, display: 'flex', alignItems: 'center', gap: 9,
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', background: cfg.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#001a22', fontWeight: 900, fontSize: 12, flexShrink: 0,
            }}>{user?.email?.[0]?.toUpperCase()}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#e8eaf0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: cfg.color, marginTop: 1 }}>{cfg.label}</div>
            </div>
          </div>
          <button onClick={() => { logout(); navigate('/login'); }}
            style={{
              width: '100%', textAlign: 'left', padding: '7px 10px',
              borderRadius: 10, border: 'none', background: 'transparent',
              cursor: 'pointer', fontSize: 12, fontWeight: 700, color: 'rgba(255,107,107,0.8)',
              display: 'flex', alignItems: 'center', gap: 7, transition: 'all 0.12s',
              fontFamily: 'Syne, sans-serif',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,107,107,0.1)'; e.currentTarget.style.color = '#ff6b6b'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,107,107,0.8)'; }}
          >← Гарах</button>
        </div>
      </aside>

      <main style={{ marginLeft: 224, flex: 1, minWidth: 0, minHeight: '100vh', background: '#0a0e1a' }}>
        <Outlet />
      </main>
    </div>
  );
}
