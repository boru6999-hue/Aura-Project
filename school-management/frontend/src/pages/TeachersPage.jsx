import { useState, useEffect, useCallback } from 'react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'
import Modal from '../components/Modal'
import { PageHeader, SkeletonTable, Empty, ActBtn, Avatar, Code, Pagination, Spinner } from '../components/UI'

const EMPTY = { email:'', password:'', firstName:'', lastName:'', department:'', phone:'' }

export default function TeachersPage() {
  const { isAdmin } = useAuth()
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
    try { const r = await api.get('/teachers', { params:{ search, page, limit:12 } }); setRows(r.data.data); setMeta(r.data.meta) }
    catch { toast('Ачааллахад алдаа гарлаа', 'error') }
    finally { setLoading(false) }
  }, [search, page])

  useEffect(() => { load() }, [load])

  const openCreate = () => { setForm(EMPTY); setEditId(null); setModal(true) }
  const openEdit   = t => { setForm({ firstName:t.firstName, lastName:t.lastName, department:t.department||'', phone:t.phone||'', email:'', password:'' }); setEditId(t.id); setModal(true) }

  const save = async e => {
    e.preventDefault(); setSaving(true)
    try {
      if (editId) { await api.put(`/teachers/${editId}`, form); toast('Шинэчлэгдлээ', 'success') }
      else        { await api.post('/teachers', form); toast('Нэмэгдлээ', 'success') }
      setModal(false); load()
    } catch (err) { toast(err.response?.data?.error || 'Алдаа', 'error') }
    finally { setSaving(false) }
  }

  const del = async (id, name) => {
    if (!confirm(`"${name}" устгах уу?`)) return
    try { await api.delete(`/teachers/${id}`); toast(`${name} устгагдлаа`, 'info'); load() }
    catch (err) { toast(err.response?.data?.error || 'Устгахад алдаа', 'error') }
  }

  return (
    <div className="page">
      <PageHeader eyebrow="БҮРТГЭЛ" titleMain="БАГШ " titleDim="НАР" meta={`${meta.total||0} нийт багш`}
        action={isAdmin && <button className="btn btn-primary" onClick={openCreate}>＋ НЭМЭХ</button>} />

      <div style={{ marginBottom:14 }}>
        <input className="input" style={{ maxWidth:320 }} placeholder="Нэр, код хайх..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
      </div>

      {loading ? <SkeletonTable rows={8} cols={6} /> : rows.length === 0 ? <Empty /> : (
        <div className="anim-fade" style={{ background:'var(--bg-card)', border:'1.5px solid var(--border-light)', overflowX:'auto' }}>
          <table className="tbl">
            <thead><tr>{['КОД','НЭР','ТЭНХИМ','И-МЭЙЛ','ХИЧЭЭЛ','ҮЙЛДЭЛ'].map(h => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {rows.map(t => (
                <tr key={t.id}>
                  <td><Code>{t.teacherCode}</Code></td>
                  <td><div style={{ display:'flex', alignItems:'center', gap:9 }}><Avatar first={t.firstName} last={t.lastName} /><span style={{ fontWeight:600 }}>{t.firstName} {t.lastName}</span></div></td>
                  <td style={{ color:'var(--text-muted)' }}>{t.department || '—'}</td>
                  <td style={{ color:'var(--text-muted)' }}>{t.user?.email}</td>
                  <td><span className="badge badge-navy">{t._count?.courses||0}</span></td>
                  <td>
                    {isAdmin && <div style={{ display:'flex', gap:6 }}>
                      <ActBtn label="ЗАСАХ" onClick={() => openEdit(t)} />
                      <ActBtn label="УСТГАХ" danger onClick={() => del(t.id, `${t.firstName} ${t.lastName}`)} />
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
        <Modal title={editId ? 'Багш засах' : 'Багш нэмэх'} onClose={() => setModal(false)}>
          <form onSubmit={save} style={{ display:'contents' }}>
            {!editId && <>
              <div><label className="form-label">И-мэйл *</label><input className="input" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required /></div>
              <div><label className="form-label">Нууц үг</label><input className="input" type="password" placeholder="teacher123" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} /></div>
            </>}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div><label className="form-label">Нэр *</label><input className="input" value={form.firstName} onChange={e=>setForm({...form,firstName:e.target.value})} required /></div>
              <div><label className="form-label">Овог *</label><input className="input" value={form.lastName} onChange={e=>setForm({...form,lastName:e.target.value})} required /></div>
            </div>
            <div><label className="form-label">Тэнхим</label><input className="input" value={form.department} onChange={e=>setForm({...form,department:e.target.value})} /></div>
            <div><label className="form-label">Утас</label><input className="input" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} /></div>
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
