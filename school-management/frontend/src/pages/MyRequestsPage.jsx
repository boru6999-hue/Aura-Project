import { useState, useEffect, useCallback } from 'react'
import api from '../api/axios'
import { useToast } from '../components/Toast'
import Modal from '../components/Modal'
import { PageHeader, SkeletonTable, Empty, ActBtn, Spinner } from '../components/UI'

const DAYS   = ['Даваа','Мягмар','Лхагва','Пүрэв','Баасан','Бямба','Ням']
const S_CLS  = {
  PENDING:  { cls:'badge-amber', label:'ХҮЛЭЭГДЭЖ БУЙ' },
  APPROVED: { cls:'badge-green', label:'ЗӨВШӨӨРСӨН' },
  REJECTED: { cls:'badge-red',   label:'ТАТГАЛЗСАН' },
}
const isGradeReq = r => r.note?.startsWith('[ДҮНГИЙН ЗАСВАРЫН ХҮСЭЛТ]')

function parseGradeNote(note) {
  try {
    const student = note.match(/Сурагч: ([^|]+)/)?.[1]?.trim()
    const change  = note.match(/Одоогийн: ([^|]+)/)?.[1]?.trim()
    const reason  = note.match(/Тайлбар: (.+)/)?.[1]?.trim()
    return { student, change, reason }
  } catch { return {} }
}

