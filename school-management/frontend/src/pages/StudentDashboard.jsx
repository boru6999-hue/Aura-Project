import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

/* ─── constants ─── */
const GRADE_META = {
  A: { color: '#10b981', bg: '#d1fae5', text: '#065f46', label: 'Өндөр',      range: '90–100' },
  B: { color: '#6366f1', bg: '#e0e7ff', text: '#3730a3', label: 'Сайн',       range: '80–89'  },
  C: { color: '#f59e0b', bg: '#fef3c7', text: '#78350f', label: 'Дундаж',     range: '70–79'  },
  D: { color: '#f97316', bg: '#ffedd5', text: '#7c2d12', label: 'Хангалттай', range: '60–69'  },
  F: { color: '#ef4444', bg: '#fee2e2', text: '#7f1d1d', label: 'Тэнцээгүй',  range: '0–59'   },
};
const getGrade = (s) => s >= 90 ? 'A' : s >= 80 ? 'B' : s >= 70 ? 'C' : s >= 60 ? 'D' : 'F';

const STATUS_MN    = { PRESENT: 'Ирсэн',    ABSENT: 'Тасалсан', LATE: 'Хоцорсон' };
const STATUS_COLOR = { PRESENT: '#10b981',  ABSENT: '#ef4444',  LATE: '#f59e0b'   };
const STATUS_BG    = { PRESENT: '#d1fae5',  ABSENT: '#fee2e2',  LATE: '#fef3c7'   };

const DAYS    = ['Даваа', 'Мягмар', 'Лхагва', 'Пүрэв', 'Баасан', 'Бямба', 'Ням'];
const HOURS   = ['08:00','09:40','11:20','13:00','14:40','16:20'];
const COLORS_COURSE = ['#6366f1','#10b981','#f59e0b','#ef4444','#0ea5e9','#8b5cf6','#ec4899'];



