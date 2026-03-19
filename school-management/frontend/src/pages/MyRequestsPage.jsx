import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useToast } from '../components/Toast';

const DAYS = ['Даваа', 'Мягмар', 'Лхагва', 'Пүрэв', 'Баасан', 'Бямба', 'Ням'];

const STATUS_CONFIG = {
  PENDING:  { label: 'Хүлээгдэж байна', bg:'#fef3c722', color:'#f59e0b', border:'#f59e0b44' },
  APPROVED: { label: 'Батлагдсан',       bg:'#d1fae522', color:'#10b981', border:'#10b98144' },
  REJECTED: { label: 'Татгалзсан',       bg:'#fee2e222', color:'#ef4444', border:'#ef444444' },
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap');
  .mr-root { font-family:'Syne',sans-serif; background:#0a0e1a; min-height:100vh; padding:28px 24px; color:#e8eaf0; }
  .mr-header { margin-bottom:28px; }
  .mr-header h1 { font-size:26px; font-weight:800; color:#fff; margin:0; }
  .mr-header .subtitle { font-family:'DM Mono',monospace; font-size:11px; color:#00d4ff; margin-top:6px; letter-spacing:0.08em; }
  .filter-tabs { display:flex; gap:6px; margin-bottom:24px; flex-wrap:wrap; }
  .filter-tab { padding:7px 16px; border-radius:4px; font-size:12px; font-weight:700; cursor:pointer; border:1.5px solid; transition:all 0.15s; font-family:'DM Mono',monospace; }
  .tab-on  { background:#00d4ff; color:#001a20; border-color:#00d4ff; }
  .tab-off { background:transparent; color:#556; border-color:#1e2535; }
  .tab-off:hover { border-color:#00d4ff44; color:#00d4ff88; }
  .req-list { display:flex; flex-direction:column; gap:10px; }
  .req-card { background:#111827; border:1px solid #1e2a3a; border-radius:12px; padding:18px 20px; display:flex; flex-direction:column; gap:12px; }
  .req-top { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; flex-wrap:wrap; }
  .course-tag { display:inline-flex; gap:6px; align-items:center; background:#00d4ff11; border:1px solid #00d4ff33; border-radius:5px; padding:4px 10px; }
  .course-code { font-family:'DM Mono',monospace; font-size:11px; font-weight:700; color:#00d4ff; }
  .course-name { font-size:11px; color:#64748b; }
  .status-pill { padding:4px 12px; border-radius:4px; font-size:11px; font-weight:700; font-family:'DM Mono',monospace; letter-spacing:0.05em; }
  .slots-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
  .slot-box { background:#0d1120; border:1px solid #1a2236; border-radius:8px; padding:12px 14px; }
  .slot-lbl { font-family:'DM Mono',monospace; font-size:9px; color:#4a5568; letter-spacing:0.1em; text-transform:uppercase; margin-bottom:6px; }
  .slot-row { display:flex; align-items:center; gap:6px; margin-top:4px; }
  .slot-val { font-size:12px; font-weight:600; color:#cbd5e1; font-family:'DM Mono',monospace; }
  .note-box { background:#0d1120; border:1px solid #1a2236; border-left:3px solid #f59e0b; border-radius:6px; padding:10px 14px; font-size:12px; color:#94a3b8; }
  .admin-note { background:#0d1120; border:1px solid #1a2236; border-left:3px solid #00d4ff; border-radius:6px; padding:10px 14px; font-size:12px; color:#94a3b8; }
  .meta { font-family:'DM Mono',monospace; font-size:10px; color:#2a3a4a; }
  .btn-cancel { background:transparent; color:#ef4444; border:1.5px solid #ef444433; border-radius:6px; padding:6px 14px; font-size:12px; font-weight:700; cursor:pointer; transition:all 0.15s; }
  .btn-cancel:hover { background:#ef444411; border-color:#ef4444; }
  .empty { text-align:center; padding:80px 0; color:#2a3a4a; font-family:'DM Mono',monospace; font-size:12px; letter-spacing:0.08em; }
`;

export default function MyRequestsPage() {
  const { show: toast } = useToast();
  const [requests, setRequests] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('ALL');

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/schedule-requests');
      setRequests(res.data.data || []);
    } catch { toast('Хүсэлтүүд ачааллахад алдаа гарлаа', 'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleCancel = async (id) => {
    if (!confirm('Хүсэлтийг цуцлах уу?')) return;
    try {
      await api.delete(`/schedule-requests/${id}`);
      toast('Хүсэлт цуцлагдлаа', 'info');
      fetchRequests();
    } catch (err) { toast(err.response?.data?.error || 'Алдаа гарлаа', 'error'); }
  };

  const FILTERS = [
    { key: 'ALL',      label: 'Бүгд' },
    { key: 'PENDING',  label: 'Хүлээгдэж байна' },
    { key: 'APPROVED', label: 'Батлагдсан' },
    { key: 'REJECTED', label: 'Татгалзсан' },
  ];

  const filtered = filter === 'ALL' ? requests : requests.filter(r => r.status === filter);
  const pendingCount = requests.filter(r => r.status === 'PENDING').length;

  return (
    <>
      <style>{CSS}</style>
      <div className="mr-root">
        <div className="mr-header">
          <h1>Миний хүсэлтүүд</h1>
          <div className="subtitle">// My Schedule Requests · {pendingCount} хүлээгдэж байна</div>
        </div>

        <div className="filter-tabs">
          {FILTERS.map(f => (
            <button key={f.key} className={`filter-tab ${filter === f.key ? 'tab-on' : 'tab-off'}`}
              onClick={() => setFilter(f.key)}>{f.label}</button>
          ))}
        </div>

        {loading ? (
          <div className="empty">
            <div style={{ width:28,height:28,border:'2px solid #1e2a3a',borderTopColor:'#00d4ff',borderRadius:'50%',animation:'spin 0.8s linear infinite',margin:'0 auto 12px' }} />
            LOADING...
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty">📋 ХҮСЭЛТ БАЙХГҮЙ</div>
        ) : (
          <div className="req-list">
            {filtered.map(req => {
              const st = STATUS_CONFIG[req.status] || STATUS_CONFIG.PENDING;
              return (
                <div className="req-card" key={req.id} style={{ borderColor: req.status === 'PENDING' ? '#f59e0b22' : req.status === 'APPROVED' ? '#10b98122' : '#1e2a3a' }}>
                  <div className="req-top">
                    <div className="course-tag">
                      <span className="course-code">{req.course?.courseCode}</span>
                      <span className="course-name">{req.course?.name}</span>
                    </div>
                    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                      <span className="status-pill" style={{ background: st.bg, color: st.color, border:`1px solid ${st.border}` }}>{st.label}</span>
                      <span className="meta">{new Date(req.createdAt).toLocaleDateString('mn-MN')}</span>
                    </div>
                  </div>

                  <div className="slots-grid">
                    {req.oldStartTime && (
                      <div className="slot-box">
                        <div className="slot-lbl">⬅ Одоогийн</div>
                        <div className="slot-row"><span style={{ fontSize:11, color:'#4a5568', width:14 }}>📅</span><span className="slot-val">{DAYS[req.oldDayOfWeek]}</span></div>
                        <div className="slot-row"><span style={{ fontSize:11, color:'#4a5568', width:14 }}>⏰</span><span className="slot-val">{req.oldStartTime} – {req.oldEndTime}</span></div>
                        {req.oldRoom && <div className="slot-row"><span style={{ fontSize:11, color:'#4a5568', width:14 }}>🚪</span><span className="slot-val">{req.oldRoom}</span></div>}
                      </div>
                    )}
                    <div className="slot-box" style={{ borderColor:'#00d4ff33' }}>
                      <div className="slot-lbl" style={{ color:'#00d4ff' }}>➡ Хүссэн цаг</div>
                      <div className="slot-row"><span style={{ fontSize:11, color:'#4a5568', width:14 }}>📅</span><span className="slot-val" style={{ color:'#00d4ff' }}>{DAYS[req.dayOfWeek]}</span></div>
                      <div className="slot-row"><span style={{ fontSize:11, color:'#4a5568', width:14 }}>⏰</span><span className="slot-val" style={{ color:'#00d4ff' }}>{req.startTime} – {req.endTime}</span></div>
                      {req.room && <div className="slot-row"><span style={{ fontSize:11, color:'#4a5568', width:14 }}>🚪</span><span className="slot-val" style={{ color:'#00d4ff' }}>{req.room}</span></div>}
                      <div className="slot-row"><span style={{ fontSize:11, color:'#4a5568', width:14 }}>📚</span><span className="slot-val">{req.semester} {req.year}</span></div>
                    </div>
                  </div>

                  {req.note && <div className="note-box">💬 {req.note}</div>}
                  {req.adminNote && <div className="admin-note">🔷 Админ: {req.adminNote}</div>}
                  {req.reviewedAt && <div className="meta">Шийдвэрлэсэн: {new Date(req.reviewedAt).toLocaleString('mn-MN')}</div>}

                  {req.status === 'PENDING' && (
                    <div>
                      <button className="btn-cancel" onClick={() => handleCancel(req.id)}>✕ Цуцлах</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
