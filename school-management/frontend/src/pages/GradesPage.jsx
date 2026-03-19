import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';
import { SkeletonTable } from '../components/Skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const GRADE_META = {
  A: { color: '#6bcb77', bg: 'rgba(107,203,119,0.12)', text: '#6bcb77', label: 'Өндөр',      range: '90–100' },
  B: { color: '#00d4ff', bg: 'rgba(0,212,255,0.10)',   text: '#00d4ff', label: 'Сайн',       range: '80–89' },
  C: { color: '#ffd93d', bg: 'rgba(255,217,61,0.12)',  text: '#ffd93d', label: 'Дундаж',     range: '70–79' },
  D: { color: '#ff8c42', bg: 'rgba(255,140,66,0.12)',  text: '#ff8c42', label: 'Хангалттай', range: '60–69' },
  F: { color: '#ff6b6b', bg: 'rgba(255,107,107,0.12)', text: '#ff6b6b', label: 'Тэнцээгүй', range: '0–59'  },
};
const GRADE_KEYS = ['A','B','C','D','F'];

const getLetterGrade = (score) => {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
};

/* ── Score bar ── */
const ScoreBar = ({ score }) => {
  const pct = Math.min(100, Math.max(0, score));
  const g   = getLetterGrade(score);
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
      <div style={{ width:80, height:4, background:'rgba(255,255,255,0.08)', borderRadius:2, overflow:'hidden' }}>
        <div style={{ width:`${pct}%`, height:'100%', background:GRADE_META[g].color, borderRadius:2, transition:'width 0.6s ease' }}/>
      </div>
      <span style={{ fontSize:12, fontWeight:800, color:GRADE_META[g].color, fontFamily:"'DM Mono',monospace", minWidth:28 }}>{score}</span>
    </div>
  );
};

