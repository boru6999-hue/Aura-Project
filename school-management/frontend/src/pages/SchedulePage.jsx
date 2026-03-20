import { useState, useEffect, useCallback } from 'react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'
import Modal from '../components/Modal'
import { PageHeader, ActBtn, Spinner } from '../components/UI'

const DAYS       = ['Даваа','Мягмар','Лхагва','Пүрэв','Баасан','Бямба','Ням']
const DAYS_SHORT = ['Да','Мя','Лх','Пү','Ба','Бя','Ня']
const HOURS      = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00']

function timeToMin(t) {
  if (!t) return 0
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

const BLOCK_COLORS = [
  { bg:'#0d1b3e', border:'#142250' },
  { bg:'#1a2d6b', border:'#213680' },
  { bg:'#1e3270', border:'#243d85' },
  { bg:'#2a4490', border:'#3155aa' },
  { bg:'#0f2255', border:'#162b6b' },
  { bg:'#3a2a7a', border:'#4a3a8a' },
  { bg:'#1a3a5a', border:'#2a4a6a' },
]

/* ── Weekly grid ── */
function WeekGrid({ rows, onAdminEdit, onAdminDelete, onTeacherRequest, isAdmin, isTeacher }) {
  const START = 8 * 60
  const END   = 18 * 60
  const TOTAL = END - START
  const ROW_H = 58

  return (
    <div style={{ overflowX:'auto' }}>
      <div style={{ minWidth:680 }}>
        {/* Day headers */}
        <div style={{ display:'grid', gridTemplateColumns:'54px repeat(5,1fr)' }}>
          <div style={{ background:'var(--navy)', height:38 }} />
          {DAYS.slice(0,5).map((d,i) => (
            <div key={i} style={{ background:'var(--navy)', display:'flex', alignItems:'center', justifyContent:'center', borderLeft:'1px solid rgba(245,240,232,0.06)' }}>
              <span style={{ fontFamily:'Barlow Condensed,sans-serif', fontWeight:800, fontSize:11, letterSpacing:'0.12em', textTransform:'uppercase', color:'rgba(245,240,232,0.55)' }}>{d}</span>
            </div>
          ))}
        </div>

        {/* Grid body */}
        <div style={{ display:'grid', gridTemplateColumns:'54px repeat(5,1fr)', background:'var(--bg-card)', border:'1.5px solid var(--border-light)', borderTop:'none' }}>
          {/* Time axis */}
          <div style={{ borderRight:'1.5px solid var(--border-light)' }}>
            {HOURS.map(h => (
              <div key={h} style={{ height:ROW_H, display:'flex', alignItems:'flex-start', paddingTop:5, justifyContent:'flex-end', paddingRight:8, borderBottom:'1px solid var(--border-light)' }}>
                <span style={{ fontFamily:'Share Tech Mono,monospace', fontSize:9, color:'var(--text-faint)' }}>{h}</span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {[0,1,2,3,4].map(dayIdx => {
            const daySlots = rows
              .filter(r => r.dayOfWeek === dayIdx)
              .sort((a,b) => timeToMin(a.startTime) - timeToMin(b.startTime))
            const col = BLOCK_COLORS[dayIdx]

            return (
              <div key={dayIdx} style={{ position:'relative', borderLeft:'1px solid var(--border-light)' }}>
                {/* Hour lines */}
                {HOURS.map(h => (
                  <div key={h} style={{ height:ROW_H, borderBottom:'1px solid var(--border-light)', position:'relative' }}>
                    <div style={{ position:'absolute', bottom:0, left:0, right:0, height:1, background:'var(--beige-mid)', opacity:0.4 }} />
                  </div>
                ))}

                {/* Schedule blocks */}
                {daySlots.map(slot => {
                  const startMin = timeToMin(slot.startTime) - START
                  const endMin   = timeToMin(slot.endTime)   - START
                  const topPct   = (startMin / TOTAL) * 100
                  const hPct     = ((endMin - startMin) / TOTAL) * 100
                  const durMin   = endMin - startMin

                  return (
                    <div key={slot.id} style={{
                      position:'absolute', top:`${topPct}%`, left:3, right:3,
                      height:`calc(${hPct}% - 3px)`,
                      background:col.bg, border:`1.5px solid ${col.border}`,
                      padding:'5px 7px', overflow:'hidden', zIndex:2,
                    }}>
                      {/* Course name */}
                      <div style={{ fontFamily:'Barlow Condensed,sans-serif', fontWeight:800, fontSize:durMin>80?12:10, textTransform:'uppercase', color:'rgba(245,240,232,0.92)', lineHeight:1.1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:durMin>100?'normal':'nowrap' }}>
                        {slot.course?.name}
                      </div>

                      {durMin > 50 && (
                        <div style={{ fontFamily:'Share Tech Mono,monospace', fontSize:8, color:'rgba(245,240,232,0.4)', marginTop:3, lineHeight:1.3 }}>
                          {slot.startTime}–{slot.endTime}
                          {slot.room && <span> · {slot.room}</span>}
                        </div>
                      )}

                      {durMin > 70 && slot.teacher && (
                        <div style={{ fontFamily:'Share Tech Mono,monospace', fontSize:8, color:'rgba(245,240,232,0.3)', marginTop:1 }}>
                          {slot.teacher.firstName} {slot.teacher.lastName}
                        </div>
                      )}

                      {/* Action buttons */}
                      {durMin > 85 && (
                        <div style={{ display:'flex', gap:3, marginTop:5 }}>
                          {isAdmin && (
                            <>
                              <button onClick={() => onAdminEdit(slot)}
                                style={{ fontFamily:'Barlow Condensed,sans-serif', fontWeight:700, fontSize:8, letterSpacing:'0.05em', color:'rgba(245,240,232,0.65)', background:'rgba(245,240,232,0.08)', border:'1px solid rgba(245,240,232,0.15)', padding:'2px 6px', cursor:'pointer', textTransform:'uppercase' }}>
                                ЗАСАХ
                              </button>
                              <button onClick={() => onAdminDelete(slot.id)}
                                style={{ fontFamily:'Barlow Condensed,sans-serif', fontWeight:700, fontSize:8, letterSpacing:'0.05em', color:'rgba(230,140,140,0.75)', background:'rgba(180,50,50,0.1)', border:'1px solid rgba(180,50,50,0.25)', padding:'2px 6px', cursor:'pointer', textTransform:'uppercase' }}>
                                УСТГАХ
                              </button>
                            </>
                          )}
                          {isTeacher && !isAdmin && (
                            <button onClick={() => onTeacherRequest(slot)}
                              style={{ fontFamily:'Barlow Condensed,sans-serif', fontWeight:700, fontSize:8, letterSpacing:'0.05em', color:'rgba(200,220,255,0.75)', background:'rgba(100,150,255,0.1)', border:'1px solid rgba(100,150,255,0.25)', padding:'2px 6px', cursor:'pointer', textTransform:'uppercase' }}>
                              ӨӨРЧЛӨХ
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ── List view ── */
function ListView({ rows, onAdminEdit, onAdminDelete, onTeacherRequest, isAdmin, isTeacher }) {
  const sorted = [...rows].sort((a,b) => a.dayOfWeek - b.dayOfWeek || timeToMin(a.startTime) - timeToMin(b.startTime))
  return (
    <div style={{ background:'var(--bg-card)', border:'1.5px solid var(--border-light)', overflowX:'auto' }}>
      <table className="tbl">
        <thead>
          <tr>
            {['ӨДӨР','ХИЧЭЭЛ','КОД','БАГШ','ЦАГ','ӨРӨӨ','УЛИРАЛ','ҮЙЛДЭЛ'].map(h => <th key={h}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 ? (
            <tr>
              <td colSpan={8} style={{ textAlign:'center', padding:'48px 0', fontFamily:'Share Tech Mono,monospace', fontSize:11, color:'var(--text-faint)', letterSpacing:'0.12em' }}>
                ХУВААРЬ БАЙХГҮЙ
              </td>
            </tr>
          ) : sorted.map(r => (
            <tr key={r.id}>
              <td>
                <span className="badge badge-navy" style={{ fontSize:9 }}>
                  {DAYS_SHORT[r.dayOfWeek] ?? r.dayOfWeek}
                </span>
              </td>
              <td style={{ fontWeight:600, maxWidth:180 }}>
                <div style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.course?.name}</div>
              </td>
              <td>
                <span style={{ fontFamily:'Share Tech Mono,monospace', fontSize:10, background:'var(--beige-mid)', color:'var(--text-main)', padding:'2px 7px', border:'1px solid var(--border)' }}>
                  {r.course?.courseCode}
                </span>
              </td>
              <td style={{ color:'var(--text-muted)', fontSize:12 }}>
                {r.teacher ? `${r.teacher.firstName} ${r.teacher.lastName}` : '—'}
              </td>
              <td style={{ fontFamily:'Share Tech Mono,monospace', fontSize:11, whiteSpace:'nowrap' }}>
                {r.startTime} – {r.endTime}
              </td>
              <td style={{ color:'var(--text-muted)', fontSize:12 }}>{r.room || '—'}</td>
              <td><span className="badge badge-beige">{r.semester} {r.year}</span></td>
              <td>
                <div style={{ display:'flex', gap:6 }}>
                  {isAdmin && (
                    <>
                      <ActBtn label="ЗАСАХ"  onClick={() => onAdminEdit(r)} />
                      <ActBtn label="УСТГАХ" danger onClick={() => onAdminDelete(r.id)} />
                    </>
                  )}
                  {isTeacher && !isAdmin && (
                    <ActBtn label="ӨӨРЧЛӨХ ХҮСЭЛТ" onClick={() => onTeacherRequest(r)} />
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ── Teacher change request modal ── */
function ChangeRequestModal({ slot, onClose, onSent }) {
  const { show: toast } = useToast()
  const [form, setForm] = useState({
    dayOfWeek:  slot.dayOfWeek,
    startTime:  slot.startTime,
    endTime:    slot.endTime,
    room:       slot.room || '',
    note:       '',
  })
  const [saving, setSaving] = useState(false)

  const submit = async e => {
    e.preventDefault(); setSaving(true)
    try {
      await api.post('/schedule-requests', {
        scheduleId:   slot.id,
        courseId:     slot.courseId,
        dayOfWeek:    Number(form.dayOfWeek),
        startTime:    form.startTime,
        endTime:      form.endTime,
        room:         form.room || null,
        semester:     slot.semester,
        year:         slot.year,
        note:         form.note || null,
        // Pass old values so admin can see the diff
        oldDayOfWeek: slot.dayOfWeek,
        oldStartTime: slot.startTime,
        oldEndTime:   slot.endTime,
        oldRoom:      slot.room || null,
      })
      toast('Хүсэлт илгээгдлээ. Админ шийдвэрлэнэ.', 'success')
      onSent()
    } catch (err) {
      toast(err.response?.data?.error || 'Алдаа гарлаа', 'error')
    } finally { setSaving(false) }
  }

  const changed = form.dayOfWeek !== slot.dayOfWeek ||
    form.startTime !== slot.startTime ||
    form.endTime   !== slot.endTime   ||
    form.room      !== (slot.room || '')

  return (
    <Modal title="Хуваарь өөрчлөх хүсэлт" onClose={onClose}>
      <form onSubmit={submit} style={{ display:'contents' }}>

        {/* Current values */}
        <div style={{ background:'var(--bg-page)', border:'1.5px solid var(--border)', padding:14 }}>
          <div className="t-label" style={{ marginBottom:8 }}>ОДООГИЙН ХУВААРЬ</div>
          <div style={{ fontFamily:'Barlow Condensed,sans-serif', fontWeight:800, fontSize:17, color:'var(--text-main)', textTransform:'uppercase', marginBottom:5 }}>
            {slot.course?.name}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
            <div>
              <div className="t-label" style={{ marginBottom:3 }}>ӨДӨР</div>
              <div style={{ fontFamily:'Barlow Condensed,sans-serif', fontWeight:700, fontSize:14, color:'var(--text-main)' }}>{DAYS[slot.dayOfWeek]}</div>
            </div>
            <div>
              <div className="t-label" style={{ marginBottom:3 }}>ЦАГ</div>
              <div style={{ fontFamily:'Share Tech Mono,monospace', fontSize:12, color:'var(--text-main)' }}>{slot.startTime}–{slot.endTime}</div>
            </div>
            <div>
              <div className="t-label" style={{ marginBottom:3 }}>ӨРӨӨ</div>
              <div style={{ fontFamily:'Share Tech Mono,monospace', fontSize:12, color:'var(--text-main)' }}>{slot.room || '—'}</div>
            </div>
          </div>
        </div>

        {/* New values */}
        <div>
          <div className="t-label" style={{ marginBottom:10 }}>ШИНЭ ХУВААРЬ (өөрчлөх хэсгийг л өөрчлөнө үү)</div>

          <div style={{ marginBottom:12 }}>
            <label className="form-label">Өдөр</label>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:6 }}>
              {DAYS.slice(0,5).map((d,i) => (
                <button key={i} type="button"
                  onClick={() => setForm({...form, dayOfWeek:i})}
                  style={{
                    padding:'7px 4px',
                    fontFamily:'Barlow Condensed,sans-serif', fontWeight:800, fontSize:11,
                    letterSpacing:'0.04em', textTransform:'uppercase', cursor:'pointer',
                    border:'1.5px solid var(--border)', transition:'all 0.12s',
                    background: Number(form.dayOfWeek)===i ? 'var(--navy)' : 'transparent',
                    color:      Number(form.dayOfWeek)===i ? 'var(--beige)' : 'var(--muted)',
                    borderColor:Number(form.dayOfWeek)===i ? 'var(--navy)' : 'var(--border)',
                  }}>
                  {d.slice(0,2)}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
            <div>
              <label className="form-label">Эхлэх цаг</label>
              <input className="input" type="time" value={form.startTime} onChange={e=>setForm({...form,startTime:e.target.value})} />
            </div>
            <div>
              <label className="form-label">Дуусах цаг</label>
              <input className="input" type="time" value={form.endTime} onChange={e=>setForm({...form,endTime:e.target.value})} />
            </div>
          </div>

          <div style={{ marginBottom:12 }}>
            <label className="form-label">Өрөө</label>
            <input className="input" value={form.room} onChange={e=>setForm({...form,room:e.target.value})} placeholder="А-101" />
          </div>

          <div>
            <label className="form-label">Өөрчлөлтийн шалтгаан *</label>
            <textarea className="input" rows={3} style={{ resize:'none' }}
              placeholder="Яагаад өөрчлөх шаардлагатай болсноо тайлбарлана уу..."
              value={form.note} onChange={e=>setForm({...form,note:e.target.value})} required />
          </div>
        </div>

        {/* Diff preview */}
        {changed && (
          <div style={{ background:'var(--bg-input)', border:'1.5px solid #b3c5f5', padding:12 }}>
            <div style={{ fontFamily:'Barlow Condensed,sans-serif', fontWeight:700, fontSize:11, letterSpacing:'0.06em', color:'#1a3a99', marginBottom:8 }}>ӨӨРЧЛӨЛТИЙН ХАРЬЦУУЛАЛТ</div>
            {form.dayOfWeek !== slot.dayOfWeek && (
              <div style={{ fontFamily:'Share Tech Mono,monospace', fontSize:10, color:'#2a4a99', marginBottom:4 }}>
                ӨДӨР: {DAYS[slot.dayOfWeek]} → {DAYS[form.dayOfWeek]}
              </div>
            )}
            {(form.startTime !== slot.startTime || form.endTime !== slot.endTime) && (
              <div style={{ fontFamily:'Share Tech Mono,monospace', fontSize:10, color:'#2a4a99', marginBottom:4 }}>
                ЦАГ: {slot.startTime}–{slot.endTime} → {form.startTime}–{form.endTime}
              </div>
            )}
            {form.room !== (slot.room || '') && (
              <div style={{ fontFamily:'Share Tech Mono,monospace', fontSize:10, color:'#2a4a99' }}>
                ӨРӨӨ: {slot.room || '—'} → {form.room || '—'}
              </div>
            )}
          </div>
        )}

        <div style={{ background:'var(--bg-input)', border:'1.5px solid #e8c870', padding:10 }}>
          <div style={{ fontFamily:'Barlow Condensed,sans-serif', fontWeight:700, fontSize:11, color:'var(--amber)', letterSpacing:'0.06em', marginBottom:3 }}>АНХААРУУЛГА</div>
          <div style={{ fontFamily:'Barlow,sans-serif', fontSize:12, color:'#6a4a00', lineHeight:1.5 }}>
            Энэ хүсэлт администратор руу илгээгдэх бөгөөд зөвшөөрөгдсний дараа л хуваарь өөрчлөгдөнө.
          </div>
        </div>

        <div style={{ display:'flex', gap:10, paddingTop:4 }}>
          <button type="submit" disabled={saving || !form.note.trim() || !changed}
            className="btn btn-primary" style={{ flex:1 }}>
            {saving ? <Spinner /> : 'ХҮСЭЛТ ИЛГЭЭХ →'}
          </button>
          <button type="button" onClick={onClose} className="btn btn-ghost" style={{ flex:1 }}>БОЛИХ</button>
        </div>
      </form>
    </Modal>
  )
}

/* ── Admin add/edit modal ── */
function AdminModal({ item, courses, teachers, onClose, onSave }) {
  const [form, setForm] = useState(item ? {
    courseId:  item.courseId,
    teacherId: item.teacherId || '',
    dayOfWeek: item.dayOfWeek,
    startTime: item.startTime,
    endTime:   item.endTime,
    room:      item.room || '',
    semester:  item.semester,
    year:      item.year,
  } : {
    courseId:'', teacherId:'', dayOfWeek:0, startTime:'08:00', endTime:'09:40', room:'', semester:'Spring', year:new Date().getFullYear(),
  })
  const [saving, setSaving] = useState(false)
  const { show: toast } = useToast()

  const submit = async e => {
    e.preventDefault(); setSaving(true)
    try {
      const body = { ...form, courseId:Number(form.courseId), teacherId:form.teacherId?Number(form.teacherId):null, dayOfWeek:Number(form.dayOfWeek), year:Number(form.year) }
      if (item) { await api.put(`/schedules/${item.id}`, body) }
      else      { await api.post('/schedules', body) }
      toast(item ? 'Шинэчлэгдлээ' : 'Нэмэгдлээ', 'success')
      onSave()
    } catch (err) { toast(err.response?.data?.error || 'Алдаа','error') }
    finally { setSaving(false) }
  }

  return (
    <Modal title={item ? 'Хуваарь засах' : 'Хуваарь нэмэх'} onClose={onClose}>
      <form onSubmit={submit} style={{ display:'contents' }}>
        <div>
          <label className="form-label">Хичээл *</label>
          <select className="input" value={form.courseId} onChange={e=>setForm({...form,courseId:e.target.value})} required>
            <option value="">Сонгоно уу</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.name} ({c.courseCode})</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">Багш</label>
          <select className="input" value={form.teacherId} onChange={e=>setForm({...form,teacherId:e.target.value})}>
            <option value="">Сонгоно уу</option>
            {teachers.map(t => <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">Өдөр *</label>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:6 }}>
            {DAYS.slice(0,5).map((d,i) => (
              <button key={i} type="button" onClick={() => setForm({...form,dayOfWeek:i})}
                style={{ padding:'7px 4px', fontFamily:'Barlow Condensed,sans-serif', fontWeight:800, fontSize:11, letterSpacing:'0.04em', textTransform:'uppercase', cursor:'pointer', border:'1.5px solid var(--border)', transition:'all 0.12s',
                  background:Number(form.dayOfWeek)===i?'var(--navy)':'transparent',
                  color:Number(form.dayOfWeek)===i?'var(--beige)':'var(--muted)',
                  borderColor:Number(form.dayOfWeek)===i?'var(--navy)':'var(--border)' }}>
                {d.slice(0,2)}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <div><label className="form-label">Эхлэх *</label><input className="input" type="time" value={form.startTime} onChange={e=>setForm({...form,startTime:e.target.value})} /></div>
          <div><label className="form-label">Дуусах *</label><input className="input" type="time" value={form.endTime} onChange={e=>setForm({...form,endTime:e.target.value})} /></div>
        </div>
        <div><label className="form-label">Өрөө</label><input className="input" placeholder="А-101" value={form.room} onChange={e=>setForm({...form,room:e.target.value})} /></div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <div>
            <label className="form-label">Улирал</label>
            <select className="input" value={form.semester} onChange={e=>setForm({...form,semester:e.target.value})}>
              <option>Spring</option><option>Fall</option><option>Summer</option>
            </select>
          </div>
          <div><label className="form-label">Жил</label><input className="input" type="number" value={form.year} onChange={e=>setForm({...form,year:e.target.value})} /></div>
        </div>
        <div style={{ display:'flex', gap:10, paddingTop:4 }}>
          <button type="submit" disabled={saving} className="btn btn-primary" style={{ flex:1 }}>{saving?<Spinner />:item?'ШИНЭЧЛЭХ':'НЭМЭХ'}</button>
          <button type="button" onClick={onClose} className="btn btn-ghost" style={{ flex:1 }}>БОЛИХ</button>
        </div>
      </form>
    </Modal>
  )
}

/* ── Main page ── */
export default function SchedulePage() {
  const { isAdmin, isTeacher } = useAuth()
  const { show: toast } = useToast()

  const [rows, setRows]           = useState([])
  const [courses, setCourses]     = useState([])
  const [teachers, setTeachers]   = useState([])
  const [fSemester, setFSemester] = useState('Fall')
  const [fYear, setFYear]         = useState(2025)
  const [view, setView]           = useState('grid')
  const [loading, setLoading]     = useState(true)

  // Admin modals
  const [adminModal, setAdminModal]   = useState(false)
  const [editItem, setEditItem]       = useState(null)

  // Teacher request modal
  const [requestSlot, setRequestSlot] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [s, c, t] = await Promise.all([
        api.get('/schedules', { params:{ semester:fSemester, year:fYear } }),
        api.get('/courses?limit=200'),
        api.get('/teachers?limit=200'),
      ])
      setRows(s.data.data || [])
      setCourses(c.data.data || [])
      setTeachers(t.data.data || [])
    } catch { toast('Ачааллахад алдаа гарлаа', 'error') }
    finally { setLoading(false) }
  }, [fSemester, fYear])

  useEffect(() => { load() }, [load])

  const openAdminCreate = () => { setEditItem(null); setAdminModal(true) }
  const openAdminEdit   = slot => { setEditItem(slot); setAdminModal(true) }

  const adminDelete = async id => {
    if (!confirm('Устгах уу?')) return
    try { await api.delete(`/schedules/${id}`); toast('Устгагдлаа','info'); load() }
    catch (err) { toast(err.response?.data?.error || 'Алдаа','error') }
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="ЦАГИЙН ХУВААРЬ"
        titleMain="ХУВАА"
        titleDim="РЬ"
        meta={`${rows.length} хуваарь · ${fSemester} ${fYear}`}
        action={isAdmin && (
          <button className="btn btn-primary" onClick={openAdminCreate}>＋ НЭМЭХ</button>
        )}
      />

      {/* Teacher info bar */}
      {isTeacher && !isAdmin && (
        <div style={{ background:'var(--bg-input)', border:'1.5px solid #b3c5f5', padding:'10px 14px', marginBottom:14, display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ fontFamily:'Barlow Condensed,sans-serif', fontWeight:700, fontSize:11, letterSpacing:'0.06em', color:'#1a3a99' }}>МЭДЭЭЛЭЛ</div>
          <div style={{ fontFamily:'Barlow,sans-serif', fontSize:12, color:'#2a4a99' }}>
            Хуваарийг өөрчлөхийн тулд блок дотрын эсвэл жагсаалтын <strong>ӨӨРЧЛӨХ ХҮСЭЛТ</strong> товчийг дарж админ руу хүсэлт илгээнэ үү.
          </div>
        </div>
      )}

      {/* Controls */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14, flexWrap:'wrap' }}>
        <select className="input" style={{ width:130 }} value={fSemester} onChange={e => setFSemester(e.target.value)}>
          <option>Spring</option><option>Fall</option><option>Summer</option>
        </select>
        <input className="input" style={{ width:90 }} type="number" value={fYear} onChange={e => setFYear(Number(e.target.value))} />

        {/* View toggle */}
        <div style={{ marginLeft:'auto', display:'flex', border:'1.5px solid var(--border)', overflow:'hidden' }}>
          {[['grid','ХҮСНЭГТ'],['list','ЖАГСААЛТ']].map(([v,label]) => (
            <button key={v} onClick={() => setView(v)}
              style={{ padding:'7px 18px', fontFamily:'Barlow Condensed,sans-serif', fontWeight:800, fontSize:11, letterSpacing:'0.08em', textTransform:'uppercase', background:view===v?'var(--navy)':'transparent', color:view===v?'var(--beige)':'var(--muted)', border:'none', cursor:'pointer', transition:'all 0.12s' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Day summary */}
      {!loading && rows.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:8, marginBottom:14 }}>
          {DAYS.slice(0,5).map((d,i) => {
            const count = rows.filter(r => r.dayOfWeek === i).length
            return (
              <div key={i} style={{ background:count>0?'var(--navy)':'var(--white)', border:'1.5px solid var(--border-light)', padding:'9px 14px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <span style={{ fontFamily:'Barlow Condensed,sans-serif', fontWeight:800, fontSize:11, textTransform:'uppercase', color:count>0?'rgba(245,240,232,0.5)':'var(--muted)' }}>{d}</span>
                <span style={{ fontFamily:'Barlow Condensed,sans-serif', fontWeight:900, fontSize:24, color:count>0?'var(--beige)':'var(--faint)' }}>{count}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Main content */}
      {loading ? (
        <div style={{ background:'var(--bg-card)', border:'1.5px solid var(--border-light)', height:380, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <span style={{ fontFamily:'Share Tech Mono,monospace', fontSize:10, color:'var(--text-faint)', letterSpacing:'0.14em' }}>АЧААЛЛАЖ БАЙНА...</span>
        </div>
      ) : view === 'grid' ? (
        <WeekGrid
          rows={rows}
          onAdminEdit={openAdminEdit}
          onAdminDelete={adminDelete}
          onTeacherRequest={setRequestSlot}
          isAdmin={isAdmin}
          isTeacher={isTeacher}
        />
      ) : (
        <ListView
          rows={rows}
          onAdminEdit={openAdminEdit}
          onAdminDelete={adminDelete}
          onTeacherRequest={setRequestSlot}
          isAdmin={isAdmin}
          isTeacher={isTeacher}
        />
      )}

      {/* Admin add/edit modal */}
      {adminModal && (
        <AdminModal
          item={editItem}
          courses={courses}
          teachers={teachers}
          onClose={() => setAdminModal(false)}
          onSave={() => { setAdminModal(false); load() }}
        />
      )}

      {/* Teacher change request modal */}
      {requestSlot && (
        <ChangeRequestModal
          slot={requestSlot}
          onClose={() => setRequestSlot(null)}
          onSent={() => { setRequestSlot(null) }}
        />
      )}
    </div>
  )
}
