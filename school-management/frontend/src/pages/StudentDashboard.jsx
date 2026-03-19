import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const GRADE_META = {
  A: { color:'#6bcb77', bg:'rgba(107,203,119,0.12)', text:'#6bcb77', label:'Өндөр',      range:'90–100' },
  B: { color:'#00d4ff', bg:'rgba(0,212,255,0.10)',   text:'#00d4ff', label:'Сайн',       range:'80–89'  },
  C: { color:'#ffd93d', bg:'rgba(255,217,61,0.12)',  text:'#ffd93d', label:'Дундаж',     range:'70–79'  },
  D: { color:'#ff8c42', bg:'rgba(255,140,66,0.12)',  text:'#ff8c42', label:'Хангалттай', range:'60–69'  },
  F: { color:'#ff6b6b', bg:'rgba(255,107,107,0.12)', text:'#ff6b6b', label:'Тэнцээгүй', range:'0–59'   },
};
const getGrade = (s) => s>=90?'A':s>=80?'B':s>=70?'C':s>=60?'D':'F';

const STATUS_COLOR = { PRESENT:'#6bcb77', ABSENT:'#ff6b6b', LATE:'#ffd93d' };
const STATUS_BG    = { PRESENT:'rgba(107,203,119,0.12)', ABSENT:'rgba(255,107,107,0.12)', LATE:'rgba(255,217,61,0.12)' };
const STATUS_MN    = { PRESENT:'Ирсэн', ABSENT:'Тасалсан', LATE:'Хоцорсон' };

const DAYS  = ['Даваа','Мягмар','Лхагва','Пүрэв','Баасан','Бямба','Ням'];
const HOURS = ['08:00','09:40','11:20','13:00','14:40','16:20'];
const PALETTE = ['#00d4ff','#6bcb77','#ffd93d','#ff6b6b','#c77dff','#ff8c42','#4ecdc4'];

/* ── helpers ── */
const DC = ({children, style={}}) => (
  <div style={{ background:'#141c2e', border:'1px solid rgba(255,255,255,0.06)', borderRadius:20, ...style }}>{children}</div>
);
const chartAxis = { fontSize:10, fill:'rgba(255,255,255,0.3)', fontFamily:"'DM Mono',monospace" };

/* ── Score bar ── */
const ScoreBar = ({score}) => {
  const g = getGrade(score);
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
      <div style={{ flex:1, height:4, background:'rgba(255,255,255,0.06)', borderRadius:2, overflow:'hidden' }}>
        <div style={{ width:`${score}%`, height:'100%', background:GRADE_META[g].color, borderRadius:2, transition:'width 0.6s ease' }}/>
      </div>
      <span style={{ fontSize:13, fontWeight:800, color:GRADE_META[g].color, minWidth:28, textAlign:'right', fontFamily:"'DM Mono',monospace" }}>{score}</span>
    </div>
  );
};

