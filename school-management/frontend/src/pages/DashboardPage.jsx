import { useState, useEffect } from 'react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { PageHeader, StatCard, BarGraph, SkeletonCards } from '../components/UI'

/* Decorative SVG hero strip */
function HeroStrip() {
  return (
    <div style={{ position:'relative', marginBottom:24, overflow:'hidden', height:72, background:'var(--navy)', display:'flex', alignItems:'center' }}>
      {/* Full-width geometric SVG */}
      <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%' }} preserveAspectRatio="none" viewBox="0 0 1200 72" fill="none">
        {/* Grid lines */}
        {[0,60,120,180,240,300,360,420,480,540,600,660,720,780,840,900,960,1020,1080,1140,1200].map(x => (
          <line key={x} x1={x} y1="0" x2={x} y2="72" stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
        ))}
        {[0,24,48,72].map(y => (
          <line key={y} x1="0" y1={y} x2="1200" y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
        ))}
        {/* Diagonal accent bars */}
        <polygon points="0,72 120,0 160,0 40,72" fill="rgba(34,81,204,0.25)"/>
        <polygon points="180,72 280,0 310,0 210,72" fill="rgba(34,81,204,0.12)"/>
        <polygon points="340,72 420,0 440,0 360,72" fill="rgba(34,81,204,0.08)"/>
        {/* Right side circles */}
        <circle cx="1140" cy="36" r="50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
        <circle cx="1140" cy="36" r="32" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>
        <circle cx="1140" cy="36" r="14" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
        <circle cx="1140" cy="36" r="3" fill="rgba(59,110,245,0.6)"/>
        {/* Data dots row */}
        {[500,540,560,590,620,650,680,720,760,800,840,880].map((x,i) => (
          <circle key={x} cx={x} cy={36 - Math.sin(i * 0.8) * 14} r="2" fill={`rgba(59,110,245,${0.3 + i*0.05})`}/>
        ))}
        {/* Connecting line for dots */}
        <polyline
          points="500,36 540,22 560,42 590,28 620,18 650,32 680,20 720,38 760,24 800,36 840,28 880,36"
          fill="none" stroke="rgba(59,110,245,0.4)" strokeWidth="1.5" strokeLinejoin="round"/>
      </svg>
      {/* Text content */}
      <div style={{ position:'relative', zIndex:2, padding:'0 24px', display:'flex', alignItems:'center', gap:20 }}>
        <div style={{ width:2, height:36, background:'var(--blue)' }}/>
        <div>
          <div style={{ fontFamily:'Share Tech Mono,monospace', fontSize:9, color:'rgba(245,240,232,0.35)', letterSpacing:'0.18em', marginBottom:4 }}>REAL-TIME OVERVIEW</div>
          <div style={{ fontFamily:'Barlow Condensed,sans-serif', fontWeight:900, fontSize:22, color:'var(--beige)', textTransform:'uppercase', letterSpacing:'0.02em' }}>
            Сургуулийн удирдлагын систем
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats]         = useState(null)
  const [gradeData, setGradeData] = useState([])
  const [attData, setAttData]     = useState({ present:0, absent:0, late:0, total:0 })
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/students?limit=1'),
      api.get('/teachers?limit=1'),
      api.get('/courses?limit=1'),
      api.get('/grades'),
      api.get('/enrollments'),
      api.get('/attendance'),
    ]).then(([s,t,c,g,e,a]) => {
      setStats({
        students:    s.data.meta?.total ?? 0,
        teachers:    t.data.meta?.total ?? 0,
        courses:     c.data.meta?.total ?? 0,
        grades:      g.data.total ?? 0,
        enrollments: e.data.total ?? 0,
      })
      const dist = { A:0,B:0,C:0,D:0,F:0 }
      ;(g.data.data||[]).forEach(gr => { if(dist[gr.grade]!==undefined) dist[gr.grade]++ })
      setGradeData(Object.entries(dist).map(([name,value]) => ({name,value})))

      const att = a.data.data || []
      const present = att.filter(x => x.status==='PRESENT').length
      const absent  = att.filter(x => x.status==='ABSENT').length
      const late    = att.filter(x => x.status==='LATE').length
      setAttData({ present, absent, late, total:att.length })
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const ROLE_MN = { ADMIN:'ADMIN', TEACHER:'БАГШ', STUDENT:'СУРАГЧ' }
  const attRate = attData.total > 0 ? Math.round((attData.present / attData.total) * 100) : 0

  return (
    <div>
      <HeroStrip />

      <div className="page" style={{ paddingTop:0 }}>
        <PageHeader
          eyebrow="ЕРӨНХИЙ ТОЙМ"
          titleMain="DASH"
          titleDim="BOARD"
          action={
            <div style={{ textAlign:'right' }}>
              <div className="t-label" style={{ marginBottom:6 }}>SIGNED IN AS</div>
              <div style={{ fontFamily:'Barlow,sans-serif', fontSize:13, color:'var(--text-main)', fontWeight:500 }}>{user?.email}</div>
              <div className="badge badge-navy" style={{ marginTop:6 }}>{ROLE_MN[user?.role]}</div>
            </div>
          }
        />

        {/* STAT CARDS */}
        {loading ? <SkeletonCards n={5} /> : (
          <div className="anim-fade" style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12, marginBottom:20 }}>
            <StatCard label="Сурагчид"    value={stats.students}    dark delay={0.00} ring={stats.students} ringMax={300}/>
            <StatCard label="Багш нар"    value={stats.teachers}    delay={0.06} ring={stats.teachers} ringMax={50}/>
            <StatCard label="Хичээлүүд"  value={stats.courses}     delay={0.09} ring={stats.courses} ringMax={30}/>
            <StatCard label="Дүнгүүд"    value={stats.grades}      delay={0.12} ring={stats.grades} ringMax={500}/>
            <StatCard label="Бүртгэлүүд"  value={stats.enrollments} delay={0.15} ring={stats.enrollments} ringMax={600}/>
          </div>
        )}

        {/* CHARTS */}
        {!loading && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>

            {/* Grade distribution bar chart */}
            <div className="card anim-fade" style={{ animationDelay:'0.2s', position:'relative', overflow:'hidden' }}>
              {/* Decorative background SVG */}
              <svg style={{ position:'absolute', bottom:0, right:0, opacity:0.04, pointerEvents:'none' }} width="120" height="120" viewBox="0 0 120 120">
                <circle cx="120" cy="120" r="100" fill="none" stroke="var(--navy)" strokeWidth="1"/>
                <circle cx="120" cy="120" r="70"  fill="none" stroke="var(--navy)" strokeWidth="1"/>
                <circle cx="120" cy="120" r="40"  fill="none" stroke="var(--navy)" strokeWidth="1"/>
              </svg>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, position:'relative' }}>
                <div>
                  <div className="t-label" style={{ marginBottom:4 }}>СТАТИСТИК</div>
                  <div style={{ fontFamily:'Barlow Condensed,sans-serif', fontWeight:900, fontSize:20, textTransform:'uppercase', color:'var(--text-main)' }}>ДҮНГИЙН ТАРХАЛТ</div>
                </div>
                <div style={{ width:3, height:24, background:'var(--navy)' }}/>
              </div>
              <BarGraph data={gradeData} height={180} />
            </div>

            {/* Attendance + grade breakdown on dark card */}
            <div className="card-navy anim-fade" style={{ animationDelay:'0.26s', position:'relative', overflow:'hidden' }}>
              {/* Background grid SVG */}
              <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:1, pointerEvents:'none' }} preserveAspectRatio="none">
                {[0,40,80,120,160,200,240].map(y => (
                  <line key={y} x1="0" y1={y} x2="100%" y2={y} stroke="rgba(255,255,255,0.03)" strokeWidth="1"/>
                ))}
                {/* Diagonal accent */}
                <line x1="0" y1="100%" x2="100%" y2="0" stroke="rgba(255,255,255,0.03)" strokeWidth="1"/>
              </svg>

              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, position:'relative' }}>
                <div>
                  <div className="t-label" style={{ color:'rgba(245,240,232,0.3)', marginBottom:4 }}>МЭДЭЭЛЭЛ</div>
                  <div style={{ fontFamily:'Barlow Condensed,sans-serif', fontWeight:900, fontSize:20, textTransform:'uppercase', color:'var(--beige)' }}>ДҮНГИЙН ХАРЬЦАА</div>
                </div>
                {/* Attendance ring */}
                <div style={{ position:'relative' }}>
                  <svg width="64" height="64" viewBox="0 0 64 64">
                    <circle cx="32" cy="32" r="27" fill="none" stroke="rgba(245,240,232,0.08)" strokeWidth="5"/>
                    <circle cx="32" cy="32" r="27" fill="none" stroke="rgba(245,240,232,0.55)" strokeWidth="5"
                      strokeDasharray={`${attRate / 100 * 2 * Math.PI * 27} ${2 * Math.PI * 27}`}
                      strokeDashoffset={2 * Math.PI * 27 * 0.25}
                      strokeLinecap="square"
                    />
                    <text x="32" y="32" textAnchor="middle" dominantBaseline="central"
                      fontFamily="Barlow Condensed,sans-serif" fontWeight="900" fontSize="14" fill="rgba(245,240,232,0.8)">
                      {attRate}%
                    </text>
                  </svg>
                  <div style={{ fontFamily:'Share Tech Mono,monospace', fontSize:8, color:'rgba(245,240,232,0.3)', letterSpacing:'0.1em', textAlign:'center', marginTop:2 }}>ИРЦ</div>
                </div>
              </div>

              <div style={{ position:'relative' }}>
                {gradeData.map((d,i) => {
                  const max   = Math.max(...gradeData.map(x => x.value), 1)
                  const pct   = max > 0 ? (d.value / max) * 100 : 0
                  const colors= ['rgba(245,240,232,0.85)','rgba(144,170,221,0.85)','rgba(96,128,187,0.85)','rgba(245,240,232,0.4)','rgba(245,240,232,0.18)']
                  return (
                    <div key={d.name} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                      <span style={{ fontFamily:'Barlow Condensed,sans-serif', fontWeight:800, fontSize:13, color:'rgba(245,240,232,0.55)', width:18 }}>{d.name}</span>
                      <div style={{ flex:1, background:'rgba(245,240,232,0.07)', height:8, position:'relative' }}>
                        <div style={{ height:'100%', width:`${pct}%`, background:colors[i], transition:'width 0.7s cubic-bezier(.4,0,.2,1)' }}>
                          {/* Hatch on bar */}
                          <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:0.2 }} preserveAspectRatio="none">
                            {[0,8,16,24].map(x => <line key={x} x1={x} y1="0" x2={x-8} y2="100%" stroke="white" strokeWidth="3"/>)}
                          </svg>
                        </div>
                      </div>
                      <span style={{ fontFamily:'Share Tech Mono,monospace', fontSize:9, color:'rgba(245,240,232,0.3)', width:24, textAlign:'right' }}>{d.value}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Attendance mini strip */}
        {!loading && attData.total > 0 && (
          <div className="anim-fade" style={{ animationDelay:'0.32s', marginBottom:20, background:'var(--bg-card)', border:'1.5px solid var(--border-light)', padding:'16px 20px', position:'relative', overflow:'hidden' }}>
            {/* SVG background */}
            <svg style={{ position:'absolute', right:0, top:0, height:'100%', opacity:0.04, pointerEvents:'none' }} width="200" viewBox="0 0 200 80">
              {[20,50,80,110,140,170,200].map(x => <line key={x} x1={x} y1="0" x2={x} y2="80" stroke="var(--navy)" strokeWidth="1"/>)}
            </svg>
            <div style={{ display:'flex', alignItems:'center', gap:24, position:'relative' }}>
              <div>
                <div className="t-label" style={{ marginBottom:4 }}>ИРЦИЙН ДҮГНЭЛТ</div>
                <div style={{ fontFamily:'Barlow Condensed,sans-serif', fontWeight:900, fontSize:32, color:'var(--text-main)', lineHeight:1 }}>{attRate}%</div>
              </div>
              <div style={{ flex:1 }}>
                {[
                  { label:'ИРСЭН',    val:attData.present, max:attData.total, color:'var(--text-main)' },
                  { label:'ИРЭЭГҮЙ', val:attData.absent,  max:attData.total, color:'var(--red)' },
                  { label:'ХОЦОРСОН',val:attData.late,    max:attData.total, color:'var(--amber)' },
                ].map(r => (
                  <div key={r.label} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
                    <div style={{ fontFamily:'Share Tech Mono,monospace', fontSize:9, color:'var(--text-muted)', letterSpacing:'0.08em', width:72 }}>{r.label}</div>
                    <div style={{ flex:1, background:'var(--beige-mid)', height:7, position:'relative' }}>
                      <div style={{ position:'absolute', top:0, left:0, height:'100%', width:`${r.max>0?(r.val/r.max)*100:0}%`, background:r.color, transition:'width 0.7s' }}/>
                    </div>
                    <div style={{ fontFamily:'Barlow Condensed,sans-serif', fontWeight:800, fontSize:14, color:'var(--text-main)', minWidth:30, textAlign:'right' }}>{r.val}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Info row */}
        {!loading && (
          <div className="anim-fade" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, animationDelay:'0.36s' }}>
            {[
              { idx:'A', label:'Таны эрх',  val:ROLE_MN[user?.role] || user?.role },
              { idx:'B', label:'И-мэйл',    val:user?.email },
              { idx:'C', label:'Систем',    val:'School Manager v2.0' },
            ].map(item => (
              <div key={item.idx} className="card" style={{ display:'flex', alignItems:'flex-start', gap:12, position:'relative', overflow:'hidden' }}>
                {/* Corner SVG accent */}
                <svg style={{ position:'absolute', top:0, left:0, opacity:0.06 }} width="40" height="40" viewBox="0 0 40 40">
                  <line x1="0" y1="40" x2="40" y2="0" stroke="var(--navy)" strokeWidth="1"/>
                  <line x1="0" y1="20" x2="20" y2="0" stroke="var(--navy)" strokeWidth="0.5"/>
                </svg>
                <div style={{ width:34, height:34, background:'var(--navy)', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Barlow Condensed,sans-serif', fontWeight:900, fontSize:17, color:'var(--beige)' }}>{item.idx}</div>
                <div style={{ minWidth:0 }}>
                  <div className="t-label" style={{ marginBottom:4 }}>{item.label}</div>
                  <div style={{ fontFamily:'Barlow Condensed,sans-serif', fontWeight:800, fontSize:14, color:'var(--text-main)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.val}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
