import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';
import { SkeletonTable } from '../components/Skeleton';

export default function TeachersPage() {
  const { isAdmin } = useAuth();
  const { show: toast } = useToast();
  const [teachers, setTeachers] = useState([]);
  const [meta, setMeta] = useState({});
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ email:'', password:'', firstName:'', lastName:'', department:'', phone:'' });
  const [editId, setEditId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/teachers', { params: { search, page, limit: 10 } });
      setTeachers(res.data.data); setMeta(res.data.meta);
    } catch { toast('Ачааллахад алдаа гарлаа', 'error'); }
    finally { setLoading(false); }
  }, [search, page]);

  useEffect(() => { fetch(); }, [fetch]);

  const openCreate = () => { setForm({ email:'', password:'', firstName:'', lastName:'', department:'', phone:'' }); setEditId(null); setShowModal(true); };
  const openEdit   = (t) => { setForm({ firstName:t.firstName, lastName:t.lastName, department:t.department||'', phone:t.phone||'', email:'', password:'' }); setEditId(t.id); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try {
      if (editId) { await api.put(`/teachers/${editId}`, form); toast('Багшийн мэдээлэл шинэчлэгдлээ', 'success'); }
      else         { await api.post('/teachers', form);          toast('Багш амжилттай нэмэгдлээ 🎉', 'success'); }
      setShowModal(false); fetch();
    } catch (err) { toast(err.response?.data?.error||'Алдаа гарлаа','error'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`"${name}" багшийг устгах уу?`)) return;
    try { await api.delete(`/teachers/${id}`); toast(`${name} устгагдлаа`,'info'); fetch(); }
    catch (err) { toast(err.response?.data?.error||'Устгахад алдаа гарлаа','error'); }
  };

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Багш нар</h1>
          <p className="text-sm text-slate-500">{meta.total||0} нийт багш</p>
        </div>
        {isAdmin && <button onClick={openCreate} className="btn-primary animate-bounce-in">＋ Нэмэх</button>}
      </div>

      <div className="card p-4 animate-slide-down">
        <input placeholder="Нэр, код хайх..." value={search}
          onChange={e=>{ setSearch(e.target.value); setPage(1); }}
          className="input-field max-w-sm" />
      </div>

      {loading ? <SkeletonTable rows={6} cols={5}/> : teachers.length === 0 ? (
        <div className="card text-center py-16 animate-scale-in">
          <span className="text-5xl">👩‍🏫</span>
          <p className="text-slate-400 mt-3 font-medium">Багш олдсонгүй</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>{['Код','Нэр','Тэнхим','И-мэйл','Хичээл','Үйлдэл'].map(h=><th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100 stagger">
                {teachers.map((t,i) => (
                  <tr key={t.id} className="table-row-hover animate-fade-in" style={{ animationDelay:`${i*0.05}s` }}>
                    <td className="px-4 py-3"><span className="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg">{t.teacherCode}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {t.firstName?.[0]}{t.lastName?.[0]}
                        </div>
                        <span className="font-medium text-slate-900">{t.firstName} {t.lastName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{t.department||'—'}</td>
                    <td className="px-4 py-3 text-slate-500">{t.user?.email}</td>
                    <td className="px-4 py-3"><span className="badge-teacher">{t._count?.courses||0}</span></td>
                    <td className="px-4 py-3">
                      {isAdmin && (
                        <div className="flex gap-1">
                          <button onClick={()=>openEdit(t)} className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 transition-all">Засах</button>
                          <button onClick={()=>handleDelete(t.id,`${t.firstName} ${t.lastName}`)} className="text-xs text-red-500 hover:text-red-700 font-semibold px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-all">Устгах</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">{meta.page}/{meta.totalPages} хуудас</p>
          <div className="flex gap-2">
            <button disabled={page<=1} onClick={()=>setPage(p=>p-1)} className="btn-secondary text-sm py-1.5 disabled:opacity-40">← Өмнөх</button>
            <button disabled={page>=meta.totalPages} onClick={()=>setPage(p=>p+1)} className="btn-secondary text-sm py-1.5 disabled:opacity-40">Дараах →</button>
          </div>
        </div>
      )}

      {showModal && (
        <Modal title={editId ? 'Багш засах' : 'Багш нэмэх'} onClose={()=>setShowModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!editId && <>
              <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">И-мэйл *</label><input className="input-field" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required /></div>
              <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Нууц үг</label><input type="password" className="input-field" placeholder="Default: teacher123" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} /></div>
            </>}
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Нэр *</label><input className="input-field" value={form.firstName} onChange={e=>setForm({...form,firstName:e.target.value})} required /></div>
              <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Овог *</label><input className="input-field" value={form.lastName} onChange={e=>setForm({...form,lastName:e.target.value})} required /></div>
            </div>
            <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Тэнхим</label><input className="input-field" value={form.department} onChange={e=>setForm({...form,department:e.target.value})} /></div>
            <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Утас</label><input className="input-field" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} /></div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={submitting} className="btn-primary flex-1">
                {submitting ? <span className="flex items-center justify-center gap-2"><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"/>Хадгалж байна...</span> : (editId?'Шинэчлэх':'Нэмэх')}
              </button>
              <button type="button" onClick={()=>setShowModal(false)} className="btn-secondary flex-1">Болих</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