/* ── Timetable ── */
const Timetable = ({enrollments, grades, schedules}) => {
  const [hovered, setHovered] = useState(null);
  const courseIds = [...new Set(enrollments.map(e=>e.courseId))];
  const slotMap = {};
  schedules.forEach(s=>{
    const hi = HOURS.indexOf(s.startTime);
    if (hi<0) return;
    const key=`${s.dayOfWeek}-${hi}`;
    if (!slotMap[key]) {
      const ci = courseIds.indexOf(s.courseId);
      const g  = grades.find(gr=>gr.courseId===s.courseId);
      slotMap[key] = { course:s.course, color:PALETTE[ci>=0?ci%PALETTE.length:0], grade:g, room:s.room, teacher:s.teacher };
    }
  });
  return (
    <div style={{ overflowX:'auto' }}>
      <table style={{ width:'100%', borderCollapse:'separate', borderSpacing:4, minWidth:640 }}>
        <thead>
          <tr>
            <th style={{ width:72, padding:'8px 4px', fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.25)', textAlign:'center', textTransform:'uppercase', letterSpacing:'0.08em', fontFamily:"'DM Mono',monospace" }}>Цаг</th>
            {DAYS.map(d=>(
              <th key={d} style={{ padding:'8px 4px', fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.5)', textAlign:'center', minWidth:110, fontFamily:'Syne, sans-serif' }}>{d}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {HOURS.map((h,hi)=>(
            <tr key={h}>
              <td style={{ textAlign:'center', verticalAlign:'middle', padding:'3px 0' }}>
                <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:8, padding:'6px 4px' }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.6)', fontFamily:"'DM Mono',monospace" }}>{h}</div>
                  <div style={{ fontSize:9, color:'rgba(255,255,255,0.25)', fontFamily:"'DM Mono',monospace" }}>
                    {(()=>{ const [hh,mm]=h.split(':').map(Number); const e=new Date(0,0,0,hh,mm+80); return `${String(e.getHours()).padStart(2,'0')}:${String(e.getMinutes()).padStart(2,'0')}`; })()}
                  </div>
                </div>
              </td>
              {DAYS.map((_,di)=>{
                const key=`${di}-${hi}`;
                const slot=slotMap[key];
                const isHov=hovered===key;
                return (
                  <td key={di} style={{ padding:'3px 2px', verticalAlign:'top' }}>
                    {slot ? (
                      <div onMouseEnter={()=>setHovered(key)} onMouseLeave={()=>setHovered(null)}
                        style={{
                          background: isHov ? slot.color : slot.color+'18',
                          border:`1px solid ${slot.color}30`,
                          borderLeft:`3px solid ${slot.color}`,
                          borderRadius:10, padding:'8px 10px', cursor:'default',
                          transition:'all 0.15s', minHeight:64,
                        }}>
                        <div style={{ fontSize:11, fontWeight:800, color:isHov?'#001a22':slot.color, lineHeight:1.3, marginBottom:3 }}>{slot.course?.name}</div>
                        <div style={{ fontSize:10, color:isHov?'rgba(0,26,34,0.7)':'rgba(255,255,255,0.3)', fontFamily:"'DM Mono',monospace" }}>{slot.room}</div>
                        {slot.grade&&(
                          <div style={{ marginTop:4, display:'inline-block', background:isHov?'rgba(0,26,34,0.2)':GRADE_META[slot.grade.grade]?.bg, color:isHov?'#001a22':GRADE_META[slot.grade.grade]?.color, fontSize:10, fontWeight:800, padding:'1px 6px', borderRadius:4 }}>
                            {slot.grade.grade} · {slot.grade.score}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ minHeight:64, borderRadius:10, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.03)' }}/>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/* ════════════════════════════════════════════════ */
export default function StudentDashboard() {
  const {user} = useAuth();
  const [profile,     setProfile]     = useState(null);
  const [grades,      setGrades]      = useState([]);
  const [attendance,  setAttendance]  = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [schedules,   setSchedules]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [activeTab,   setActiveTab]   = useState('overview');
  const [scheduleFilter, setScheduleFilter] = useState('');

  useEffect(()=>{
    (async()=>{
      try {
        const meRes = await api.get('/auth/me');
        const me = meRes.data;
        setProfile(me);
        if (me.student?.id) {
          const sid = me.student.id;
          const [gRes,aRes,eRes] = await Promise.all([
            api.get('/grades',{params:{studentId:sid}}),
            api.get('/attendance',{params:{studentId:sid}}),
            api.get('/enrollments',{params:{studentId:sid}}),
          ]);
          setGrades(gRes.data.data||[]);
          setAttendance(aRes.data.data||[]);
          const enrolls=eRes.data.data||[];
          setEnrollments(enrolls);
          const semKeys=[...new Set(enrolls.map(e=>`${e.semester}_${e.year}`))];
          let allSched=[];
          for (const sk of semKeys) {
            const [sem,yr]=sk.split('_');
            try { const r=await api.get('/schedules',{params:{semester:sem,year:parseInt(yr)}}); allSched=allSched.concat(r.data.data||[]); } catch{}
          }
          setSchedules(allSched);
        }
      } catch(err){console.error(err);}
      finally{setLoading(false);}
    })();
  },[]);

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh', background:'#0a0e1a' }}>
      <div style={{ width:32, height:32, border:'3px solid rgba(0,212,255,0.2)', borderTop:'3px solid #00d4ff', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  /* computed */
  const avg       = grades.length?(grades.reduce((s,g)=>s+g.score,0)/grades.length).toFixed(1):'—';
  const highest   = grades.length?Math.max(...grades.map(g=>g.score)):'—';
  const lowest    = grades.length?Math.min(...grades.map(g=>g.score)):'—';
  const passing   = grades.filter(g=>g.score>=60).length;
  const present   = attendance.filter(a=>a.status==='PRESENT').length;
  const absent    = attendance.filter(a=>a.status==='ABSENT').length;
  const late      = attendance.filter(a=>a.status==='LATE').length;
  const attendRate= attendance.length?Math.round((present/attendance.length)*100):0;

  const semMap={};
  grades.forEach(g=>{ const k=`${g.semester} ${g.year}`; if(!semMap[k])semMap[k]=[]; semMap[k].push(g.score); });
  const semData = Object.entries(semMap).sort().map(([k,sc])=>({name:k,avg:parseFloat((sc.reduce((a,b)=>a+b,0)/sc.length).toFixed(1))}));

  const dist={A:0,B:0,C:0,D:0,F:0};
  grades.forEach(g=>{if(dist[g.grade]!==undefined)dist[g.grade]++;});
  const distData=Object.entries(dist).map(([name,value])=>({name,value}));

  const semesters=[...new Set(enrollments.map(e=>`${e.semester} ${e.year}`))].sort();
  const filteredEnrollments=scheduleFilter?enrollments.filter(e=>`${e.semester} ${e.year}`===scheduleFilter):enrollments;

  const avgGrade = avg!=='—'?getGrade(parseFloat(avg)):null;

  const TABS=[
    {key:'overview',  label:'Ерөнхий'},
    {key:'schedule',  label:'Хуваарь'},
    {key:'grades',    label:'Дүнгүүд'},
    {key:'attendance',label:'Ирц'},
    {key:'courses',   label:'Хичээлүүд'},
  ];

  const darkTip = { contentStyle:{background:'#1a2338',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,color:'#e8eaf0',fontSize:12}, cursor:{fill:'rgba(255,255,255,0.03)'} };

  return (
    <div style={{ padding:24, maxWidth:1100, margin:'0 auto', display:'flex', flexDirection:'column', gap:20, background:'#0a0e1a', minHeight:'100vh' }}>

      {/* ── Profile banner ── */}
      <div style={{
        background:'linear-gradient(135deg,#0d1a3a 0%,#0f2040 50%,#0a1830 100%)',
        border:'1px solid rgba(0,212,255,0.15)',
        borderRadius:20, padding:'28px 32px',
        display:'flex', alignItems:'center', gap:20,
        boxShadow:'0 0 60px rgba(0,212,255,0.06)',
      }}>
        <div style={{ width:64, height:64, borderRadius:'50%', background:'rgba(0,212,255,0.12)', border:'2px solid rgba(0,212,255,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, fontWeight:900, color:'#00d4ff', flexShrink:0 }}>
          {profile?.student?.firstName?.[0]||user?.email?.[0]?.toUpperCase()}
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:22, fontWeight:800, color:'#e8eaf0', letterSpacing:'-0.02em' }}>{profile?.student?.firstName||user?.email}</div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.35)', marginTop:5, display:'flex', gap:8, flexWrap:'wrap', alignItems:'center', fontFamily:"'DM Mono',monospace" }}>
            {profile?.student?.studentCode&&(
              <span style={{ background:'rgba(0,212,255,0.1)', border:'1px solid rgba(0,212,255,0.25)', color:'#00d4ff', padding:'2px 10px', borderRadius:20, fontSize:11, fontWeight:700 }}>{profile.student.studentCode}</span>
            )}
            <span>{user?.email}</span>
          </div>
        </div>
        <div style={{ textAlign:'right', flexShrink:0 }}>
          <div style={{ fontSize:40, fontWeight:900, lineHeight:1, color: avgGrade?GRADE_META[avgGrade].color:'rgba(255,255,255,0.3)', fontFamily:"'DM Mono',monospace" }}>{avg}</div>
          <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)', marginTop:4, textTransform:'uppercase', letterSpacing:'0.08em', fontFamily:"'DM Mono',monospace" }}>Дундаж оноо</div>
          {avgGrade&&(
            <div style={{ marginTop:6, display:'inline-block', padding:'3px 12px', borderRadius:20, background:GRADE_META[avgGrade].bg, color:GRADE_META[avgGrade].color, fontSize:11, fontWeight:800, border:`1px solid ${GRADE_META[avgGrade].color}30` }}>
              {avgGrade} — {GRADE_META[avgGrade].label}
            </div>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display:'flex', gap:3, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:12, padding:4, width:'fit-content', flexWrap:'wrap' }}>
        {TABS.map(t=>(
          <button key={t.key} onClick={()=>setActiveTab(t.key)} style={{
            padding:'7px 16px', borderRadius:9, border:activeTab===t.key?'1px solid rgba(0,212,255,0.2)':'1px solid transparent',
            cursor:'pointer', fontSize:12, fontWeight:700, transition:'all 0.15s', fontFamily:'Syne, sans-serif',
            background: activeTab===t.key?'#1a2338':'transparent',
            color:       activeTab===t.key?'#00d4ff':'rgba(255,255,255,0.35)',
            boxShadow:   activeTab===t.key?'0 2px 8px rgba(0,0,0,0.4)':'none',
            whiteSpace:'nowrap',
          }}>{t.label}</button>
        ))}
      </div>

      {/* ══ OVERVIEW ══ */}
      {activeTab==='overview'&&(
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
            {[
              {label:'Нийт дүн',        value:grades.length,           accent:'#c77dff'},
              {label:'Хамгийн өндөр',  value:highest,                  accent:'#6bcb77'},
              {label:'Хамгийн бага',   value:lowest,                   accent:'#ff8c42'},
              {label:'Тэнцсэн хичээл', value:`${passing}/${grades.length}`, accent:'#00d4ff'},
            ].map((s,i)=>(
              <div key={i} style={{ background:'#141c2e', border:'1px solid rgba(255,255,255,0.06)', borderTop:`2px solid ${s.accent}`, borderRadius:16, padding:'14px 18px' }}>
                <div style={{ fontSize:24, fontWeight:800, color:s.accent, letterSpacing:'-0.02em', fontFamily:"'DM Mono',monospace" }}>{s.value}</div>
                <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.3)', marginTop:4, textTransform:'uppercase', letterSpacing:'0.07em', fontFamily:"'DM Mono',monospace" }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Attendance summary */}
          <DC style={{ padding:20 }}>
            <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:'0.08em', fontFamily:"'DM Mono',monospace", marginBottom:14 }}>Ирцийн хураангуй</div>
            <div style={{ display:'flex', alignItems:'center', gap:20, flexWrap:'wrap' }}>
              <div style={{ textAlign:'center', minWidth:72 }}>
                <div style={{ fontSize:36, fontWeight:900, color:attendRate>=80?'#6bcb77':attendRate>=60?'#ffd93d':'#ff6b6b', fontFamily:"'DM Mono',monospace" }}>{attendRate}%</div>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)', fontWeight:700, fontFamily:"'DM Mono',monospace" }}>Ирцийн хувь</div>
              </div>
              <div style={{ flex:1, minWidth:200 }}>
                <div style={{ height:8, background:'rgba(255,255,255,0.06)', borderRadius:4, overflow:'hidden', marginBottom:10 }}>
                  <div style={{ display:'flex', height:'100%' }}>
                    <div style={{ width:`${attendance.length?(present/attendance.length)*100:0}%`, background:'#6bcb77' }}/>
                    <div style={{ width:`${attendance.length?(late/attendance.length)*100:0}%`, background:'#ffd93d' }}/>
                    <div style={{ width:`${attendance.length?(absent/attendance.length)*100:0}%`, background:'#ff6b6b' }}/>
                  </div>
                </div>
                <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
                  {[['Ирсэн',present,'#6bcb77'],['Хоцорсон',late,'#ffd93d'],['Тасалсан',absent,'#ff6b6b']].map(([l,v,c])=>(
                    <div key={l} style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <div style={{ width:7, height:7, borderRadius:2, background:c }}/>
                      <span style={{ fontSize:12, color:'rgba(255,255,255,0.4)', fontWeight:600 }}>{l}: <strong style={{ color:c }}>{v}</strong></span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </DC>

          {grades.length>0&&(
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              {[
                { title:'Улирлын дундаж', data:semData, dataKey:'avg', fill:'#00d4ff', xKey:'name', domain:[0,100] },
                { title:'Дүнгийн тархалт', data:distData, dataKey:'value', fill:null, xKey:'name', domain:undefined },
              ].map((chart,i)=>(
                <DC key={i} style={{ padding:20 }}>
                  <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:'0.08em', fontFamily:"'DM Mono',monospace", marginBottom:16 }}>{chart.title}</div>
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={chart.data} barCategoryGap="40%">
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
                      <XAxis dataKey={chart.xKey} tick={{...chartAxis, fontSize:i===1?12:10, fontWeight:i===1?700:600}} axisLine={false} tickLine={false}/>
                      <YAxis domain={chart.domain} tick={chartAxis} axisLine={false} tickLine={false} allowDecimals={false}/>
                      <Tooltip {...darkTip} formatter={(v)=>[`${v}`,'Дундаж']}/>
                      <Bar dataKey={chart.dataKey} radius={[6,6,0,0]} maxBarSize={48} fill={chart.fill||'#00d4ff'}>
                        {!chart.fill&&chart.data.map(d=><Cell key={d.name} fill={GRADE_META[d.name]?.color||'#00d4ff'}/>)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </DC>
              ))}
            </div>
          )}

          {grades.length>0&&(
            <DC style={{ overflow:'hidden' }}>
              <div style={{ padding:'13px 20px', borderBottom:'1px solid rgba(255,255,255,0.06)', background:'rgba(255,255,255,0.02)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:13, fontWeight:700, color:'#e8eaf0' }}>Сүүлийн дүнгүүд</span>
                <button onClick={()=>setActiveTab('grades')} style={{ fontSize:12, color:'#00d4ff', fontWeight:700, background:'none', border:'none', cursor:'pointer', fontFamily:'Syne, sans-serif' }}>Бүгдийг харах →</button>
              </div>
              {grades.slice(0,5).map((g,i)=>(
                <div key={g.id} style={{ display:'flex', alignItems:'center', padding:'12px 20px', borderBottom:i<4?'1px solid rgba(255,255,255,0.04)':'none', gap:12 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600, fontSize:13, color:'#e8eaf0' }}>{g.course?.name}</div>
                    <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', marginTop:2, fontFamily:"'DM Mono',monospace" }}>{g.semester} {g.year}</div>
                  </div>
                  <div style={{ width:140 }}><ScoreBar score={g.score}/></div>
                  <span style={{ fontSize:13, fontWeight:800, padding:'3px 10px', borderRadius:6, background:GRADE_META[g.grade]?.bg, color:GRADE_META[g.grade]?.color, minWidth:28, textAlign:'center' }}>{g.grade}</span>
                </div>
              ))}
            </DC>
          )}
        </div>
      )}

      {/* ══ SCHEDULE ══ */}
      {activeTab==='schedule'&&(
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <DC style={{ padding:'16px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12, borderRadius:16 }}>
            <div>
              <div style={{ fontSize:15, fontWeight:800, color:'#e8eaf0' }}>Хичээлийн хуваарь</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', marginTop:3, fontFamily:"'DM Mono',monospace" }}>{filteredEnrollments.length} хичээл · 7 хоног</div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:11, color:'rgba(255,255,255,0.35)', fontWeight:700, fontFamily:"'DM Mono',monospace" }}>Улирал:</span>
              <select value={scheduleFilter} onChange={e=>setScheduleFilter(e.target.value)}
                className="input-field" style={{ fontSize:12, padding:'5px 10px', width:'auto', colorScheme:'dark' }}>
                <option value="">Бүгд</option>
                {semesters.map(s=><option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </DC>

          {/* Course legend */}
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {filteredEnrollments.map((e,i)=>e.course&&(
              <div key={e.id} style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(255,255,255,0.03)', border:`1px solid rgba(255,255,255,0.06)`, borderLeft:`3px solid ${PALETTE[i%PALETTE.length]}`, borderRadius:8, padding:'5px 10px' }}>
                <span style={{ fontSize:11, fontWeight:700, color:PALETTE[i%PALETTE.length] }}>{e.course.courseCode}</span>
                <span style={{ fontSize:11, color:'rgba(255,255,255,0.4)' }}>{e.course.name}</span>
                <span style={{ fontSize:10, color:'rgba(255,255,255,0.2)', fontFamily:"'DM Mono',monospace" }}>{e.course.credits}кр</span>
              </div>
            ))}
          </div>

          {enrollments.length===0
            ? <DC style={{ textAlign:'center', padding:'64px 0', color:'rgba(255,255,255,0.2)', fontWeight:600 }}>Бүртгэлтэй хичээл байхгүй</DC>
            : <DC style={{ padding:20 }}><Timetable enrollments={filteredEnrollments} grades={grades} schedules={schedules.filter(s=>!scheduleFilter||`${s.semester} ${s.year}`===scheduleFilter)}/></DC>
          }

          {filteredEnrollments.length>0&&(
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
              {[
                {label:'Нийт хичээл', value:filteredEnrollments.length,                                              accent:'#c77dff'},
                {label:'Нийт кредит', value:filteredEnrollments.reduce((s,e)=>s+(e.course?.credits||0),0),           accent:'#6bcb77'},
                {label:'7 хоногт',   value:`${filteredEnrollments.length*2} цаг`,                                    accent:'#ffd93d'},
              ].map((s,i)=>(
                <div key={i} style={{ background:'#141c2e', border:'1px solid rgba(255,255,255,0.06)', borderTop:`2px solid ${s.accent}`, borderRadius:16, padding:'14px 18px' }}>
                  <div style={{ fontSize:22, fontWeight:800, color:s.accent, fontFamily:"'DM Mono',monospace" }}>{s.value}</div>
                  <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.3)', marginTop:4, textTransform:'uppercase', letterSpacing:'0.07em', fontFamily:"'DM Mono',monospace" }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══ GRADES ══ */}
      {activeTab==='grades'&&(
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {Object.entries(GRADE_META).map(([g,m])=>(
              <div key={g} style={{ display:'flex', alignItems:'center', gap:6, background:m.bg, border:`1px solid ${m.color}30`, borderRadius:8, padding:'4px 10px' }}>
                <span style={{ fontWeight:800, fontSize:13, color:m.color }}>{g}</span>
                <span style={{ fontSize:11, color:'rgba(255,255,255,0.35)', fontFamily:"'DM Mono',monospace" }}>{m.range}</span>
              </div>
            ))}
          </div>
          {grades.length===0
            ? <DC style={{ textAlign:'center', padding:'64px 0', color:'rgba(255,255,255,0.2)', fontWeight:600 }}>Дүн байхгүй байна</DC>
            : Object.entries(grades.reduce((acc,g)=>{ const k=`${g.semester} ${g.year}`; if(!acc[k])acc[k]=[]; acc[k].push(g); return acc; },{}))
                .sort(([a],[b])=>a.localeCompare(b))
                .map(([semKey,semGrades])=>{
                  const semAvg=(semGrades.reduce((s,g)=>s+g.score,0)/semGrades.length).toFixed(1);
                  const semG=getGrade(parseFloat(semAvg));
                  return (
                    <DC key={semKey} style={{ overflow:'hidden' }}>
                      <div style={{ padding:'12px 20px', borderBottom:'1px solid rgba(255,255,255,0.06)', background:'rgba(255,255,255,0.02)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                        <span style={{ fontWeight:700, color:'#00d4ff', fontSize:13, fontFamily:"'DM Mono',monospace" }}>{semKey}</span>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <span style={{ fontSize:11, color:'rgba(255,255,255,0.3)' }}>Дундаж:</span>
                          <span style={{ fontSize:15, fontWeight:800, color:GRADE_META[semG].color, fontFamily:"'DM Mono',monospace" }}>{semAvg}</span>
                          <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:5, background:GRADE_META[semG].bg, color:GRADE_META[semG].text }}>{semG}</span>
                        </div>
                      </div>
                      {semGrades.map((g,i)=>(
                        <div key={g.id} style={{ display:'flex', alignItems:'center', padding:'13px 20px', borderBottom:i<semGrades.length-1?'1px solid rgba(255,255,255,0.04)':'none', gap:16 }}>
                          <div style={{ flex:1 }}>
                            <div style={{ fontWeight:600, fontSize:13, color:'#e8eaf0' }}>{g.course?.name}</div>
                            <div style={{ fontSize:11, color:'rgba(255,255,255,0.25)', marginTop:1, fontFamily:"'DM Mono',monospace" }}>{g.course?.courseCode}</div>
                          </div>
                          <div style={{ width:160 }}><ScoreBar score={g.score}/></div>
                          <span style={{ fontSize:14, fontWeight:800, padding:'3px 12px', borderRadius:7, background:GRADE_META[g.grade]?.bg, color:GRADE_META[g.grade]?.color, minWidth:32, textAlign:'center' }}>{g.grade}</span>
                        </div>
                      ))}
                    </DC>
                  );
                })
          }
        </div>
      )}

      {/* ══ ATTENDANCE ══ */}
      {activeTab==='attendance'&&(
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
            {[
              {label:'Ирцийн хувь', value:`${attendRate}%`, color:attendRate>=80?'#6bcb77':'#ffd93d'},
              {label:'Ирсэн',       value:present,           color:'#6bcb77'},
              {label:'Хоцорсон',    value:late,              color:'#ffd93d'},
              {label:'Тасалсан',    value:absent,            color:'#ff6b6b'},
            ].map((s,i)=>(
              <div key={i} style={{ background:'#141c2e', border:'1px solid rgba(255,255,255,0.06)', borderTop:`2px solid ${s.color}`, borderRadius:16, padding:'14px 18px', textAlign:'center' }}>
                <div style={{ fontSize:24, fontWeight:800, color:s.color, fontFamily:"'DM Mono',monospace" }}>{s.value}</div>
                <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.3)', marginTop:4, textTransform:'uppercase', letterSpacing:'0.07em', fontFamily:"'DM Mono',monospace" }}>{s.label}</div>
              </div>
            ))}
          </div>
          {attendance.length===0
            ? <DC style={{ textAlign:'center', padding:'64px 0', color:'rgba(255,255,255,0.2)', fontWeight:600 }}>Ирцийн бүртгэл байхгүй</DC>
            : <DC style={{ overflow:'hidden' }}>
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                    <thead>
                      <tr style={{ background:'rgba(255,255,255,0.03)', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                        {['Хичээл','Огноо','Статус'].map(h=>(
                          <th key={h} style={{ padding:'10px 18px', textAlign:'left', fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:'0.08em', fontFamily:"'DM Mono',monospace" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[...attendance].sort((a,b)=>new Date(b.date)-new Date(a.date)).map((a,i)=>(
                        <tr key={a.id} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)', transition:'background 0.1s' }}
                          onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.03)'}
                          onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                          <td style={{ padding:'11px 18px', fontWeight:600, color:'#e8eaf0' }}>{a.course?.name}</td>
                          <td style={{ padding:'11px 18px', color:'rgba(255,255,255,0.35)', fontFamily:"'DM Mono',monospace", fontSize:12 }}>{new Date(a.date).toLocaleDateString('mn-MN')}</td>
                          <td style={{ padding:'11px 18px' }}>
                            <span style={{ fontSize:12, fontWeight:700, padding:'3px 10px', borderRadius:6, background:STATUS_BG[a.status], color:STATUS_COLOR[a.status], border:`1px solid ${STATUS_COLOR[a.status]}30` }}>
                              {STATUS_MN[a.status]||a.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </DC>
          }
        </div>
      )}

      {/* ══ COURSES ══ */}
      {activeTab==='courses'&&(
        enrollments.length===0
          ? <DC style={{ textAlign:'center', padding:'64px 0', color:'rgba(255,255,255,0.2)', fontWeight:600 }}>Бүртгэлтэй хичээл байхгүй</DC>
          : <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:14 }}>
              {enrollments.map((e,i)=>{
                const g=grades.find(gr=>gr.courseId===e.courseId&&gr.semester===e.semester&&gr.year===e.year);
                const accent=PALETTE[i%PALETTE.length];
                return (
                  <div key={e.id} style={{ background:'#141c2e', border:'1px solid rgba(255,255,255,0.06)', borderTop:`2px solid ${accent}`, borderRadius:18, padding:20, display:'flex', flexDirection:'column', gap:10, transition:'all 0.15s' }}
                    onMouseEnter={el=>{ el.currentTarget.style.borderColor=`${accent}40`; el.currentTarget.style.boxShadow=`0 0 20px ${accent}12`; }}
                    onMouseLeave={el=>{ el.currentTarget.style.borderColor='rgba(255,255,255,0.06)'; el.currentTarget.style.boxShadow='none'; }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                      <span style={{ fontSize:11, fontWeight:700, color:accent, background:`${accent}18`, border:`1px solid ${accent}30`, padding:'2px 8px', borderRadius:6, fontFamily:"'DM Mono',monospace" }}>{e.course?.courseCode}</span>
                      <span style={{ fontSize:11, color:'rgba(255,255,255,0.25)', fontFamily:"'DM Mono',monospace", fontWeight:600 }}>{e.course?.credits} кр</span>
                    </div>
                    <div style={{ fontWeight:700, fontSize:14, color:'#e8eaf0', lineHeight:1.3 }}>{e.course?.name}</div>
                    <div style={{ fontSize:12, color:'rgba(255,255,255,0.3)', fontFamily:"'DM Mono',monospace" }}>
                      {e.semester} {e.year}{e.course?.teacher&&<> · {e.course.teacher.firstName} {e.course.teacher.lastName}</>}
                    </div>
                    {g ? (
                      <div style={{ marginTop:4 }}>
                        <ScoreBar score={g.score}/>
                        <div style={{ marginTop:6, display:'flex', alignItems:'center', gap:6 }}>
                          <span style={{ fontSize:11, color:'rgba(255,255,255,0.3)' }}>Дүн:</span>
                          <span style={{ fontSize:13, fontWeight:800, padding:'2px 10px', borderRadius:6, background:GRADE_META[g.grade]?.bg, color:GRADE_META[g.grade]?.color }}>{g.grade} — {GRADE_META[g.grade]?.label}</span>
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize:12, color:'rgba(255,255,255,0.2)', fontStyle:'italic' }}>Дүн оруулаагүй</div>
                    )}
                  </div>
                );
              })}
            </div>
      )}
    </div>
  );
}
