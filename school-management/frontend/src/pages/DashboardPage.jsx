import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { SkeletonCard } from '../components/Skeleton';

const COLORS = ['#00d4ff', '#6bcb77', '#ffd93d', '#ff6b6b', '#c77dff'];
const ROLE_CFG = {
  ADMIN: { color: '#c77dff', bg: 'rgba(199,125,255,0.1)', border: 'rgba(199,125,255,0.2)' },
  TEACHER: { color: '#00d4ff', bg: 'rgba(0,212,255,0.08)', border: 'rgba(0,212,255,0.2)' },
  STUDENT: { color: '#6bcb77', bg: 'rgba(107,203,119,0.08)', border: 'rgba(107,203,119,0.2)' },
};

const StatCard = ({ label, value, icon, accentColor, delay = 0 }) => (
  <div className="animate-fade-in" style={{ animationDelay: `${delay}s` }}>
    <div style={{
      background: '#141c2e', borderRadius: 16, padding: '18px 20px',
      border: '1px solid rgba(255,255,255,0.06)',
      boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', gap: 14,
      transition: 'all 0.18s', cursor: 'default',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = accentColor + '40'; e.currentTarget.style.boxShadow = `0 0 24px ${accentColor}18`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.4)'; e.currentTarget.style.transform = ''; }}
    >
      <div style={{ width: 44, height: 44, borderRadius: 12, background: `${accentColor}15`, border: `1px solid ${accentColor}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'DM Mono',monospace" }}>{label}</div>
        <div style={{ fontSize: 28, fontWeight: 800, color: '#e8eaf0', marginTop: 2, letterSpacing: '-0.03em' }}>{value}</div>
      </div>
    </div>
  </div>
);

const DarkTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) return (
    <div style={{ background: '#1a2338', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', fontFamily: "'DM Mono',monospace", textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 800, color: '#00d4ff' }}>{payload[0].value} оюутан</div>
    </div>
  );
  return null;
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ students: 0, teachers: 0, courses: 0, grades: 0, enrollments: 0 });
  const [gradeData, setGradeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const cfg = ROLE_CFG[user?.role] || ROLE_CFG.STUDENT;

  useEffect(() => {
    (async () => {
      try {
        const [s, t, c, g, e] = await Promise.all([api.get('/students?limit=1'), api.get('/teachers?limit=1'), api.get('/courses?limit=1'), api.get('/grades'), api.get('/enrollments')]);
        setStats({ students: s.data.meta?.total || 0, teachers: t.data.meta?.total || 0, courses: c.data.meta?.total || 0, grades: g.data.total || 0, enrollments: e.data.total || 0 });
        const grades = g.data.data || [], dist = { A: 0, B: 0, C: 0, D: 0, F: 0 };
        grades.forEach(gr => { if (dist[gr.grade] !== undefined) dist[gr.grade]++; });
        setGradeData(Object.entries(dist).map(([name, value]) => ({ name, value })));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return (
    <div style={{ padding: 28 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(190px,1fr))', gap: 14, marginBottom: 24 }}>
        {[...Array(5)].map((_, i) => <SkeletonCard key={i} />)}
      </div>
    </div>
  );

  const chartAxisStyle = { fontSize: 11, fill: 'rgba(255,255,255,0.3)', fontFamily: "'DM Mono',monospace" };

  return (
    <div style={{ padding: '28px 28px 40px', minHeight: '100vh', background: '#0a0e1a' }}>

      {/* Header */}
      <div className="animate-slide-down" style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#e8eaf0', margin: 0, letterSpacing: '-0.02em' }}>Dashboard</h1>
            <p style={{ margin: '6px 0 0', fontSize: 12, fontFamily: "'DM Mono',monospace", color: 'rgba(255,255,255,0.35)' }}>
              // Сайн байна уу, <span style={{ color: cfg.color, fontWeight: 700 }}>{user?.email}</span>
              {' '}<span style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, borderRadius: 999, fontSize: 10, padding: '1px 8px', fontWeight: 800 }}>{user?.role}</span>
            </p>
          </div>
          <div style={{ background: '#141c2e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '8px 14px', textAlign: 'left' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', fontFamily: "'DM Mono',monospace", textTransform: 'uppercase', letterSpacing: '0.06em' }}>Нийт тоймлол</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>Өнөөдрийн байдлаар</div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(190px,1fr))', gap: 14, marginBottom: 20 }}>
        <StatCard label="Сурагчид" value={stats.students} icon="👨‍🎓" accentColor="#00d4ff" delay={0.05} />
        <StatCard label="Багш нар" value={stats.teachers} icon="👩‍🏫" accentColor="#c77dff" delay={0.10} />
        <StatCard label="Хичээлүүд" value={stats.courses} icon="📚" accentColor="#6bcb77" delay={0.15} />
        <StatCard label="Дүнгүүд" value={stats.grades} icon="📊" accentColor="#ffd93d" delay={0.20} />
        <StatCard label="Бүртгэлүүд" value={stats.enrollments} icon="📋" accentColor="#ff6b6b" delay={0.25} />
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        {[
          {
            title: 'Дүнгийн тархалт', delay: '0.3s', content: gradeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={gradeData} barCategoryGap="32%">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" tick={chartAxisStyle} axisLine={false} tickLine={false} />
                  <YAxis tick={chartAxisStyle} axisLine={false} tickLine={false} width={28} />
                  <Tooltip content={<DarkTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {gradeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 13, padding: '48px 0' }}>Дүн байхгүй</p>
          },
          {
            title: 'Дүнгийн хуваарь', delay: '0.35s', content: gradeData.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height={210}>
                <PieChart>
                  <Pie data={gradeData.filter(d => d.value > 0)} cx="50%" cy="48%" innerRadius={52} outerRadius={84} paddingAngle={3} dataKey="value">
                    {gradeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1a2338', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#e8eaf0', fontSize: 12 }} formatter={(v, n) => [v, `Дүн ${n}`]} />
                  <Legend formatter={v => <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontFamily: "'DM Mono',monospace" }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            ) : <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 13, padding: '48px 0' }}>Өгөгдөл байхгүй</p>
          },
        ].map((item, i) => (
          <div key={i} className="animate-fade-in" style={{ animationDelay: item.delay, background: '#141c2e', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)', padding: '20px 20px 12px', boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16, fontFamily: "'DM Mono',monospace" }}>{item.title}</div>
            {item.content}
          </div>
        ))}
      </div>
    </div>
  );
}
