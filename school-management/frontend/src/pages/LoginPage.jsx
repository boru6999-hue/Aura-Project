import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const demos = [
  { role: 'admin',   email: 'admin@school.mn',    pwd: 'admin123',   label: 'Admin',   color: 'bg-violet-100 text-violet-700 hover:bg-violet-200' },
  { role: 'teacher', email: 'teacher1@school.mn', pwd: 'teacher123', label: 'Багш',    color: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
  { role: 'student', email: 'student1@school.mn', pwd: 'student123', label: 'Сурагч',  color: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Нэвтрэхэд алдаа гарлаа');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 flex-col justify-center items-center p-12 relative overflow-hidden">
        {/* Animated circles */}
        <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-white/5 animate-spin-slow" style={{ animationDuration: '20s' }} />
        <div className="absolute bottom-20 right-10 w-48 h-48 rounded-full bg-white/5 animate-spin-slow" style={{ animationDuration: '30s', animationDirection: 'reverse' }} />
        <div className="absolute top-1/3 right-1/4 w-20 h-20 rounded-full bg-white/10" />

        <div className="relative z-10 text-center animate-fade-in">
          <div className="w-20 h-20 bg-white/10 backdrop-blur rounded-3xl flex items-center justify-center text-4xl mb-6 mx-auto shadow-2xl border border-white/20">
            🏫
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">Сургуулийн систем</h2>
          <p className="text-indigo-200 text-base leading-relaxed max-w-xs">
            Сурагч, багш, хичээл, дүнгийн бүртгэлийн удирдлагын систем
          </p>

          <div className="mt-10 space-y-3 text-left">
            {['Сурагчийг хичээлд бүртгэх', 'Дүн, ирцийн мэдээлэл', 'JWT хамгаалалттай API'].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-indigo-100 animate-fade-in" style={{ animationDelay: `${0.3 + i * 0.1}s` }}>
                <span className="w-5 h-5 rounded-full bg-emerald-400 flex items-center justify-center text-xs text-white font-bold flex-shrink-0">✓</span>
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right login panel */}
      <div className="w-full lg:w-[420px] flex flex-col justify-center p-8 bg-white">
        <div className="max-w-sm mx-auto w-full space-y-8 animate-fade-in">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-md">
              S
            </div>
            <div>
              <h1 className="font-bold text-slate-900 text-lg">School Manager</h1>
              <p className="text-xs text-slate-400">Сургалтын удирдлагын систем</p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-900">Нэвтрэх</h2>
            <p className="text-slate-500 text-sm mt-1">Дансандаа нэвтэрнэ үү</p>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-2 animate-slide-down">
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">И-мэйл</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="input-field" placeholder="your@email.com" required autoFocus />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Нууц үг</label>
              <div className="relative">
                <input type={showPwd ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-field pr-10" placeholder="••••••••" required />
                <button type="button" onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors text-sm">
                  {showPwd ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full py-3 text-base flex items-center justify-center gap-2">
              {loading
                ? <><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Нэвтэрч байна...</>
                : 'Нэвтрэх →'}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-400 text-center mb-3 font-medium">Туршилтын данс</p>
            <div className="grid grid-cols-3 gap-2">
              {demos.map(d => (
                <button key={d.role} onClick={() => { setEmail(d.email); setPassword(d.pwd); }}
                  className={`text-xs py-2 px-3 rounded-xl font-semibold transition-all duration-150 active:scale-95 ${d.color}`}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
