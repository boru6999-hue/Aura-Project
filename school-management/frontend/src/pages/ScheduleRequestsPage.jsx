import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';

const DAYS = ['Даваа', 'Мягмар', 'Лхагва', 'Пүрэв', 'Баасан', 'Бямба', 'Ням'];

const STATUS_CONFIG = {
  PENDING:  { label: 'Хүлээгдэж байна', bg: '#fef3c7', color: '#d97706', dot: '#f59e0b' },
  APPROVED: { label: 'Батлагдсан',       bg: '#d1fae5', color: '#065f46', dot: '#10b981' },
  REJECTED: { label: 'Татгалзсан',       bg: '#fee2e2', color: '#7f1d1d', dot: '#ef4444' },
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap');

  .req-root { font-family:'Syne',sans-serif; background:#0a0e1a; min-height:100vh; padding:28px 24px; color:#e8eaf0; }
  .req-header { display:flex; align-items:flex-start; justify-content:space-between; flex-wrap:wrap; gap:16px; margin-bottom:28px; }
  .req-header h1 { font-size:26px; font-weight:800; color:#fff; margin:0; letter-spacing:-0.5px; }
  .req-header .subtitle { font-family:'DM Mono',monospace; font-size:11px; color:#00d4ff; margin-top:6px; letter-spacing:0.08em; }

  .filter-tabs { display:flex; gap:6px; flex-wrap:wrap; }
  .filter-tab { padding:7px 16px; border-radius:4px; font-size:12px; font-weight:700; cursor:pointer; border:1.5px solid; transition:all 0.15s; font-family:'DM Mono',monospace; }
  .filter-tab-on  { background:#00d4ff; color:#001a20; border-color:#00d4ff; box-shadow:0 0 12px rgba(0,212,255,0.35); }
  .filter-tab-off { background:transparent; color:#556; border-color:#1e2535; }
  .filter-tab-off:hover { border-color:#00d4ff44; color:#00d4ff88; }

  .badge-pending  { background:#fef3c744; color:#f59e0b; border:1px solid #f59e0b44; }
  .badge-approved { background:#d1fae544; color:#10b981; border:1px solid #10b98144; }
  .badge-rejected { background:#fee2e244; color:#ef4444; border:1px solid #ef444444; }

  .req-list { display:flex; flex-direction:column; gap:10px; }

  .req-card {
    background:#111827; border:1px solid #1e2a3a; border-radius:12px; padding:18px 20px;
    display:flex; flex-direction:column; gap:12px; transition:border-color 0.15s;
  }
  .req-card:hover { border-color:#00d4ff33; }
  .req-card-top { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; flex-wrap:wrap; }
  .req-teacher { display:flex; align-items:center; gap:10px; }
  .req-avatar {
    width:38px; height:38px; border-radius:8px; background:linear-gradient(135deg,#6366f1,#4338ca);
    display:flex; align-items:center; justify-content:center; color:#fff; font-weight:800; font-size:15px; flex-shrink:0;
  }
  .req-teacher-name { font-size:14px; font-weight:700; color:#e8eaf0; }
  .req-teacher-code { font-family:'DM Mono',monospace; font-size:10px; color:#4a5568; }

  .status-badge {
    padding:4px 12px; border-radius:4px; font-size:11px; font-weight:700;
    font-family:'DM Mono',monospace; letter-spacing:0.05em; flex-shrink:0;
  }

  .req-slots { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
  .slot-box { background:#0d1120; border:1px solid #1a2236; border-radius:8px; padding:12px 14px; }
  .slot-box-label { font-family:'DM Mono',monospace; font-size:9px; color:#4a5568; letter-spacing:0.1em; text-transform:uppercase; margin-bottom:6px; }
  .slot-row { display:flex; align-items:center; gap:6px; margin-top:4px; }
  .slot-icon { font-size:11px; color:#4a5568; width:14px; }
  .slot-val { font-size:12px; font-weight:600; color:#cbd5e1; font-family:'DM Mono',monospace; }

  .req-course-tag { display:inline-flex; align-items:center; gap:6px; background:#00d4ff11; border:1px solid #00d4ff33; border-radius:5px; padding:4px 10px; }
  .req-course-code { font-family:'DM Mono',monospace; font-size:11px; font-weight:700; color:#00d4ff; }
  .req-course-name { font-size:11px; color:#64748b; }

  .req-note { background:#0d1120; border:1px solid #1a2236; border-left:3px solid #f59e0b; border-radius:6px; padding:10px 14px; font-size:12px; color:#94a3b8; font-style:italic; }
  .req-admin-note { background:#0d1120; border:1px solid #1a2236; border-left:3px solid #00d4ff; border-radius:6px; padding:10px 14px; font-size:12px; color:#94a3b8; }
  .req-meta { font-family:'DM Mono',monospace; font-size:10px; color:#2a3a4a; }

  .req-actions { display:flex; gap:8px; }
  .btn-approve { background:#10b981; color:#fff; border:none; border-radius:6px; padding:8px 18px; font-size:12px; font-weight:700; cursor:pointer; font-family:'Syne',sans-serif; transition:all 0.15s; }
  .btn-approve:hover { background:#059669; box-shadow:0 0 12px rgba(16,185,129,0.4); }
  .btn-reject  { background:transparent; color:#ef4444; border:1.5px solid #ef444444; border-radius:6px; padding:8px 18px; font-size:12px; font-weight:700; cursor:pointer; font-family:'Syne',sans-serif; transition:all 0.15s; }
  .btn-reject:hover { background:#ef444411; border-color:#ef4444; }

  .empty-state { text-align:center; padding:80px 0; }
  .empty-icon { font-size:40px; margin-bottom:12px; }
  .empty-title { font-family:'DM Mono',monospace; font-size:13px; color:#2a3a4a; letter-spacing:0.08em; }

  .stats-row { display:flex; gap:10px; margin-bottom:24px; flex-wrap:wrap; }
  .stat-mini { background:#111827; border:1px solid #1e2a3a; border-radius:8px; padding:10px 16px; display:flex; gap:10px; align-items:center; }
  .stat-mini-val { font-family:'DM Mono',monospace; font-size:20px; font-weight:800; }
  .stat-mini-lbl { font-size:10px; color:#4a5568; text-transform:uppercase; letter-spacing:0.08em; }

  .dark-modal .modal-lbl { display:block; font-size:11px; font-weight:700; color:#00d4ff; margin-bottom:6px; text-transform:uppercase; letter-spacing:0.08em; font-family:'DM Mono',monospace; }
  .dark-modal .input-field { background:#111827 !important; border-color:#1e2a3a !important; color:#e8eaf0 !important; }
  .dark-modal .input-field:focus { border-color:#00d4ff !important; }
`;

export default function ScheduleRequestsPage() {
  const { show: toast } = useToast();
  const [requests,    setRequests]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [filter,      setFilter]      = useState('PENDING');
  const [reviewModal, setReviewModal] = useState(null); // { req, action: 'approve'|'reject' }
  const [adminNote,   setAdminNote]   = useState('');
  const [submitting,  setSubmitting]  = useState(false);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/schedule-requests', { params: filter !== 'ALL' ? { status: filter } : {} });
      setRequests(res.data.data || []);
    } catch { toast('Хүсэлтүүд ачааллахад алдаа гарлаа', 'error'); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleReview = async () => {
    if (!reviewModal) return;
    setSubmitting(true);
    try {
      const endpoint = reviewModal.action === 'approve' ? 'approve' : 'reject';
      await api.put(`/schedule-requests/${reviewModal.req.id}/${endpoint}`, { adminNote });
      toast(reviewModal.action === 'approve' ? 'Хүсэлт батлагдлаа!' : 'Хүсэлт татгалзагдлаа', 
            reviewModal.action === 'approve' ? 'success' : 'info');
      setReviewModal(null);
      setAdminNote('');
      fetchRequests();
    } catch (err) {
      toast(err.response?.data?.error || 'Алдаа гарлаа', 'error');
    } finally { setSubmitting(false); }
  };

  const counts = {
    PENDING:  requests.filter ? 0 : 0, // will refetch per filter
    ALL: requests.length,
  };

  const FILTERS = [
    { key: 'PENDING',  label: 'Хүлээгдэж байна' },
    { key: 'APPROVED', label: 'Батлагдсан' },
    { key: 'REJECTED', label: 'Татгалзсан' },
    { key: 'ALL',      label: 'Бүгд' },
  ];

  return (
    <>
      <style>{CSS}</style>
      <div className="req-root">

        <div className="req-header">
          <div>
            <h1>Хуваарийн хүсэлтүүд</h1>
            <div className="subtitle">// Schedule Change Requests · Admin Review</div>
          </div>
          <div className="filter-tabs">
            {FILTERS.map(f => (
              <button key={f.key} className={`filter-tab ${filter === f.key ? 'filter-tab-on' : 'filter-tab-off'}`}
                onClick={() => setFilter(f.key)}>{f.label}</button>
            ))}
          </div>
        </div>

        <div className="stats-row">
          {[
            { val: requests.length, lbl: filter === 'ALL' ? 'Нийт' : FILTERS.find(f=>f.key===filter)?.label, color: '#00d4ff' },
          ].map((s, i) => (
            <div className="stat-mini" key={i}>
              <div>
                <div className="stat-mini-val" style={{ color: s.color }}>{s.val}</div>
                <div className="stat-mini-lbl">{s.lbl}</div>
              </div>
            </div>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign:'center', padding:'80px 0', fontFamily:'DM Mono,monospace', color:'#2a3a4a', fontSize:12, letterSpacing:'0.08em' }}>
            <div style={{ width:28,height:28,border:'2px solid #1e2a3a',borderTopColor:'#00d4ff',borderRadius:'50%',animation:'spin 0.8s linear infinite',margin:'0 auto 12px' }} />
            LOADING...
          </div>
        ) : requests.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <div className="empty-title">NO REQUESTS FOUND</div>
          </div>
        ) : (
          <div className="req-list">
            {requests.map(req => {
              const st = STATUS_CONFIG[req.status] || STATUS_CONFIG.PENDING;
              return (
                <div className="req-card" key={req.id}>
                  <div className="req-card-top">
                    <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
                      <div className="req-teacher">
                        <div className="req-avatar">{req.teacher?.firstName?.[0] || 'T'}</div>
                        <div>
                          <div className="req-teacher-name">{req.teacher?.firstName} {req.teacher?.lastName}</div>
                          <div className="req-teacher-code">{req.teacher?.teacherCode}</div>
                        </div>
                      </div>
                      <div className="req-course-tag">
                        <span className="req-course-code">{req.course?.courseCode}</span>
                        <span className="req-course-name">{req.course?.name}</span>
                      </div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <span className={`status-badge badge-${req.status.toLowerCase()}`}>{st.label}</span>
                      <span className="req-meta">{new Date(req.createdAt).toLocaleDateString('mn-MN')}</span>
                    </div>
                  </div>

                  <div className="req-slots">
                    {/* Current / From */}
                    {req.oldStartTime && (
                      <div className="slot-box">
                        <div className="slot-box-label">⬅ Одоогийн цаг</div>
                        <div className="slot-row"><span className="slot-icon">📅</span><span className="slot-val">{DAYS[req.oldDayOfWeek]}</span></div>
                        <div className="slot-row"><span className="slot-icon">⏰</span><span className="slot-val">{req.oldStartTime} – {req.oldEndTime}</span></div>
                        {req.oldRoom && <div className="slot-row"><span className="slot-icon">🚪</span><span className="slot-val">{req.oldRoom}</span></div>}
                      </div>
                    )}
                    {/* Proposed / To */}
                    <div className="slot-box" style={{ borderColor:'#00d4ff33' }}>
                      <div className="slot-box-label" style={{ color:'#00d4ff' }}>{req.oldStartTime ? '➡ Шинэ цаг' : '✦ Шинэ слот'}</div>
                      <div className="slot-row"><span className="slot-icon">📅</span><span className="slot-val" style={{ color:'#00d4ff' }}>{DAYS[req.dayOfWeek]}</span></div>
                      <div className="slot-row"><span className="slot-icon">⏰</span><span className="slot-val" style={{ color:'#00d4ff' }}>{req.startTime} – {req.endTime}</span></div>
                      {req.room && <div className="slot-row"><span className="slot-icon">🚪</span><span className="slot-val" style={{ color:'#00d4ff' }}>{req.room}</span></div>}
                      <div className="slot-row"><span className="slot-icon">📚</span><span className="slot-val">{req.semester} {req.year}</span></div>
                    </div>
                  </div>

                  {req.note && (
                    <div className="req-note">💬 {req.note}</div>
                  )}
                  {req.adminNote && (
                    <div className="req-admin-note">🔷 Админ: {req.adminNote}</div>
                  )}
                  {req.reviewedAt && (
                    <div className="req-meta">Шийдвэрлэсэн: {new Date(req.reviewedAt).toLocaleString('mn-MN')}</div>
                  )}

                  {req.status === 'PENDING' && (
                    <div className="req-actions">
                      <button className="btn-approve" onClick={() => { setReviewModal({ req, action: 'approve' }); setAdminNote(''); }}>
                        ✓ Батлах
                      </button>
                      <button className="btn-reject" onClick={() => { setReviewModal({ req, action: 'reject' }); setAdminNote(''); }}>
                        ✕ Татгалзах
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {reviewModal && (
          <Modal
            title={reviewModal.action === 'approve' ? 'ХҮСЭЛТ БАТЛАХ' : 'ХҮСЭЛТ ТАТГАЛЗАХ'}
            onClose={() => setReviewModal(null)}
            size="sm"
          >
            <div className="dark-modal" style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div style={{ background:'#0d1120', border:'1px solid #1a2236', borderRadius:8, padding:'12px 14px', fontSize:13, color:'#94a3b8' }}>
                <strong style={{ color:'#e8eaf0' }}>{reviewModal.req.teacher?.firstName} {reviewModal.req.teacher?.lastName}</strong> —{' '}
                {reviewModal.req.course?.name} · {DAYS[reviewModal.req.dayOfWeek]} {reviewModal.req.startTime}
              </div>
              <div>
                <label className="modal-lbl">Тайлбар (заавал биш)</label>
                <textarea
                  className="input-field"
                  rows={3}
                  value={adminNote}
                  onChange={e => setAdminNote(e.target.value)}
                  placeholder={reviewModal.action === 'approve' ? 'Батлах тайлбар...' : 'Татгалзах шалтгаан...'}
                  style={{ resize:'vertical' }}
                />
              </div>
              <div style={{ display:'flex', gap:10 }}>
                {reviewModal.action === 'approve' ? (
                  <button className="btn-approve" style={{ flex:1, padding:'10px' }} onClick={handleReview} disabled={submitting}>
                    {submitting ? 'Батлаж байна...' : '✓ Батлах'}
                  </button>
                ) : (
                  <button className="btn-reject" style={{ flex:1, padding:'10px' }} onClick={handleReview} disabled={submitting}>
                    {submitting ? 'Татгалзаж байна...' : '✕ Татгалзах'}
                  </button>
                )}
                <button className="btn-secondary" style={{ flex:1 }} onClick={() => setReviewModal(null)}>Болих</button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </>
  );
}
