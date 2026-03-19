import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';
import { SkeletonTable } from '../components/Skeleton';

const STATUS_STYLE = {
  PRESENT: 'text-[#6bcb77]',
  ABSENT:  'text-[#ff6b6b]',
  LATE:    'text-[#ffd93d]',
};
const STATUS_MN = { PRESENT: 'Ирсэн', ABSENT: 'Тасалсан', LATE: 'Хоцорсон' };

export default function AttendancePage() {
  const { isAdmin, isTeacher } = useAuth();
  const { show: toast } = useToast();
  const [records, setRecords]   = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filters, setFilters]   = useState({ studentId:'', courseId:'', date:'' });
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ studentId:'', courseId:'', status:'PRESENT', date: new Date().toISOString().split('T')[0] });
  const [submitting, setSubmitting] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.studentId) params.studentId = filters.studentId;
      if (filters.courseId)  params.courseId  = filters.courseId;
      if (filters.date)      params.date      = filters.date;
      const res = await api.get('/attendance', { params });
      setRecords(res.data.data);
    } catch { toast('Ирцийн мэдээлэл ачааллахад алдаа гарлаа','error'); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetch(); }, [fetch]);
  useEffect(() => {
    Promise.all([api.get('/students?limit=200'), api.get('/courses?limit=200')])
      .then(([s,c]) => { setStudents(s.data.data); setCourses(c.data.data); }).catch(()=>{});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try {
      await api.post('/attendance', form);
      toast('Ирц амжилттай бүртгэгдлээ ✅','success');
      setShowModal(false); fetch();
    } catch (err) { toast(err.response?.data?.error||'Алдаа гарлаа','error'); }
    finally { setSubmitting(false); }
  };

  const presentCount = records.filter(r=>r.status==='PRESENT').length;
  const absentCount  = records.filter(r=>r.status==='ABSENT').length;
  const lateCount    = records.filter(r=>r.status==='LATE').length;
  const attendRate   = records.length ? Math.round((presentCount/records.length)*100) : 0;

  return (
    <div className="animate-fade-in" style={{ padding:"28px", minHeight:"100vh", background:"#0a0e1a" }}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ирц</h1>
          <p className="text-sm text-[rgba(255,255,255,0.35)]">{records.length} нийт бүртгэл</p>
        </div>
        {(isAdmin||isTeacher) && (
          <button onClick={()=>{ setForm({studentId:'',courseId:'',status:'PRESENT',date:new Date().toISOString().split('T')[0]}); setShowModal(true); }}
            className="btn-primary animate-bounce-in">＋ Ирц бүртгэх</button>
        )}
      </div>

      {records.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger">
          {[
            { label:'Ирсэн',   value:presentCount, color:'bg-emerald-50 border-emerald-200 text-emerald-800' },
            { label:'Тасалсан', value:absentCount,  color:'bg-red-50 border-red-200 text-red-800' },
            { label:'Хоцорсон', value:lateCount,    color:'bg-yellow-50 border-yellow-200 text-yellow-800' },
            { label:'Ирцийн хувь', value:`${attendRate}%`, color:'bg-indigo-50 border-indigo-200 text-indigo-800' },
          ].map((s,i) => (
            <div key={i} className={`rounded-2xl border p-4 text-center animate-fade-in ${s.color}`} style={{ animationDelay:`${i*0.08}s` }}>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs font-semibold mt-1 opacity-70">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="card p-4 animate-slide-down">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select className="input-field text-sm" value={filters.studentId} onChange={e=>setFilters({...filters,studentId:e.target.value})}>
            <option value="">Бүх сурагч</option>
            {students.map(s=><option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}
          </select>
          <select className="input-field text-sm" value={filters.courseId} onChange={e=>setFilters({...filters,courseId:e.target.value})}>
            <option value="">Бүх хичээл</option>
            {courses.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input type="date" className="input-field text-sm" value={filters.date} onChange={e=>setFilters({...filters,date:e.target.value})} />
        </div>
      </div>

      {loading ? <SkeletonTable rows={7} cols={4}/> : records.length === 0 ? (
        <div className="card text-center py-16 animate-scale-in">
          <span className="text-5xl">✅</span>
          <p className="text-[rgba(255,255,255,0.25)] mt-3 font-medium">Ирцийн бүртгэл олдсонгүй</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#0a0e1a] border-b border-[rgba(255,255,255,0.08)]">
                <tr>{['Сурагч','Хичээл','Огноо','Статус'].map(h=><th key={h} className="px-4 py-3 text-left text-xs font-bold text-[rgba(255,255,255,0.35)] uppercase tracking-wider">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100 stagger">
                {records.map((r,i) => (
                  <tr key={r.id} className="table-row-hover animate-fade-in" style={{ animationDelay:`${i*0.04}s` }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {r.student?.firstName?.[0]}{r.student?.lastName?.[0]}
                        </div>
                        <span className="font-medium text-[#e8eaf0]">{r.student?.firstName} {r.student?.lastName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[rgba(255,255,255,0.35)] text-xs">{r.course?.name}</td>
                    <td className="px-4 py-3 text-[rgba(255,255,255,0.35)]">{new Date(r.date).toLocaleDateString('mn-MN')}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLE[r.status]||'bg-slate-100 text-slate-800'}`}>
                        {STATUS_MN[r.status] || r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <Modal title="Ирц бүртгэх" onClose={()=>setShowModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-[rgba(255,255,255,0.7)] mb-1.5">Сурагч *</label>
              <select className="input-field" value={form.studentId} onChange={e=>setForm({...form,studentId:e.target.value})} required>
                <option value="">Сурагч сонгоно уу</option>
                {students.map(s=><option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.studentCode})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[rgba(255,255,255,0.7)] mb-1.5">Хичээл *</label>
              <select className="input-field" value={form.courseId} onChange={e=>setForm({...form,courseId:e.target.value})} required>
                <option value="">Хичээл сонгоно уу</option>
                {courses.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[rgba(255,255,255,0.7)] mb-1.5">Статус</label>
              <div className="grid grid-cols-3 gap-2">
                {['PRESENT','ABSENT','LATE'].map(s => (
                  <button type="button" key={s}
                    onClick={()=>setForm({...form,status:s})}
                    className={`py-2.5 px-3 rounded-xl text-sm font-semibold border transition-all duration-200 active:scale-95
                      ${form.status===s ? STATUS_STYLE[s]+' border-current shadow-sm' : 'bg-[#141c2e] border-[rgba(255,255,255,0.08)] text-slate-600 hover:bg-[#0a0e1a]'}`}>
                    {STATUS_MN[s]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[rgba(255,255,255,0.7)] mb-1.5">Огноо</label>
              <input type="date" className="input-field" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={submitting} className="btn-primary flex-1">
                {submitting ? <span className="flex items-center justify-center gap-2"><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"/>Бүртгэж байна...</span> : 'Бүртгэх'}
              </button>
              <button type="button" onClick={()=>setShowModal(false)} className="btn-secondary flex-1">Болих</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
