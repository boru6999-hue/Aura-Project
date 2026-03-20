import { useState, useEffect, useCallback } from 'react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'
import Modal from '../components/Modal'
import { PageHeader, SkeletonTable, Empty, ActBtn, Code, Pagination, Spinner } from '../components/UI'

const EMPTY = { name:'', description:'', credits:3, teacherId:'' }

export default function CoursesPage() {
  const { isAdmin } = useAuth()
  const { show: toast } = useToast()
  const [rows, setRows]       = useState([])
  const [meta, setMeta]       = useState({})
  const [teachers, setTeachers] = useState([])
  const [search, setSearch]   = useState('')
  const [page, setPage]       = useState(1)
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState(false)
  const [form, setForm]       = useState(EMPTY)
  const [editId, setEditId]   = useState(null)
  const [saving, setSaving]   = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [r, t] = await Promise.all([
        api.get('/courses', { params:{ search, page, limit:12 } }),
        api.get('/teachers?limit=100'),
      ])
      setRows(r.data.data); setMeta(r.data.meta); setTeachers(t.data.data || [])
    } catch { toast('Ачааллахад алдаа гарлаа', 'error') }
    finally { setLoading(false) }
  }, [search, page])

  useEffect(() => { load() }, [load])

  const openCreate = () => { setForm(EMPTY); setEditId(null); setModal(true) }
  const openEdit   = c => { setForm({ name:c.name, description:c.description||'', credits:c.credits, teacherId:c.teacherId||'' }); setEditId(c.id); setModal(true) }

  const save = async e => {
    e.preventDefault(); setSaving(true)
    try {
      const body = { ...form, credits: Number(form.credits), teacherId: form.teacherId ? Number(form.teacherId) : null }
      if (editId) { await api.put(`/courses/${editId}`, body); toast('Шинэчлэгдлээ', 'success') }
      else        { await api.post('/courses', body); toast('Нэмэгдлээ', 'success') }
      setModal(false); load()
    } catch (err) { toast(err.response?.data?.error || 'Алдаа', 'error') }
    finally { setSaving(false) }
  }

  const del = async (id, name) => {
    if (!confirm(`"${name}" устгах уу?`)) return
    try { await api.delete(`/courses/${id}`); toast(`${name} устгагдлаа`, 'info'); load() }
    catch (err) { toast(err.response?.data?.error || 'Устгахад алдаа', 'error') }
  }

  return (
    <div className="page">
      <PageHeader eyebrow="СУРГАЛТ" titleMain="ХИЧЭЭЛ" titleDim="ҮҮД" meta={`${meta.total||0} нийт хичээл`}
        action={isAdmin && <button className="btn btn-primary" onClick={openCreate}>＋ НЭМЭХ</button>} />
      <div style={{ marginBottom:14 }}>
        <input className="input" style={{ maxWidth:320 }} placeholder="Хичээл хайх..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
      </div>
      {loading ? <SkeletonTable rows={8} cols={6} /> : rows.length === 0 ? <Empty /> : (
        <div className="anim-fade" style={{ background:'var(--bg-card)', border:'1.5px solid var(--border-light)', overflowX:'auto' }}>
          <table className="tbl">
            <thead><tr>{['КОД','НЭР','КРЕДИТ','БАГШ','БҮРТГЭЛ','ҮЙЛДЭЛ'].map(h => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {rows.map(c => (
                <tr key={c.id}>
                  <td><Code>{c.courseCode}</Code></td>
                  <td style={{ fontWeight:600, maxWidth:200 }}>
                    <div>{c.name}</div>
                    {c.description && <div style={{ fontFamily:'Barlow,sans-serif', fontWeight:400, fontSize:11, color:'var(--text-faint)', marginTop:2 }}>{c.description.slice(0,60)}{c.description.length > 60 ? '...' : ''}</div>}
                  </td>
                  <td><span className="badge badge-beige">{c.credits} CR</span></td>
                  <td style={{ color:'var(--text-muted)' }}>{c.teacher ? `${c.teacher.firstName} ${c.teacher.lastName}` : '—'}</td>
                  <td><span className="badge badge-navy">{c._count?.enrollments||0}</span></td>
                  <td>
                    {isAdmin && <div style={{ display:'flex', gap:6 }}>
                      <ActBtn label="ЗАСАХ" onClick={() => openEdit(c)} />
                      <ActBtn label="УСТГАХ" danger onClick={() => del(c.id, c.name)} />
                    </div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} totalPages={meta.totalPages} onPage={setPage} />
      {modal && (
        <Modal title={editId ? 'Хичээл засах' : 'Хичээл нэмэх'} onClose={() => setModal(false)}>
          <form onSubmit={save} style={{ display:'contents' }}>
            <div><label className="form-label">Нэр *</label><input className="input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required /></div>
            <div><label className="form-label">Тайлбар</label><textarea className="input" rows={3} style={{ resize:'none' }} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} /></div>
            <div><label className="form-label">Кредит</label><input className="input" type="number" min="1" max="10" value={form.credits} onChange={e=>setForm({...form,credits:e.target.value})} /></div>
            <div>
              <label className="form-label">Багш</label>
              <select className="input" value={form.teacherId} onChange={e=>setForm({...form,teacherId:e.target.value})}>
                <option value="">Сонгоно уу</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>)}
              </select>
            </div>
            <div style={{ display:'flex', gap:10, paddingTop:4 }}>
              <button type="submit" disabled={saving} className="btn btn-primary" style={{ flex:1 }}>{saving ? <Spinner /> : editId ? 'ШИНЭЧЛЭХ' : 'НЭМЭХ'}</button>
              <button type="button" onClick={() => setModal(false)} className="btn btn-ghost" style={{ flex:1 }}>БОЛИХ</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
