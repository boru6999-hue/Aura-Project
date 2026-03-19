import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { ToastProvider } from './components/Toast'
import Layout from './components/Layout'
import LoginPage              from './pages/LoginPage'
import DashboardPage          from './pages/DashboardPage'
import StudentsPage           from './pages/StudentsPage'
import TeachersPage           from './pages/TeachersPage'
import CoursesPage            from './pages/CoursesPage'
import GradesPage             from './pages/GradesPage'
import AttendancePage         from './pages/AttendancePage'
import EnrollmentsPage        from './pages/EnrollmentsPage'
import SchedulePage           from './pages/SchedulePage'
import ScheduleRequestsPage   from './pages/ScheduleRequestsPage'
import MyRequestsPage         from './pages/MyRequestsPage'
import StudentDashboard       from './pages/StudentDashboard'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'var(--bg-page)' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontFamily:'Barlow Condensed,sans-serif', fontWeight:900, fontSize:32, color:'var(--text-main)', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:12 }}>AURA</div>
        <div style={{ width:32, height:2, background:'var(--blue)', margin:'0 auto' }} />
      </div>
    </div>
  )
  return user ? children : <Navigate to="/login" replace />
}

function RoleRoute({ children, roles }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />
  return children
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={user?.role === 'STUDENT' ? <Navigate to="/my" replace /> : <DashboardPage />} />
        <Route path="my"               element={<RoleRoute roles={['STUDENT']}><StudentDashboard /></RoleRoute>} />
        <Route path="students"         element={<RoleRoute roles={['ADMIN','TEACHER']}><StudentsPage /></RoleRoute>} />
        <Route path="teachers"         element={<RoleRoute roles={['ADMIN']}><TeachersPage /></RoleRoute>} />
        <Route path="courses"          element={<CoursesPage />} />
        <Route path="grades"           element={<GradesPage />} />
        <Route path="attendance"       element={<AttendancePage />} />
        <Route path="enrollments"      element={<EnrollmentsPage />} />
        <Route path="schedule"         element={<SchedulePage />} />
        <Route path="schedule-requests" element={<RoleRoute roles={['ADMIN']}><ScheduleRequestsPage /></RoleRoute>} />
        <Route path="my-requests"      element={<RoleRoute roles={['TEACHER']}><MyRequestsPage /></RoleRoute>} />
        <Route path="*"                element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
