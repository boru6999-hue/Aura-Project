import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';

const DAYS      = ['Даваа', 'Мягмар', 'Лхагва', 'Пүрэв', 'Баасан', 'Бямба', 'Ням'];
const DAY_EN    = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const HOURS     = ['08:00','09:40','11:20','13:00','14:40','16:20'];
const END_TIMES = ['09:40','11:20','13:00','14:40','16:20','18:00'];
const ROOMS     = ['А-101','А-102','А-203','А-301','Б-101','Б-205','В-301','В-302','Лаб-1','Лаб-2','Лаб-3'];
const PERIOD_LABELS = ['I', 'II', 'III', 'IV', 'V', 'VI'];

const PALETTE = [
  { bg: '#00d4ff', text: '#003d4d' },
  { bg: '#ff6b6b', text: '#4a0000' },
  { bg: '#ffd93d', text: '#4a3800' },
  { bg: '#6bcb77', text: '#0a3d15' },
  { bg: '#ff8c42', text: '#4a2000' },
  { bg: '#c77dff', text: '#2d004a' },
  { bg: '#4ecdc4', text: '#00332e' },
  { bg: '#ff6eb4', text: '#4a0028' },
  { bg: '#a8e063', text: '#1e3d00' },
  { bg: '#f7c59f', text: '#4a2800' },
];

const getCourseStyle = (courseId, courses) => {
  const idx = courses.findIndex(c => c.id === courseId);
  return PALETTE[idx % PALETTE.length] || PALETTE[0];
};

