/* Skeleton loaders */
export function SkeletonTable({ rows = 6, cols = 4 }) {
  return (
    <div style={{ border:'1.5px solid var(--border-light)', background:'var(--bg-card)' }}>
      <div style={{ background:'var(--navy)', height:38 }} />
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} style={{ display:'flex', gap:14, padding:'11px 14px', borderBottom:'1px solid var(--border-light)', alignItems:'center' }}>
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="skel" style={{ height:11, flex: c === 0 ? 2 : 1 }} />
          ))}
        </div>
      ))}
    </div>
  )
}

export function SkeletonCards({ n = 4 }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:`repeat(${n},1fr)`, gap:12 }}>
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} style={{ background:'var(--bg-card)', border:'1.5px solid var(--border-light)', padding:20 }}>
          <div className="skel" style={{ height:9, width:'40%', marginBottom:12 }} />
          <div className="skel" style={{ height:38, width:'60%', marginBottom:10 }} />
          <div className="skel" style={{ height:3, width:'35%' }} />
        </div>
      ))}
    </div>
  )
}

/* ── SVG Ring — decorative data ring ── */
export function DataRing({ value, max = 100, size = 56, color = 'var(--navy)', bg = 'var(--beige-mid)' }) {
  const r = (size - 6) / 2
  const circ = 2 * Math.PI * r
  const pct  = Math.min(value / max, 1)
  const dash = pct * circ
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink:0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={bg} strokeWidth="4"/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="4"
        strokeDasharray={`${dash} ${circ}`}
        strokeDashoffset={circ * 0.25}
        strokeLinecap="square"
        style={{ transition:'stroke-dasharray 0.8s cubic-bezier(.4,0,.2,1)' }}
      />
    </svg>
  )
}

/* ── SVG Sparkline ── */
export function Sparkline({ values = [], width = 80, height = 28, color = 'var(--navy)' }) {
  if (!values.length) return null
  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const range = max - min || 1
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width
    const y = height - ((v - min) / range) * height
    return `${x},${y}`
  }).join(' ')
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow:'visible' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
      {/* End dot */}
      {values.length > 0 && (() => {
        const lx = width
        const lv = values[values.length - 1]
        const ly = height - ((lv - min) / range) * height
        return <circle cx={lx} cy={ly} r="2.5" fill={color}/>
      })()}
    </svg>
  )
}

/* ── Stat card with SVG ring ── */
export function StatCard({ label, value, dark, delay = 0, ring, ringMax, sparkValues }) {
  return (
    <div className={dark ? 'card-navy' : 'card'} style={{ position:'relative', overflow:'hidden', animationDelay:`${delay}s` }}>
      {/* Decorative corner SVG */}
      <svg style={{ position:'absolute', top:0, right:0, opacity:0.06, pointerEvents:'none' }} width="80" height="80" viewBox="0 0 80 80">
        <circle cx="80" cy="0" r="60" fill="none" stroke={dark ? 'white' : 'var(--navy)'} strokeWidth="1"/>
        <circle cx="80" cy="0" r="40" fill="none" stroke={dark ? 'white' : 'var(--navy)'} strokeWidth="1"/>
        <circle cx="80" cy="0" r="20" fill="none" stroke={dark ? 'white' : 'var(--navy)'} strokeWidth="1"/>
      </svg>

      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div className="t-label" style={{ color: dark ? 'rgba(245,240,232,0.4)' : 'var(--muted)', marginBottom:10 }}>{label}</div>
          <div style={{ fontFamily:'Barlow Condensed,sans-serif', fontWeight:900, fontSize:46, lineHeight:1, color: dark ? 'var(--text-invert)' : 'var(--text-main)' }}>
            {value ?? '—'}
          </div>
        </div>
        {ring !== undefined && (
          <DataRing
            value={ring} max={ringMax || 100} size={52}
            color={dark ? 'rgba(245,240,232,0.7)' : 'var(--navy)'}
            bg={dark ? 'rgba(245,240,232,0.1)' : 'var(--beige-mid)'}
          />
        )}
      </div>

      {sparkValues && sparkValues.length > 1 && (
        <div style={{ marginTop:12 }}>
          <Sparkline values={sparkValues} width={80} height={22}
            color={dark ? 'rgba(245,240,232,0.4)' : 'var(--faint)'} />
        </div>
      )}

      <div style={{ marginTop:14, height:2, width:'36%', background: dark ? 'var(--blue)' : 'var(--border)' }} />
    </div>
  )
}

