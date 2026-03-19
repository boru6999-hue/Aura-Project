import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import StudentDashboard from './pages/StudentDashboard';
import StudentsPage from './pages/StudentsPage';
import TeachersPage from './pages/TeachersPage';
import CoursesPage from './pages/CoursesPage';
import GradesPage from './pages/GradesPage';
import AttendancePage from './pages/AttendancePage';
import EnrollmentsPage from './pages/EnrollmentsPage';
import SchedulePage from './pages/SchedulePage';
import ScheduleRequestsPage from './pages/ScheduleRequestsPage';
import MyRequestsPage from './pages/MyRequestsPage';

const RoleRoute = ({ children, roles }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  return children;
};

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#f8fafc' }}>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:16 }}>
        <div style={{ width:48,height:48,borderRadius:14,background:'linear-gradient(135deg,#6366f1,#4338ca)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:800,fontSize:20 }}>S</div>
        <div style={{ width:24,height:24,border:'3px solid #e0e7ff',borderTop:'3px solid #6366f1',borderRadius:'50%',animation:'spin 0.8s linear infinite' }} />
      </div>
    </div>
  );
  return user ? children : <Navigate to="/login" />;
};

function SmartDashboard() {
  const { user } = useAuth();
  if (user?.role === 'STUDENT') return <Navigate to="/my" replace />;
  return <DashboardPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
              <Route index element={<SmartDashboard />} />
              <Route path="students"    element={<RoleRoute roles={['ADMIN','TEACHER']}><StudentsPage /></RoleRoute>} />
              <Route path="teachers"    element={<RoleRoute roles={['ADMIN']}><TeachersPage /></RoleRoute>} />
              <Route path="enrollments" element={<RoleRoute roles={['ADMIN','TEACHER']}><EnrollmentsPage /></RoleRoute>} />
              <Route path="grades"      element={<RoleRoute roles={['ADMIN','TEACHER']}><GradesPage /></RoleRoute>} />
              <Route path="attendance"  element={<RoleRoute roles={['ADMIN','TEACHER']}><AttendancePage /></RoleRoute>} />
              <Route path="courses"     element={<RoleRoute roles={['ADMIN','TEACHER']}><CoursesPage /></RoleRoute>} />
              <Route path="schedule"    element={<RoleRoute roles={['ADMIN','TEACHER']}><SchedulePage /></RoleRoute>} />
              <Route path="schedule-requests" element={<RoleRoute roles={['ADMIN']}><ScheduleRequestsPage /></RoleRoute>} />
              <Route path="my-requests" element={<RoleRoute roles={['TEACHER']}><MyRequestsPage /></RoleRoute>} />
              <Route path="my"          element={<RoleRoute roles={['STUDENT']}><StudentDashboard /></RoleRoute>} />
            </Route>
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
