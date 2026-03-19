import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const ADMIN_NAV = [
  { to: '/',            label: 'Dashboard'   },
  { to: '/students',    label: 'Сурагчид'    },
  { to: '/teachers',    label: 'Багш нар'    },
  { to: '/courses',     label: 'Хичээлүүд'   },
  { to: '/enrollments', label: 'Бүртгэл'     },
  { to: '/schedule',    label: 'Хуваарь'     },
  { to: '/schedule-requests', label: 'Хуваарийн хүсэлт' },
  { to: '/grades',      label: 'Дүнгүүд'     },
  { to: '/attendance',  label: 'Ирц'         },
];

const TEACHER_NAV = [
  { to: '/',            label: 'Dashboard'   },
  { to: '/students',    label: 'Сурагчид'    },
  { to: '/courses',     label: 'Хичээлүүд'   },
  { to: '/enrollments', label: 'Бүртгэл'     },
  { to: '/schedule',    label: 'Хуваарь'     },
  { to: '/my-requests', label: 'Миний хүсэлт' },
  { to: '/grades',      label: 'Дүнгүүд'     },
  { to: '/attendance',  label: 'Ирц'         },
];

const STUDENT_NAV = [
  { to: '/my', label: 'Миний хуудас' },
];

const ROLE_COLOR = { ADMIN: '#7c3aed', TEACHER: '#2563eb', STUDENT: '#059669' };
const ROLE_BG    = { ADMIN: '#f3f0ff', TEACHER: '#eff6ff', STUDENT: '#f0fdf4' };
const ROLE_MN    = { ADMIN: 'Админ',   TEACHER: 'Багш',    STUDENT: 'Сурагч'  };

export default function Layout() {
  const { user, logout, isAdmin, isTeacher, isStudent } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/login'); };
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!isAdmin) return;
    const fetchPending = async () => {
      try {
        const res = await api.get('/schedule-requests/pending-count');
        setPendingCount(res.data.count || 0);
      } catch {}
    };
    fetchPending();
    const interval = setInterval(fetchPending, 30000);
    return () => clearInterval(interval);
  }, [isAdmin]);

  const navItems = isAdmin ? ADMIN_NAV : isTeacher ? TEACHER_NAV : STUDENT_NAV;

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Sidebar */}
      <aside style={{ position:'fixed', top:0, left:0, height:'100vh', width:232, background:'#fff', borderRight:'1px solid #f1f5f9', display:'flex', flexDirection:'column', boxShadow:'1px 0 12px rgba(0,0,0,0.05)', zIndex:20 }}>
        {/* Logo */}
        <div style={{ padding:'18px 16px', borderBottom:'1px solid #f1f5f9' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,#6366f1,#4338ca)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:900, fontSize:16, boxShadow:'0 2px 8px rgba(99,102,241,0.35)', flexShrink:0 }}>S</div>
            <div>
              <div style={{ fontWeight:800, color:'#0f172a', fontSize:13 }}>School Manager</div>
              <div style={{ fontSize:10, color:'#94a3b8', marginTop:1 }}>Сургалтын систем</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:10, overflowY:'auto', display:'flex', flexDirection:'column', gap:2 }}>
          {navItems.map(({ to, label }) => (
            <NavLink key={to} to={to} end={to === '/' || to === '/my'}
              style={({ isActive }) => ({
                display:'flex', alignItems:'center', gap:10,
                padding:'9px 12px', borderRadius:10,
                fontSize:13, fontWeight:500, textDecoration:'none',
                transition:'all 0.12s',
                background:  isActive ? '#eef2ff' : 'transparent',
                color:       isActive ? '#4338ca' : '#64748b',
                borderLeft:  isActive ? '3px solid #6366f1' : '3px solid transparent',
              })}>
              <span style={{ flex:1 }}>{label}</span>
              {(to === '/schedule-requests' || to === '/my-requests') && pendingCount > 0 && (
                <span style={{ background:'#ef4444', color:'#fff', fontSize:10, fontWeight:800, borderRadius:'10px', padding:'1px 6px', lineHeight:'16px' }}>
                  {pendingCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User panel */}
        <div style={{ padding:12, borderTop:'1px solid #f1f5f9' }}>
          <div style={{ background:ROLE_BG[user?.role], borderRadius:10, padding:'8px 12px', marginBottom:8, display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:28, height:28, borderRadius:'50%', background:ROLE_COLOR[user?.role], display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:11, flexShrink:0 }}>
              {user?.email?.[0]?.toUpperCase()}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#0f172a', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.email}</div>
              <div style={{ fontSize:10, fontWeight:700, color:ROLE_COLOR[user?.role], marginTop:1 }}>{ROLE_MN[user?.role]}</div>
            </div>
          </div>
          <button onClick={handleLogout}
            style={{ width:'100%', textAlign:'left', padding:'7px 12px', borderRadius:10, border:'none', background:'transparent', cursor:'pointer', fontSize:12, fontWeight:600, color:'#ef4444', display:'flex', alignItems:'center', gap:6 }}
            onMouseEnter={e => e.currentTarget.style.background='#fef2f2'}
            onMouseLeave={e => e.currentTarget.style.background='transparent'}>
            ← Гарах
          </button>
        </div>
      </aside>

      <main style={{ marginLeft:232, flex:1, minWidth:0, minHeight:'100vh', background:'#f8fafc' }}>
        <Outlet />
      </main>
    </div>
  );
}