/* ── Bar graph (vertical, SVG-based) ── */
export function BarGraph({ data, height = 160 }) {
  if (!data?.length) return (
    <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text-faint)', fontFamily:'Share Tech Mono,monospace', fontSize:11, letterSpacing:'0.1em' }}>NO DATA</div>
  )
  const max = Math.max(...data.map(d => d.value), 1)
  const colors = ['var(--navy)','var(--blue)','#4a6ab0','var(--muted)','var(--faint)']
  const LABEL_H = 22

  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:6, height, paddingBottom:LABEL_H, position:'relative' }}>
      {data.map((d, i) => {
        const pct = (d.value / max) * 100
        const barH = Math.max((pct / 100) * (height - LABEL_H - 16), 4)
        return (
          <div key={d.name} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
            <div style={{ fontFamily:'Share Tech Mono,monospace', fontSize:9, color:'var(--text-muted)' }}>{d.value}</div>
            {/* Bar with diagonal hatch pattern */}
            <div style={{ width:'100%', height:barH, background: colors[i % colors.length], position:'relative', overflow:'hidden', transition:'height 0.6s ease' }}>
              {/* Subtle hatch lines on bar */}
              <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:0.15 }} preserveAspectRatio="none">
                {[0,8,16,24,32,40].map(x => (
                  <line key={x} x1={x} y1="0" x2={x-20} y2="100%" stroke="white" strokeWidth="4"/>
                ))}
              </svg>
            </div>
            <div style={{ fontFamily:'Barlow Condensed,sans-serif', fontWeight:800, fontSize:12, color:'var(--text-main)', textTransform:'uppercase' }}>{d.name}</div>
          </div>
        )
      })}
    </div>
  )
}

/* ── Horizontal bar row ── */
export function HBar({ label, value, max, color = 'var(--navy)' }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
      <div style={{ fontFamily:'Barlow Condensed,sans-serif', fontWeight:700, fontSize:12, color:'var(--text-main)', width:24, textAlign:'right', textTransform:'uppercase' }}>{label}</div>
      <div style={{ flex:1, background:'var(--beige-mid)', height:8, position:'relative' }}>
        <div style={{ position:'absolute', left:0, top:0, height:'100%', width:`${pct}%`, background:color, transition:'width 0.6s ease' }} />
      </div>
      <div style={{ fontFamily:'Share Tech Mono,monospace', fontSize:10, color:'var(--text-muted)', width:28, textAlign:'right' }}>{value}</div>
    </div>
  )
}

/* ── Pagination ── */
export function Pagination({ page, totalPages, onPage }) {
  if (totalPages <= 1) return null
  return (
    <div className="pag">
      <span className="pag-info">{page} / {totalPages} ХУУДАС</span>
      <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>← ӨМНӨХ</button>
      <button className="btn btn-ghost btn-sm" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>ДАРААХ →</button>
    </div>
  )
}

/* ── Page header with SVG rule ── */
export function PageHeader({ eyebrow, titleMain, titleDim, meta, action }) {
  return (
    <div className="page-header anim-slide">
      <div style={{ flex:1, minWidth:0 }}>
        {eyebrow && <div className="t-label" style={{ marginBottom:8 }}>{eyebrow}</div>}
        <h1 className="page-title">{titleMain}{titleDim && <span>{titleDim}</span>}</h1>
        {meta && <div className="t-mono" style={{ color:'var(--text-muted)', marginTop:8 }}>{meta}</div>}
      </div>
      {action && <div style={{ flexShrink:0, paddingLeft:16 }}>{action}</div>}
    </div>
  )
}

