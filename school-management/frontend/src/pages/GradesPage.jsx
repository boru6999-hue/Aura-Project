import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';
import { SkeletonTable } from '../components/Skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

/* ─────────────────── constants ─────────────────── */
const GRADE_META = {
  A: { color: '#10b981', bg: '#d1fae5', text: '#065f46', label: 'Өндөр',     range: '90–100' },
  B: { color: '#6366f1', bg: '#e0e7ff', text: '#3730a3', label: 'Сайн',      range: '80–89' },
  C: { color: '#f59e0b', bg: '#fef3c7', text: '#78350f', label: 'Дундаж',    range: '70–79' },
  D: { color: '#f97316', bg: '#ffedd5', text: '#7c2d12', label: 'Хангалттай',range: '60–69' },
  F: { color: '#ef4444', bg: '#fee2e2', text: '#7f1d1d', label: 'Тэнцээгүй', range: '0–59' },
};
const GRADE_KEYS = ['A', 'B', 'C', 'D', 'F'];

const getLetterGrade = (score) => {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
};

/* ─────────────────── sub-components ─────────────────── */

const ScoreBar = ({ score }) => {
  const pct = Math.min(100, Math.max(0, score));
  const g = getLetterGrade(score);
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-24 bg-slate-100 rounded-full h-1.5 overflow-hidden">
        <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: GRADE_META[g].color, transition: 'width 0.6s ease' }} />
      </div>
      <span className="text-xs font-bold tabular-nums" style={{ color: GRADE_META[g].color }}>{score}</span>
    </div>
  );
};

