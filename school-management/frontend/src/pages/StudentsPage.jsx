import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';
import { SkeletonTable } from '../components/Skeleton';

const EMPTY = { email: '', password: '', firstName: '', lastName: '', phone: '', address: '', dateOfBirth: '' };

export default function StudentsPage() {
  const { isAdmin, isTeacher } = useAuth();
  const { show: toast } = useToast();
  const [students, setStudents] = useState([]);
  const [meta, setMeta] = useState({});
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/students', { params: { search, page, limit: 10 } });
      setStudents(res.data.data); setMeta(res.data.meta);
    } catch { toast('Ачааллахад алдаа гарлаа', 'error'); }
    finally { setLoading(false); }
  }, [search, page]);

  useEffect(() => { fetch(); }, [fetch]);

  const openCreate = () => { setForm(EMPTY); setEditId(null); setShowModal(true); };
  const openEdit = (s) => {
    setForm({ firstName: s.firstName, lastName: s.lastName, phone: s.phone||'', address: s.address||'', dateOfBirth: s.dateOfBirth?s.dateOfBirth.split('T')[0]:'', email:'', password:'' });
    setEditId(s.id); setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try {
      if (editId) { await api.put(`/students/${editId}`, form); toast('Сурагчийн мэдээлэл шинэчлэгдлээ', 'success'); }
      else         { await api.post('/students', form);          toast('Сурагч амжилттай нэмэгдлээ 🎉', 'success'); }
      setShowModal(false); fetch();
    } catch (err) { toast(err.response?.data?.error || 'Алдаа гарлаа', 'error'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`"${name}" сурагчийг устгах уу?`)) return;
    try { await api.delete(`/students/${id}`); toast(`${name} устгагдлаа`, 'info'); fetch(); }
    catch (err) { toast(err.response?.data?.error || 'Устгахад алдаа гарлаа', 'error'); }
  };

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Сурагчид</h1>
          <p className="text-sm text-slate-500 mt-0.5">{meta.total||0} нийт сурагч</p>
        </div>
        {(isAdmin||isTeacher) && <button onClick={openCreate} className="btn-primary animate-bounce-in">＋ Нэмэх</button>}
      </div>

      <div className="card p-4">
        <input placeholder="Нэр, код, и-мэйлээр хайх..." value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="input-field max-w-sm" />
      </div>

      {loading ? <SkeletonTable rows={8} cols={6} /> : students.length === 0 ? (
        <div className="card text-center py-16 animate-scale-in">
          <span className="text-5xl">👨‍🎓</span>
          <p className="text-slate-400 mt-3 font-medium">Сурагч олдсонгүй</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>{['Код','Нэр','И-мэйл','Хичээл','Дүн','Үйлдэл'].map(h=><th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100 stagger">
                {students.map((s, i) => (
                  <tr key={s.id} className="table-row-hover animate-fade-in" style={{ animationDelay: `${i*0.04}s` }}>
                    <td className="px-4 py-3"><span className="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg">{s.studentCode}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {s.firstName?.[0]}{s.lastName?.[0]}
                        </div>
                        <span className="font-medium text-slate-900">{s.firstName} {s.lastName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{s.user?.email}</td>
                    <td className="px-4 py-3"><span className="badge-student">{s._count?.enrollments||0}</span></td>
                    <td className="px-4 py-3"><span className="badge-admin">{s._count?.grades||0}</span></td>
                    <td className="px-4 py-3">
                      {(isAdmin||isTeacher) && (
                        <div className="flex gap-1">
                          <button onClick={() => openEdit(s)} className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 transition-all">Засах</button>
                          {isAdmin && <button onClick={() => handleDelete(s.id, `${s.firstName} ${s.lastName}`)} className="text-xs text-red-500 hover:text-red-700 font-semibold px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-all">Устгах</button>}
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
        <div className="flex items-center justify-between animate-fade-in">
          <p className="text-sm text-slate-500">{meta.page}/{meta.totalPages} хуудас</p>
          <div className="flex gap-2">
            <button disabled={page<=1} onClick={()=>setPage(p=>p-1)} className="btn-secondary text-sm py-1.5 disabled:opacity-40">← Өмнөх</button>
            <button disabled={page>=meta.totalPages} onClick={()=>setPage(p=>p+1)} className="btn-secondary text-sm py-1.5 disabled:opacity-40">Дараах →</button>
          </div>
        </div>
      )}

      {showModal && (
        <Modal title={editId ? 'Сурагч засах' : 'Сурагч нэмэх'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!editId && <>
              <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">И-мэйл *</label><input className="input-field" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required /></div>
              <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Нууц үг</label><input type="password" className="input-field" placeholder="Default: student123" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} /></div>
            </>}
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Нэр *</label><input className="input-field" value={form.firstName} onChange={e=>setForm({...form,firstName:e.target.value})} required /></div>
              <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Овог *</label><input className="input-field" value={form.lastName} onChange={e=>setForm({...form,lastName:e.target.value})} required /></div>
            </div>
            <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Утас</label><input className="input-field" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} /></div>
            <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Хаяг</label><input className="input-field" value={form.address} onChange={e=>setForm({...form,address:e.target.value})} /></div>
            <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Төрсөн өдөр</label><input type="date" className="input-field" value={form.dateOfBirth} onChange={e=>setForm({...form,dateOfBirth:e.target.value})} /></div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={submitting} className="btn-primary flex-1">
                {submitting?<span className="flex items-center justify-center gap-2"><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"/>Хадгалж байна...</span>:(editId?'Шинэчлэх':'Нэмэх')}
              </button>
              <button type="button" onClick={()=>setShowModal(false)} className="btn-secondary flex-1">Болих</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
