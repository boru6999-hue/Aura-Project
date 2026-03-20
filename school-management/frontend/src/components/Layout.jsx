import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import api from '../api/axios'

const ADMIN_NAV = [
  { to:'/',                  n:'01', label:'Dashboard' },
  { to:'/students',          n:'02', label:'Сурагчид' },
  { to:'/teachers',          n:'03', label:'Багш нар' },
  { to:'/courses',           n:'04', label:'Хичээлүүд' },
  { to:'/enrollments',       n:'05', label:'Бүртгэл' },
  { to:'/grades',            n:'06', label:'Дүнгүүд' },
  { to:'/attendance',        n:'07', label:'Ирц' },
  { to:'/schedule',          n:'08', label:'Хуваарь' },
  { to:'/schedule-requests', n:'09', label:'Хүсэлт' },
]
const TEACHER_NAV = [
  { to:'/',            n:'01', label:'Dashboard' },
  { to:'/students',    n:'02', label:'Сурагчид' },
  { to:'/courses',     n:'03', label:'Хичээлүүд' },
  { to:'/enrollments', n:'04', label:'Бүртгэл' },
  { to:'/grades',      n:'05', label:'Дүнгүүд' },
  { to:'/attendance',  n:'06', label:'Ирц' },
  { to:'/schedule',    n:'07', label:'Хуваарь' },
  { to:'/my-requests', n:'08', label:'Миний хүсэлт' },
]
const STUDENT_NAV = [{ to:'/my', n:'01', label:'Миний хуудас' }]
const ROLE_MN = { ADMIN:'ADMIN', TEACHER:'БАГШ', STUDENT:'СУРАГЧ' }

function LogoMark() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <rect x="1" y="1" width="34" height="34" stroke="rgba(245,240,232,0.12)" strokeWidth="1"/>
      {[9,18,27].flatMap(x => [9,18,27].map(y => (
        <circle key={`${x}${y}`} cx={x} cy={y} r="1.5" fill="rgba(245,240,232,0.14)" />
      )))}
      <line x1="18" y1="4" x2="18" y2="32" stroke="rgba(245,240,232,0.06)" strokeWidth="0.5"/>
      <line x1="4" y1="18" x2="32" y2="18" stroke="rgba(245,240,232,0.06)" strokeWidth="0.5"/>
      <polygon points="18,10 26,18 18,26 10,18" stroke="rgba(245,240,232,0.3)" strokeWidth="1" fill="none"/>
      <rect x="14" y="14" width="8" height="8" stroke="var(--blue)" strokeWidth="1.2" fill="rgba(91,138,245,0.18)"/>
      <circle cx="18" cy="18" r="2" fill="rgba(245,240,232,0.85)"/>
    </svg>
  )
}

function SidebarBg() {
  return (
    <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none', overflow:'hidden' }} preserveAspectRatio="none">
      <line x1="40" y1="0" x2="40" y2="100%" stroke="rgba(255,255,255,0.03)" strokeWidth="1"/>
      <line x1="180" y1="0" x2="180" y2="100%" stroke="rgba(255,255,255,0.03)" strokeWidth="1"/>
      {[120,200,280,360,440,520,600,680].map((y,i) => (
        <line key={i} x1="0" y1={y} x2="220" y2={y} stroke="rgba(255,255,255,0.025)" strokeWidth="1"/>
      ))}
      <polygon points="-20,700 240,200 280,200 60,700" fill="rgba(255,255,255,0.015)"/>
      <circle cx="220" cy="820" r="180" stroke="rgba(255,255,255,0.03)" strokeWidth="1" fill="none"/>
      <circle cx="220" cy="820" r="110" stroke="rgba(255,255,255,0.025)" strokeWidth="1" fill="none"/>
      <circle cx="220" cy="820" r="50" stroke="rgba(91,138,245,0.08)" strokeWidth="1" fill="none"/>
    </svg>
  )
}

function ThemeToggle() {
  const { dark, toggle } = useTheme()
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
      <span style={{ fontFamily:'Share Tech Mono,monospace', fontSize:9, color:'rgba(245,240,232,0.25)', letterSpacing:'0.1em' }}>
        {dark ? 'DARK' : 'LIGHT'}
      </span>
      <button onClick={toggle} className="theme-toggle" title="Toggle dark/light mode">
        <div className={`theme-toggle-knob ${dark ? 'on' : ''}`}>
          {/* Sun / moon icon */}
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            {dark ? (
              /* Moon */
              <path d="M5 1.5A3.5 3.5 0 0 0 8.5 5 3.5 3.5 0 0 1 2 5a3 3 0 0 1 3-3.5z" fill="rgba(91,138,245,0.9)"/>
            ) : (
              /* Sun */
              <>
                <circle cx="5" cy="5" r="2" fill="rgba(13,27,62,0.7)"/>
                {[0,45,90,135,180,225,270,315].map(a => {
                  const rad = (a * Math.PI) / 180
                  const x1 = 5 + Math.cos(rad) * 3.2
                  const y1 = 5 + Math.sin(rad) * 3.2
                  const x2 = 5 + Math.cos(rad) * 4.2
                  const y2 = 5 + Math.sin(rad) * 4.2
                  return <line key={a} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(13,27,62,0.7)" strokeWidth="1.2"/>
                })}
              </>
            )}
          </svg>
        </div>
      </button>
    </div>
  )
}

