import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';
import { SkeletonTable } from '../components/Skeleton';

const EMPTY = { email:'', password:'', firstName:'', lastName:'', phone:'', address:'', dateOfBirth:'' };

const label = (text) => (
  <label style={{ display:'block', fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.35)', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.08em', fontFamily:"'DM Mono',monospace" }}>{text}</label>
);

export default function StudentsPage() {
  const { isAdmin, isTeacher } = useAuth();
  const { show: toast } = useToast();
  const [students, setStudents] = useState([]);
  const [meta, setMeta]         = useState({});
  const [search, setSearch]     = useState('');
  const [page, setPage]         = useState(1);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]         = useState(EMPTY);
  const [editId, setEditId]     = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await api.get('/students',{params:{search,page,limit:10}}); setStudents(r.data.data); setMeta(r.data.meta); }
    catch { toast('Ачааллахад алдаа гарлаа','error'); }
    finally { setLoading(false); }
  }, [search, page]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm(EMPTY); setEditId(null); setShowModal(true); };
  const openEdit = (s) => {
    setForm({ firstName:s.firstName, lastName:s.lastName, phone:s.phone||'', address:s.address||'', dateOfBirth:s.dateOfBirth?s.dateOfBirth.split('T')[0]:'', email:'', password:'' });
    setEditId(s.id); setShowModal(true);
  };
  const handleSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try {
      if (editId) { await api.put(`/students/${editId}`,form); toast('Сурагчийн мэдээлэл шинэчлэгдлээ','success'); }
      else        { await api.post('/students',form);           toast('Сурагч амжилттай нэмэгдлээ','success'); }
      setShowModal(false); load();
    } catch(err) { toast(err.response?.data?.error||'Алдаа гарлаа','error'); }
    finally { setSubmitting(false); }
  };
  const handleDelete = async (id, name) => {
    if (!confirm(`"${name}" сурагчийг устгах уу?`)) return;
    try { await api.delete(`/students/${id}`); toast(`${name} устгагдлаа`,'info'); load(); }
    catch(err) { toast(err.response?.data?.error||'Устгахад алдаа гарлаа','error'); }
  };

  return (
    <div style={{ padding:'28px', minHeight:'100vh', background:'#0a0e1a' }} className="animate-fade-in">
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:'#e8eaf0', margin:0, letterSpacing:'-0.02em' }}>Сурагчид</h1>
          <p style={{ margin:'4px 0 0', fontSize:11, color:'rgba(255,255,255,0.3)', fontFamily:"'DM Mono',monospace" }}>// {meta.total||0} нийт сурагч</p>
        </div>
        {(isAdmin||isTeacher) && <button onClick={openCreate} className="btn-primary animate-bounce-in">＋ Нэмэх</button>}
      </div>

      {/* Search */}
      <div style={{ marginBottom:16 }}>
        <input placeholder="// нэр, код, и-мэйлээр хайх..." value={search}
          onChange={e=>{setSearch(e.target.value);setPage(1);}}
          className="input-field" style={{ maxWidth:360 }} />
      </div>

      {/* Table */}
      {loading ? <SkeletonTable rows={8} cols={6}/> : students.length === 0 ? (
        <div style={{ background:'#141c2e', border:'1px solid rgba(255,255,255,0.06)', borderRadius:20, textAlign:'center', padding:'64px 0' }} className="animate-scale-in">
          <span style={{ fontSize:48 }}>👨‍🎓</span>
          <p style={{ color:'rgba(255,255,255,0.25)', marginTop:12, fontWeight:600 }}>Сурагч олдсонгүй</p>
        </div>
      ) : (
        <div style={{ background:'#141c2e', border:'1px solid rgba(255,255,255,0.06)', borderRadius:20, overflow:'hidden' }} className="animate-fade-in">
          <div style={{ overflowX:'auto' }}>
            <table>
              <thead>
                <tr>{['Код','Нэр','И-мэйл','Хичээл','Дүн','Үйлдэл'].map(h=><th key={h} style={{ textAlign:'left' }}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {students.map((s,i)=>(
                  <tr key={s.id} className="table-row-hover animate-fade-in" style={{ animationDelay:`${i*0.04}s` }}>
                    <td>
                      <span style={{ fontSize:11, fontFamily:"'DM Mono',monospace", background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.5)', padding:'3px 8px', borderRadius:6 }}>{s.studentCode}</span>
                    </td>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <div style={{ width:28, height:28, borderRadius:'50%', background:'linear-gradient(135deg,#00d4ff,#0099cc)', display:'flex', alignItems:'center', justifyContent:'center', color:'#001a22', fontSize:11, fontWeight:900, flexShrink:0 }}>
                          {s.firstName?.[0]}{s.lastName?.[0]}
                        </div>
                        <span style={{ fontWeight:600, color:'#e8eaf0' }}>{s.firstName} {s.lastName}</span>
                      </div>
                    </td>
                    <td style={{ color:'rgba(255,255,255,0.4)', fontFamily:"'DM Mono',monospace", fontSize:12 }}>{s.user?.email}</td>
                    <td><span className="badge-student">{s._count?.enrollments||0}</span></td>
                    <td><span className="badge-admin">{s._count?.grades||0}</span></td>
                    <td>
                      {(isAdmin||isTeacher) && (
                        <div style={{ display:'flex', gap:4 }}>
                          <button onClick={()=>openEdit(s)} style={{ fontSize:12, fontWeight:700, color:'#00d4ff', border:'1px solid rgba(0,212,255,0.2)', background:'rgba(0,212,255,0.06)', padding:'4px 10px', borderRadius:8, cursor:'pointer', transition:'all 0.12s' }}
                            onMouseEnter={e=>{e.currentTarget.style.background='rgba(0,212,255,0.12)';}}
                            onMouseLeave={e=>{e.currentTarget.style.background='rgba(0,212,255,0.06)';}}
                          >Засах</button>
                          {isAdmin && <button onClick={()=>handleDelete(s.id,`${s.firstName} ${s.lastName}`)} style={{ fontSize:12, fontWeight:700, color:'#ff6b6b', border:'1px solid rgba(255,107,107,0.2)', background:'rgba(255,107,107,0.06)', padding:'4px 10px', borderRadius:8, cursor:'pointer', transition:'all 0.12s' }}
                            onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,107,107,0.12)';}}
                            onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,107,107,0.06)';}}
                          >Устгах</button>}
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

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:16 }} className="animate-fade-in">
          <p style={{ fontSize:11, color:'rgba(255,255,255,0.3)', fontFamily:"'DM Mono',monospace" }}>{meta.page}/{meta.totalPages} хуудас</p>
          <div style={{ display:'flex', gap:8 }}>
            <button disabled={page<=1} onClick={()=>setPage(p=>p-1)} className="btn-secondary" style={{ fontSize:12, padding:'6px 14px' }}>← Өмнөх</button>
            <button disabled={page>=meta.totalPages} onClick={()=>setPage(p=>p+1)} className="btn-secondary" style={{ fontSize:12, padding:'6px 14px' }}>Дараах →</button>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <Modal title={editId ? 'Сурагч засах' : 'Сурагч нэмэх'} onClose={()=>setShowModal(false)}>
          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {!editId && <>
              <div>{label('И-мэйл *')}<input className="input-field" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required/></div>
              <div>{label('Нууц үг')}<input type="password" className="input-field" placeholder="Default: student123" value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/></div>
            </>}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div>{label('Нэр *')}<input className="input-field" value={form.firstName} onChange={e=>setForm({...form,firstName:e.target.value})} required/></div>
              <div>{label('Овог *')}<input className="input-field" value={form.lastName} onChange={e=>setForm({...form,lastName:e.target.value})} required/></div>
            </div>
            <div>{label('Утас')}<input className="input-field" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></div>
            <div>{label('Хаяг')}<input className="input-field" value={form.address} onChange={e=>setForm({...form,address:e.target.value})}/></div>
            <div>{label('Төрсөн өдөр')}<input type="date" className="input-field" value={form.dateOfBirth} onChange={e=>setForm({...form,dateOfBirth:e.target.value})} style={{ colorScheme:'dark' }}/></div>
            <div style={{ display:'flex', gap:10, paddingTop:4 }}>
              <button type="submit" disabled={submitting} className="btn-primary" style={{ flex:1, justifyContent:'center' }}>
                {submitting?<><span style={{width:14,height:14,border:'2px solid rgba(0,26,34,0.3)',borderTopColor:'#001a22',borderRadius:'50%',display:'inline-block',animation:'spin 0.7s linear infinite'}}/>Хадгалж...</>:(editId?'Шинэчлэх':'Нэмэх')}
              </button>
              <button type="button" onClick={()=>setShowModal(false)} className="btn-secondary" style={{ flex:1, justifyContent:'center' }}>Болих</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
