import { useState, useEffect, useCallback } from 'react'
import api from '../api/axios'
import { useToast } from '../components/Toast'
import Modal from '../components/Modal'
import { PageHeader, SkeletonTable, Empty, ActBtn, Spinner } from '../components/UI'

const DAYS = ['Даваа','Мягмар','Лхагва','Пүрэв','Баасан','Бямба','Ням']
const S_CLS = {
  PENDING:  { cls:'badge-amber', label:'ХҮЛЭЭГДЭЖ БУЙ' },
  APPROVED: { cls:'badge-green', label:'ЗӨВШӨӨРСӨН' },
  REJECTED: { cls:'badge-red',   label:'ТАТГАЛЗСАН' },
}

// Detect grade-change requests by note prefix
const isGradeReq = r => r.note?.startsWith('[ДҮНГИЙН ЗАСВАРЫН ХҮСЭЛТ]')

function parseGradeNote(note) {
  // Format: [ДҮНГИЙН ЗАСВАРЫН ХҮСЭЛТ] Сурагч: ... | Хичээл: ... | Одоогийн: X (G) → Шинэ: Y (H) | Тайлбар: ...
  try {
    const student = note.match(/Сурагч: ([^|]+)/)?.[1]?.trim()
    const course  = note.match(/Хичээл: ([^|]+)/)?.[1]?.trim()
    const change  = note.match(/Одоогийн: ([^|]+)/)?.[1]?.trim()
    const reason  = note.match(/Тайлбар: (.+)/)?.[1]?.trim()
    return { student, course, change, reason }
  } catch { return {} }
}