/* Custom SVG Donut — no label overlap, clean legend on side */
const DonutChart = ({ data, total }) => {
  const size = 180;
  const cx = size / 2, cy = size / 2;
  const R = 72, r = 44;
  const gap = 0.03; // radians gap between slices

  let startAngle = -Math.PI / 2;
  const slices = data.map(d => {
    const angle = (d.value / total) * (Math.PI * 2 - gap * data.length);
    const slice = { ...d, startAngle, endAngle: startAngle + angle };
    startAngle += angle + gap;
    return slice;
  });

  const arc = (sa, ea, outerR, innerR) => {
    const x1 = cx + outerR * Math.cos(sa), y1 = cy + outerR * Math.sin(sa);
    const x2 = cx + outerR * Math.cos(ea), y2 = cy + outerR * Math.sin(ea);
    const x3 = cx + innerR * Math.cos(ea), y3 = cy + innerR * Math.sin(ea);
    const x4 = cx + innerR * Math.cos(sa), y4 = cy + innerR * Math.sin(sa);
    const large = ea - sa > Math.PI ? 1 : 0;
    return `M${x1},${y1} A${outerR},${outerR},0,${large},1,${x2},${y2} L${x3},${y3} A${innerR},${innerR},0,${large},0,${x4},${y4} Z`;
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
      <svg width={size} height={size} style={{ flexShrink: 0 }}>
        {slices.map(s => (
          <path key={s.grade} d={arc(s.startAngle, s.endAngle, R, r)}
            fill={GRADE_META[s.grade].color}
            style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.12))' }} />
        ))}
        {/* Center text */}
        <text x={cx} y={cy - 8} textAnchor="middle" style={{ fontSize: 26, fontWeight: 800, fill: '#0f172a', fontFamily: 'inherit' }}>{total}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" style={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8', letterSpacing: 1, textTransform: 'uppercase' }}>НИЙТ</text>
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        {slices.map(s => {
          const pct = ((s.value / total) * 100).toFixed(0);
          return (
            <div key={s.grade} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: GRADE_META[s.grade].color, flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>
                  <span style={{ fontWeight: 800, color: GRADE_META[s.grade].color, marginRight: 4 }}>{s.grade}</span>
                  {GRADE_META[s.grade].label}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 48, height: 4, borderRadius: 2, background: '#f1f5f9', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: GRADE_META[s.grade].color, borderRadius: 2 }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', minWidth: 28, textAlign: 'right' }}>{s.value}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* Custom bar tooltip */
const BarTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const g = label;
  return (
    <div style={{ background: '#fff', border: `1px solid ${GRADE_META[g]?.color || '#e2e8f0'}`, borderRadius: 10, padding: '8px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: GRADE_META[g]?.color }}>{g} — {GRADE_META[g]?.range}</div>
      <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{payload[0].value} сурагч</div>
    </div>
  );
};

/* ─────────────────── semester averages ─────────────────── */
const computeSemesterAverages = (grades) => {
  const map = {};
  grades.forEach(g => {
    const sid = g.studentId;
    if (!map[sid]) map[sid] = { studentId: sid, name: `${g.student?.firstName} ${g.student?.lastName}`, code: g.student?.studentCode, semesters: {} };
    const key = `${g.semester} ${g.year}`;
    if (!map[sid].semesters[key]) map[sid].semesters[key] = [];
    map[sid].semesters[key].push(g.score);
  });
  const semKeys = [...new Set(grades.map(g => `${g.semester} ${g.year}`))].sort();
  const rows = Object.values(map).map(s => {
    const semAvgs = {};
    semKeys.forEach(k => {
      const sc = s.semesters[k];
      semAvgs[k] = sc ? (sc.reduce((a, b) => a + b, 0) / sc.length).toFixed(1) : '—';
    });
    const all = grades.filter(g => g.studentId === s.studentId).map(g => g.score);
    return { ...s, semAvgs, overall: all.length ? (all.reduce((a, b) => a + b, 0) / all.length).toFixed(1) : '—' };
  });
  return { rows, semKeys };
};

/* ═══════════════════════════════════════════════════════════ */
export default function GradesPage() {
  const { isAdmin, isTeacher } = useAuth();
  const { show: toast } = useToast();

  const [grades, setGrades]     = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState('table');
  const [filters, setFilters]   = useState({ studentId: '', courseId: '', semester: '', year: '' });
  const [showModal, setShowModal]       = useState(false);
  const [editingGrade, setEditingGrade] = useState(null);
  const [form, setForm] = useState({ studentId: '', courseId: '', score: '', semester: 'Spring', year: new Date().getFullYear() });
  const [submitting, setSubmitting] = useState(false);

  const fetchGrades = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.studentId) params.studentId = filters.studentId;
      if (filters.courseId)  params.courseId  = filters.courseId;
      if (filters.semester)  params.semester  = filters.semester;
      if (filters.year)      params.year      = filters.year;
      const res = await api.get('/grades', { params });
      setGrades(res.data.data);
    } catch { toast('Дүнгүүд ачааллахад алдаа гарлаа', 'error'); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchGrades(); }, [fetchGrades]);
  useEffect(() => {
    Promise.all([api.get('/students?limit=200'), api.get('/courses?limit=200')])
      .then(([s, c]) => { setStudents(s.data.data); setCourses(c.data.data); })
      .catch(() => {});
  }, []);

  const openAdd = () => { setEditingGrade(null); setForm({ studentId: '', courseId: '', score: '', semester: 'Spring', year: new Date().getFullYear() }); setShowModal(true); };
  const openEdit = (g) => { setEditingGrade(g); setForm({ studentId: g.studentId, courseId: g.courseId, score: g.score, semester: g.semester, year: g.year }); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try {
      await api.post('/grades', { studentId: parseInt(form.studentId), courseId: parseInt(form.courseId), score: parseFloat(form.score), semester: form.semester, year: parseInt(form.year) });
      toast(editingGrade ? 'Дүн шинэчлэгдлээ' : 'Дүн хадгалагдлаа', 'success');
      setShowModal(false); fetchGrades();
    } catch (err) { toast(err.response?.data?.error || 'Алдаа гарлаа', 'error'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Энэ дүнг устгах уу?')) return;
    try { await api.delete(`/grades/${id}`); toast('Дүн устгагдлаа', 'info'); fetchGrades(); }
    catch { toast('Устгахад алдаа гарлаа', 'error'); }
  };

  /* computed */
  const dist = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  grades.forEach(g => { if (dist[g.grade] !== undefined) dist[g.grade]++; });
  const barData   = GRADE_KEYS.map(k => ({ grade: k, value: dist[k] }));
  const donutData = barData.filter(d => d.value > 0);
  const avg     = grades.length ? (grades.reduce((s, g) => s + g.score, 0) / grades.length).toFixed(1) : '—';
  const highest = grades.length ? Math.max(...grades.map(g => g.score)) : '—';
  const passing = grades.filter(g => g.score >= 60).length;
  const { rows: semRows, semKeys } = computeSemesterAverages(grades);

  const avgColor = (v) => {
    if (v === '—') return '#94a3b8';
    const n = parseFloat(v);
    return GRADE_META[getLetterGrade(n)].color;
  };

  const TABS = [
    { key: 'table',    label: 'Хүснэгт' },
    { key: 'semester', label: 'Улирлын дундаж' },
    { key: 'chart',    label: 'График' },
  ];

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0 }}>Дүнгүүд</h1>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
            {grades.length} бичлэг
            {avg !== '—' && <> · Дундаж оноо: <strong style={{ color: '#6366f1' }}>{avg}</strong></>}
          </p>
        </div>
        {(isAdmin || isTeacher) && (
          <button onClick={openAdd} className="btn-primary">+ Дүн нэмэх</button>
        )}
      </div>

      {/* ── Stat strip ── */}
      {grades.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            { label: 'Нийт бичлэг',    value: grades.length, accent: '#6366f1' },
            { label: 'Дундаж оноо',    value: avg,           accent: '#10b981' },
            { label: 'Хамгийн өндөр',  value: highest,       accent: '#f59e0b' },
            { label: 'Тэнцсэн',        value: `${passing} / ${grades.length}`, accent: '#0ea5e9' },
          ].map((s, i) => (
            <div key={i} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '14px 18px', borderTop: `3px solid ${s.accent}` }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.accent }}>{s.value}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Grade scale legend ── */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {GRADE_KEYS.map(g => (
          <div key={g} style={{ display: 'flex', alignItems: 'center', gap: 6, background: GRADE_META[g].bg, border: `1px solid ${GRADE_META[g].color}22`, borderRadius: 8, padding: '4px 10px' }}>
            <span style={{ fontWeight: 800, fontSize: 13, color: GRADE_META[g].color }}>{g}</span>
            <span style={{ fontSize: 11, color: GRADE_META[g].text, fontWeight: 500 }}>{GRADE_META[g].range}</span>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: 4, background: '#f1f5f9', borderRadius: 12, padding: 4, width: 'fit-content' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            style={{
              padding: '8px 18px', borderRadius: 9, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
              background: activeTab === t.key ? '#fff' : 'transparent',
              color: activeTab === t.key ? '#4338ca' : '#64748b',
              boxShadow: activeTab === t.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ════════ CHART TAB ════════ */}
      {activeTab === 'chart' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

          {/* Bar chart */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20, padding: 24 }}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: 1, textTransform: 'uppercase' }}>Дүнгийн тархалт</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginTop: 2 }}>Тоо хэмжээ</div>
            </div>
            {grades.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#cbd5e1', padding: '40px 0', fontSize: 14 }}>Өгөгдөл байхгүй</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barData} barCategoryGap="40%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" vertical={false} />
                  <XAxis dataKey="grade" tick={{ fontSize: 13, fontWeight: 700, fill: '#475569' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#cbd5e1' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<BarTip />} cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="value" radius={[10, 10, 0, 0]} maxBarSize={56}>
                    {barData.map(d => <Cell key={d.grade} fill={GRADE_META[d.grade].color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Custom donut */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20, padding: 24 }}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: 1, textTransform: 'uppercase' }}>Дүнгийн хуваарь</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginTop: 2 }}>Хувь харьцаа</div>
            </div>
            {donutData.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#cbd5e1', padding: '40px 0', fontSize: 14 }}>Өгөгдөл байхгүй</div>
            ) : (
              <DonutChart data={donutData} total={grades.length} />
            )}
          </div>

          {/* Semester trend bar — full width */}
          {semKeys.length > 1 && (
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20, padding: 24, gridColumn: '1 / -1' }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: 1, textTransform: 'uppercase' }}>Улирлаар</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginTop: 2 }}>Улирлын дундаж оноо</div>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart
                  data={semKeys.map(k => {
                    const vals = semRows.map(r => r.semAvgs[k]).filter(v => v !== '—').map(Number);
                    return { name: k, avg: vals.length ? parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)) : 0 };
                  })}
                  barCategoryGap="45%"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#cbd5e1' }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v) => [`${v}`, 'Дундаж оноо']} />
                  <Bar dataKey="avg" fill="#6366f1" radius={[10, 10, 0, 0]} maxBarSize={64} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* ════════ SEMESTER TAB ════════ */}
      {activeTab === 'semester' && (
        loading ? <SkeletonTable rows={5} cols={4} /> :
        semRows.length === 0 ? (
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20, textAlign: 'center', padding: '64px 0' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>—</div>
            <p style={{ color: '#94a3b8', fontWeight: 600 }}>Дүн байхгүй байна</p>
          </div>
        ) : (
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>Улирлын дундаж дүн</span>
              <span style={{ fontSize: 11, color: '#cbd5e1' }}>{semRows.length} сурагч · {semKeys.length} улирал</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '12px 20px', textAlign: 'left', fontWeight: 700, color: '#475569', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, position: 'sticky', left: 0, background: '#f8fafc' }}>Сурагч</th>
                    {semKeys.map(k => (
                      <th key={k} style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, color: '#6366f1', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>{k}</th>
                    ))}
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, color: '#0f172a', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, background: '#eef2ff' }}>Нийт дундаж</th>
                  </tr>
                </thead>
                <tbody>
                  {semRows.map((row, i) => (
                    <tr key={row.studentId} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                      <td style={{ padding: '12px 20px', position: 'sticky', left: 0, background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#818cf8,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 11, flexShrink: 0 }}>
                            {row.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#0f172a' }}>{row.name}</div>
                            <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>{row.code}</div>
                          </div>
                        </div>
                      </td>
                      {semKeys.map(k => {
                        const val = row.semAvgs[k];
                        const g = val !== '—' ? getLetterGrade(parseFloat(val)) : null;
                        return (
                          <td key={k} style={{ padding: '12px 16px', textAlign: 'center' }}>
                            {val === '—' ? (
                              <span style={{ color: '#e2e8f0', fontSize: 18, fontWeight: 700 }}>—</span>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                                <span style={{ fontSize: 16, fontWeight: 800, color: GRADE_META[g].color, fontVariantNumeric: 'tabular-nums' }}>{val}</span>
                                <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: GRADE_META[g].bg, color: GRADE_META[g].text }}>{g}</span>
                              </div>
                            )}
                          </td>
                        );
                      })}
                      <td style={{ padding: '12px 16px', textAlign: 'center', background: '#eef2ff' }}>
                        {row.overall !== '—' ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                            <span style={{ fontSize: 16, fontWeight: 800, color: avgColor(row.overall) }}>{row.overall}</span>
                            <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: GRADE_META[getLetterGrade(parseFloat(row.overall))].bg, color: GRADE_META[getLetterGrade(parseFloat(row.overall))].text }}>
                              {getLetterGrade(parseFloat(row.overall))}
                            </span>
                          </div>
                        ) : <span style={{ color: '#e2e8f0' }}>—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: '2px solid #e2e8f0', background: '#f8fafc' }}>
                    <td style={{ padding: '12px 20px', fontWeight: 700, fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>Ангийн дундаж</td>
                    {semKeys.map(k => {
                      const vals = semRows.map(r => r.semAvgs[k]).filter(v => v !== '—').map(Number);
                      const ca = vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : '—';
                      return (
                        <td key={k} style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <span style={{ fontSize: 13, fontWeight: 800, color: avgColor(ca) }}>{ca}</span>
                        </td>
                      );
                    })}
                    <td style={{ padding: '12px 16px', textAlign: 'center', background: '#e0e7ff' }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#4338ca' }}>{avg}</span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )
      )}

      {/* ════════ TABLE TAB ════════ */}
      {activeTab === 'table' && (
        <>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
              <select className="input-field text-sm" value={filters.studentId} onChange={e => setFilters({ ...filters, studentId: e.target.value })}>
                <option value="">Бүх сурагч</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}
              </select>
              <select className="input-field text-sm" value={filters.courseId} onChange={e => setFilters({ ...filters, courseId: e.target.value })}>
                <option value="">Бүх хичээл</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select className="input-field text-sm" value={filters.semester} onChange={e => setFilters({ ...filters, semester: e.target.value })}>
                <option value="">Бүх улирал</option>
                <option>Spring</option><option>Fall</option><option>Summer</option>
              </select>
              <input type="number" placeholder="Жил" className="input-field text-sm" value={filters.year} onChange={e => setFilters({ ...filters, year: e.target.value })} />
            </div>
          </div>

          {loading ? <SkeletonTable rows={7} cols={7} /> :
          grades.length === 0 ? (
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20, textAlign: 'center', padding: '64px 0' }}>
              <p style={{ color: '#94a3b8', fontWeight: 600 }}>Дүн олдсонгүй</p>
            </div>
          ) : (
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      {['Сурагч', 'Хичээл', 'Оноо', 'Дүн', 'Улирал', 'Жил', 'Үйлдэл'].map(h => (
                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#64748b', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {grades.map((g, i) => (
                      <tr key={g.id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafafa', transition: 'background 0.1s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                        onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#fafafa'}>
                        <td style={{ padding: '11px 16px', fontWeight: 600, color: '#0f172a' }}>{g.student?.firstName} {g.student?.lastName}</td>
                        <td style={{ padding: '11px 16px', color: '#64748b', fontSize: 12 }}>{g.course?.name}</td>
                        <td style={{ padding: '11px 16px' }}><ScoreBar score={g.score} /></td>
                        <td style={{ padding: '11px 16px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 10px', borderRadius: 6, fontSize: 12, fontWeight: 800, background: GRADE_META[g.grade]?.bg, color: GRADE_META[g.grade]?.color }}>
                            {g.grade}
                          </span>
                        </td>
                        <td style={{ padding: '11px 16px', color: '#64748b' }}>{g.semester}</td>
                        <td style={{ padding: '11px 16px', color: '#64748b', fontWeight: 600 }}>{g.year}</td>
                        <td style={{ padding: '11px 16px' }}>
                          {(isAdmin || isTeacher) && (
                            <div style={{ display: 'flex', gap: 4 }}>
                              <button onClick={() => openEdit(g)}
                                style={{ fontSize: 12, fontWeight: 600, color: '#6366f1', background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 10px', borderRadius: 8, transition: 'background 0.1s' }}
                                onMouseEnter={e => e.currentTarget.style.background = '#eef2ff'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                Засах
                              </button>
                              <button onClick={() => handleDelete(g.id)}
                                style={{ fontSize: 12, fontWeight: 600, color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 10px', borderRadius: 8, transition: 'background 0.1s' }}
                                onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                Устгах
                              </button>
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
        </>
      )}

      {/* ════════ ADD / EDIT MODAL ════════ */}
      {showModal && (
        <Modal title={editingGrade ? 'Дүн засах' : 'Дүн нэмэх'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {editingGrade ? (
              <div style={{ background: '#eef2ff', borderRadius: 12, padding: '14px 16px', fontSize: 13 }}>
                <div style={{ color: '#475569' }}>Сурагч: <strong style={{ color: '#0f172a' }}>{editingGrade.student?.firstName} {editingGrade.student?.lastName}</strong></div>
                <div style={{ color: '#475569', marginTop: 4 }}>Хичээл: <strong style={{ color: '#0f172a' }}>{editingGrade.course?.name}</strong></div>
                <div style={{ color: '#475569', marginTop: 4 }}>Улирал: <strong style={{ color: '#0f172a' }}>{editingGrade.semester} {editingGrade.year}</strong></div>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Сурагч *</label>
                  <select className="input-field" value={form.studentId} onChange={e => setForm({ ...form, studentId: e.target.value })} required>
                    <option value="">Сурагч сонгоно уу</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.studentCode})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Хичээл *</label>
                  <select className="input-field" value={form.courseId} onChange={e => setForm({ ...form, courseId: e.target.value })} required>
                    <option value="">Хичээл сонгоно уу</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </>
            )}

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                Оноо (0–100) *
                {form.score !== '' && !isNaN(parseFloat(form.score)) && (() => {
                  const g = getLetterGrade(parseFloat(form.score));
                  return <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 800, padding: '2px 8px', borderRadius: 6, background: GRADE_META[g].bg, color: GRADE_META[g].color }}>{g} — {GRADE_META[g].label}</span>;
                })()}
              </label>
              <input type="number" min="0" max="100" step="0.1" className="input-field"
                value={form.score} onChange={e => setForm({ ...form, score: e.target.value })}
                autoFocus={!!editingGrade} required />
              {form.score !== '' && !isNaN(parseFloat(form.score)) && (
                <div style={{ marginTop: 8 }}><ScoreBar score={parseFloat(form.score) || 0} /></div>
              )}
            </div>

            {!editingGrade && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Улирал *</label>
                  <select className="input-field" value={form.semester} onChange={e => setForm({ ...form, semester: e.target.value })}>
                    <option>Spring</option><option>Fall</option><option>Summer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Жил *</label>
                  <input type="number" className="input-field" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} required />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
              <button type="submit" disabled={submitting} className="btn-primary" style={{ flex: 1 }}>
                {submitting ? 'Хадгалж байна...' : editingGrade ? 'Шинэчлэх' : 'Дүн хадгалах'}
              </button>
              <button type="button" onClick={() => setShowModal(false)} className="btn-secondary" style={{ flex: 1 }}>Болих</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
