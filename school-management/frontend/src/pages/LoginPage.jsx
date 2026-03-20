import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Spinner } from '../components/UI'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [show, setShow]         = useState(false)
  const { login }  = useAuth()
  const navigate   = useNavigate()

  const submit = async e => {
    e.preventDefault(); setError(''); setLoading(true)
    try { await login(email, password); navigate('/') }
    catch (err) { setError(err.response?.data?.error || 'Нэвтрэхэд алдаа гарлаа') }
    finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', background:'var(--bg-page)' }}>

      {/* ── LEFT: NAVY PANEL ── */}
      <div style={{ flex:1, background:'var(--navy)', position:'relative', overflow:'hidden', display:'flex', flexDirection:'column' }}>
        {/* Rich SVG geometric backdrop */}
        <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none' }} preserveAspectRatio="none" viewBox="0 0 600 900">
          {/* Fine grid */}
          <defs>
            <pattern id="micro" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M30 0L0 0 0 30" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="600" height="900" fill="url(#micro)"/>
          {/* Big diagonal slabs */}
          <polygon points="0,900 200,0 240,0 40,900" fill="rgba(34,81,204,0.18)"/>
          <polygon points="260,900 420,0 450,0 290,900" fill="rgba(34,81,204,0.08)"/>
          {/* Concentric circles — center right */}
          <circle cx="580" cy="450" r="320" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
          <circle cx="580" cy="450" r="220" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
          <circle cx="580" cy="450" r="120" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
          <circle cx="580" cy="450" r="50"  fill="none" stroke="rgba(59,110,245,0.2)" strokeWidth="1"/>
          <circle cx="580" cy="450" r="8"   fill="rgba(59,110,245,0.4)"/>
          {/* Data sparkline across middle */}
          <polyline points="0,560 60,540 120,570 180,530 240,550 300,520 360,545 420,510 480,535 540,515 600,530"
            fill="none" stroke="rgba(59,110,245,0.35)" strokeWidth="1.5" strokeLinejoin="round"/>
          {/* Dots on sparkline */}
          {[60,180,300,420,540].map((x,i) => {
            const ys = [540,530,520,510,515]
            return <circle key={x} cx={x} cy={ys[i]} r="3" fill={`rgba(59,110,245,${0.4+i*0.08})`}/>
          })}
          {/* Cross hairs top-left */}
          <line x1="60" y1="20" x2="60" y2="100" stroke="rgba(255,255,255,0.07)" strokeWidth="1"/>
          <line x1="20" y1="60" x2="100" y2="60" stroke="rgba(255,255,255,0.07)" strokeWidth="1"/>
          <circle cx="60" cy="60" r="4" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1"/>
          {/* Bottom left corner marks */}
          <line x1="0" y1="820" x2="40" y2="820" stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
          <line x1="0" y1="820" x2="0" y2="860" stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
        </svg>
        {/* Right accent stripe */}
        <div style={{ position:'absolute', top:0, right:0, width:3, height:'100%', background:'linear-gradient(to bottom, var(--blue), rgba(59,110,245,0.3), transparent)' }} />
        {/* Giant ghost text */}
        <div style={{ position:'absolute', bottom:-50, left:-10, fontFamily:'Barlow Condensed,sans-serif', fontWeight:900, fontSize:'clamp(120px,16vw,240px)', lineHeight:1, color:'transparent', WebkitTextStroke:'1px rgba(245,240,232,0.04)', textTransform:'uppercase', userSelect:'none', pointerEvents:'none', letterSpacing:'-0.03em', whiteSpace:'nowrap' }}>AURA</div>

        {/* Top bar */}
        <div style={{ padding:'22px 36px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid rgba(245,240,232,0.07)', position:'relative', zIndex:10 }}>
          <div style={{ fontFamily:'Barlow Condensed,sans-serif', fontWeight:900, fontSize:22, color:'var(--beige)', letterSpacing:'0.14em', textTransform:'uppercase' }}>AURA</div>
          <div style={{ fontFamily:'Share Tech Mono,monospace', fontSize:9, color:'rgba(245,240,232,0.25)', letterSpacing:'0.12em' }}>SCHOOL OS v2.0</div>
        </div>

        {/* Main content */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center', padding:'40px 52px 60px', position:'relative', zIndex:10 }}>
          <div style={{ fontFamily:'Share Tech Mono,monospace', fontSize:9, color:'rgba(245,240,232,0.3)', letterSpacing:'0.18em', textTransform:'uppercase', marginBottom:24 }}>◼ СУРГАЛТЫН УДИРДЛАГА</div>
          <h1 style={{ fontFamily:'Barlow Condensed,sans-serif', fontWeight:900, fontSize:'clamp(52px,6vw,88px)', color:'var(--beige)', lineHeight:0.9, textTransform:'uppercase', letterSpacing:'-0.02em' }}>
            SCHOOL<br/>
            <span style={{ color:'rgba(245,240,232,0.28)' }}>MANAGE</span><br/>
            MENT.
          </h1>
          <div style={{ display:'flex', alignItems:'center', gap:12, margin:'28px 0' }}>
            <div style={{ height:2, width:36, background:'var(--blue)' }} />
            <div style={{ height:1, flex:1, background:'rgba(245,240,232,0.07)' }} />
          </div>
          {[['01','Сурагчийг хичээлд бүртгэх'],['02','Дүн, ирцийн мэдээлэл'],['03','JWT хамгаалалттай API']].map(([n,t]) => (
            <div key={n} style={{ display:'flex', alignItems:'center', gap:18, padding:'10px 0', borderBottom:'1px solid rgba(245,240,232,0.06)' }}>
              <span style={{ fontFamily:'Share Tech Mono,monospace', fontSize:9, color:'rgba(245,240,232,0.22)', minWidth:20 }}>{n}</span>
              <span style={{ fontFamily:'Barlow,sans-serif', fontSize:13, color:'rgba(245,240,232,0.45)' }}>{t}</span>
            </div>
          ))}
        </div>

        {/* Ticker */}
        <div style={{ borderTop:'1px solid rgba(245,240,232,0.06)', height:32, overflow:'hidden', display:'flex', alignItems:'center', position:'relative', zIndex:10 }}>
          <span className="marquee" style={{ fontFamily:'Share Tech Mono,monospace', fontSize:9, color:'rgba(245,240,232,0.15)', letterSpacing:'0.12em' }}>
            {Array(4).fill('СУРАГЧИД · БАГШ НАР · ХИЧЭЭЛҮҮД · ДҮНГҮҮД · ИРЦИЙН БҮРТГЭЛ · ХУВААРЬ · ').join('')}
          </span>
        </div>
      </div>

      {/* ── RIGHT: FORM ── */}
      <div style={{ width:420, display:'flex', flexDirection:'column', justifyContent:'center', background:'var(--bg-card)', padding:'52px 44px', borderLeft:'1.5px solid var(--border)' }}>
        <div className="anim-fade" style={{ maxWidth:330, margin:'0 auto', width:'100%' }}>

          {/* Logo mark */}
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:44 }}>
            <div style={{ width:40, height:40, background:'var(--navy)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="7" height="7" fill="white" opacity="0.9"/>
                <rect x="14" y="3" width="7" height="7" fill="white" opacity="0.35"/>
                <rect x="3" y="14" width="7" height="7" fill="white" opacity="0.35"/>
                <rect x="14" y="14" width="7" height="7" fill="white" opacity="0.9"/>
              </svg>
            </div>
            <div>
              <div style={{ fontFamily:'Barlow Condensed,sans-serif', fontWeight:900, fontSize:16, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--text-main)', lineHeight:1 }}>School Manager</div>
              <div style={{ fontFamily:'Share Tech Mono,monospace', fontSize:9, color:'var(--text-faint)', letterSpacing:'0.1em', textTransform:'uppercase', marginTop:3 }}>Сургалтын систем</div>
            </div>
          </div>

          <div style={{ marginBottom:30 }}>
            <h2 style={{ fontFamily:'Barlow Condensed,sans-serif', fontWeight:900, fontSize:48, lineHeight:0.9, textTransform:'uppercase', color:'var(--text-main)', marginBottom:12 }}>НЭВТРЭХ</h2>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:22, height:2, background:'var(--blue)' }} />
              <span style={{ fontFamily:'Share Tech Mono,monospace', fontSize:9, color:'var(--text-muted)', letterSpacing:'0.1em' }}>ДАНСАНДАА НЭВТЭРНЭ ҮҮ</span>
            </div>
          </div>

          {error && (
            <div className="anim-slide" style={{ padding:'9px 13px', background:'var(--bg-input)', border:'1.5px solid #e0b0b0', color:'var(--red)', fontFamily:'Barlow,sans-serif', fontSize:13, fontWeight:500, display:'flex', alignItems:'center', gap:8, marginBottom:18 }}>
              <span style={{ fontFamily:'Barlow Condensed,sans-serif', fontWeight:900, fontSize:15 }}>!</span> {error}
            </div>
          )}

          <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div>
              <label className="form-label">И-мэйл</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input" placeholder="user@school.mn" required autoFocus />
            </div>
            <div>
              <label className="form-label">Нууц үг</label>
              <div style={{ position:'relative' }}>
                <input type={show ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className="input" style={{ paddingRight:50 }} placeholder="••••••••" required />
                <button type="button" onClick={() => setShow(v => !v)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontFamily:'Share Tech Mono,monospace', fontSize:9, color:'var(--text-faint)', letterSpacing:'0.06em' }}>
                  {show ? 'HIDE' : 'SHOW'}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width:'100%', marginTop:4, justifyContent:'center' }}>
              {loading ? <><Spinner /> НЭВТЭРЧ БАЙНА</> : 'НЭВТРЭХ →'}
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
  )
}