/* ─── sub-components ─── */
const ScoreBar = ({ score }) => {
  const g = getGrade(score);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${score}%`, height: '100%', background: GRADE_META[g].color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 800, color: GRADE_META[g].color, minWidth: 32, textAlign: 'right' }}>{score}</span>
    </div>
  );
};

/* ─── Timetable grid ─── */
const Timetable = ({ enrollments, grades, schedules }) => {
  const [hovered, setHovered] = useState(null);

  // Build slot map from REAL schedule data
  const slotMap = {};
  // Get course id set from enrollments for color mapping
  const courseIds = [...new Set(enrollments.map(e => e.courseId))];

  schedules.forEach(s => {
    const hi = HOURS.indexOf(s.startTime);
    if (hi < 0) return;
    const key = `${s.dayOfWeek}-${hi}`;
    if (!slotMap[key]) {
      const colorIdx = courseIds.indexOf(s.courseId);
      const enrollment = enrollments.find(e => e.courseId === s.courseId);
      const g = grades.find(gr => gr.courseId === s.courseId);
      slotMap[key] = {
        course:   s.course,
        color:    COLORS_COURSE[colorIdx >= 0 ? colorIdx % COLORS_COURSE.length : 0],
        grade:    g,
        room:     s.room,
        semester: `${s.semester} ${s.year}`,
        teacher:  s.teacher,
      };
    }
  });

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 4, minWidth: 640 }}>
        <thead>
          <tr>
            <th style={{ width: 72, padding: '8px 4px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.5 }}>Цаг</th>
            {DAYS.map(d => (
              <th key={d} style={{ padding: '8px 4px', fontSize: 12, fontWeight: 700, color: '#374151', textAlign: 'center', minWidth: 110 }}>
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {HOURS.map((h, hi) => (
            <tr key={h}>
              {/* Time label */}
              <td style={{ textAlign: 'center', verticalAlign: 'middle', padding: '4px 0' }}>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '6px 4px' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>{h}</div>
                  <div style={{ fontSize: 10, color: '#94a3b8' }}>
                    {(() => {
                      const [hh, mm] = h.split(':').map(Number);
                      const end = new Date(0, 0, 0, hh, mm + 80);
                      return `${String(end.getHours()).padStart(2,'0')}:${String(end.getMinutes()).padStart(2,'0')}`;
                    })()}
                  </div>
                </div>
              </td>
              {/* Day cells */}
              {DAYS.map((d, di) => {
                const key  = `${di}-${hi}`;
                const slot = slotMap[key];
                const isHovered = hovered === key;
                return (
                  <td key={d} style={{ padding: '3px 2px', verticalAlign: 'top' }}>
                    {slot ? (
                      <div
                        onMouseEnter={() => setHovered(key)}
                        onMouseLeave={() => setHovered(null)}
                        style={{
                          background: isHovered ? slot.color : slot.color + '18',
                          border: `2px solid ${slot.color}40`,
                          borderLeft: `4px solid ${slot.color}`,
                          borderRadius: 10,
                          padding: '8px 10px',
                          cursor: 'default',
                          transition: 'all 0.15s',
                          minHeight: 64,
                        }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: isHovered ? '#fff' : slot.color, lineHeight: 1.3, marginBottom: 3 }}>
                          {slot.course.name}
                        </div>
                        <div style={{ fontSize: 10, color: isHovered ? 'rgba(255,255,255,0.8)' : '#94a3b8', fontWeight: 600 }}>
                          {slot.room}
                        </div>
                        {slot.grade && (
                          <div style={{
                            marginTop: 4, display: 'inline-block',
                            background: isHovered ? 'rgba(255,255,255,0.25)' : GRADE_META[slot.grade.grade]?.bg,
                            color: isHovered ? '#fff' : GRADE_META[slot.grade.grade]?.color,
                            fontSize: 10, fontWeight: 800, padding: '1px 6px', borderRadius: 4,
                          }}>
                            {slot.grade.grade} · {slot.grade.score}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ minHeight: 64, borderRadius: 10, background: '#f8fafc', border: '1px solid #f1f5f9' }} />
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

/* ═══════════════════════════════════════════════════════════ */
export default function StudentDashboard() {
  const { user } = useAuth();
  const [profile,     setProfile]     = useState(null);
  const [grades,      setGrades]      = useState([]);
  const [attendance,  setAttendance]  = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [schedules,   setSchedules]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [activeTab,   setActiveTab]   = useState('overview');
  const [scheduleFilter, setScheduleFilter] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const meRes = await api.get('/auth/me');
        const me    = meRes.data;
        setProfile(me);
        if (me.student?.id) {
          const sid = me.student.id;
          const [gRes, aRes, eRes] = await Promise.all([
            api.get('/grades',      { params: { studentId: sid } }),
            api.get('/attendance',  { params: { studentId: sid } }),
            api.get('/enrollments', { params: { studentId: sid } }),
          ]);
          setGrades(gRes.data.data      || []);
          setAttendance(aRes.data.data  || []);
          const enrolls = eRes.data.data || [];
          setEnrollments(enrolls);

          // fetch real schedule for each semester found in enrollments
          const semKeys = [...new Set(enrolls.map(e => `${e.semester}_${e.year}`))];
          let allSchedules = [];
          for (const sk of semKeys) {
            const [sem, yr] = sk.split('_');
            try {
              const sRes = await api.get('/schedules', { params: { semester: sem, year: parseInt(yr) } });
              allSchedules = allSchedules.concat(sRes.data.data || []);
            } catch {}
          }
          setSchedules(allSchedules);
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ width: 32, height: 32, border: '3px solid #e0e7ff', borderTop: '3px solid #6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );

  /* ── computed ── */
  const avg        = grades.length ? (grades.reduce((s, g) => s + g.score, 0) / grades.length).toFixed(1) : '—';
  const highest    = grades.length ? Math.max(...grades.map(g => g.score)) : '—';
  const lowest     = grades.length ? Math.min(...grades.map(g => g.score)) : '—';
  const passing    = grades.filter(g => g.score >= 60).length;
  const present    = attendance.filter(a => a.status === 'PRESENT').length;
  const absent     = attendance.filter(a => a.status === 'ABSENT').length;
  const late       = attendance.filter(a => a.status === 'LATE').length;
  const attendRate = attendance.length ? Math.round((present / attendance.length) * 100) : 0;

  const semMap = {};
  grades.forEach(g => {
    const k = `${g.semester} ${g.year}`;
    if (!semMap[k]) semMap[k] = [];
    semMap[k].push(g.score);
  });
  const semData = Object.entries(semMap).sort().map(([k, sc]) => ({
    name: k, avg: parseFloat((sc.reduce((a, b) => a + b, 0) / sc.length).toFixed(1)),
  }));

  const dist = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  grades.forEach(g => { if (dist[g.grade] !== undefined) dist[g.grade]++; });
  const distData = Object.entries(dist).map(([name, value]) => ({ name, value }));

  /* unique semesters for schedule filter */
  const semesters = [...new Set(enrollments.map(e => `${e.semester} ${e.year}`))].sort();
  const filteredEnrollments = scheduleFilter
    ? enrollments.filter(e => `${e.semester} ${e.year}` === scheduleFilter)
    : enrollments;

  const TABS = [
    { key: 'overview',  label: 'Ерөнхий'       },
    { key: 'schedule',  label: 'Хичээлийн хуваарь' },
    { key: 'grades',    label: 'Дүнгүүд'        },
    { key: 'attendance',label: 'Ирц'            },
    { key: 'courses',   label: 'Хичээлүүд'      },
  ];

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Profile banner ── */}
      <div style={{ background: 'linear-gradient(135deg,#6366f1 0%,#4338ca 100%)', borderRadius: 20, padding: '28px 32px', color: '#fff', display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: '3px solid rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 900, flexShrink: 0 }}>
          {profile?.student?.firstName?.[0] || user?.email?.[0]?.toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 22, fontWeight: 800 }}>{profile?.student?.firstName || user?.email}</div>
          <div style={{ fontSize: 13, opacity: 0.75, marginTop: 4, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {profile?.student?.studentCode && (
              <span style={{ background: 'rgba(255,255,255,0.15)', padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{profile.student.studentCode}</span>
            )}
            <span>{user?.email}</span>
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 38, fontWeight: 900, lineHeight: 1 }}>{avg}</div>
          <div style={{ fontSize: 11, opacity: 0.65, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Дундаж оноо</div>
          {avg !== '—' && (
            <div style={{ marginTop: 6, display: 'inline-block', padding: '3px 12px', borderRadius: 20, background: GRADE_META[getGrade(parseFloat(avg))].bg, color: GRADE_META[getGrade(parseFloat(avg))].color, fontSize: 12, fontWeight: 800 }}>
              {getGrade(parseFloat(avg))} — {GRADE_META[getGrade(parseFloat(avg))].label}
            </div>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: 3, background: '#f1f5f9', borderRadius: 12, padding: 4, width: 'fit-content', flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            style={{ padding: '8px 16px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.15s', background: activeTab === t.key ? '#fff' : 'transparent', color: activeTab === t.key ? '#4338ca' : '#64748b', boxShadow: activeTab === t.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none', whiteSpace: 'nowrap' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ══════════ OVERVIEW ══════════ */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
            {[
              { label: 'Нийт дүн',        value: grades.length,                  accent: '#6366f1' },
              { label: 'Хамгийн өндөр',   value: highest,                        accent: '#10b981' },
              { label: 'Хамгийн бага',    value: lowest,                         accent: '#f97316' },
              { label: 'Тэнцсэн хичээл', value: `${passing}/${grades.length}`,  accent: '#0ea5e9' },
            ].map((s, i) => (
              <div key={i} style={{ background: '#fff', border: '1px solid #e2e8f0', borderTop: `3px solid ${s.accent}`, borderRadius: 16, padding: '14px 18px' }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: s.accent }}>{s.value}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Attendance summary */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20, padding: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>Ирцийн хураангуй</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'center', minWidth: 72 }}>
                <div style={{ fontSize: 36, fontWeight: 900, color: attendRate >= 80 ? '#10b981' : attendRate >= 60 ? '#f59e0b' : '#ef4444' }}>{attendRate}%</div>
                <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>Ирцийн хувь</div>
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ height: 10, background: '#f1f5f9', borderRadius: 5, overflow: 'hidden', marginBottom: 8 }}>
                  <div style={{ display: 'flex', height: '100%' }}>
                    <div style={{ width: `${attendance.length ? (present/attendance.length)*100 : 0}%`, background: '#10b981' }} />
                    <div style={{ width: `${attendance.length ? (late/attendance.length)*100 : 0}%`, background: '#f59e0b' }} />
                    <div style={{ width: `${attendance.length ? (absent/attendance.length)*100 : 0}%`, background: '#ef4444' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  {[['Ирсэн',present,'#10b981'],['Хоцорсон',late,'#f59e0b'],['Тасалсан',absent,'#ef4444']].map(([l,v,c]) => (
                    <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: c }} />
                      <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{l}: <strong style={{ color: c }}>{v}</strong></span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {grades.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20, padding: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Улирлаар</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>Улирлын дундаж</div>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={semData} barCategoryGap="40%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0,100]} tick={{ fontSize: 10, fill: '#cbd5e1' }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(v) => [`${v}`, 'Дундаж']} />
                    <Bar dataKey="avg" fill="#6366f1" radius={[8,8,0,0]} maxBarSize={48} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20, padding: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Дүнгийн тархалт</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>A / B / C / D / F</div>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={distData} barCategoryGap="35%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 13, fontWeight: 700, fill: '#475569' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#cbd5e1' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip formatter={(v) => [`${v} хичээл`]} />
                    <Bar dataKey="value" radius={[8,8,0,0]} maxBarSize={48}>
                      {distData.map(d => <Cell key={d.name} fill={GRADE_META[d.name].color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {grades.length > 0 && (
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20, overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', background: '#fafafa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Сүүлийн дүнгүүд</span>
                <button onClick={() => setActiveTab('grades')} style={{ fontSize: 12, color: '#6366f1', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>Бүгдийг харах →</button>
              </div>
              {grades.slice(0,5).map((g, i) => (
                <div key={g.id} style={{ display: 'flex', alignItems: 'center', padding: '12px 20px', borderBottom: i<4 ? '1px solid #f8fafc' : 'none', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>{g.course?.name}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{g.semester} {g.year}</div>
                  </div>
                  <div style={{ width: 140 }}><ScoreBar score={g.score} /></div>
                  <span style={{ fontSize: 13, fontWeight: 800, padding: '3px 10px', borderRadius: 6, background: GRADE_META[g.grade]?.bg, color: GRADE_META[g.grade]?.color, minWidth: 28, textAlign: 'center' }}>{g.grade}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════ SCHEDULE ══════════ */}
      {activeTab === 'schedule' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Header + filter */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>Хичээлийн хуваарь</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 3 }}>
                {filteredEnrollments.length} хичээл · 7 хоног
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Улирал:</span>
              <select
                value={scheduleFilter}
                onChange={e => setScheduleFilter(e.target.value)}
                style={{ fontSize: 13, fontWeight: 600, color: '#374151', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', outline: 'none' }}>
                <option value="">Бүгд</option>
                {semesters.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Color legend */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {filteredEnrollments.map((e, i) => e.course && (
              <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', border: '1px solid #e2e8f0', borderLeft: `3px solid ${COLORS_COURSE[i % COLORS_COURSE.length]}`, borderRadius: 8, padding: '5px 10px' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: COLORS_COURSE[i % COLORS_COURSE.length] }}>{e.course.courseCode}</span>
                <span style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>{e.course.name}</span>
                <span style={{ fontSize: 10, color: '#94a3b8' }}>{e.course.credits}кр</span>
              </div>
            ))}
          </div>

          {enrollments.length === 0 ? (
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20, textAlign: 'center', padding: '64px 0', color: '#94a3b8', fontWeight: 600 }}>
              Бүртгэлтэй хичээл байхгүй байна
            </div>
          ) : (
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20, padding: 20 }}>
              <Timetable enrollments={filteredEnrollments} grades={grades} schedules={schedules.filter(s => !scheduleFilter || `${s.semester} ${s.year}` === scheduleFilter)} />
            </div>
          )}

          {/* Credits summary */}
          {filteredEnrollments.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
              {[
                { label: 'Нийт хичээл',   value: filteredEnrollments.length,                                                     accent: '#6366f1' },
                { label: 'Нийт кредит',   value: filteredEnrollments.reduce((s, e) => s + (e.course?.credits || 0), 0),           accent: '#10b981' },
                { label: 'Долоо хоногт',  value: `${filteredEnrollments.length * 2} цаг`,                                        accent: '#f59e0b' },
              ].map((s, i) => (
                <div key={i} style={{ background: '#fff', border: '1px solid #e2e8f0', borderTop: `3px solid ${s.accent}`, borderRadius: 16, padding: '14px 18px' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: s.accent }}>{s.value}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════ GRADES ══════════ */}
      {activeTab === 'grades' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {Object.entries(GRADE_META).map(([g, m]) => (
              <div key={g} style={{ display: 'flex', alignItems: 'center', gap: 6, background: m.bg, border: `1px solid ${m.color}22`, borderRadius: 8, padding: '4px 10px' }}>
                <span style={{ fontWeight: 800, fontSize: 13, color: m.color }}>{g}</span>
                <span style={{ fontSize: 11, color: m.text }}>{m.range}</span>
              </div>
            ))}
          </div>
          {grades.length === 0 ? (
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20, textAlign: 'center', padding: '64px 0', color: '#94a3b8', fontWeight: 600 }}>Дүн байхгүй байна</div>
          ) : (
            Object.entries(grades.reduce((acc, g) => { const k=`${g.semester} ${g.year}`; if(!acc[k]) acc[k]=[]; acc[k].push(g); return acc; }, {}))
              .sort(([a],[b]) => a.localeCompare(b))
              .map(([semKey, semGrades]) => {
                const semAvg = (semGrades.reduce((s,g)=>s+g.score,0)/semGrades.length).toFixed(1);
                return (
                  <div key={semKey} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20, overflow: 'hidden' }}>
                    <div style={{ padding: '12px 20px', borderBottom: '1px solid #f1f5f9', background: '#fafafa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, color: '#4338ca', fontSize: 14 }}>{semKey}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 12, color: '#64748b' }}>Дундаж:</span>
                        <span style={{ fontSize: 15, fontWeight: 800, color: GRADE_META[getGrade(parseFloat(semAvg))].color }}>{semAvg}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 5, background: GRADE_META[getGrade(parseFloat(semAvg))].bg, color: GRADE_META[getGrade(parseFloat(semAvg))].color }}>
                          {getGrade(parseFloat(semAvg))}
                        </span>
                      </div>
                    </div>
                    {semGrades.map((g, i) => (
                      <div key={g.id} style={{ display: 'flex', alignItems: 'center', padding: '13px 20px', borderBottom: i<semGrades.length-1 ? '1px solid #f8fafc' : 'none', gap: 16 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>{g.course?.name}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>{g.course?.courseCode}</div>
                        </div>
                        <div style={{ width: 160 }}><ScoreBar score={g.score} /></div>
                        <span style={{ fontSize: 14, fontWeight: 800, padding: '3px 12px', borderRadius: 7, background: GRADE_META[g.grade]?.bg, color: GRADE_META[g.grade]?.color, minWidth: 32, textAlign: 'center' }}>{g.grade}</span>
                      </div>
                    ))}
                  </div>
                );
              })
          )}
        </div>
      )}

      {/* ══════════ ATTENDANCE ══════════ */}
      {activeTab === 'attendance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
            {[
              { label: 'Ирцийн хувь', value: `${attendRate}%`, color: attendRate>=80?'#10b981':'#f59e0b' },
              { label: 'Ирсэн',       value: present,           color: '#10b981' },
              { label: 'Хоцорсон',    value: late,              color: '#f59e0b' },
              { label: 'Тасалсан',    value: absent,            color: '#ef4444' },
            ].map((s, i) => (
              <div key={i} style={{ background: '#fff', border: '1px solid #e2e8f0', borderTop: `3px solid ${s.color}`, borderRadius: 16, padding: '14px 18px', textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
              </div>
            ))}
          </div>
          {attendance.length === 0 ? (
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20, textAlign: 'center', padding: '64px 0', color: '#94a3b8', fontWeight: 600 }}>Ирцийн бүртгэл байхгүй</div>
          ) : (
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      {['Хичээл','Огноо','Статус'].map(h => (
                        <th key={h} style={{ padding: '11px 18px', textAlign: 'left', fontWeight: 700, color: '#64748b', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...attendance].sort((a,b)=>new Date(b.date)-new Date(a.date)).map((a, i) => (
                      <tr key={a.id} style={{ borderBottom: '1px solid #f8fafc', background: i%2===0?'#fff':'#fafafa' }}>
                        <td style={{ padding: '11px 18px', fontWeight: 600, color: '#0f172a' }}>{a.course?.name}</td>
                        <td style={{ padding: '11px 18px', color: '#64748b' }}>{new Date(a.date).toLocaleDateString('mn-MN')}</td>
                        <td style={{ padding: '11px 18px' }}>
                          <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 6, background: STATUS_BG[a.status], color: STATUS_COLOR[a.status] }}>
                            {STATUS_MN[a.status]||a.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════ COURSES ══════════ */}
      {activeTab === 'courses' && (
        <div>
          {enrollments.length === 0 ? (
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20, textAlign: 'center', padding: '64px 0', color: '#94a3b8', fontWeight: 600 }}>Бүртгэлтэй хичээл байхгүй</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
              {enrollments.map((e, i) => {
                const g = grades.find(gr => gr.courseId === e.courseId && gr.semester === e.semester && gr.year === e.year);
                return (
                  <div key={e.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderTop: `3px solid ${COLORS_COURSE[i % COLORS_COURSE.length]}`, borderRadius: 18, padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: COLORS_COURSE[i%COLORS_COURSE.length], background: COLORS_COURSE[i%COLORS_COURSE.length]+'18', padding: '2px 8px', borderRadius: 6 }}>{e.course?.courseCode}</span>
                      <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>{e.course?.credits} кредит</span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', lineHeight: 1.3 }}>{e.course?.name}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>
                      {e.semester} {e.year}
                      {e.course?.teacher && <> · {e.course.teacher.firstName} {e.course.teacher.lastName}</>}
                    </div>
                    {g ? (
                      <div style={{ marginTop: 4 }}>
                        <ScoreBar score={g.score} />
                        <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 11, color: '#64748b' }}>Дүн:</span>
                          <span style={{ fontSize: 13, fontWeight: 800, padding: '2px 10px', borderRadius: 6, background: GRADE_META[g.grade]?.bg, color: GRADE_META[g.grade]?.color }}>{g.grade} — {GRADE_META[g.grade]?.label}</span>
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: 12, color: '#cbd5e1', fontStyle: 'italic' }}>Дүн оруулаагүй</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
