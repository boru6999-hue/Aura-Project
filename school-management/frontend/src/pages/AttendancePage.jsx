import { useState, useEffect, useCallback } from 'react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'
import Modal from '../components/Modal'
import { PageHeader, SkeletonTable, Empty, Pagination, Spinner } from '../components/UI'

const STATUS = ['PRESENT','ABSENT','LATE']
const S_STYLE = { PRESENT:{ bg:'var(--green)', cls:'badge-green', label:'ИРСЭН' }, ABSENT:{ bg:'var(--red)', cls:'badge-red', label:'ИРЭЭГҮЙ' }, LATE:{ cls:'badge-amber', label:'ХОЦОРСОН' } }

export default function AttendancePage() {
  const { isAdmin, isTeacher } = useAuth()
  const { show: toast } = useToast()
  const [rows, setRows]         = useState([])
  const [students, setStudents] = useState([])
  const [courses, setCourses]   = useState([])
  const [fStudent, setFStudent] = useState('')
  const [fCourse, setFCourse]   = useState('')
  const [loading, setLoading]   = useState(true)
  const [modal, setModal]       = useState(false)
  const [form, setForm]         = useState({ studentId:'', courseId:'', status:'PRESENT', date:new Date().toISOString().split('T')[0] })
  const [saving, setSaving]     = useState(false)

  const total   = rows.length
  const present = rows.filter(r => r.status === 'PRESENT').length
  const absent  = rows.filter(r => r.status === 'ABSENT').length
  const late    = rows.filter(r => r.status === 'LATE').length
  const rate    = total > 0 ? Math.round((present / total) * 100) : 0

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (fStudent) params.studentId = fStudent
      if (fCourse)  params.courseId  = fCourse
      const [a, s, c] = await Promise.all([api.get('/attendance', { params }), api.get('/students?limit=200'), api.get('/courses?limit=200')])
      setRows(a.data.data || []); setStudents(s.data.data || []); setCourses(c.data.data || [])
    } catch { toast('Ачааллахад алдаа', 'error') }
    finally { setLoading(false) }
  }, [fStudent, fCourse])

  useEffect(() => { load() }, [load])

  const save = async e => {
    e.preventDefault(); setSaving(true)
    try {
      await api.post('/attendance', { ...form, studentId: Number(form.studentId), courseId: Number(form.courseId) })
      toast('Бүртгэгдлээ', 'success'); setModal(false); load()
    } catch (err) { toast(err.response?.data?.error || 'Алдаа', 'error') }
    finally { setSaving(false) }
  }

  return (
    <div className="page">
      <PageHeader eyebrow="ХЯНАЛТ" titleMain="ИРЦ" titleDim=" БҮРТГЭЛ" meta={`${total} нийт бүртгэл`}
        action={(isAdmin||isTeacher) && <button className="btn btn-primary" onClick={() => setModal(true)}>＋ БҮРТГЭХ</button>} />

      {/* Stats */}
      {!loading && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:16 }}>
          {[
            { label:'НИЙТ', val:total, dark:true },
            { label:'ИРСЭН', val:present },
            { label:'ИРЭЭГҮЙ', val:absent },
            { label:'ИРЦИЙН %', val:`${rate}%` },
          ].map((s,i) => (
            <div key={i} className={s.dark ? 'card-navy' : 'card'} style={{ padding:16, textAlign:'center' }}>
              <div className="t-label" style={{ marginBottom:8, color: s.dark ? 'rgba(245,240,232,0.35)' : 'var(--muted)' }}>{s.label}</div>
              <div style={{ fontFamily:'Barlow Condensed,sans-serif', fontWeight:900, fontSize:40, color: s.dark ? 'var(--beige)' : 'var(--navy)' }}>{s.val}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
        <select className="input" value={fStudent} onChange={e => setFStudent(e.target.value)}>
          <option value="">Бүх сурагч</option>
          {students.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}
        </select>
        <select className="input" value={fCourse} onChange={e => setFCourse(e.target.value)}>
          <option value="">Бүх хичээл</option>
          {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {loading ? <SkeletonTable rows={8} cols={5} /> : rows.length === 0 ? <Empty /> : (
        <div className="anim-fade" style={{ background:'var(--bg-card)', border:'1.5px solid var(--border-light)', overflowX:'auto' }}>
          <table className="tbl">
            <thead><tr>{['СУРАГЧ','ХИЧЭЭЛ','СТАТУС','ОГНОО','КОД'].map(h => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {rows.map(r => {
                const s = S_STYLE[r.status] || S_STYLE.PRESENT
                return (
                  <tr key={r.id}>
                    <td style={{ fontWeight:600 }}>{r.student?.firstName} {r.student?.lastName}</td>
                    <td style={{ color:'var(--text-muted)' }}>{r.course?.name}</td>
                    <td><span className={`badge ${s.cls}`}>{s.label}</span></td>
                    <td style={{ fontFamily:'Share Tech Mono,monospace', fontSize:11, color:'var(--text-muted)' }}>{new Date(r.date).toLocaleDateString()}</td>
                    <td style={{ fontFamily:'Share Tech Mono,monospace', fontSize:10, color:'var(--text-faint)' }}>#{r.id}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <Modal title="Ирц бүртгэх" onClose={() => setModal(false)}>
          <form onSubmit={save} style={{ display:'contents' }}>
            <div>
              <label className="form-label">Сурагч *</label>
              <select className="input" value={form.studentId} onChange={e=>setForm({...form,studentId:e.target.value})} required>
                <option value="">Сонгоно уу</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Хичээл *</label>
              <select className="input" value={form.courseId} onChange={e=>setForm({...form,courseId:e.target.value})} required>
                <option value="">Сонгоно уу</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Статус</label>
              <div style={{ display:'flex', gap:8 }}>
                {STATUS.map(s => (
                  <button key={s} type="button" onClick={() => setForm({...form, status:s})}
                    style={{ flex:1, padding:'8px 0', fontFamily:'Barlow Condensed,sans-serif', fontWeight:800, fontSize:11, letterSpacing:'0.06em', textTransform:'uppercase', cursor:'pointer', transition:'all 0.12s',
                      background: form.status === s ? 'var(--navy)' : 'transparent',
                      color: form.status === s ? 'var(--beige)' : 'var(--muted)',
                      border: form.status === s ? '1.5px solid var(--navy)' : '1.5px solid var(--border)',
                    }}>
                    {S_STYLE[s].label}
                  </button>
                ))}
              </div>
            </div>
            <div><label className="form-label">Огноо</label><input className="input" type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} /></div>
            <div style={{ display:'flex', gap:10, paddingTop:4 }}>
              <button type="submit" disabled={saving} className="btn btn-primary" style={{ flex:1 }}>{saving ? <Spinner /> : 'БҮРТГЭХ'}</button>
              <button type="button" onClick={() => setModal(false)} className="btn btn-ghost" style={{ flex:1 }}>БОЛИХ</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
