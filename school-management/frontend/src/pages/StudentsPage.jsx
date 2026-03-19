import { useState, useEffect, useCallback } from 'react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'
import Modal from '../components/Modal'
import { PageHeader, SkeletonTable, Empty, ActBtn, Avatar, Code, Pagination, Spinner } from '../components/UI'

const EMPTY = { email:'', password:'', firstName:'', lastName:'', phone:'', address:'', dateOfBirth:'' }

export default function StudentsPage() {
  const { isAdmin, isTeacher } = useAuth()
  const { show: toast } = useToast()
  const [rows, setRows]     = useState([])
  const [meta, setMeta]     = useState({})
  const [search, setSearch] = useState('')
  const [page, setPage]     = useState(1)
  const [loading, setLoading] = useState(true)
  const [modal, setModal]   = useState(false)
  const [form, setForm]     = useState(EMPTY)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try { const r = await api.get('/students', { params:{ search, page, limit:12 } }); setRows(r.data.data); setMeta(r.data.meta) }
    catch { toast('Ачааллахад алдаа гарлаа', 'error') }
    finally { setLoading(false) }
  }, [search, page])

  useEffect(() => { load() }, [load])

  const openCreate = () => { setForm(EMPTY); setEditId(null); setModal(true) }
  const openEdit   = s => { setForm({ firstName:s.firstName, lastName:s.lastName, phone:s.phone||'', address:s.address||'', dateOfBirth:s.dateOfBirth?s.dateOfBirth.split('T')[0]:'', email:'', password:'' }); setEditId(s.id); setModal(true) }

  const save = async e => {
    e.preventDefault(); setSaving(true)
    try {
      if (editId) { await api.put(`/students/${editId}`, form); toast('Шинэчлэгдлээ', 'success') }
      else        { await api.post('/students', form); toast('Нэмэгдлээ', 'success') }
      setModal(false); load()
    } catch (err) { toast(err.response?.data?.error || 'Алдаа', 'error') }
    finally { setSaving(false) }
  }

  const del = async (id, name) => {
    if (!confirm(`"${name}" устгах уу?`)) return
    try { await api.delete(`/students/${id}`); toast(`${name} устгагдлаа`, 'info'); load() }
    catch (err) { toast(err.response?.data?.error || 'Устгахад алдаа', 'error') }
  }

  return (
    <div className="page">
      <PageHeader eyebrow="БҮРТГЭЛ" titleMain="СУРАГЧ" titleDim="ИД" meta={`${meta.total||0} нийт сурагч`}
        action={(isAdmin||isTeacher) && <button className="btn btn-primary" onClick={openCreate}>＋ НЭМЭХ</button>} />

      {/* Search */}
      <div style={{ marginBottom:14 }}>
        <input className="input" style={{ maxWidth:320 }} placeholder="Нэр, код, и-мэйлээр хайх..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
      </div>

      {/* Table */}
      {loading ? <SkeletonTable rows={10} cols={6} /> : rows.length === 0 ? <Empty /> : (
        <div className="anim-fade" style={{ background:'var(--bg-card)', border:'1.5px solid var(--border-light)', overflowX:'auto' }}>
          <table className="tbl">
            <thead><tr>{['КОД','НЭР','И-МЭЙЛ','ХИЧЭЭЛ','ДҮН','ҮЙЛДЭЛ'].map(h => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {rows.map(s => (
                <tr key={s.id}>
                  <td><Code>{s.studentCode}</Code></td>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                      <Avatar first={s.firstName} last={s.lastName} />
                      <span style={{ fontWeight:600 }}>{s.firstName} {s.lastName}</span>
                    </div>
                  </td>
                  <td style={{ color:'var(--text-muted)' }}>{s.user?.email}</td>
                  <td><span className="badge badge-navy">{s._count?.enrollments||0}</span></td>
                  <td><span className="badge badge-beige">{s._count?.grades||0}</span></td>
                  <td>
                    {(isAdmin||isTeacher) && (
                      <div style={{ display:'flex', gap:6 }}>
                        <ActBtn label="ЗАСАХ" onClick={() => openEdit(s)} />
                        {isAdmin && <ActBtn label="УСТГАХ" danger onClick={() => del(s.id, `${s.firstName} ${s.lastName}`)} />}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} totalPages={meta.totalPages} onPage={setPage} />

      {modal && (
        <Modal title={editId ? 'Сурагч засах' : 'Сурагч нэмэх'} onClose={() => setModal(false)}>
          <form onSubmit={save} style={{ display:'contents' }}>
            {!editId && <>
              <div><label className="form-label">И-мэйл *</label><input className="input" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required /></div>
              <div><label className="form-label">Нууц үг</label><input className="input" type="password" placeholder="student123" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} /></div>
            </>}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div><label className="form-label">Нэр *</label><input className="input" value={form.firstName} onChange={e=>setForm({...form,firstName:e.target.value})} required /></div>
              <div><label className="form-label">Овог *</label><input className="input" value={form.lastName} onChange={e=>setForm({...form,lastName:e.target.value})} required /></div>
            </div>
            <div><label className="form-label">Утас</label><input className="input" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} /></div>
            <div><label className="form-label">Хаяг</label><input className="input" value={form.address} onChange={e=>setForm({...form,address:e.target.value})} /></div>
            <div><label className="form-label">Төрсөн өдөр</label><input className="input" type="date" value={form.dateOfBirth} onChange={e=>setForm({...form,dateOfBirth:e.target.value})} /></div>
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
