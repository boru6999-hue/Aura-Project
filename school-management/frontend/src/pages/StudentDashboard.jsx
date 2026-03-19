import { useState, useEffect } from 'react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { PageHeader, SkeletonCards, BarGraph } from '../components/UI'

const DAYS = ['Даваа','Мягмар','Лхагва','Пүрэв','Баасан','Бямба','Ням']
const GRADE_META = { A:{ color:'var(--text-main)', pct:95 }, B:{ color:'var(--blue)', pct:80 }, C:{ color:'var(--text-muted)', pct:65 }, D:{ color:'var(--amber)', pct:50 }, F:{ color:'var(--red)', pct:30 } }

export default function StudentDashboard() {
  const { user } = useAuth()
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.student?.id) return
    const sid = user.student.id
    Promise.all([
      api.get(`/enrollments/student/${sid}`),
      api.get('/grades', { params:{ studentId: sid } }),
      api.get('/attendance', { params:{ studentId: sid } }),
      api.get('/schedules'),
    ]).then(([e, g, a, s]) => {
      setData({
        enrollments: e.data.data || [],
        grades:      g.data.data || [],
        attendance:  a.data.data || [],
        schedules:   s.data.data || [],
      })
    }).catch(console.error).finally(() => setLoading(false))
  }, [user])

  if (loading) return <div className="page"><SkeletonCards n={3} /></div>
  if (!data)   return <div className="page"><div className="t-label">МЭДЭЭЛЭЛ БАЙХГҮЙ</div></div>

  const { enrollments, grades, attendance, schedules } = data
  const present = attendance.filter(a => a.status === 'PRESENT').length
  const absent  = attendance.filter(a => a.status === 'ABSENT').length
  const rate    = attendance.length > 0 ? Math.round((present / attendance.length) * 100) : 0

  const gradeDist = ['A','B','C','D','F'].map(g => ({ name:g, value: grades.filter(r => r.grade === g).length }))
  const avgScore  = grades.length > 0 ? Math.round(grades.reduce((s,g) => s + g.score, 0) / grades.length) : 0

  const mySchedules = schedules.filter(s => enrollments.some(e => e.courseId === s.courseId))

  return (
    <div className="page">
      <PageHeader
        eyebrow="СУРАГЧИЙН ХУУДАС"
        titleMain="МИНИЙ "
        titleDim="ХУУДАС"
        action={
          <div style={{ textAlign:'right' }}>
            <div className="t-label" style={{ marginBottom:5 }}>СУРАГЧ</div>
            <div style={{ fontFamily:'Barlow Condensed,sans-serif', fontWeight:900, fontSize:18, color:'var(--text-main)' }}>{user?.student?.firstName} {user?.student?.lastName}</div>
            <div style={{ fontFamily:'Share Tech Mono,monospace', fontSize:10, color:'var(--text-muted)', marginTop:3 }}>{user?.student?.studentCode}</div>
          </div>
        }
      />

      {/* Stat strip */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
        {[
          { label:'БҮРТГЭЛТЭЙ ХИЧЭЭЛ', val:enrollments.length, dark:true },
          { label:'НИЙТ ДҮН',          val:grades.length },
          { label:'ДУНДАЖ ОНО',        val:avgScore },
          { label:'ИРЦИЙН %',          val:`${rate}%` },
        ].map((s,i) => (
          <div key={i} className={s.dark ? 'card-navy' : 'card'} style={{ padding:18 }}>
            <div className="t-label" style={{ marginBottom:8, color: s.dark ? 'rgba(245,240,232,0.35)' : 'var(--muted)' }}>{s.label}</div>
            <div style={{ fontFamily:'Barlow Condensed,sans-serif', fontWeight:900, fontSize:42, lineHeight:1, color: s.dark ? 'var(--beige)' : 'var(--navy)' }}>{s.val}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
        {/* Grade chart */}
        <div className="card">
          <div className="t-label" style={{ marginBottom:6 }}>ДҮНГИЙН ТАРХАЛТ</div>
          <div style={{ fontFamily:'Barlow Condensed,sans-serif', fontWeight:900, fontSize:18, color:'var(--text-main)', textTransform:'uppercase', marginBottom:14 }}>Дүнгүүд</div>
          <BarGraph data={gradeDist} height={140} />
        </div>

        {/* Attendance */}
        <div className="card-navy" style={{ padding:20 }}>
          <div className="t-label" style={{ color:'rgba(245,240,232,0.3)', marginBottom:6 }}>ИРЦИЙН МЭДЭЭЛЭЛ</div>
          <div style={{ fontFamily:'Barlow Condensed,sans-serif', fontWeight:900, fontSize:18, color:'var(--beige)', textTransform:'uppercase', marginBottom:20 }}>Ирц</div>
          {[
            { label:'ИРСЭН', val:present, color:'var(--beige)', max:attendance.length },
            { label:'ИРЭЭГҮЙ', val:absent, color:'#e08080', max:attendance.length },
            { label:'ХОЦОРСОН', val:attendance.length - present - absent, color:'#c8a860', max:attendance.length },
          ].map(r => (
            <div key={r.label} style={{ marginBottom:14 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                <span style={{ fontFamily:'Share Tech Mono,monospace', fontSize:9, color:'rgba(245,240,232,0.35)', letterSpacing:'0.1em' }}>{r.label}</span>
                <span style={{ fontFamily:'Barlow Condensed,sans-serif', fontWeight:800, fontSize:13, color:'rgba(245,240,232,0.7)' }}>{r.val}</span>
              </div>
              <div style={{ background:'rgba(245,240,232,0.08)', height:6 }}>
                <div style={{ height:'100%', width:`${r.max > 0 ? (r.val/r.max)*100 : 0}%`, background:r.color, transition:'width 0.6s ease' }} />
              </div>
            </div>
          ))}
          <div style={{ marginTop:20, paddingTop:14, borderTop:'1px solid rgba(245,240,232,0.07)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span className="t-label" style={{ color:'rgba(245,240,232,0.25)' }}>НИЙТ ИРЦ</span>
            <span style={{ fontFamily:'Barlow Condensed,sans-serif', fontWeight:900, fontSize:28, color:'var(--beige)' }}>{rate}%</span>
          </div>
        </div>
      </div>

      {/* Enrolled courses */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
        <div className="card">
          <div className="t-label" style={{ marginBottom:10 }}>БҮРТГЭЛТЭЙ ХИЧЭЭЛҮҮД</div>
          {enrollments.length === 0
            ? <div style={{ color:'var(--text-faint)', fontSize:12, fontFamily:'Share Tech Mono,monospace', letterSpacing:'0.1em', padding:'20px 0', textAlign:'center' }}>ХИЧЭЭЛ БАЙХГҮЙ</div>
            : enrollments.map((e, i) => (
              <div key={e.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 0', borderBottom: i < enrollments.length-1 ? '1px solid var(--border-light)' : 'none' }}>
                <div style={{ width:24, height:24, background:'var(--navy)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontFamily:'Barlow Condensed,sans-serif', fontWeight:900, fontSize:11, color:'var(--beige)' }}>{i+1}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontFamily:'Barlow,sans-serif', fontWeight:600, fontSize:13, color:'var(--text-main)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{e.course?.name}</div>
                  <div className="t-label" style={{ marginTop:1 }}>{e.semester} {e.year}</div>
                </div>
                {grades.filter(g => g.courseId === e.courseId).slice(0,1).map(g => (
                  <span key={g.id} style={{ fontFamily:'Barlow Condensed,sans-serif', fontWeight:900, fontSize:18, color:'var(--text-main)' }}>{g.grade}</span>
                ))}
              </div>
            ))
          }
        </div>

        {/* Schedule */}
        <div className="card">
          <div className="t-label" style={{ marginBottom:10 }}>ЦАГИЙН ХУВААРЬ</div>
          {mySchedules.length === 0
            ? <div style={{ color:'var(--text-faint)', fontSize:12, fontFamily:'Share Tech Mono,monospace', letterSpacing:'0.1em', padding:'20px 0', textAlign:'center' }}>ХУВААРЬ БАЙХГҮЙ</div>
            : mySchedules.map((s, i) => (
              <div key={s.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom: i < mySchedules.length-1 ? '1px solid var(--border-light)' : 'none' }}>
                <span className="badge badge-navy" style={{ flexShrink:0, fontSize:9 }}>{DAYS[s.dayOfWeek]}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontFamily:'Barlow,sans-serif', fontWeight:600, fontSize:12, color:'var(--text-main)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.course?.name}</div>
                  <div style={{ fontFamily:'Share Tech Mono,monospace', fontSize:10, color:'var(--text-muted)', marginTop:1 }}>{s.startTime} – {s.endTime}{s.room ? ` · ${s.room}` : ''}</div>
                </div>
              </div>
            ))
          }
        </div>
      </div>

      {/* Grades detail */}
      {grades.length > 0 && (
        <div className="card">
          <div className="t-label" style={{ marginBottom:14 }}>ДҮН ДЭЛГЭРЭНГҮЙ</div>
          <div style={{ background:'var(--bg-card)', border:'1.5px solid var(--border-light)', overflowX:'auto' }}>
            <table className="tbl">
              <thead><tr>{['ХИЧЭЭЛ','ОНО','ДҮН','УЛИРАЛ','ЖИЛ'].map(h => <th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {grades.map(g => (
                  <tr key={g.id}>
                    <td style={{ fontWeight:600 }}>{g.course?.name}</td>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <span style={{ fontFamily:'Share Tech Mono,monospace', fontSize:12, fontWeight:700, color:'var(--text-main)', minWidth:28 }}>{g.score}</span>
                        <div style={{ width:80, background:'var(--beige-mid)', height:5 }}>
                          <div style={{ height:'100%', width:`${g.score}%`, background: GRADE_META[g.grade]?.color || 'var(--navy)' }} />
                        </div>
                      </div>
                    </td>
                    <td><span className="badge badge-navy">{g.grade}</span></td>
                    <td style={{ color:'var(--text-muted)', fontFamily:'Share Tech Mono,monospace', fontSize:11 }}>{g.semester}</td>
                    <td style={{ color:'var(--text-muted)', fontFamily:'Share Tech Mono,monospace', fontSize:11 }}>{g.year}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
