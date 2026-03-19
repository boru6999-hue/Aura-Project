import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';
import { SkeletonCard } from '../components/Skeleton';

export default function CoursesPage() {
  const { isAdmin, isTeacher } = useAuth();
  const { show: toast } = useToast();
  const [courses, setCourses]   = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [meta, setMeta]         = useState({});
  const [search, setSearch]     = useState('');
  const [page, setPage]         = useState(1);
  const [loading, setLoading]   = useState(true);
  const [cached, setCached]     = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]         = useState({ name:'', description:'', credits:3, teacherId:'' });
  const [editId, setEditId]     = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/courses', { params: { search, page, limit: 9 } });
      setCourses(res.data.data); setMeta(res.data.meta); setCached(res.data.cached);
    } catch { toast('Хичээлүүд ачааллахад алдаа гарлаа', 'error'); }
    finally { setLoading(false); }
  }, [search, page]);

  useEffect(() => { fetch(); }, [fetch]);
  useEffect(() => { api.get('/teachers?limit=100').then(r=>setTeachers(r.data.data)).catch(()=>{}); }, []);

  const openCreate = () => { setForm({ name:'', description:'', credits:3, teacherId:'' }); setEditId(null); setShowModal(true); };
  const openEdit   = (c) => { setForm({ name:c.name, description:c.description||'', credits:c.credits, teacherId:c.teacherId||'' }); setEditId(c.id); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try {
      if (editId) { await api.put(`/courses/${editId}`, form); toast('Хичээл шинэчлэгдлээ', 'success'); }
      else         { await api.post('/courses', form);          toast('Хичээл амжилттай нэмэгдлээ 🎉', 'success'); }
      setShowModal(false); fetch();
    } catch (err) { toast(err.response?.data?.error || 'Алдаа гарлаа', 'error'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`"${name}" хичээлийг устгах уу?`)) return;
    try { await api.delete(`/courses/${id}`); toast(`${name} устгагдлаа`, 'info'); fetch(); }
    catch (err) { toast(err.response?.data?.error||'Устгахад алдаа гарлаа','error'); }
  };

  const creditColor = (n) => n >= 4 ? 'bg-rose-100 text-rose-700' : n === 3 ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600';

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Хичээлүүд</h1>
          <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-2">
            {meta.total||0} нийт хичээл
            {cached && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700 font-semibold">⚡ Кэшлэгдсэн</span>}
          </p>
        </div>
        {(isAdmin||isTeacher) && <button onClick={openCreate} className="btn-primary animate-bounce-in">＋ Нэмэх</button>}
      </div>

      <div className="card p-4 animate-slide-down">
        <input placeholder="Хичээл хайх..." value={search}
          onChange={e=>{ setSearch(e.target.value); setPage(1); }}
          className="input-field max-w-sm" />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_,i) => <SkeletonCard key={i} />)}
        </div>
      ) : courses.length === 0 ? (
        <div className="card text-center py-16 animate-scale-in">
          <span className="text-5xl">📚</span>
          <p className="text-slate-400 mt-3 font-medium">Хичээл олдсонгүй</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 stagger">
          {courses.map((c, i) => (
            <div key={c.id}
              className="card hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group animate-fade-in"
              style={{ animationDelay: `${i * 0.06}s` }}>
              <div className="flex items-start justify-between mb-3">
                <span className="font-mono text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg font-semibold">{c.courseCode}</span>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${creditColor(c.credits)}`}>{c.credits} кредит</span>
              </div>
              <h3 className="font-bold text-slate-900 mb-1 group-hover:text-indigo-700 transition-colors">{c.name}</h3>
              {c.description && <p className="text-xs text-slate-400 mb-3 line-clamp-2">{c.description}</p>}
              <div className="space-y-1 text-xs text-slate-500 mb-4">
                <div className="flex items-center gap-1.5">
                  <span>👩‍🏫</span>
                  <span>{c.teacher ? `${c.teacher.firstName} ${c.teacher.lastName}` : 'Багш оноогдоогүй'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span>👥</span>
                  <span>{c._count?.enrollments||0} сурагч бүртгэлтэй</span>
                </div>
              </div>
              {(isAdmin||isTeacher) && (
                <div className="flex gap-2 pt-3 border-t border-slate-100">
                  <button onClick={()=>openEdit(c)} className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 transition-all flex-1 text-center">Засах</button>
                  {isAdmin && <button onClick={()=>handleDelete(c.id, c.name)} className="text-xs text-red-500 hover:text-red-700 font-semibold px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-all flex-1 text-center">Устгах</button>}
                </div>
              )}
            </div>
          ))}
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
        <Modal title={editId ? 'Хичээл засах' : 'Хичээл нэмэх'} onClose={()=>setShowModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Хичээлийн нэр *</label><input className="input-field" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required /></div>
            <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Тайлбар</label><textarea className="input-field resize-none" rows={3} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} /></div>
            <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Кредит</label><input type="number" min="1" max="10" className="input-field" value={form.credits} onChange={e=>setForm({...form,credits:e.target.value})} /></div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Багш</label>
              <select className="input-field" value={form.teacherId} onChange={e=>setForm({...form,teacherId:e.target.value})}>
                <option value="">Багш оноогдоогүй</option>
                {teachers.map(t=><option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>)}
              </select>
            </div>
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