/* ── Custom Donut ── */
const DonutChart = ({ data, total }) => {
  const size=180, cx=90, cy=90, R=72, r=44, gap=0.03;
  let sa = -Math.PI/2;
  const slices = data.map(d => {
    const angle = (d.value/total)*(Math.PI*2 - gap*data.length);
    const s = { ...d, startAngle:sa, endAngle:sa+angle };
    sa += angle+gap; return s;
  });
  const arc=(sa,ea,oR,iR)=>{
    const x1=cx+oR*Math.cos(sa),y1=cy+oR*Math.sin(sa);
    const x2=cx+oR*Math.cos(ea),y2=cy+oR*Math.sin(ea);
    const x3=cx+iR*Math.cos(ea),y3=cy+iR*Math.sin(ea);
    const x4=cx+iR*Math.cos(sa),y4=cy+iR*Math.sin(sa);
    const lg=ea-sa>Math.PI?1:0;
    return `M${x1},${y1} A${oR},${oR},0,${lg},1,${x2},${y2} L${x3},${y3} A${iR},${iR},0,${lg},0,${x4},${y4} Z`;
  };
  return (
    <div style={{ display:'flex', alignItems:'center', gap:28 }}>
      <svg width={size} height={size} style={{ flexShrink:0 }}>
        {slices.map(s=>(
          <path key={s.grade} d={arc(s.startAngle,s.endAngle,R,r)} fill={GRADE_META[s.grade].color}
            style={{ filter:'drop-shadow(0 2px 8px rgba(0,0,0,0.4))' }}/>
        ))}
        <text x={cx} y={cy-8} textAnchor="middle" style={{ fontSize:26, fontWeight:800, fill:'#e8eaf0', fontFamily:'Syne, sans-serif' }}>{total}</text>
        <text x={cx} y={cy+12} textAnchor="middle" style={{ fontSize:9, fontWeight:700, fill:'rgba(255,255,255,0.3)', letterSpacing:2, textTransform:'uppercase', fontFamily:"'DM Mono',monospace" }}>НИЙТ</text>
      </svg>
      <div style={{ display:'flex', flexDirection:'column', gap:8, flex:1 }}>
        {slices.map(s=>{
          const pct=((s.value/total)*100).toFixed(0);
          return (
            <div key={s.grade} style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:8, height:8, borderRadius:2, background:GRADE_META[s.grade].color, flexShrink:0 }}/>
              <div style={{ flex:1, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.5)' }}>
                  <span style={{ fontWeight:800, color:GRADE_META[s.grade].color, marginRight:6 }}>{s.grade}</span>
                  {GRADE_META[s.grade].label}
                </span>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <div style={{ width:44, height:3, borderRadius:2, background:'rgba(255,255,255,0.08)', overflow:'hidden' }}>
                    <div style={{ width:`${pct}%`, height:'100%', background:GRADE_META[s.grade].color, borderRadius:2 }}/>
                  </div>
                  <span style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.3)', minWidth:24, textAlign:'right', fontFamily:"'DM Mono',monospace" }}>{s.value}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ── Bar tooltip ── */
const BarTip = ({active, payload, label}) => {
  if (!active||!payload?.length) return null;
  return (
    <div style={{ background:'#1a2338', border:`1px solid ${GRADE_META[label]?.color||'rgba(255,255,255,0.1)'}40`, borderRadius:10, padding:'10px 14px', boxShadow:'0 8px 24px rgba(0,0,0,0.5)' }}>
      <div style={{ fontSize:13, fontWeight:800, color:GRADE_META[label]?.color }}>{label} — {GRADE_META[label]?.range}</div>
      <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', marginTop:2 }}>{payload[0].value} сурагч</div>
    </div>
  );
};

/* ── Semester averages ── */
const computeSemesterAverages = (grades) => {
  const map={};
  grades.forEach(g=>{
    const sid=g.studentId;
    if(!map[sid]) map[sid]={studentId:sid,name:`${g.student?.firstName} ${g.student?.lastName}`,code:g.student?.studentCode,semesters:{}};
    const key=`${g.semester} ${g.year}`;
    if(!map[sid].semesters[key]) map[sid].semesters[key]=[];
    map[sid].semesters[key].push(g.score);
  });
  const semKeys=[...new Set(grades.map(g=>`${g.semester} ${g.year}`))].sort();
  const rows=Object.values(map).map(s=>{
    const semAvgs={};
    semKeys.forEach(k=>{ const sc=s.semesters[k]; semAvgs[k]=sc?(sc.reduce((a,b)=>a+b,0)/sc.length).toFixed(1):'—'; });
    const all=grades.filter(g=>g.studentId===s.studentId).map(g=>g.score);
    return {...s,semAvgs,overall:all.length?(all.reduce((a,b)=>a+b,0)/all.length).toFixed(1):'—'};
  });
  return {rows,semKeys};
};

const avgColor=(v)=>{
  if(v==='—') return 'rgba(255,255,255,0.2)';
  return GRADE_META[getLetterGrade(parseFloat(v))].color;
};

/* ── Dark label helper ── */
const Lbl=({children})=>(
  <label style={{ display:'block', fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.35)', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.08em', fontFamily:"'DM Mono',monospace" }}>{children}</label>
);

/* dark card */
const DC = ({ children, style={} }) => (
  <div style={{ background:'#141c2e', border:'1px solid rgba(255,255,255,0.06)', borderRadius:20, ...style }}>{children}</div>
);

const chartAxis = { fontSize:11, fill:'rgba(255,255,255,0.3)', fontFamily:"'DM Mono',monospace" };

/* ════════════════════════════════════════════════ */
export default function GradesPage() {
  const { isAdmin, isTeacher } = useAuth();
  const { show: toast } = useToast();

  const [grades,    setGrades]    = useState([]);
  const [students,  setStudents]  = useState([]);
  const [courses,   setCourses]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState('table');
  const [filters,   setFilters]   = useState({ studentId:'', courseId:'', semester:'', year:'' });
  const [showModal, setShowModal] = useState(false);
  const [editingGrade, setEditingGrade] = useState(null);
  const [form,      setForm]      = useState({ studentId:'', courseId:'', score:'', semester:'Spring', year:new Date().getFullYear() });
  const [submitting,setSubmitting]= useState(false);

  const fetchGrades = useCallback(async () => {
    setLoading(true);
    try {
      const params={};
      if(filters.studentId) params.studentId=filters.studentId;
      if(filters.courseId)  params.courseId=filters.courseId;
      if(filters.semester)  params.semester=filters.semester;
      if(filters.year)      params.year=filters.year;
      const res = await api.get('/grades',{params});
      setGrades(res.data.data);
    } catch { toast('Дүнгүүд ачааллахад алдаа гарлаа','error'); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(()=>{ fetchGrades(); },[fetchGrades]);
  useEffect(()=>{
    Promise.all([api.get('/students?limit=200'),api.get('/courses?limit=200')])
      .then(([s,c])=>{ setStudents(s.data.data); setCourses(c.data.data); }).catch(()=>{});
  },[]);

  const openAdd  = () => { setEditingGrade(null); setForm({studentId:'',courseId:'',score:'',semester:'Spring',year:new Date().getFullYear()}); setShowModal(true); };
  const openEdit = (g) => { setEditingGrade(g); setForm({studentId:g.studentId,courseId:g.courseId,score:g.score,semester:g.semester,year:g.year}); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try {
      await api.post('/grades',{studentId:parseInt(form.studentId),courseId:parseInt(form.courseId),score:parseFloat(form.score),semester:form.semester,year:parseInt(form.year)});
      toast(editingGrade?'Дүн шинэчлэгдлээ':'Дүн хадгалагдлаа','success');
      setShowModal(false); fetchGrades();
    } catch(err) { toast(err.response?.data?.error||'Алдаа гарлаа','error'); }
    finally { setSubmitting(false); }
  };
  const handleDelete = async (id) => {
    if(!confirm('Энэ дүнг устгах уу?')) return;
    try { await api.delete(`/grades/${id}`); toast('Дүн устгагдлаа','info'); fetchGrades(); }
    catch { toast('Устгахад алдаа гарлаа','error'); }
  };

  /* computed */
  const dist={A:0,B:0,C:0,D:0,F:0};
  grades.forEach(g=>{ if(dist[g.grade]!==undefined) dist[g.grade]++; });
  const barData    = GRADE_KEYS.map(k=>({grade:k,value:dist[k]}));
  const donutData  = barData.filter(d=>d.value>0);
  const avg        = grades.length ? (grades.reduce((s,g)=>s+g.score,0)/grades.length).toFixed(1) : '—';
  const highest    = grades.length ? Math.max(...grades.map(g=>g.score)) : '—';
  const passing    = grades.filter(g=>g.score>=60).length;
  const {rows:semRows,semKeys} = computeSemesterAverages(grades);

  const TABS=[{key:'table',label:'Хүснэгт'},{key:'semester',label:'Улирлын дундаж'},{key:'chart',label:'График'}];

  /* row hover color */
  const rowBg = 'rgba(255,255,255,0.0)';
  const rowHover = 'rgba(255,255,255,0.03)';

  return (
    <div style={{ padding:28, minHeight:'100vh', background:'#0a0e1a', display:'flex', flexDirection:'column', gap:20 }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:'#e8eaf0', margin:0, letterSpacing:'-0.02em' }}>Дүнгүүд</h1>
          <p style={{ fontSize:12, color:'rgba(255,255,255,0.3)', marginTop:4, fontFamily:"'DM Mono',monospace" }}>
            // {grades.length} бичлэг{avg!=='—'&&<> · дундаж: <span style={{color:'#00d4ff',fontWeight:700}}>{avg}</span></>}
          </p>
        </div>
        {(isAdmin||isTeacher)&&<button onClick={openAdd} className="btn-primary">+ Дүн нэмэх</button>}
      </div>

      {/* Stat strip */}
      {grades.length>0&&(
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
          {[
            {label:'Нийт бичлэг',   value:grades.length, accent:'#c77dff'},
            {label:'Дундаж оноо',    value:avg,           accent:'#6bcb77'},
            {label:'Хамгийн өндөр', value:highest,       accent:'#ffd93d'},
            {label:'Тэнцсэн',       value:`${passing}/${grades.length}`, accent:'#00d4ff'},
          ].map((s,i)=>(
            <div key={i} style={{ background:'#141c2e', border:'1px solid rgba(255,255,255,0.06)', borderRadius:16, padding:'14px 18px', borderTop:`2px solid ${s.accent}` }}>
              <div style={{ fontSize:22, fontWeight:800, color:s.accent, letterSpacing:'-0.02em' }}>{s.value}</div>
              <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.3)', marginTop:4, textTransform:'uppercase', letterSpacing:'0.07em', fontFamily:"'DM Mono',monospace" }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Grade scale legend */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        {GRADE_KEYS.map(g=>(
          <div key={g} style={{ display:'flex', alignItems:'center', gap:6, background:GRADE_META[g].bg, border:`1px solid ${GRADE_META[g].color}30`, borderRadius:8, padding:'4px 10px' }}>
            <span style={{ fontWeight:800, fontSize:13, color:GRADE_META[g].color }}>{g}</span>
            <span style={{ fontSize:11, color:'rgba(255,255,255,0.35)', fontFamily:"'DM Mono',monospace" }}>{GRADE_META[g].range}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, background:'rgba(255,255,255,0.04)', borderRadius:12, padding:4, width:'fit-content', border:'1px solid rgba(255,255,255,0.06)' }}>
        {TABS.map(t=>(
          <button key={t.key} onClick={()=>setActiveTab(t.key)} style={{
            padding:'7px 18px', borderRadius:9, border:'none', cursor:'pointer',
            fontSize:13, fontWeight:700, transition:'all 0.15s', fontFamily:'Syne, sans-serif',
            background: activeTab===t.key ? '#1a2338' : 'transparent',
            color:       activeTab===t.key ? '#00d4ff' : 'rgba(255,255,255,0.35)',
            boxShadow:   activeTab===t.key ? '0 2px 8px rgba(0,0,0,0.4)' : 'none',
            border:      activeTab===t.key ? '1px solid rgba(0,212,255,0.2)' : '1px solid transparent',
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── CHART TAB ── */}
      {activeTab==='chart'&&(
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <DC style={{ padding:24 }}>
            <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.3)', letterSpacing:'0.08em', textTransform:'uppercase', fontFamily:"'DM Mono',monospace", marginBottom:4 }}>Дүнгийн тархалт</div>
            <div style={{ fontSize:17, fontWeight:800, color:'#e8eaf0', marginBottom:20 }}>Тоо хэмжээ</div>
            {grades.length===0
              ? <div style={{ textAlign:'center', color:'rgba(255,255,255,0.15)', padding:'40px 0', fontSize:14 }}>Өгөгдөл байхгүй</div>
              : <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={barData} barCategoryGap="40%">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
                    <XAxis dataKey="grade" tick={{...chartAxis, fontSize:13, fontWeight:700}} axisLine={false} tickLine={false}/>
                    <YAxis tick={chartAxis} axisLine={false} tickLine={false} allowDecimals={false}/>
                    <Tooltip content={<BarTip/>} cursor={{fill:'rgba(255,255,255,0.03)'}}/>
                    <Bar dataKey="value" radius={[8,8,0,0]} maxBarSize={56}>
                      {barData.map(d=><Cell key={d.grade} fill={GRADE_META[d.grade].color}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
            }
          </DC>

          <DC style={{ padding:24 }}>
            <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.3)', letterSpacing:'0.08em', textTransform:'uppercase', fontFamily:"'DM Mono',monospace", marginBottom:4 }}>Дүнгийн хуваарь</div>
            <div style={{ fontSize:17, fontWeight:800, color:'#e8eaf0', marginBottom:20 }}>Хувь харьцаа</div>
            {donutData.length===0
              ? <div style={{ textAlign:'center', color:'rgba(255,255,255,0.15)', padding:'40px 0' }}>Өгөгдөл байхгүй</div>
              : <DonutChart data={donutData} total={grades.length}/>
            }
          </DC>

          {semKeys.length>1&&(
            <DC style={{ padding:24, gridColumn:'1/-1' }}>
              <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.3)', letterSpacing:'0.08em', textTransform:'uppercase', fontFamily:"'DM Mono',monospace", marginBottom:4 }}>Улирлаар</div>
              <div style={{ fontSize:17, fontWeight:800, color:'#e8eaf0', marginBottom:20 }}>Улирлын дундаж оноо</div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={semKeys.map(k=>{
                  const vals=semRows.map(r=>r.semAvgs[k]).filter(v=>v!=='—').map(Number);
                  return {name:k, avg:vals.length?parseFloat((vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(1)):0};
                })} barCategoryGap="45%">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
                  <XAxis dataKey="name" tick={{...chartAxis, fontWeight:600}} axisLine={false} tickLine={false}/>
                  <YAxis domain={[0,100]} tick={chartAxis} axisLine={false} tickLine={false}/>
                  <Tooltip contentStyle={{background:'#1a2338',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,color:'#e8eaf0',fontSize:12}} formatter={(v)=>[`${v}`,'Дундаж оноо']}/>
                  <Bar dataKey="avg" fill="#00d4ff" radius={[8,8,0,0]} maxBarSize={64}/>
                </BarChart>
              </ResponsiveContainer>
            </DC>
          )}
        </div>
      )}

      {/* ── SEMESTER TAB ── */}
      {activeTab==='semester'&&(
        loading ? <SkeletonTable rows={5} cols={4}/> :
        semRows.length===0
          ? <DC style={{ textAlign:'center', padding:'64px 0' }}>
              <div style={{ fontSize:32, marginBottom:12, color:'rgba(255,255,255,0.15)' }}>—</div>
              <p style={{ color:'rgba(255,255,255,0.25)', fontWeight:600 }}>Дүн байхгүй байна</p>
            </DC>
          : <DC style={{ overflow:'hidden' }}>
              <div style={{ padding:'14px 20px', borderBottom:'1px solid rgba(255,255,255,0.06)', background:'rgba(255,255,255,0.02)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <span style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:'0.08em', fontFamily:"'DM Mono',monospace" }}>Улирлын дундаж дүн</span>
                <span style={{ fontSize:11, color:'rgba(255,255,255,0.2)', fontFamily:"'DM Mono',monospace" }}>{semRows.length} сурагч · {semKeys.length} улирал</span>
              </div>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                  <thead>
                    <tr style={{ background:'rgba(255,255,255,0.03)', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                      <th style={{ padding:'11px 20px', textAlign:'left', fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:'0.07em', fontFamily:"'DM Mono',monospace", position:'sticky', left:0, background:'#141c2e' }}>Сурагч</th>
                      {semKeys.map(k=>(
                        <th key={k} style={{ padding:'11px 16px', textAlign:'center', fontSize:10, fontWeight:700, color:'#00d4ff', textTransform:'uppercase', letterSpacing:'0.06em', fontFamily:"'DM Mono',monospace", whiteSpace:'nowrap' }}>{k}</th>
                      ))}
                      <th style={{ padding:'11px 16px', textAlign:'center', fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.5)', textTransform:'uppercase', letterSpacing:'0.06em', fontFamily:"'DM Mono',monospace", background:'rgba(0,212,255,0.05)' }}>Нийт дундаж</th>
                    </tr>
                  </thead>
                  <tbody>
                    {semRows.map((row,i)=>(
                      <tr key={row.studentId} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}
                        onMouseEnter={e=>e.currentTarget.style.background=rowHover}
                        onMouseLeave={e=>e.currentTarget.style.background=rowBg}>
                        <td style={{ padding:'11px 20px', position:'sticky', left:0, background:'#141c2e' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                            <div style={{ width:30, height:30, borderRadius:'50%', background:'linear-gradient(135deg,#00d4ff,#0099cc)', display:'flex', alignItems:'center', justifyContent:'center', color:'#001a22', fontWeight:900, fontSize:11, flexShrink:0 }}>
                              {row.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight:600, color:'#e8eaf0', fontSize:13 }}>{row.name}</div>
                              <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)', fontFamily:"'DM Mono',monospace" }}>{row.code}</div>
                            </div>
                          </div>
                        </td>
                        {semKeys.map(k=>{
                          const val=row.semAvgs[k];
                          const g=val!=='—'?getLetterGrade(parseFloat(val)):null;
                          return (
                            <td key={k} style={{ padding:'11px 16px', textAlign:'center' }}>
                              {val==='—'
                                ? <span style={{ color:'rgba(255,255,255,0.12)', fontSize:16 }}>—</span>
                                : <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                                    <span style={{ fontSize:15, fontWeight:800, color:GRADE_META[g].color, fontFamily:"'DM Mono',monospace" }}>{val}</span>
                                    <span style={{ fontSize:10, fontWeight:700, padding:'1px 6px', borderRadius:4, background:GRADE_META[g].bg, color:GRADE_META[g].text }}>{g}</span>
                                  </div>
                              }
                            </td>
                          );
                        })}
                        <td style={{ padding:'11px 16px', textAlign:'center', background:'rgba(0,212,255,0.04)' }}>
                          {row.overall!=='—'
                            ? <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                                <span style={{ fontSize:15, fontWeight:800, color:avgColor(row.overall), fontFamily:"'DM Mono',monospace" }}>{row.overall}</span>
                                <span style={{ fontSize:10, fontWeight:700, padding:'1px 6px', borderRadius:4, background:GRADE_META[getLetterGrade(parseFloat(row.overall))].bg, color:GRADE_META[getLetterGrade(parseFloat(row.overall))].text }}>{getLetterGrade(parseFloat(row.overall))}</span>
                              </div>
                            : <span style={{ color:'rgba(255,255,255,0.12)' }}>—</span>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.02)' }}>
                      <td style={{ padding:'11px 20px', fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:'0.07em', fontFamily:"'DM Mono',monospace" }}>Ангийн дундаж</td>
                      {semKeys.map(k=>{
                        const vals=semRows.map(r=>r.semAvgs[k]).filter(v=>v!=='—').map(Number);
                        const ca=vals.length?(vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(1):'—';
                        return <td key={k} style={{ padding:'11px 16px', textAlign:'center' }}><span style={{ fontSize:13, fontWeight:800, color:avgColor(ca), fontFamily:"'DM Mono',monospace" }}>{ca}</span></td>;
                      })}
                      <td style={{ padding:'11px 16px', textAlign:'center', background:'rgba(0,212,255,0.06)' }}>
                        <span style={{ fontSize:13, fontWeight:800, color:'#00d4ff', fontFamily:"'DM Mono',monospace" }}>{avg}</span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </DC>
      )}

      {/* ── TABLE TAB ── */}
      {activeTab==='table'&&(
        <>
          <DC style={{ padding:16 }}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
              {[
                {as:'select', val:filters.studentId, set:v=>setFilters({...filters,studentId:v}), opts:[{v:'',l:'Бүх сурагч'},...students.map(s=>({v:s.id,l:`${s.firstName} ${s.lastName}`}))]},
                {as:'select', val:filters.courseId,  set:v=>setFilters({...filters,courseId:v}),  opts:[{v:'',l:'Бүх хичээл'},...courses.map(c=>({v:c.id,l:c.name}))]},
                {as:'select', val:filters.semester,  set:v=>setFilters({...filters,semester:v}),  opts:[{v:'',l:'Бүх улирал'},{v:'Spring',l:'Spring'},{v:'Fall',l:'Fall'},{v:'Summer',l:'Summer'}]},
                {as:'input',  val:filters.year,      set:v=>setFilters({...filters,year:v}),       placeholder:'Жил'},
              ].map((f,i)=> f.as==='select'
                ? <select key={i} className="input-field" style={{fontSize:13}} value={f.val} onChange={e=>f.set(e.target.value)}>
                    {f.opts.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
                  </select>
                : <input key={i} type="number" className="input-field" style={{fontSize:13}} placeholder={f.placeholder} value={f.val} onChange={e=>f.set(e.target.value)}/>
              )}
            </div>
          </DC>

          {loading ? <SkeletonTable rows={7} cols={7}/> :
           grades.length===0
            ? <DC style={{ textAlign:'center', padding:'64px 0' }}>
                <p style={{ color:'rgba(255,255,255,0.25)', fontWeight:600 }}>Дүн олдсонгүй</p>
              </DC>
            : <DC style={{ overflow:'hidden' }}>
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                    <thead>
                      <tr style={{ background:'rgba(255,255,255,0.03)', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                        {['Сурагч','Хичээл','Оноо','Дүн','Улирал','Жил','Үйлдэл'].map(h=>(
                          <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:'0.07em', fontFamily:"'DM Mono',monospace" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {grades.map((g,i)=>(
                        <tr key={g.id} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)', transition:'background 0.1s' }}
                          onMouseEnter={e=>e.currentTarget.style.background=rowHover}
                          onMouseLeave={e=>e.currentTarget.style.background=rowBg}>
                          <td style={{ padding:'11px 14px', fontWeight:600, color:'#e8eaf0' }}>{g.student?.firstName} {g.student?.lastName}</td>
                          <td style={{ padding:'11px 14px', color:'rgba(255,255,255,0.4)', fontSize:12 }}>{g.course?.name}</td>
                          <td style={{ padding:'11px 14px' }}><ScoreBar score={g.score}/></td>
                          <td style={{ padding:'11px 14px' }}>
                            <span style={{ display:'inline-flex', alignItems:'center', padding:'2px 10px', borderRadius:6, fontSize:12, fontWeight:800, background:GRADE_META[g.grade]?.bg, color:GRADE_META[g.grade]?.color }}>{g.grade}</span>
                          </td>
                          <td style={{ padding:'11px 14px', color:'rgba(255,255,255,0.4)', fontFamily:"'DM Mono',monospace", fontSize:12 }}>{g.semester}</td>
                          <td style={{ padding:'11px 14px', color:'rgba(255,255,255,0.5)', fontFamily:"'DM Mono',monospace", fontWeight:700 }}>{g.year}</td>
                          <td style={{ padding:'11px 14px' }}>
                            {(isAdmin||isTeacher)&&(
                              <div style={{ display:'flex', gap:4 }}>
                                <button onClick={()=>openEdit(g)} style={{ fontSize:12, fontWeight:700, color:'#00d4ff', border:'1px solid rgba(0,212,255,0.2)', background:'rgba(0,212,255,0.06)', padding:'4px 10px', borderRadius:8, cursor:'pointer', transition:'all 0.12s', fontFamily:'Syne, sans-serif' }}
                                  onMouseEnter={e=>e.currentTarget.style.background='rgba(0,212,255,0.14)'}
                                  onMouseLeave={e=>e.currentTarget.style.background='rgba(0,212,255,0.06)'}>Засах</button>
                                <button onClick={()=>handleDelete(g.id)} style={{ fontSize:12, fontWeight:700, color:'#ff6b6b', border:'1px solid rgba(255,107,107,0.2)', background:'rgba(255,107,107,0.06)', padding:'4px 10px', borderRadius:8, cursor:'pointer', transition:'all 0.12s', fontFamily:'Syne, sans-serif' }}
                                  onMouseEnter={e=>e.currentTarget.style.background='rgba(255,107,107,0.14)'}
                                  onMouseLeave={e=>e.currentTarget.style.background='rgba(255,107,107,0.06)'}>Устгах</button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </DC>
          }
        </>
      )}

      {/* ── MODAL ── */}
      {showModal&&(
        <Modal title={editingGrade?'Дүн засах':'Дүн нэмэх'} onClose={()=>setShowModal(false)}>
          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {editingGrade
              ? <div style={{ background:'rgba(0,212,255,0.06)', border:'1px solid rgba(0,212,255,0.15)', borderRadius:12, padding:'14px 16px', fontSize:13 }}>
                  <div style={{ color:'rgba(255,255,255,0.4)' }}>Сурагч: <strong style={{ color:'#e8eaf0' }}>{editingGrade.student?.firstName} {editingGrade.student?.lastName}</strong></div>
                  <div style={{ color:'rgba(255,255,255,0.4)', marginTop:4 }}>Хичээл: <strong style={{ color:'#e8eaf0' }}>{editingGrade.course?.name}</strong></div>
                  <div style={{ color:'rgba(255,255,255,0.4)', marginTop:4 }}>Улирал: <strong style={{ color:'#e8eaf0' }}>{editingGrade.semester} {editingGrade.year}</strong></div>
                </div>
              : <>
                  <div><Lbl>Сурагч *</Lbl>
                    <select className="input-field" value={form.studentId} onChange={e=>setForm({...form,studentId:e.target.value})} required style={{ colorScheme:'dark' }}>
                      <option value="">Сурагч сонгоно уу</option>
                      {students.map(s=><option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.studentCode})</option>)}
                    </select>
                  </div>
                  <div><Lbl>Хичээл *</Lbl>
                    <select className="input-field" value={form.courseId} onChange={e=>setForm({...form,courseId:e.target.value})} required style={{ colorScheme:'dark' }}>
                      <option value="">Хичээл сонгоно уу</option>
                      {courses.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </>
            }
            <div>
              <Lbl>Оноо (0–100) *{form.score!==''&&!isNaN(parseFloat(form.score))&&(()=>{
                const g=getLetterGrade(parseFloat(form.score));
                return <span style={{ marginLeft:8, fontSize:11, fontWeight:800, padding:'2px 8px', borderRadius:6, background:GRADE_META[g].bg, color:GRADE_META[g].color }}>{g} — {GRADE_META[g].label}</span>;
              })()}</Lbl>
              <input type="number" min="0" max="100" step="0.1" className="input-field"
                value={form.score} onChange={e=>setForm({...form,score:e.target.value})}
                autoFocus={!!editingGrade} required/>
              {form.score!==''&&!isNaN(parseFloat(form.score))&&(
                <div style={{ marginTop:8 }}><ScoreBar score={parseFloat(form.score)||0}/></div>
              )}
            </div>
            {!editingGrade&&(
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div><Lbl>Улирал *</Lbl>
                  <select className="input-field" value={form.semester} onChange={e=>setForm({...form,semester:e.target.value})} style={{ colorScheme:'dark' }}>
                    <option>Spring</option><option>Fall</option><option>Summer</option>
                  </select>
                </div>
                <div><Lbl>Жил *</Lbl>
                  <input type="number" className="input-field" value={form.year} onChange={e=>setForm({...form,year:e.target.value})} required/>
                </div>
              </div>
            )}
            <div style={{ display:'flex', gap:10, paddingTop:4 }}>
              <button type="submit" disabled={submitting} className="btn-primary" style={{ flex:1, justifyContent:'center' }}>
                {submitting?'Хадгалж байна...':editingGrade?'Шинэчлэх':'Дүн хадгалах'}
              </button>
              <button type="button" onClick={()=>setShowModal(false)} className="btn-secondary" style={{ flex:1, justifyContent:'center' }}>Болих</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