const SEMESTERS_OPTIONS = [
  { label: 'Fall 2024',   semester: 'Fall',   year: 2024 },
  { label: 'Spring 2025', semester: 'Spring', year: 2025 },
  { label: 'Fall 2025',   semester: 'Fall',   year: 2025 },
  { label: 'Spring 2026', semester: 'Spring', year: 2026 },
];

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');

  .sched-root {
    font-family: 'Syne', sans-serif;
    background: #0a0e1a;
    min-height: 100vh;
    padding: 28px 24px;
    color: #e8eaf0;
  }
  .sched-header {
    display: flex; align-items: flex-start; justify-content: space-between;
    flex-wrap: wrap; gap: 16px; margin-bottom: 28px;
  }
  .sched-title h1 {
    font-size: 28px; font-weight: 800; color: #fff; margin: 0;
    letter-spacing: -0.5px; line-height: 1.1;
  }
  .sched-title .subtitle {
    font-family: 'DM Mono', monospace; font-size: 11px; color: #00d4ff;
    margin-top: 6px; letter-spacing: 0.08em; text-transform: uppercase;
  }
  .sem-pills { display: flex; gap: 6px; flex-wrap: wrap; }
  .sem-pill {
    padding: 7px 16px; border-radius: 4px; font-size: 12px; font-weight: 700;
    cursor: pointer; border: 1.5px solid; letter-spacing: 0.05em;
    transition: all 0.15s; font-family: 'DM Mono', monospace;
  }
  .sem-pill-on  { background: #00d4ff; color: #001a20; border-color: #00d4ff; box-shadow: 0 0 16px rgba(0,212,255,0.4); }
  .sem-pill-off { background: transparent; color: #556; border-color: #1e2535; }
  .sem-pill-off:hover { border-color: #00d4ff44; color: #00d4ff99; }

  .sched-stats { display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; }
  .stat-chip {
    background: #111827; border: 1px solid #1e2a3a; border-radius: 8px;
    padding: 12px 18px; display: flex; flex-direction: column; gap: 2px; min-width: 110px;
  }
  .stat-chip .val {
    font-size: 26px; font-weight: 800; color: #00d4ff; line-height: 1;
    font-family: 'DM Mono', monospace;
  }
  .stat-chip .lbl {
    font-size: 10px; font-weight: 600; color: #4a5568;
    text-transform: uppercase; letter-spacing: 0.08em;
  }

  .sched-legend { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; }
  .legend-tag {
    display: flex; align-items: center; gap: 7px;
    background: #111827; border: 1px solid #1e2a3a;
    border-radius: 5px; padding: 5px 10px; font-size: 11px; font-weight: 700;
  }
  .legend-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

  .grid-wrap {
    background: #0d1120; border: 1px solid #1a2236; border-radius: 12px;
    overflow: hidden; overflow-x: auto;
  }
  .sched-table { width: 100%; border-collapse: collapse; min-width: 720px; }
  .sched-table thead tr th { background: #0d1120; border-bottom: 2px solid #1a2236; padding: 0; }
  .th-time { width: 80px; padding: 14px 8px; }
  .th-day { padding: 14px 8px; min-width: 148px; text-align: center; }
  .th-day-en { font-family: 'DM Mono', monospace; font-size: 11px; font-weight: 500; color: #00d4ff; letter-spacing: 0.12em; }
  .th-day-mn { font-size: 13px; font-weight: 800; color: #e8eaf0; margin-top: 2px; }
  .sched-table tbody tr { border-bottom: 1px solid #131929; }
  .td-time {
    padding: 8px; vertical-align: middle; text-align: center;
    border-right: 1px solid #1a2236; background: #0a0e1a;
  }
  .time-block { display: flex; flex-direction: column; align-items: center; gap: 1px; }
  .time-period {
    font-family: 'DM Mono', monospace; font-size: 9px; font-weight: 500; color: #00d4ff;
    letter-spacing: 0.1em; background: #001a2044; padding: 2px 5px; border-radius: 3px; margin-bottom: 3px;
  }
  .time-start { font-family: 'DM Mono', monospace; font-size: 12px; font-weight: 500; color: #cbd5e1; }
  .time-end   { font-family: 'DM Mono', monospace; font-size: 10px; color: #3a4a5c; }
  .td-cell { padding: 5px; vertical-align: top; border-right: 1px solid #131929; }

  .slot-filled {
    border-radius: 6px; padding: 10px 11px; cursor: pointer;
    min-height: 76px; position: relative; transition: transform 0.12s, box-shadow 0.12s; overflow: hidden;
  }
  .slot-filled:hover { transform: scale(1.02); box-shadow: 0 4px 20px rgba(0,0,0,0.4); }
  .slot-name { font-size: 11px; font-weight: 800; line-height: 1.3; margin-bottom: 5px; }
  .slot-meta { display: flex; flex-direction: column; gap: 2px; margin-top: 4px; }
  .slot-room, .slot-teacher { font-family: 'DM Mono', monospace; font-size: 9px; font-weight: 500; opacity: 0.7; }
  .slot-del {
    position: absolute; top: 5px; right: 5px; width: 18px; height: 18px;
    border-radius: 3px; border: none; font-size: 12px; font-weight: 800; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    background: rgba(0,0,0,0.3); color: rgba(255,255,255,0.8);
    opacity: 0; transition: opacity 0.15s, background 0.15s;
  }
  .slot-filled:hover .slot-del { opacity: 1; }
  .slot-del:hover { background: rgba(239,68,68,0.8) !important; }

  .slot-empty {
    min-height: 76px; border-radius: 6px; border: 1px dashed #1e2a3a;
    background: transparent; cursor: pointer; display: flex;
    align-items: center; justify-content: center; transition: all 0.15s;
  }
  .slot-empty:hover { background: #00d4ff08; border-color: #00d4ff44; }
  .slot-plus { font-size: 16px; color: #1e2a3a; transition: color 0.15s; }
  .slot-empty:hover .slot-plus { color: #00d4ff55; }

  .sched-loading { text-align: center; padding: 80px 0; color: #3a4a5c; }
  .sched-spinner {
    width: 28px; height: 28px; border: 2px solid #1e2a3a; border-top-color: #00d4ff;
    border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 12px;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .sched-empty { text-align: center; padding: 60px 0; color: #3a4a5c; font-size: 13px; }

  .modal-lbl {
    display: block; font-size: 11px; font-weight: 700; color: #00d4ff;
    margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.08em;
    font-family: 'DM Mono', monospace;
  }
  .modal-grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
  .rooms-wrap { display: flex; gap: 5px; flex-wrap: wrap; margin-bottom: 6px; }
  .room-btn {
    padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 700;
    cursor: pointer; border: 1px solid; font-family: 'DM Mono', monospace; transition: all 0.1s;
  }
  .room-on  { background: #00d4ff22; border-color: #00d4ff; color: #00d4ff; }
  .room-off { background: transparent; border-color: #1e2a3a; color: #4a5568; }
  .room-off:hover { border-color: #00d4ff44; color: #00d4ff77; }
  .sem-info {
    background: #111827; border: 1px solid #1e2a3a; border-left: 3px solid #00d4ff;
    border-radius: 6px; padding: 10px 14px; font-size: 12px; color: #4a5568;
    display: flex; gap: 8px; font-family: 'DM Mono', monospace;
  }
  .sem-info strong { color: #00d4ff; }
  .conflict-warn {
    background: #2a1200; border: 1px solid #f59e0b55; border-radius: 6px;
    padding: 8px 12px; font-size: 12px; color: #f59e0b; font-family: 'DM Mono', monospace;
  }
  .dark-inputs .input-field {
    background: #111827 !important; border-color: #1e2a3a !important; color: #e8eaf0 !important;
  }
  .dark-inputs .input-field:focus {
    border-color: #00d4ff !important; box-shadow: 0 0 0 2px rgba(0,212,255,0.15) !important;
  }
`;

export default function SchedulePage() {
  const { isAdmin, isTeacher } = useAuth();
  const { show: toast } = useToast();
  const canEdit = isAdmin || isTeacher;

  const [schedules, setSchedules] = useState([]);
  const [courses,   setCourses]   = useState([]);
  const [teachers,  setTeachers]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [semFilter, setSemFilter] = useState(SEMESTERS_OPTIONS[2]);

  const [showModal,    setShowModal]    = useState(false);
  const [editSlot,     setEditSlot]     = useState(null);
  const [form,         setForm]         = useState({ courseId: '', teacherId: '', dayOfWeek: 0, startTime: '08:00', endTime: '09:40', room: '' });
  const [submitting,   setSubmitting]   = useState(false);
  const [conflictWarn, setConflictWarn] = useState('');

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/schedules', { params: { semester: semFilter.semester, year: semFilter.year } });
      setSchedules(res.data.data || []);
    } catch { toast('Хуваарь ачааллахад алдаа гарлаа', 'error'); }
    finally { setLoading(false); }
  }, [semFilter]);

  useEffect(() => { fetchSchedules(); }, [fetchSchedules]);
  useEffect(() => {
    Promise.all([api.get('/courses?limit=200'), api.get('/teachers?limit=100')])
      .then(([c, t]) => { setCourses(c.data.data || []); setTeachers(t.data.data || []); })
      .catch(() => {});
  }, []);

  const gridMap = {};
  schedules.forEach(s => {
    const hi = HOURS.indexOf(s.startTime);
    if (hi >= 0) gridMap[`${s.dayOfWeek}-${hi}`] = s;
  });

  const checkConflict = (courseId, dayOfWeek, startTime, excludeId) => {
    const hi = HOURS.indexOf(startTime);
    if (hi < 0) return '';
    const occupant = gridMap[`${dayOfWeek}-${hi}`];
    if (occupant && occupant.id !== excludeId) {
      const c = courses.find(x => x.id === occupant.courseId);
      return `Энэ цагт "${c?.name || 'хичээл'}" байна`;
    }
    return '';
  };

  const openAdd = (day, hourIdx) => {
    if (!canEdit) return;
    const existing = gridMap[`${day}-${hourIdx}`];
    if (existing) { openEdit(existing); return; }
    setEditSlot(null); setConflictWarn('');
    setForm({ courseId: '', teacherId: '', dayOfWeek: day, startTime: HOURS[hourIdx], endTime: END_TIMES[hourIdx], room: '', note: '' });
    setShowModal(true);
  };

  const openEdit = (s) => {
    if (!canEdit) return;
    setEditSlot(s.id); setConflictWarn('');
    setForm({
      courseId: s.courseId, teacherId: s.teacherId || '',
      dayOfWeek: s.dayOfWeek, startTime: s.startTime, endTime: s.endTime, room: s.room || '',
      note: '',
      // Store old values for request diff
      oldDayOfWeek: s.dayOfWeek, oldStartTime: s.startTime, oldEndTime: s.endTime, oldRoom: s.room || '',
    });
    setShowModal(true);
  };

  const handleCourseChange = (courseId) => {
    const course = courses.find(c => c.id === parseInt(courseId));
    const nf = { ...form, courseId, teacherId: course?.teacherId ? String(course.teacherId) : form.teacherId };
    setForm(nf);
    setConflictWarn(checkConflict(courseId, nf.dayOfWeek, nf.startTime, editSlot));
  };

  const handleStartChange = (start) => {
    const hi = HOURS.indexOf(start);
    const nf = { ...form, startTime: start, endTime: hi >= 0 ? END_TIMES[hi] : form.endTime };
    setForm(nf);
    setConflictWarn(checkConflict(nf.courseId, nf.dayOfWeek, start, editSlot));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.courseId) { toast('Хичээл сонгоно уу', 'warning'); return; }
    const conflict = checkConflict(form.courseId, form.dayOfWeek, form.startTime, editSlot);
    if (conflict && !editSlot) { setConflictWarn(conflict); return; }
    setSubmitting(true);
    try {
      const payload = {
        courseId: parseInt(form.courseId), teacherId: form.teacherId ? parseInt(form.teacherId) : undefined,
        dayOfWeek: parseInt(form.dayOfWeek), startTime: form.startTime, endTime: form.endTime,
        room: form.room || null, semester: semFilter.semester, year: semFilter.year,
      };

      if (isAdmin) {
        // Admin directly saves
        if (editSlot) { await api.put(`/schedules/${editSlot}`, payload); toast('Хуваарь шинэчлэгдлээ', 'success'); }
        else          { await api.post('/schedules', payload);             toast('Хуваарь нэмэгдлээ',    'success'); }
        setShowModal(false); fetchSchedules();
      } else {
        // Teacher submits a change request
        const requestPayload = {
          scheduleId:   editSlot || null,
          courseId:     parseInt(form.courseId),
          dayOfWeek:    parseInt(form.dayOfWeek),
          startTime:    form.startTime,
          endTime:      form.endTime,
          room:         form.room || null,
          semester:     semFilter.semester,
          year:         semFilter.year,
          note:         form.note || null,
          // Pass old values for change requests
          oldDayOfWeek: editSlot !== null ? form.oldDayOfWeek : undefined,
          oldStartTime: editSlot !== null ? form.oldStartTime : undefined,
          oldEndTime:   editSlot !== null ? form.oldEndTime   : undefined,
          oldRoom:      editSlot !== null ? form.oldRoom      : undefined,
        };
        await api.post('/schedule-requests', requestPayload);
        toast('Хүсэлт илгээгдлээ! Админ батлахыг хүлээнэ үү.', 'success');
        setShowModal(false);
      }
    } catch (err) { toast(err.response?.data?.error || 'Алдаа гарлаа', 'error'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Энэ цагийн хуваарийг устгах уу?')) return;
    try { await api.delete(`/schedules/${id}`); toast('Хуваарь устгагдлаа', 'info'); fetchSchedules(); }
    catch { toast('Устгахад алдаа гарлаа', 'error'); }
  };

  const totalCourses = new Set(schedules.map(s => s.courseId)).size;
  const totalCredits = [...new Set(schedules.map(s => s.courseId))]
    .reduce((sum, cid) => sum + (courses.find(c => c.id === cid)?.credits || 0), 0);
  const busyDays = new Set(schedules.map(s => s.dayOfWeek)).size;

  return (
    <>
      <style>{CSS}</style>
      <div className="sched-root">

        <div className="sched-header">
          <div className="sched-title">
            <h1>Хичээлийн хуваарь</h1>
            <div className="subtitle">// Academic Schedule · {semFilter.label}</div>
          </div>
          <div className="sem-pills">
            {SEMESTERS_OPTIONS.map(s => (
              <button key={s.label} className={`sem-pill ${semFilter.label === s.label ? 'sem-pill-on' : 'sem-pill-off'}`}
                onClick={() => setSemFilter(s)}>{s.label}</button>
            ))}
          </div>
        </div>

        <div className="sched-stats">
          {[
            { val: totalCourses, lbl: 'Хичээл' },
            { val: totalCredits, lbl: 'Кредит' },
            { val: schedules.length, lbl: 'Цагийн слот' },
            { val: busyDays, lbl: 'Идэвхтэй өдөр' },
          ].map((s, i) => (
            <div className="stat-chip" key={i}>
              <span className="val">{s.val}</span>
              <span className="lbl">{s.lbl}</span>
            </div>
          ))}
        </div>

        {courses.length > 0 && schedules.length > 0 && (
          <div className="sched-legend">
            {[...new Set(schedules.map(s => s.courseId))].map(cid => {
              const c = courses.find(x => x.id === cid);
              if (!c) return null;
              const st = getCourseStyle(cid, courses);
              return (
                <div className="legend-tag" key={cid}>
                  <span className="legend-dot" style={{ background: st.bg }} />
                  <span style={{ color: '#94a3b8', fontFamily: 'DM Mono,monospace', letterSpacing: '0.04em' }}>{c.courseCode}</span>
                  <span style={{ color: '#64748b', fontSize: 10 }}>{c.name}</span>
                </div>
              );
            })}
          </div>
        )}

        <div className="grid-wrap">
          {loading ? (
            <div className="sched-loading">
              <div className="sched-spinner" />
              <div style={{ fontFamily: 'DM Mono,monospace', fontSize: 12, letterSpacing: '0.08em' }}>LOADING SCHEDULE...</div>
            </div>
          ) : (
            <>
              <table className="sched-table">
                <thead>
                  <tr>
                    <th className="th-time" />
                    {DAYS.map((d, di) => (
                      <th className="th-day" key={d}>
                        <div className="th-day-en">{DAY_EN[di]}</div>
                        <div className="th-day-mn">{d}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {HOURS.map((h, hi) => (
                    <tr key={h}>
                      <td className="td-time">
                        <div className="time-block">
                          <span className="time-period">{PERIOD_LABELS[hi]}</span>
                          <span className="time-start">{h}</span>
                          <span className="time-end">{END_TIMES[hi]}</span>
                        </div>
                      </td>
                      {DAYS.map((d, di) => {
                        const slot = gridMap[`${di}-${hi}`];
                        const st   = slot ? getCourseStyle(slot.courseId, courses) : null;
                        return (
                          <td className="td-cell" key={d}>
                            {slot ? (
                              <div className="slot-filled"
                                style={{ background: st.bg + '22', borderLeft: `3px solid ${st.bg}` }}
                                onClick={() => openEdit(slot)}>
                                <div className="slot-name" style={{ color: st.bg }}>{slot.course?.name}</div>
                                <div className="slot-meta">
                                  {slot.room    && <span className="slot-room"    style={{ color: st.bg + 'bb' }}>⬡ {slot.room}</span>}
                                  {slot.teacher && <span className="slot-teacher" style={{ color: st.bg + '88' }}>{slot.teacher.firstName} {slot.teacher.lastName}</span>}
                                </div>
                                {canEdit && (
                                  <button className="slot-del" onClick={e => handleDelete(slot.id, e)} title="Устгах">×</button>
                                )}
                              </div>
                            ) : (
                              <div className="slot-empty"
                                style={{ cursor: canEdit ? 'pointer' : 'default' }}
                                onClick={() => openAdd(di, hi)}>
                                {canEdit && <span className="slot-plus">+</span>}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              {schedules.length === 0 && (
                <div className="sched-empty">
                  <div style={{ fontFamily: 'DM Mono,monospace', fontSize: 13, letterSpacing: '0.06em', marginBottom: 8 }}>NO SCHEDULE DATA</div>
                  <div style={{ fontSize: 12 }}>{canEdit ? 'Хуваарь нэмэхийн тулд нүд дээр дарна уу' : 'Хуваарь байхгүй байна'}</div>
                </div>
              )}
            </>
          )}
        </div>

        {showModal && (
          <Modal
            title={editSlot ? 'ХУВААРЬ ЗАСАХ' : `ХУВААРЬ НЭМЭХ · ${DAYS[form.dayOfWeek]} · ${form.startTime}`}
            onClose={() => setShowModal(false)}
            size="md"
          >
            <div className="dark-inputs">
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {conflictWarn && <div className="conflict-warn">⚠ {conflictWarn}</div>}

                <div><label className="modal-lbl">Хичээл *</label>
                  <select className="input-field" value={form.courseId} onChange={e => handleCourseChange(e.target.value)} required>
                    <option value="">Хичээл сонгоно уу</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.name} ({c.courseCode}) — {c.credits}кр</option>)}
                  </select>
                </div>

                <div><label className="modal-lbl">Багш</label>
                  <select className="input-field" value={form.teacherId} onChange={e => setForm(f => ({ ...f, teacherId: e.target.value }))}>
                    <option value="">Багш сонгоно уу</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>)}
                  </select>
                </div>

                <div className="modal-grid3">
                  <div><label className="modal-lbl">Гараг *</label>
                    <select className="input-field" value={form.dayOfWeek}
                      onChange={e => { const dw = parseInt(e.target.value); setForm(f => ({ ...f, dayOfWeek: dw })); setConflictWarn(checkConflict(form.courseId, dw, form.startTime, editSlot)); }}>
                      {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
                    </select>
                  </div>
                  <div><label className="modal-lbl">Эхлэх цаг *</label>
                    <select className="input-field" value={form.startTime} onChange={e => handleStartChange(e.target.value)}>
                      {HOURS.map((h, i) => <option key={h} value={h}>{h} – {END_TIMES[i]}</option>)}
                    </select>
                  </div>
                  <div><label className="modal-lbl">Дуусах цаг</label>
                    <input className="input-field" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} placeholder="09:40" />
                  </div>
                </div>

                <div><label className="modal-lbl">Анги өрөө</label>
                  <div className="rooms-wrap">
                    {ROOMS.map(r => (
                      <button type="button" key={r} className={`room-btn ${form.room === r ? 'room-on' : 'room-off'}`}
                        onClick={() => setForm(f => ({ ...f, room: r }))}>{r}</button>
                    ))}
                  </div>
                  <input className="input-field" value={form.room} onChange={e => setForm(f => ({ ...f, room: e.target.value }))} placeholder="Өрөөний дугаар оруулах..." />
                </div>

                <div className="sem-info"><span>SEMESTER:</span><strong>{semFilter.label}</strong></div>

                {/* Teacher mode: show note field + info banner */}
                {!isAdmin && (
                  <>
                    <div style={{ background:'#001a2044', border:'1px solid #00d4ff22', borderRadius:6, padding:'8px 12px', fontSize:11, color:'#00d4ff88', fontFamily:'DM Mono,monospace' }}>
                      ℹ Та хүсэлт илгээх бөгөөд админ батлахаас хойш хуваарь өөрчлөгдөнө
                    </div>
                    <div>
                      <label className="modal-lbl">Тайлбар / Шалтгаан</label>
                      <textarea className="input-field" rows={2} value={form.note || ''} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="Яагаад өөрчлөх гэж байна вэ?" style={{ resize:'vertical' }} />
                    </div>
                  </>
                )}

                <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
                  <button type="submit" disabled={submitting} className="btn-primary" style={{ flex: 1 }}>
                    {submitting ? 'Илгээж байна...' : isAdmin ? (editSlot ? 'Шинэчлэх' : 'Нэмэх') : '📨 Хүсэлт илгээх'}
                  </button>
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary" style={{ flex: 1 }}>Болих</button>
                </div>
              </form>
            </div>
          </Modal>
        )}
      </div>
    </>
  );
}
