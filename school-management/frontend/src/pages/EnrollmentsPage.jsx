import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';
import { SkeletonTable } from '../components/Skeleton';

export default function EnrollmentsPage() {
  const { isAdmin, isTeacher } = useAuth();
  const { show: toast } = useToast();

  const [courses, setCourses]         = useState([]);
  const [students, setStudents]       = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading]         = useState(true);

  const [filterCourse, setFilterCourse]     = useState('');
  const [filterStudent, setFilterStudent]   = useState('');
  const [filterSemester, setFilterSemester] = useState('');

  const [showAssign, setShowAssign] = useState(false);
  const [assignForm, setAssignForm] = useState({
    mode: 'single',
    studentId: '',
    selectedStudentIds: [],
    courseId: '',
    semester: 'Spring',
    year: new Date().getFullYear(),
  });
  const [submitting, setSubmitting]   = useState(false);
  const [searchStudent, setSearchStudent] = useState('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterCourse)   params.courseId  = filterCourse;
      if (filterStudent)  params.studentId = filterStudent;
      if (filterSemester) params.semester  = filterSemester;

      const [eRes, cRes, sRes] = await Promise.all([
        api.get('/enrollments', { params }),
        api.get('/courses?limit=200'),
        api.get('/students?limit=200'),
      ]);
      setEnrollments(eRes.data.data);
      setCourses(cRes.data.data);
      setStudents(sRes.data.data);
    } catch {
      toast('Мэдээлэл ачаалж чадсангүй', 'error');
    } finally {
      setLoading(false);
    }
  }, [filterCourse, filterStudent, filterSemester]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const uniqueStudents = new Set(enrollments.map(e => e.studentId)).size;
  const uniqueCourses  = new Set(enrollments.map(e => e.courseId)).size;

  const handleAssign = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (assignForm.mode === 'bulk') {
        if (!assignForm.selectedStudentIds.length) {
          toast('Сурагч сонгоно уу', 'warning');
          setSubmitting(false);
          return;
        }
        const res = await api.post('/enrollments/bulk', {
          studentIds: assignForm.selectedStudentIds,
          courseId:   parseInt(assignForm.courseId),
          semester:   assignForm.semester,
          year:       parseInt(assignForm.year),
        });
        toast(res.data.message || `${assignForm.selectedStudentIds.length} сурагч бүртгэгдлээ 🎉`, 'success');
      } else {
        await api.post('/enrollments', {
          studentId: parseInt(assignForm.studentId),
          courseId:  parseInt(assignForm.courseId),
          semester:  assignForm.semester,
          year:      parseInt(assignForm.year),
        });
        toast('Сурагч хичээлд амжилттай бүртгэгдлээ ✅', 'success');
      }
      setShowAssign(false);
      fetchAll();
    } catch (err) {
      toast(err.response?.data?.error || 'Алдаа гарлаа', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnenroll = async (id, studentName, courseName) => {
    if (!confirm(`"${studentName}"-г "${courseName}" хичээлээс хасах уу?`)) return;
    try {
      await api.delete(`/enrollments/${id}`);
      toast('Сурагч хасагдлаа', 'info');
      fetchAll();
    } catch {
      toast('Хасахад алдаа гарлаа', 'error');
    }
  };

  const toggleStudent = (id) => {
    setAssignForm(f => ({
      ...f,
      selectedStudentIds: f.selectedStudentIds.includes(id)
        ? f.selectedStudentIds.filter(s => s !== id)
        : [...f.selectedStudentIds, id],
    }));
  };

  const filteredStudentsForModal = students.filter(s =>
    `${s.firstName} ${s.lastName} ${s.studentCode}`.toLowerCase().includes(searchStudent.toLowerCase())
  );

  const openAssign = () => {
    setAssignForm({ mode: 'single', studentId: '', selectedStudentIds: [], courseId: '', semester: 'Spring', year: new Date().getFullYear() });
    setSearchStudent('');
    setShowAssign(true);
  };

  return (
    <div style={{ padding:"28px", minHeight:"100vh", background:"#0a0e1a" }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Хичээлийн бүртгэл</h1>
          <p className="text-sm text-[rgba(255,255,255,0.35)] mt-0.5">Сурагчдыг хичээлд хуваарилах</p>
        </div>
        {(isAdmin || isTeacher) && (
          <button onClick={openAssign} className="btn-primary flex items-center gap-2">
            <span className="text-lg leading-none">＋</span> Бүртгэх
          </button>
        )}
      </div>

      {/* Stats — simple cards, no backdrop */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 text-center">
          <p className="text-3xl font-bold text-indigo-700">{enrollments.length}</p>
          <p className="text-xs font-semibold text-indigo-500 mt-1">Нийт бүртгэл</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-center">
          <p className="text-3xl font-bold text-emerald-700">{uniqueStudents}</p>
          <p className="text-xs font-semibold text-emerald-500 mt-1">Бүртгэлтэй сурагч</p>
        </div>
        <div className="bg-violet-50 border border-violet-100 rounded-2xl p-4 text-center">
          <p className="text-3xl font-bold text-violet-700">{uniqueCourses}</p>
          <p className="text-xs font-semibold text-violet-500 mt-1">Хамрагдсан хичээл</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#141c2e] border border-[rgba(255,255,255,0.08)] rounded-2xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select className="input-field text-sm" value={filterCourse} onChange={e => setFilterCourse(e.target.value)}>
            <option value="">Бүх хичээл</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className="input-field text-sm" value={filterStudent} onChange={e => setFilterStudent(e.target.value)}>
            <option value="">Бүх сурагч</option>
            {students.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}
          </select>
          <select className="input-field text-sm" value={filterSemester} onChange={e => setFilterSemester(e.target.value)}>
            <option value="">Бүх улирал</option>
            <option>Spring</option><option>Fall</option><option>Summer</option>
          </select>
        </div>
        {(filterCourse || filterStudent || filterSemester) && (
          <button
            onClick={() => { setFilterCourse(''); setFilterStudent(''); setFilterSemester(''); }}
            className="mt-2 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
          >
            ✕ Шүүлтүүр цэвэрлэх
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <SkeletonTable rows={6} cols={5} />
      ) : enrollments.length === 0 ? (
        <div className="bg-[#141c2e] border border-[rgba(255,255,255,0.08)] rounded-2xl flex flex-col items-center justify-center py-20">
          <span className="text-5xl mb-4">📋</span>
          <p className="text-[rgba(255,255,255,0.35)] font-medium">Бүртгэл олдсонгүй</p>
          {(isAdmin || isTeacher) && (
            <button onClick={openAssign} className="mt-4 btn-primary text-sm">＋ Анхны бүртгэл нэмэх</button>
          )}
        </div>
      ) : (
        <div className="bg-[#141c2e] border border-[rgba(255,255,255,0.08)] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#0a0e1a] border-b border-[rgba(255,255,255,0.08)]">
                <tr>
                  {['Сурагч', 'Код', 'Хичээл', 'Улирал', 'Он', 'Үйлдэл'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-[rgba(255,255,255,0.35)] uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {enrollments.map((e, i) => (
                  <tr key={e.id} className="hover:bg-[#0a0e1a] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold flex-shrink-0">
                          {e.student?.firstName?.[0]}{e.student?.lastName?.[0]}
                        </div>
                        <span className="font-medium text-[#e8eaf0]">{e.student?.firstName} {e.student?.lastName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg">{e.student?.studentCode}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-[rgba(255,255,255,0.7)]">{e.course?.name}</span>
                      <span className="ml-2 font-mono text-xs text-[rgba(255,255,255,0.25)]">{e.course?.courseCode}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                        {e.semester}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[rgba(255,255,255,0.35)] font-medium">{e.year}</td>
                    <td className="px-4 py-3">
                      {(isAdmin || isTeacher) && (
                        <button
                          onClick={() => handleUnenroll(e.id, `${e.student?.firstName} ${e.student?.lastName}`, e.course?.name)}
                          className="text-xs text-red-500 hover:text-red-700 font-semibold px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-all flex items-center gap-1"
                        >
                          ✕ Хасах
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {showAssign && (
        <Modal title="Хичээлд бүртгэх" onClose={() => setShowAssign(false)} size="lg">
          <form onSubmit={handleAssign} className="space-y-5">
            {/* Mode toggle */}
            <div className="flex rounded-xl border border-[rgba(255,255,255,0.08)] overflow-hidden">
              {[['single', '👤 Нэг сурагч'], ['bulk', '👥 Олон сурагч']].map(([mode, label]) => (
                <button key={mode} type="button"
                  onClick={() => setAssignForm(f => ({ ...f, mode, studentId: '', selectedStudentIds: [] }))}
                  className={`flex-1 py-2.5 text-sm font-semibold transition-all duration-200 ${
                    assignForm.mode === mode
                      ? 'bg-indigo-600 text-white'
                      : 'bg-[#141c2e] text-slate-600 hover:bg-[#0a0e1a]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Course */}
            <div>
              <label className="block text-sm font-semibold text-[rgba(255,255,255,0.7)] mb-1.5">Хичээл *</label>
              <select className="input-field" value={assignForm.courseId}
                onChange={e => setAssignForm(f => ({ ...f, courseId: e.target.value }))} required>
                <option value="">Хичээл сонгоно уу</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.courseCode}) — {c.credits} кредит</option>
                ))}
              </select>
            </div>

            {/* Single student */}
            {assignForm.mode === 'single' && (
              <div>
                <label className="block text-sm font-semibold text-[rgba(255,255,255,0.7)] mb-1.5">Сурагч *</label>
                <select className="input-field" value={assignForm.studentId}
                  onChange={e => setAssignForm(f => ({ ...f, studentId: e.target.value }))} required>
                  <option value="">Сурагч сонгоно уу</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.firstName} {s.lastName} — {s.studentCode}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Bulk student list */}
            {assignForm.mode === 'bulk' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-semibold text-[rgba(255,255,255,0.7)]">
                    Сурагчид *
                    {assignForm.selectedStudentIds.length > 0 && (
                      <span className="ml-2 text-xs font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">
                        {assignForm.selectedStudentIds.length} сонгогдсон
                      </span>
                    )}
                  </label>
                  <div className="flex gap-3 text-xs">
                    <button type="button"
                      onClick={() => setAssignForm(f => ({ ...f, selectedStudentIds: filteredStudentsForModal.map(s => s.id) }))}
                      className="text-indigo-600 hover:text-indigo-800 font-semibold">
                      Бүгдийг сонгох
                    </button>
                    {assignForm.selectedStudentIds.length > 0 && (
                      <button type="button"
                        onClick={() => setAssignForm(f => ({ ...f, selectedStudentIds: [] }))}
                        className="text-[rgba(255,255,255,0.25)] hover:text-red-500 font-semibold">
                        Цэвэрлэх
                      </button>
                    )}
                  </div>
                </div>

                <input type="text" placeholder="Нэрээр хайх..."
                  className="input-field mb-2 text-sm"
                  value={searchStudent}
                  onChange={e => setSearchStudent(e.target.value)} />

                <div className="border border-[rgba(255,255,255,0.08)] rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                  {filteredStudentsForModal.length === 0 ? (
                    <p className="text-center text-[rgba(255,255,255,0.25)] text-sm py-6">Сурагч олдсонгүй</p>
                  ) : filteredStudentsForModal.map(s => {
                    const selected = assignForm.selectedStudentIds.includes(s.id);
                    return (
                      <label key={s.id}
                        className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors border-b border-[rgba(255,255,255,0.05)] last:border-0
                          ${selected ? 'bg-indigo-50' : 'hover:bg-[#0a0e1a]'}`}
                      >
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0
                          ${selected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                          {selected && <span className="text-white text-xs font-bold">✓</span>}
                        </div>
                        <input type="checkbox" className="sr-only" checked={selected} onChange={() => toggleStudent(s.id)} />
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {s.firstName?.[0]}{s.lastName?.[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-slate-800 text-sm">{s.firstName} {s.lastName}</span>
                          <span className="ml-2 font-mono text-xs text-[rgba(255,255,255,0.25)]">{s.studentCode}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Semester + Year */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[rgba(255,255,255,0.7)] mb-1.5">Улирал *</label>
                <select className="input-field" value={assignForm.semester}
                  onChange={e => setAssignForm(f => ({ ...f, semester: e.target.value }))}>
                  <option>Spring</option><option>Fall</option><option>Summer</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[rgba(255,255,255,0.7)] mb-1.5">Жил *</label>
                <input type="number" className="input-field" value={assignForm.year}
                  onChange={e => setAssignForm(f => ({ ...f, year: e.target.value }))}
                  min="2020" max="2035" required />
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={submitting}
                className="btn-success flex-1 flex items-center justify-center gap-2">
                {submitting ? (
                  <><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Бүртгэж байна...</>
                ) : (
                  <>✓ {assignForm.mode === 'bulk' ? `${assignForm.selectedStudentIds.length || 0} сурагч бүртгэх` : 'Бүртгэх'}</>
                )}
              </button>
              <button type="button" onClick={() => setShowAssign(false)} className="btn-secondary flex-1">Болих</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