/* ── Empty state ── */
export function Empty({ text = 'ӨГӨГДӨЛ БАЙХГҮЙ' }) {
  return (
    <div style={{ background:'var(--bg-card)', border:'1.5px solid var(--border-light)', padding:'60px 0', textAlign:'center', position:'relative', overflow:'hidden' }}>
      {/* Decorative background */}
      <svg style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', opacity:0.04, pointerEvents:'none' }} width="200" height="200" viewBox="0 0 200 200">
        <circle cx="100" cy="100" r="90" fill="none" stroke="var(--navy)" strokeWidth="1" strokeDasharray="4 8"/>
        <circle cx="100" cy="100" r="60" fill="none" stroke="var(--navy)" strokeWidth="1" strokeDasharray="2 6"/>
        <circle cx="100" cy="100" r="30" fill="none" stroke="var(--navy)" strokeWidth="1"/>
        <line x1="10" y1="100" x2="190" y2="100" stroke="var(--navy)" strokeWidth="0.5"/>
        <line x1="100" y1="10" x2="100" y2="190" stroke="var(--navy)" strokeWidth="0.5"/>
      </svg>
      <div style={{ fontFamily:'Barlow Condensed,sans-serif', fontWeight:900, fontSize:22, color:'var(--border)', letterSpacing:'0.04em', position:'relative' }}>{text}</div>
    </div>
  )
}

/* ── Inline action buttons ── */
export function ActBtn({ label, danger, onClick }) {
  return (
    <button onClick={onClick} style={{
      fontFamily:'Barlow Condensed,sans-serif', fontWeight:700, fontSize:10,
      letterSpacing:'0.08em', textTransform:'uppercase',
      color: danger ? 'var(--red)' : 'var(--blue)',
      background:'none', border:`1px solid ${danger ? '#e0b0b0' : 'var(--border-light)'}`,
      padding:'3px 9px', cursor:'pointer', transition:'all 0.12s',
    }}
    onMouseEnter={e => { e.currentTarget.style.background = danger ? 'var(--red)' : 'var(--navy)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = danger ? 'var(--red)' : 'var(--navy)' }}
    onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = danger ? 'var(--red)' : 'var(--blue)'; e.currentTarget.style.borderColor = danger ? '#e0b0b0' : 'var(--border-light)' }}>
      {label}
    </button>
  )
}

/* ── Avatar initials square ── */
export function Avatar({ first, last, size = 30 }) {
  return (
    <div style={{ width:size, height:size, background:'var(--navy)', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Barlow Condensed,sans-serif', fontWeight:900, fontSize:size * 0.4, color:'var(--beige)', position:'relative', overflow:'hidden' }}>
      {/* Corner tick marks */}
      <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:0.3 }} viewBox="0 0 30 30">
        <line x1="0" y1="6" x2="0" y2="0" stroke="white" strokeWidth="1.5"/>
        <line x1="0" y1="0" x2="6" y2="0" stroke="white" strokeWidth="1.5"/>
        <line x1="30" y1="24" x2="30" y2="30" stroke="white" strokeWidth="1.5"/>
        <line x1="30" y1="30" x2="24" y2="30" stroke="white" strokeWidth="1.5"/>
      </svg>
      {(first?.[0] || '') + (last?.[0] || '')}
    </div>
  )
}

/* ── Code tag ── */
export function Code({ children }) {
  return (
    <span style={{ fontFamily:'Share Tech Mono,monospace', fontSize:10, background:'var(--beige-mid)', color:'var(--text-main)', padding:'2px 7px', border:'1px solid var(--border)' }}>
      {children}
    </span>
  )
}

/* ── Spinner ── */
export function Spinner() {
  return <span className="spin" style={{ display:'inline-block', width:13, height:13, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'currentColor', borderRadius:'50%' }} />
}