function ApproveModal({ item, onClose, onDone }) {
  const { show: toast } = useToast()
  const [adminNote, setAdminNote] = useState('')
  const [saving, setSaving]       = useState(false)
  const isGrade = isGradeReq(item)
  const parsed  = isGrade ? parseGradeNote(item.note) : null

  const act = async (action) => {
    setSaving(true)
    try {
      if (action === 'approve') {
        await api.put(`/schedule-requests/${item.id}/approve`, { adminNote })
        // For grade requests: extract new score and apply it
        if (isGrade) {
          const newScoreMatch = item.note.match(/→ Шинэ: (\d+)/)
          const newScore = newScoreMatch ? Number(newScoreMatch[1]) : null
          const studentCodeMatch = item.note.match(/\(([A-Z]{3}\d+)\)/)
          const studentCode = studentCodeMatch ? studentCodeMatch[1] : null
          if (newScore !== null && studentCode) {
            // Find student by code then update grade
            try {
              const sRes = await api.get(`/students?search=${studentCode}&limit=1`)
              const student = sRes.data.data?.[0]
              if (student) {
                await api.post('/grades', {
                  studentId: student.id,
                  courseId:  item.courseId,
                  score:     newScore,
                  semester:  item.semester,
                  year:      item.year,
                })
              }
            } catch (e) { console.warn('Grade auto-apply failed', e) }
          }
        }
        toast('Зөвшөөрлөө', 'success')
      } else {
        await api.put(`/schedule-requests/${item.id}/reject`, { adminNote })
        toast('Татгалзлаа', 'info')
      }
      onDone()
    } catch (err) { toast(err.response?.data?.error || 'Алдаа', 'error') }
    finally { setSaving(false) }
  }

  return (
    <Modal title={isGrade ? 'Дүнгийн засварын хүсэлт' : 'Хуваарийн хүсэлт'} onClose={onClose}>
      {/* Detail card */}
      <div style={{ background:'var(--bg-page)', border:'1.5px solid var(--border)', padding:14 }}>
        <div className="t-label" style={{ marginBottom:8 }}>ХҮСЭЛТИЙН ДЭЛГЭРЭНГҮЙ</div>
        {isGrade ? (
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            <div style={{ display:'flex', gap:8 }}>
              <span className="t-label" style={{ minWidth:70 }}>СУРАГЧ</span>
              <span style={{ fontFamily:'Barlow,sans-serif', fontWeight:600, fontSize:13, color:'var(--text-main)' }}>{parsed.student}</span>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <span className="t-label" style={{ minWidth:70 }}>ХИЧЭЭЛ</span>
              <span style={{ fontFamily:'Barlow,sans-serif', fontSize:13, color:'var(--text-muted)' }}>{parsed.course}</span>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <span className="t-label" style={{ minWidth:70 }}>ӨӨРЧЛӨЛТ</span>
              <span style={{ fontFamily:'Barlow Condensed,sans-serif', fontWeight:800, fontSize:16, color:'var(--text-main)' }}>{parsed.change}</span>
            </div>
            {parsed.reason && (
              <div style={{ display:'flex', gap:8 }}>
                <span className="t-label" style={{ minWidth:70 }}>ШАЛТГААН</span>
                <span style={{ fontFamily:'Barlow,sans-serif', fontSize:12, color:'var(--text-muted)' }}>{parsed.reason}</span>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            <div style={{ display:'flex', gap:8 }}>
              <span className="t-label" style={{ minWidth:60 }}>БАГШ</span>
              <span style={{ fontFamily:'Barlow,sans-serif', fontWeight:600, fontSize:13, color:'var(--text-main)' }}>{item.teacher?.firstName} {item.teacher?.lastName}</span>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <span className="t-label" style={{ minWidth:60 }}>ХИЧЭЭЛ</span>
              <span style={{ fontFamily:'Barlow,sans-serif', fontSize:13, color:'var(--text-muted)' }}>{item.course?.name}</span>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <span className="t-label" style={{ minWidth:60 }}>ЦАГ</span>
              <span style={{ fontFamily:'Share Tech Mono,monospace', fontSize:12, color:'var(--text-main)' }}>{DAYS[item.dayOfWeek]} · {item.startTime}–{item.endTime}{item.room ? ` · ${item.room}` : ''}</span>
            </div>
            {item.note && (
              <div style={{ display:'flex', gap:8 }}>
                <span className="t-label" style={{ minWidth:60 }}>ТАЙЛБАР</span>
                <span style={{ fontFamily:'Barlow,sans-serif', fontSize:12, color:'var(--text-muted)' }}>{item.note}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div>
        <label className="form-label">Админы тайлбар (заавал биш)</label>
        <textarea className="input" rows={3} style={{ resize:'none' }} value={adminNote} onChange={e => setAdminNote(e.target.value)} placeholder="Тайлбар..." />
      </div>

      <div style={{ display:'flex', gap:10, paddingTop:4 }}>
        <button className="btn btn-success" style={{ flex:1 }} disabled={saving} onClick={() => act('approve')}>
          {saving ? <Spinner /> : 'ЗӨВШӨӨРӨХ'}
        </button>
        <button className="btn btn-danger" style={{ flex:1 }} disabled={saving} onClick={() => act('reject')}>
          {saving ? <Spinner /> : 'ТАТГАЛЗАХ'}
        </button>
        <button className="btn btn-ghost" style={{ flex:1 }} onClick={onClose}>БОЛИХ</button>
      </div>
    </Modal>
  )
}

export default function ScheduleRequestsPage() {
  const { show: toast } = useToast()
  const [rows, setRows]         = useState([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState(null)
  const [tab, setTab]           = useState('all') // all | schedule | grade

  const load = useCallback(async () => {
    setLoading(true)
    try { const r = await api.get('/schedule-requests'); setRows(r.data.data || []) }
    catch { toast('Ачааллахад алдаа', 'error') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = rows.filter(r => {
    if (tab === 'schedule') return !isGradeReq(r)
    if (tab === 'grade')    return isGradeReq(r)
    return true
  })

  const pending       = rows.filter(r => r.status === 'PENDING').length
  const pendingGrade  = rows.filter(r => r.status === 'PENDING' && isGradeReq(r)).length
  const pendingSched  = rows.filter(r => r.status === 'PENDING' && !isGradeReq(r)).length

  return (
    <div className="page">
      <PageHeader eyebrow="ХЯНАЛТ" titleMain="ХҮСЭЛТ" titleDim={pending > 0 ? `ҮҮД (${pending})` : 'ҮҮД'}
        meta={`${rows.length} нийт · ${pending} хүлээгдэж буй`} />

      {/* Summary cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:16 }}>
        {[
          { label:'НИЙТ ХҮСЭЛТ',   val:rows.length,   dark:true },
          { label:'ХУВААРИЙН',     val:rows.filter(r => !isGradeReq(r)).length },
          { label:'ДҮНГИЙН ЗАСВАР', val:rows.filter(r => isGradeReq(r)).length },
        ].map((s,i) => (
          <div key={i} className={s.dark?'card-navy':'card'} style={{ padding:'14px 18px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div className="t-label" style={{ color: s.dark?'rgba(245,240,232,0.35)':'var(--muted)' }}>{s.label}</div>
            <div style={{ fontFamily:'Barlow Condensed,sans-serif', fontWeight:900, fontSize:38, color: s.dark?'var(--beige)':'var(--navy)' }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Tab filter */}
      <div style={{ display:'flex', border:'1.5px solid var(--border)', overflow:'hidden', marginBottom:14, width:'fit-content' }}>
        {[
          ['all',      `БҮГД (${rows.length})`],
          ['schedule', `ХУВААРЬ${pendingSched > 0 ? ` · ${pendingSched} хүлээгдэж буй` : ''}`],
          ['grade',    `ДҮНГИЙН ЗАСВАР${pendingGrade > 0 ? ` · ${pendingGrade} хүлээгдэж буй` : ''}`],
        ].map(([v,label]) => (
          <button key={v} onClick={() => setTab(v)} style={{ padding:'8px 18px', fontFamily:'Barlow Condensed,sans-serif', fontWeight:800, fontSize:11, letterSpacing:'0.08em', textTransform:'uppercase', background:tab===v?'var(--navy)':'transparent', color:tab===v?'var(--beige)':'var(--muted)', border:'none', cursor:'pointer', transition:'all 0.12s', whiteSpace:'nowrap' }}>{label}</button>
        ))}
      </div>

      {/* Table */}
      {loading ? <SkeletonTable rows={6} cols={6} /> : filtered.length === 0 ? <Empty text="ХҮСЭЛТ БАЙХГҮЙ" /> : (
        <div className="anim-fade" style={{ background:'var(--bg-card)', border:'1.5px solid var(--border-light)', overflowX:'auto' }}>
          <table className="tbl">
            <thead>
              <tr>{['ТӨРӨЛ','БАГШ','ДЭЛГЭРЭНГҮЙ','УЛИРАЛ','СТАТУС','ОГНОО','ҮЙЛДЭЛ'].map(h => <th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {filtered.map(r => {
                const s = S_CLS[r.status] || S_CLS.PENDING
                const grade = isGradeReq(r)
                const parsed = grade ? parseGradeNote(r.note) : null
                return (
                  <tr key={r.id}>
                    <td>
                      {grade
                        ? <span className="badge badge-amber" style={{ fontSize:9 }}>ДҮН</span>
                        : <span className="badge badge-navy"  style={{ fontSize:9 }}>ХУВААРЬ</span>}
                    </td>
                    <td style={{ fontWeight:600 }}>{r.teacher?.firstName} {r.teacher?.lastName}</td>
                    <td style={{ maxWidth:260 }}>
                      {grade ? (
                        <div>
                          <div style={{ fontFamily:'Barlow,sans-serif', fontSize:12, fontWeight:600, color:'var(--text-main)' }}>{parsed?.student}</div>
                          <div style={{ fontFamily:'Share Tech Mono,monospace', fontSize:10, color:'var(--text-muted)' }}>{parsed?.change}</div>
                        </div>
                      ) : (
                        <div>
                          <div style={{ fontFamily:'Barlow,sans-serif', fontSize:12, fontWeight:600, color:'var(--text-main)' }}>{r.course?.name}</div>
                          {/* Show old → new diff if old values exist */}
                          {r.oldStartTime ? (
                            <div style={{ display:'flex', flexDirection:'column', gap:2, marginTop:3 }}>
                              <div style={{ fontFamily:'Share Tech Mono,monospace', fontSize:9, color:'var(--red)', textDecoration:'line-through' }}>
                                {DAYS[r.oldDayOfWeek ?? r.dayOfWeek]} · {r.oldStartTime}–{r.oldEndTime}{r.oldRoom ? ` · ${r.oldRoom}` : ''}
                              </div>
                              <div style={{ fontFamily:'Share Tech Mono,monospace', fontSize:9, color:'var(--green)' }}>
                                {DAYS[r.dayOfWeek]} · {r.startTime}–{r.endTime}{r.room ? ` · ${r.room}` : ''}
                              </div>
                            </div>
                          ) : (
                            <div style={{ fontFamily:'Share Tech Mono,monospace', fontSize:10, color:'var(--text-muted)' }}>{DAYS[r.dayOfWeek]} · {r.startTime}–{r.endTime}{r.room ? ` · ${r.room}` : ''}</div>
                          )}
                          {r.note && !isGradeReq(r) && (
                            <div style={{ fontFamily:'Barlow,sans-serif', fontSize:11, color:'var(--text-muted)', marginTop:3, fontStyle:'italic' }}>"{r.note}"</div>
                          )}
                        </div>
                      )}
                    </td>
                    <td><span className="badge badge-beige" style={{ fontSize:9 }}>{r.semester} {r.year}</span></td>
                    <td><span className={`badge ${s.cls}`} style={{ fontSize:9 }}>{s.label}</span></td>
                    <td style={{ fontFamily:'Share Tech Mono,monospace', fontSize:10, color:'var(--text-faint)', whiteSpace:'nowrap' }}>
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      {r.status === 'PENDING' ? (
                        <ActBtn label="ШИЙДВЭРЛЭХ" onClick={() => setSelected(r)} />
                      ) : (
                        <span className="t-label">{r.adminNote ? `"${r.adminNote.slice(0,30)}..."` : '—'}</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <ApproveModal
          item={selected}
          onClose={() => setSelected(null)}
          onDone={() => { setSelected(null); load() }}
        />
      )}
    </div>
  )
}
