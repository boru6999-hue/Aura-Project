import { useState, useEffect, useCallback } from 'react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'
import Modal from '../components/Modal'
import { PageHeader, SkeletonTable, Empty, ActBtn, Pagination, Spinner, BarGraph } from '../components/UI'

const GRADES    = ['A','B','C','D','F']
const GRADE_CLS = { A:'badge-green', B:'badge-blue', C:'badge-beige', D:'badge-amber', F:'badge-red' }

// ── Grade change request modal ──
function GradeChangeRequestModal({ grade, onClose, onSent }) {
  const { show: toast } = useToast()
  const [newScore, setNewScore] = useState(grade.score)
  const [note, setNote]         = useState('')
  const [saving, setSaving]     = useState(false)

  const submit = async e => {
    e.preventDefault()
    setSaving(true)
    try {
      // We store grade edit requests as schedule-requests with a special note format
      // But since backend has no grade-request table, we use a workaround:
      // Send a POST to grades — it will upsert. But we need admin approval.
      // Solution: POST to schedule-requests with note encoding the grade change.
      // Better: just use the existing grade upsert — admin can delete if wrong.
      // Per requirement: second edit → send as note-based schedule request.
      // We'll use scheduleRequest with courseId, note describing change, dayOfWeek=0, startTime/endTime placeholder.
      const newGrade = newScore >= 90 ? 'A' : newScore >= 80 ? 'B' : newScore >= 70 ? 'C' : newScore >= 60 ? 'D' : 'F'
      await api.post('/schedule-requests', {
        courseId:   grade.courseId,
        dayOfWeek:  0,
        startTime:  '00:00',
        endTime:    '00:00',
        semester:   grade.semester,
        year:       grade.year,
        note: `[ДҮНГИЙН ЗАСВАРЫН ХҮСЭЛТ] Сурагч: ${grade.student?.firstName} ${grade.student?.lastName} (${grade.student?.studentCode}) | Хичээл: ${grade.course?.name} | Одоогийн: ${grade.score} (${grade.grade}) → Шинэ: ${newScore} (${newGrade}) | Тайлбар: ${note || 'тайлбаргүй'}`,
      })
      toast('Засварын хүсэлт илгээгдлээ. Админ шийдвэрлэнэ.', 'info')
      onSent()
    } catch (err) {
      toast(err.response?.data?.error || 'Алдаа гарлаа', 'error')
    } finally { setSaving(false) }
  }

  const newGrade = Number(newScore) >= 90 ? 'A' : Number(newScore) >= 80 ? 'B' : Number(newScore) >= 70 ? 'C' : Number(newScore) >= 60 ? 'D' : 'F'

  return (
    <Modal title="Дүнгийн засварын хүсэлт" onClose={onClose}>
      <form onSubmit={submit} style={{ display:'contents' }}>
        {/* Info */}
        <div style={{ background:'var(--bg-page)', border:'1.5px solid var(--border)', padding:14 }}>
          <div className="t-label" style={{ marginBottom:6 }}>ОДООГИЙН ДҮН</div>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div>
              <div style={{ fontFamily:'Barlow Condensed,sans-serif', fontWeight:800, fontSize:16, color:'var(--text-main)' }}>{grade.student?.firstName} {grade.student?.lastName}</div>
              <div className="t-label">{grade.course?.name} · {grade.semester} {grade.year}</div>
            </div>
            <div style={{ marginLeft:'auto', textAlign:'right' }}>
              <div style={{ fontFamily:'Barlow Condensed,sans-serif', fontWeight:900, fontSize:36, color:'var(--text-main)', lineHeight:1 }}>{grade.grade}</div>
              <div className="t-label">{grade.score} оноо</div>
            </div>
          </div>
        </div>

        <div>
          <label className="form-label">Шинэ оноо (0–100) *</label>
          <input className="input" type="number" min="0" max="100" value={newScore}
            onChange={e => setNewScore(e.target.value)} required />
          <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:8 }}>
            <div style={{ flex:1, background:'var(--beige-mid)', height:6 }}>
              <div style={{ height:'100%', width:`${newScore}%`, background:'var(--navy)', transition:'width 0.3s' }} />
            </div>
            <span style={{ fontFamily:'Barlow Condensed,sans-serif', fontWeight:900, fontSize:22, color:'var(--text-main)', minWidth:28 }}>{newGrade}</span>
          </div>
        </div>
        <div>
          <label className="form-label">Засварын шалтгаан *</label>
          <textarea className="input" rows={3} style={{ resize:'none' }} placeholder="Яагаад засах шаардлагатай болсноо тайлбарлана уу..." value={note} onChange={e => setNote(e.target.value)} required />
        </div>

        <div style={{ background:'var(--bg-input)', border:'1.5px solid #b3c5f5', padding:12 }}>
          <div style={{ fontFamily:'Barlow Condensed,sans-serif', fontWeight:700, fontSize:11, letterSpacing:'0.06em', color:'#1a3a99', marginBottom:4 }}>АНХААРУУЛГА</div>
          <div style={{ fontFamily:'Barlow,sans-serif', fontSize:12, color:'#2a4a99', lineHeight:1.5 }}>
            Энэ хүсэлт администратор руу илгээгдэх бөгөөд зөвшөөрөгдсний дараа л дүн шинэчлэгдэнэ.
          </div>
        </div>

        <div style={{ display:'flex', gap:10, paddingTop:4 }}>
          <button type="submit" disabled={saving || !note.trim()} className="btn btn-primary" style={{ flex:1 }}>
            {saving ? <Spinner /> : 'ХҮСЭЛТ ИЛГЭЭХ'}
          </button>
          <button type="button" onClick={onClose} className="btn btn-ghost" style={{ flex:1 }}>БОЛИХ</button>
        </div>
      </form>
    </Modal>
  )
}