export default function MyRequestsPage() {
  const { show: toast } = useToast()
  const [rows, setRows]       = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState(false)
  const [form, setForm]       = useState({ courseId:'', dayOfWeek:0, startTime:'08:00', endTime:'09:40', room:'', semester:'Spring', year:new Date().getFullYear(), note:'' })
  const [saving, setSaving]   = useState(false)
  const [tab, setTab]         = useState('all')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [r, c] = await Promise.all([api.get('/schedule-requests'), api.get('/courses?limit=200')])
      setRows(r.data.data || []); setCourses(c.data.data || [])
    } catch { toast('Ачааллахад алдаа', 'error') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const save = async e => {
    e.preventDefault(); setSaving(true)
    try {
      await api.post('/schedule-requests', { ...form, courseId:Number(form.courseId), dayOfWeek:Number(form.dayOfWeek), year:Number(form.year) })
      toast('Хүсэлт илгээгдлээ', 'success'); setModal(false); load()
    } catch (err) { toast(err.response?.data?.error || 'Алдаа', 'error') }
    finally { setSaving(false) }
  }

  const cancel = async id => {
    if (!confirm('Цуцлах уу?')) return
    try { await api.delete(`/schedule-requests/${id}`); toast('Цуцлагдлаа', 'info'); load() }
    catch (err) { toast(err.response?.data?.error || 'Алдаа', 'error') }
  }

  const filtered = rows.filter(r => {
    if (tab === 'schedule') return !isGradeReq(r)
    if (tab === 'grade')    return isGradeReq(r)
    return true
  })

  const pending = rows.filter(r => r.status === 'PENDING').length

  return (
    <div className="page">
      <PageHeader eyebrow="БАГШ" titleMain="МИНИЙ " titleDim="ХҮСЭЛТ"
        meta={`${rows.length} нийт · ${pending} хүлээгдэж буй`}
        action={<button className="btn btn-primary" onClick={() => setModal(true)}>＋ ХУВААРИЙН ХҮСЭЛТ</button>} />

      {/* Tabs */}
      <div style={{ display:'flex', border:'1.5px solid var(--border)', overflow:'hidden', marginBottom:14, width:'fit-content' }}>
        {[
          ['all',      `БҮГД (${rows.length})`],
          ['schedule', 'ХУВААРЬ'],
          ['grade',    'ДҮНГИЙН ЗАСВАР'],
        ].map(([v,label]) => (
          <button key={v} onClick={() => setTab(v)} style={{ padding:'8px 18px', fontFamily:'Barlow Condensed,sans-serif', fontWeight:800, fontSize:11, letterSpacing:'0.08em', textTransform:'uppercase', background:tab===v?'var(--navy)':'transparent', color:tab===v?'var(--beige)':'var(--muted)', border:'none', cursor:'pointer', transition:'all 0.12s', whiteSpace:'nowrap' }}>{label}</button>
        ))}
      </div>

      {loading ? <SkeletonTable rows={6} cols={5} /> : filtered.length === 0 ? <Empty text="ХҮСЭЛТ БАЙХГҮЙ" /> : (
        <div className="anim-fade" style={{ background:'var(--bg-card)', border:'1.5px solid var(--border-light)', overflowX:'auto' }}>
          <table className="tbl">
            <thead><tr>{['ТӨРӨЛ','ДЭЛГЭРЭНГҮЙ','УЛИРАЛ','СТАТУС','ОГНОО','ҮЙЛДЭЛ'].map(h => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map(r => {
                const s     = S_CLS[r.status] || S_CLS.PENDING
                const grade = isGradeReq(r)
                const parsed = grade ? parseGradeNote(r.note) : null
                return (
                  <tr key={r.id}>
                    <td>
                      {grade
                        ? <span className="badge badge-amber" style={{ fontSize:9 }}>ДҮН</span>
                        : <span className="badge badge-navy"  style={{ fontSize:9 }}>ХУВААРЬ</span>}
                    </td>
                    <td style={{ maxWidth:260 }}>
                      {grade ? (
                        <div>
                          <div style={{ fontFamily:'Barlow,sans-serif', fontSize:12, fontWeight:600, color:'var(--text-main)' }}>{parsed?.student}</div>
                          <div style={{ fontFamily:'Share Tech Mono,monospace', fontSize:10, color:'var(--text-muted)' }}>{parsed?.change}</div>
                          {r.adminNote && r.status !== 'PENDING' && (
                            <div style={{ fontFamily:'Barlow,sans-serif', fontSize:11, color: r.status==='APPROVED'?'var(--green)':'var(--red)', marginTop:3 }}>
                              Админ: {r.adminNote}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <div style={{ fontFamily:'Barlow,sans-serif', fontSize:12, fontWeight:600, color:'var(--text-main)' }}>{r.course?.name}</div>
                          <div style={{ fontFamily:'Share Tech Mono,monospace', fontSize:10, color:'var(--text-muted)' }}>{DAYS[r.dayOfWeek]} · {r.startTime}–{r.endTime}{r.room ? ` · ${r.room}` : ''}</div>
                          {r.adminNote && r.status !== 'PENDING' && (
                            <div style={{ fontFamily:'Barlow,sans-serif', fontSize:11, color: r.status==='APPROVED'?'var(--green)':'var(--red)', marginTop:3 }}>
                              Админ: {r.adminNote}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td><span className="badge badge-beige" style={{ fontSize:9 }}>{r.semester} {r.year}</span></td>
                    <td><span className={`badge ${s.cls}`} style={{ fontSize:9 }}>{s.label}</span></td>
                    <td style={{ fontFamily:'Share Tech Mono,monospace', fontSize:10, color:'var(--text-faint)', whiteSpace:'nowrap' }}>
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                    <td>{r.status === 'PENDING' && <ActBtn label="ЦУЦЛАХ" danger onClick={() => cancel(r.id)} />}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* New schedule request modal */}
      {modal && (
        <Modal title="Хуваарийн хүсэлт" onClose={() => setModal(false)}>
          <form onSubmit={save} style={{ display:'contents' }}>
            <div>
              <label className="form-label">Хичээл *</label>
              <select className="input" value={form.courseId} onChange={e=>setForm({...form,courseId:e.target.value})} required>
                <option value="">Сонгоно уу</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Өдөр *</label>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:6 }}>
                {DAYS.slice(0,5).map((d,i) => (
                  <button key={i} type="button" onClick={() => setForm({...form,dayOfWeek:i})} style={{ padding:'7px 4px', fontFamily:'Barlow Condensed,sans-serif', fontWeight:800, fontSize:11, letterSpacing:'0.04em', textTransform:'uppercase', cursor:'pointer', border:'1.5px solid var(--border)', transition:'all 0.12s', background:Number(form.dayOfWeek)===i?'var(--navy)':'transparent', color:Number(form.dayOfWeek)===i?'var(--beige)':'var(--muted)', borderColor:Number(form.dayOfWeek)===i?'var(--navy)':'var(--border)' }}>{d.slice(0,2)}</button>
                ))}
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div><label className="form-label">Эхлэх</label><input className="input" type="time" value={form.startTime} onChange={e=>setForm({...form,startTime:e.target.value})} /></div>
              <div><label className="form-label">Дуусах</label><input className="input" type="time" value={form.endTime} onChange={e=>setForm({...form,endTime:e.target.value})} /></div>
            </div>
            <div><label className="form-label">Өрөө</label><input className="input" value={form.room} onChange={e=>setForm({...form,room:e.target.value})} /></div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div>
                <label className="form-label">Улирал</label>
                <select className="input" value={form.semester} onChange={e=>setForm({...form,semester:e.target.value})}>
                  <option>Spring</option><option>Fall</option><option>Summer</option>
                </select>
              </div>
              <div><label className="form-label">Жил</label><input className="input" type="number" value={form.year} onChange={e=>setForm({...form,year:e.target.value})} /></div>
            </div>
            <div><label className="form-label">Тайлбар</label><textarea className="input" rows={3} style={{ resize:'none' }} value={form.note} onChange={e=>setForm({...form,note:e.target.value})} /></div>
            <div style={{ display:'flex', gap:10, paddingTop:4 }}>
              <button type="submit" disabled={saving} className="btn btn-primary" style={{ flex:1 }}>{saving ? <Spinner /> : 'ИЛГЭЭХ'}</button>
              <button type="button" onClick={() => setModal(false)} className="btn btn-ghost" style={{ flex:1 }}>БОЛИХ</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
