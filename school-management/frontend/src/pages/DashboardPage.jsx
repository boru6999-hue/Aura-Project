import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { SkeletonCard } from '../components/Skeleton';

const StatCard = ({ label, value, icon, color, delay = 0 }) => (
  <div className={`card flex items-center gap-4 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 animate-fade-in`}
       style={{ animationDelay: `${delay}s` }}>
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${color} shadow-sm flex-shrink-0`}>{icon}</div>
    <div>
      <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">{label}</p>
      <p className="text-3xl font-bold text-slate-900 mt-0.5">{value}</p>
    </div>
  </div>
);

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-100 px-4 py-2 text-sm">
      <p className="font-semibold text-slate-700">{label}</p>
      <p className="text-indigo-600 font-bold">{payload[0].value} оюутан</p>
    </div>
  );
  return null;
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ students: 0, teachers: 0, courses: 0, grades: 0, enrollments: 0 });
  const [gradeData, setGradeData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [s, t, c, g, e] = await Promise.all([
          api.get('/students?limit=1'),
          api.get('/teachers?limit=1'),
          api.get('/courses?limit=1'),
          api.get('/grades'),
          api.get('/enrollments'),
        ]);
        setStats({
          students: s.data.meta?.total || 0,
          teachers: t.data.meta?.total || 0,
          courses: c.data.meta?.total || 0,
          grades: g.data.total || 0,
          enrollments: e.data.total || 0,
        });
        const grades = g.data.data || [];
        const dist = { A: 0, B: 0, C: 0, D: 0, F: 0 };
        grades.forEach(gr => { if (dist[gr.grade] !== undefined) dist[gr.grade]++; });
        setGradeData(Object.entries(dist).map(([name, value]) => ({ name, value })));
      } catch (err) {
        console.error(err);
      } finally { setLoading(false); }
    };
    fetchStats();
  }, []);

  if (loading) return (
    <div className="p-6 space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="animate-slide-down">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1 text-sm">
          Сайн байна уу, <span className="font-semibold text-indigo-600">{user?.email}</span>
          {' '}<span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
            user?.role === 'ADMIN' ? 'bg-violet-100 text-violet-700' :
            user?.role === 'TEACHER' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
          }`}>{user?.role}</span>
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Сурагчид"    value={stats.students}    icon="👨‍🎓" color="bg-blue-50"   delay={0.05} />
        <StatCard label="Багш нар"    value={stats.teachers}    icon="👩‍🏫" color="bg-violet-50" delay={0.10} />
        <StatCard label="Хичээлүүд"   value={stats.courses}     icon="📚"   color="bg-emerald-50" delay={0.15} />
        <StatCard label="Дүнгүүд"     value={stats.grades}      icon="📊"   color="bg-yellow-50" delay={0.20} />
        <StatCard label="Бүртгэлүүд"  value={stats.enrollments} icon="📋"   color="bg-rose-50"   delay={0.25} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Дүнгийн тархалт</h2>
          {gradeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={gradeData} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 13, fontWeight: 600, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {gradeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-slate-400 text-sm text-center py-14">Дүн байхгүй байна</p>}
        </div>

        <div className="card animate-fade-in" style={{ animationDelay: '0.35s' }}>
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Дүнгийн хуваарь</h2>
          {gradeData.some(d => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={230}>
              <PieChart>
                <Pie data={gradeData.filter(d => d.value > 0)} cx="50%" cy="50%"
                  innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                  {gradeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v, n) => [v, `Дүн ${n}`]} />
                <Legend formatter={v => <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-slate-400 text-sm text-center py-14">Өгөгдөл байхгүй</p>}
        </div>
      </div>

      {/* Info row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
        {[
          { icon: '🔑', label: 'Таны эрх', value: user?.role, color: 'bg-indigo-50 border-indigo-100' },
          { icon: '📧', label: 'И-мэйл', value: user?.email, color: 'bg-slate-50 border-slate-200' },
          { icon: '🏫', label: 'Систем', value: 'School Manager v2.0', color: 'bg-emerald-50 border-emerald-100' },
        ].map((item, i) => (
          <div key={i} className={`rounded-2xl border p-4 ${item.color}`}>
            <p className="text-lg mb-1">{item.icon}</p>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">{item.label}</p>
            <p className="font-bold text-slate-800 mt-0.5 truncate">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
