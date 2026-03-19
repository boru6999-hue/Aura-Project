import { useState, useEffect, useCallback } from 'react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'
import Modal from '../components/Modal'
import { PageHeader, SkeletonTable, Empty, ActBtn, Spinner } from '../components/UI'

export default function EnrollmentsPage() {
  const { isAdmin, isTeacher } = useAuth()
  const { show: toast } = useToast()
  const [rows, setRows]         = useState([])
  const [students, setStudents] = useState([])
  const [courses, setCourses]   = useState([])
  const [fCourse, setFCourse]   = useState('')
  const [fStudent, setFStudent] = useState('')
  const [fSemester, setFSemester] = useState('')
  const [loading, setLoading]   = useState(true)
  const [modal, setModal]       = useState(false)
  const [form, setForm]         = useState({ studentId:'', courseId:'', semester:'Spring', year:new Date().getFullYear() })
  const [saving, setSaving]     = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (fCourse) params.courseId = fCourse
      if (fStudent) params.studentId = fStudent
      if (fSemester) params.semester = fSemester
      const [e, s, c] = await Promise.all([api.get('/enrollments', { params }), api.get('/students?limit=200'), api.get('/courses?limit=200')])
      setRows(e.data.data || []); setStudents(s.data.data || []); setCourses(c.data.data || [])
    } catch { toast('Ачааллахад алдаа', 'error') }
    finally { setLoading(false) }
  }, [fCourse, fStudent, fSemester])

  useEffect(() => { load() }, [load])

  const save = async e => {
    e.preventDefault(); setSaving(true)
    try {
      await api.post('/enrollments', { ...form, studentId: Number(form.studentId), courseId: Number(form.courseId), year: Number(form.year) })
      toast('Бүртгэгдлээ', 'success'); setModal(false); load()
    } catch (err) { toast(err.response?.data?.error || 'Алдаа', 'error') }
    finally { setSaving(false) }
  }

  const del = async (id) => {
    if (!confirm('Бүртгэлийг цуцлах уу?')) return
    try { await api.delete(`/enrollments/${id}`); toast('Цуцлагдлаа', 'info'); load() }
    catch (err) { toast(err.response?.data?.error || 'Алдаа', 'error') }
  }

  const uniqueStudents = new Set(rows.map(r => r.studentId)).size
  const uniqueCourses  = new Set(rows.map(r => r.courseId)).size

  return (
    <div className="page">
      <PageHeader eyebrow="СУРГАЛТ" titleMain="БҮРТ" titleDim="ГЭЛ" meta={`${rows.length} нийт бүртгэл`}
        action={(isAdmin||isTeacher) && <button className="btn btn-primary" onClick={() => setModal(true)}>＋ БҮРТГЭХ</button>} />

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:16 }}>
        {[{ label:'НИЙТ БҮРТГЭЛ', val:rows.length, dark:true }, { label:'СУРАГЧ', val:uniqueStudents }, { label:'ХИЧЭЭЛ', val:uniqueCourses }].map((s,i) => (
          <div key={i} className={s.dark ? 'card-navy' : 'card'} style={{ padding:16, textAlign:'center' }}>
            <div className="t-label" style={{ marginBottom:8, color: s.dark ? 'rgba(245,240,232,0.35)' : 'var(--muted)' }}>{s.label}</div>
            <div style={{ fontFamily:'Barlow Condensed,sans-serif', fontWeight:900, fontSize:44, color: s.dark ? 'var(--beige)' : 'var(--navy)' }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:14 }}>
        <select className="input" value={fStudent} onChange={e => setFStudent(e.target.value)}>
          <option value="">Бүх сурагч</option>
          {students.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}
        </select>
        <select className="input" value={fCourse} onChange={e => setFCourse(e.target.value)}>
          <option value="">Бүх хичээл</option>
          {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="input" value={fSemester} onChange={e => setFSemester(e.target.value)}>
          <option value="">Бүх улирал</option>
          <option>Spring</option><option>Fall</option><option>Summer</option>
        </select>
      </div>

      {loading ? <SkeletonTable rows={8} cols={5} /> : rows.length === 0 ? <Empty /> : (
        <div className="anim-fade" style={{ background:'var(--bg-card)', border:'1.5px solid var(--border-light)', overflowX:'auto' }}>
          <table className="tbl">
            <thead><tr>{['СУРАГЧ','КОД','ХИЧЭЭЛ','УЛИРАЛ','ЖИЛ','ҮЙЛДЭЛ'].map(h => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id}>
                  <td style={{ fontWeight:600 }}>{r.student?.firstName} {r.student?.lastName}</td>
                  <td><span style={{ fontFamily:'Share Tech Mono,monospace', fontSize:10, background:'var(--beige-mid)', color:'var(--text-main)', padding:'2px 7px', border:'1px solid var(--border)' }}>{r.student?.studentCode}</span></td>
                  <td style={{ color:'var(--text-muted)' }}>{r.course?.name}</td>
                  <td><span className="badge badge-beige">{r.semester}</span></td>
                  <td style={{ fontFamily:'Share Tech Mono,monospace', fontSize:11, color:'var(--text-muted)' }}>{r.year}</td>
                  <td>{(isAdmin||isTeacher) && <ActBtn label="ЦУЦЛАХ" danger onClick={() => del(r.id)} />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <Modal title="Бүртгэх" onClose={() => setModal(false)}>
          <form onSubmit={save} style={{ display:'contents' }}>
            <div>
              <label className="form-label">Сурагч *</label>
              <select className="input" value={form.studentId} onChange={e=>setForm({...form,studentId:e.target.value})} required>
                <option value="">Сонгоно уу</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.studentCode})</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Хичээл *</label>
              <select className="input" value={form.courseId} onChange={e=>setForm({...form,courseId:e.target.value})} required>
                <option value="">Сонгоно уу</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div>
                <label className="form-label">Улирал *</label>
                <select className="input" value={form.semester} onChange={e=>setForm({...form,semester:e.target.value})}>
                  <option>Spring</option><option>Fall</option><option>Summer</option>
                </select>
              </div>
              <div><label className="form-label">Жил *</label><input className="input" type="number" value={form.year} onChange={e=>setForm({...form,year:e.target.value})} /></div>
            </div>
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