export default function GradesPage() {
  const { isAdmin, isTeacher } = useAuth()
  const { show: toast } = useToast()
  const [rows, setRows]         = useState([])
  const [students, setStudents] = useState([])
  const [courses, setCourses]   = useState([])
  const [fStudent, setFStudent] = useState('')
  const [fCourse,  setFCourse]  = useState('')
  const [fSemester,setFSemester]= useState('')
  const [loading,  setLoading]  = useState(true)
  const [addModal, setAddModal] = useState(false)
  const [editRequest, setEditRequest] = useState(null)  // grade to send edit request for
  const [form, setForm] = useState({ studentId:'', courseId:'', score:'', semester:'Spring', year:new Date().getFullYear() })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (fStudent) params.studentId = fStudent
      if (fCourse)  params.courseId  = fCourse
      if (fSemester) params.semester = fSemester
      const [g, s, c] = await Promise.all([
        api.get('/grades', { params }),
        api.get('/students?limit=200'),
        api.get('/courses?limit=200'),
      ])
      setRows(g.data.data || [])
      setStudents(s.data.data || [])
      setCourses(c.data.data || [])
    } catch { toast('Ачааллахад алдаа гарлаа', 'error') }
    finally { setLoading(false) }
  }, [fStudent, fCourse, fSemester])

  useEffect(() => { load() }, [load])

  // Check if a grade already exists for student+course+semester+year
  const gradeExists = (studentId, courseId, semester, year) =>
    rows.some(r => r.studentId === Number(studentId) && r.courseId === Number(courseId) &&
      r.semester === semester && r.year === Number(year))

  const saveGrade = async e => {
    e.preventDefault(); setSaving(true)
    try {
      // If grade already exists → cannot POST directly, must use request flow
      if (gradeExists(form.studentId, form.courseId, form.semester, form.year)) {
        toast('Энэ дүн аль хэдийн байна. Засах бол хүсэлт илгээнэ үү.', 'error')
        setSaving(false); return
      }
      await api.post('/grades', {
        ...form,
        score:     Number(form.score),
        studentId: Number(form.studentId),
        courseId:  Number(form.courseId),
        year:      Number(form.year),
      })
      toast('Дүн нэмэгдлээ', 'success')
      setAddModal(false); load()
    } catch (err) { toast(err.response?.data?.error || 'Алдаа', 'error') }
    finally { setSaving(false) }
  }

  const del = async id => {
    if (!confirm('Устгах уу?')) return
    try { await api.delete(`/grades/${id}`); toast('Устгагдлаа', 'info'); load() }
    catch (err) { toast(err.response?.data?.error || 'Алдаа', 'error') }
  }

  const dist = GRADES.map(g => ({ name:g, value: rows.filter(r => r.grade === g).length }))

  return (
    <div className="page">
      <PageHeader eyebrow="ҮНЭЛГЭЭ" titleMain="ДҮН" titleDim="ГҮҮД"
        meta={`${rows.length} нийт дүн`}
        action={(isAdmin||isTeacher) && (
          <button className="btn btn-primary" onClick={() => setAddModal(true)}>＋ ДҮН НЭМЭХ</button>
        )} />

      {/* Chart strip */}
      {!loading && rows.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
          <div className="card anim-fade">
            <div className="t-label" style={{ marginBottom:10 }}>ТАРХАЛТ</div>
            <BarGraph data={dist} height={130} />
          </div>
          <div className="card-navy anim-fade" style={{ animationDelay:'0.08s' }}>
            <div className="t-label" style={{ color:'rgba(245,240,232,0.3)', marginBottom:14 }}>ХАРЬЦАА</div>
            {dist.map((d,i) => {
              const max = Math.max(...dist.map(x => x.value), 1)
              const colors = ['var(--beige)','#90aadd','#6080bb','rgba(245,240,232,0.4)','rgba(245,240,232,0.15)']
              return (
                <div key={d.name} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                  <span style={{ fontFamily:'Barlow Condensed,sans-serif', fontWeight:800, fontSize:12, color:'rgba(245,240,232,0.5)', width:16 }}>{d.name}</span>
                  <div style={{ flex:1, background:'rgba(245,240,232,0.08)', height:7 }}>
                    <div style={{ height:'100%', width:`${max>0?(d.value/max)*100:0}%`, background:colors[i], transition:'width 0.5s' }} />
                  </div>
                  <span style={{ fontFamily:'Share Tech Mono,monospace', fontSize:9, color:'rgba(245,240,232,0.3)', width:20, textAlign:'right' }}>{d.value}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

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

      {/* Table */}
      {loading ? <SkeletonTable rows={8} cols={7} /> : rows.length === 0 ? <Empty /> : (
        <div className="anim-fade" style={{ background:'var(--bg-card)', border:'1.5px solid var(--border-light)', overflowX:'auto' }}>
          <table className="tbl">
            <thead>
              <tr>
                {['СУРАГЧ','ХИЧЭЭЛ','ОНО','ДҮН','УЛИРАЛ','ЖИЛ','ҮЙЛДЭЛ'].map(h => <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id}>
                  <td style={{ fontWeight:600 }}>{r.student?.firstName} {r.student?.lastName}
                    <div style={{ fontFamily:'Share Tech Mono,monospace', fontSize:9, color:'var(--text-faint)' }}>{r.student?.studentCode}</div>
                  </td>
                  <td style={{ color:'var(--text-muted)' }}>{r.course?.name}</td>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontFamily:'Share Tech Mono,monospace', fontSize:13, fontWeight:700, color:'var(--text-main)', minWidth:28 }}>{r.score}</span>
                      <div style={{ width:70, background:'var(--beige-mid)', height:5 }}>
                        <div style={{ height:'100%', width:`${r.score}%`, background:'var(--navy)' }} />
                      </div>
                    </div>
                  </td>
                  <td><span className={`badge ${GRADE_CLS[r.grade] || 'badge-beige'}`}>{r.grade}</span></td>
                  <td style={{ color:'var(--text-muted)', fontFamily:'Share Tech Mono,monospace', fontSize:11 }}>{r.semester}</td>
                  <td style={{ color:'var(--text-muted)', fontFamily:'Share Tech Mono,monospace', fontSize:11 }}>{r.year}</td>
                  <td>
                    <div style={{ display:'flex', gap:6 }}>
                      {/* Teacher: can only send edit request (not direct edit) */}
                      {isTeacher && !isAdmin && (
                        <ActBtn label="ЗАСАХ ХҮСЭЛТ" onClick={() => setEditRequest(r)} />
                      )}
                      {/* Admin: can delete */}
                      {isAdmin && (
                        <ActBtn label="УСТГАХ" danger onClick={() => del(r.id)} />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add grade modal */}
      {addModal && (
        <Modal title="Дүн нэмэх" onClose={() => setAddModal(false)}>
          <form onSubmit={saveGrade} style={{ display:'contents' }}>
            <div>
              <label className="form-label">Сурагч *</label>
              <select className="input" value={form.studentId} onChange={e => setForm({...form,studentId:e.target.value})} required>
                <option value="">Сонгоно уу</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.studentCode})</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Хичээл *</label>
              <select className="input" value={form.courseId} onChange={e => setForm({...form,courseId:e.target.value})} required>
                <option value="">Сонгоно уу</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div>
                <label className="form-label">Улирал *</label>
                <select className="input" value={form.semester} onChange={e => setForm({...form,semester:e.target.value})}>
                  <option>Spring</option><option>Fall</option><option>Summer</option>
                </select>
              </div>
              <div><label className="form-label">Жил *</label><input className="input" type="number" value={form.year} onChange={e => setForm({...form,year:e.target.value})} /></div>
            </div>
            <div>
              <label className="form-label">Оноо (0–100) *</label>
              <input className="input" type="number" min="0" max="100" value={form.score} onChange={e => setForm({...form,score:e.target.value})} required />
              {form.score !== '' && (
                <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:8 }}>
                  <div style={{ flex:1, background:'var(--beige-mid)', height:6 }}>
                    <div style={{ height:'100%', width:`${form.score}%`, background:'var(--navy)', transition:'width 0.3s' }} />
                  </div>
                  <span style={{ fontFamily:'Barlow Condensed,sans-serif', fontWeight:900, fontSize:22, color:'var(--text-main)', minWidth:24 }}>
                    {Number(form.score)>=90?'A':Number(form.score)>=80?'B':Number(form.score)>=70?'C':Number(form.score)>=60?'D':'F'}
                  </span>
                </div>
              )}
            </div>
            {/* Warn if grade already exists */}
            {form.studentId && form.courseId && form.semester && form.year && gradeExists(form.studentId, form.courseId, form.semester, form.year) && (
              <div style={{ background:'var(--bg-input)', border:'1.5px solid #e0b0b0', padding:10 }}>
                <div style={{ fontFamily:'Barlow Condensed,sans-serif', fontWeight:700, fontSize:11, color:'var(--red)', letterSpacing:'0.06em', marginBottom:3 }}>! АНХААРУУЛГА</div>
                <div style={{ fontFamily:'Barlow,sans-serif', fontSize:12, color:'var(--red)' }}>Энэ сурагчийн дүн аль хэдийн оруулагдсан байна. Засах бол хүснэгтээс "ЗАСАХ ХҮСЭЛТ" товч ашиглана уу.</div>
              </div>
            )}
            <div style={{ display:'flex', gap:10, paddingTop:4 }}>
              <button type="submit" disabled={saving} className="btn btn-primary" style={{ flex:1 }}>{saving ? <Spinner /> : 'НЭМЭХ'}</button>
              <button type="button" onClick={() => setAddModal(false)} className="btn btn-ghost" style={{ flex:1 }}>БОЛИХ</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Grade edit request modal */}
      {editRequest && (
        <GradeChangeRequestModal
          grade={editRequest}
          onClose={() => setEditRequest(null)}
          onSent={() => { setEditRequest(null) }}
        />
      )}
    </div>
  )
}