export default function Layout() {
  const { user, logout, isAdmin, isTeacher } = useAuth()
  const navigate = useNavigate()
  const [pending, setPending] = useState(0)

  useEffect(() => {
    if (!isAdmin) return
    const load = () => api.get('/schedule-requests/pending-count')
      .then(r => setPending(r.data.count || 0)).catch(() => {})
    load()
    const id = setInterval(load, 30000)
    return () => clearInterval(id)
  }, [isAdmin])

  const nav = isAdmin ? ADMIN_NAV : isTeacher ? TEACHER_NAV : STUDENT_NAV
  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>
      {/* ── SIDEBAR ── */}
      <aside style={{
        position:'fixed', top:0, left:0, height:'100vh', width:220,
        background:'var(--sidebar-bg)',
        display:'flex', flexDirection:'column',
        zIndex:20, flexShrink:0, overflow:'hidden',
        transition:'background 0.3s',
      }}>
        <SidebarBg />

        {/* Top gradient accent */}
        <div style={{ height:3, background:'linear-gradient(to right, var(--blue), var(--blue-light), transparent)', flexShrink:0, position:'relative', zIndex:2 }} />

        {/* Logo */}
        <div style={{ padding:'16px 20px 14px', borderBottom:'1px solid rgba(245,240,232,0.07)', position:'relative', zIndex:2, display:'flex', alignItems:'center', gap:12 }}>
          <LogoMark />
          <div>
            <div style={{ fontFamily:'Barlow Condensed,sans-serif', fontWeight:900, fontSize:22, color:'rgba(245,240,232,0.92)', letterSpacing:'0.12em', textTransform:'uppercase', lineHeight:1 }}>AURA</div>
            <div style={{ fontFamily:'Share Tech Mono,monospace', fontSize:9, color:'rgba(245,240,232,0.22)', letterSpacing:'0.14em', marginTop:4 }}>SCHOOL OS v2.0</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, overflowY:'auto', padding:'8px 0', position:'relative', zIndex:2 }}>
          {nav.map(({ to, n, label }) => (
            <NavLink key={to} to={to} end={to === '/' || to === '/my'}>
              {({ isActive }) => (
                <div style={{
                  display:'flex', alignItems:'center', gap:10,
                  padding:'9px 20px', cursor:'pointer',
                  borderLeft: isActive ? '3px solid rgba(245,240,232,0.85)' : '3px solid transparent',
                  background: isActive ? 'rgba(245,240,232,0.08)' : 'transparent',
                  transition:'background 0.15s, border-color 0.15s, padding-left 0.15s',
                  position:'relative', overflow:'hidden',
                }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background='rgba(245,240,232,0.05)'; e.currentTarget.style.paddingLeft='24px' } }}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background='transparent'; e.currentTarget.style.paddingLeft='20px' } }}>
                  <span style={{ fontFamily:'Share Tech Mono,monospace', fontSize:9, color: isActive ? 'rgba(245,240,232,0.5)' : 'rgba(245,240,232,0.2)', minWidth:18, flexShrink:0, transition:'color 0.15s' }}>{n}</span>
                  <span style={{ fontFamily:'Barlow Condensed,sans-serif', fontWeight:700, fontSize:13, letterSpacing:'0.04em', textTransform:'uppercase', color: isActive ? 'rgba(245,240,232,0.95)' : 'rgba(245,240,232,0.5)', flex:1, transition:'color 0.15s' }}>{label}</span>
                  {to === '/schedule-requests' && pending > 0 && (
                    <span className="badge-pulse" style={{ background:'var(--red)', color:'#fff', fontFamily:'Share Tech Mono,monospace', fontSize:9, padding:'1px 6px', borderRadius:2 }}>{pending}</span>
                  )}
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User panel */}
        <div style={{ padding:'12px 20px', borderTop:'1px solid rgba(245,240,232,0.07)', position:'relative', zIndex:2 }}>
          {/* Theme toggle */}
          <ThemeToggle />

          <div style={{ marginBottom:10 }}>
            <div style={{ fontFamily:'Share Tech Mono,monospace', fontSize:9, color:'rgba(245,240,232,0.22)', letterSpacing:'0.1em', marginBottom:4 }}>SIGNED IN AS</div>
            <div style={{ fontFamily:'Barlow,sans-serif', fontSize:12, color:'rgba(245,240,232,0.6)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.email}</div>
            <div style={{ display:'inline-block', marginTop:5, fontFamily:'Barlow Condensed,sans-serif', fontWeight:800, fontSize:10, letterSpacing:'0.1em', textTransform:'uppercase', color:'rgba(245,240,232,0.85)', background:'rgba(245,240,232,0.1)', padding:'2px 8px', border:'1px solid rgba(245,240,232,0.15)' }}>
              {ROLE_MN[user?.role]}
            </div>
          </div>
          <button onClick={handleLogout}
            style={{ width:'100%', background:'transparent', border:'1px solid rgba(245,240,232,0.15)', padding:'7px 12px', cursor:'pointer', fontFamily:'Barlow Condensed,sans-serif', fontWeight:700, fontSize:11, letterSpacing:'0.1em', textTransform:'uppercase', color:'rgba(245,240,232,0.4)', transition:'all 0.18s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(184,50,50,0.6)'; e.currentTarget.style.color='rgba(224,100,100,0.9)'; e.currentTarget.style.background='rgba(184,50,50,0.08)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(245,240,232,0.15)'; e.currentTarget.style.color='rgba(245,240,232,0.4)'; e.currentTarget.style.background='transparent' }}>
            ← ГАРАХ
          </button>
        </div>

        {/* Bottom accent */}
        <div style={{ height:3, background:'linear-gradient(to right, transparent, var(--blue-light), var(--blue))', flexShrink:0, position:'relative', zIndex:2 }} />
      </aside>

      {/* ── MAIN ── */}
      <main style={{ marginLeft:220, flex:1, minWidth:0, background:'var(--bg-page)', minHeight:'100vh', transition:'background 0.3s' }}>
        <Outlet />
      </main>
    </div>
  )
}
