import React, { Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuthStore } from './store/authStore';
import { useUiStore } from './store/uiStore';
import { ROLES } from './constants';
import PageWrapper from './components/layout/PageWrapper';
import { Loader2 } from 'lucide-react';

// Lazy load components
const Login = React.lazy(() => import('./pages/auth/Login'));

// Admin
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard'));
const UserManagement = React.lazy(() => import('./pages/admin/UserManagement'));
const AuditLog = React.lazy(() => import('./pages/admin/AuditLog'));
const OrgSettings = React.lazy(() => import('./pages/admin/OrgSettings'));

// HR
const HRDashboard = React.lazy(() => import('./pages/hr/HRDashboard'));
const EmployeeList = React.lazy(() => import('./pages/hr/EmployeeList'));
const AttendanceGrid = React.lazy(() => import('./pages/hr/AttendanceGrid'));
const PayrollManager = React.lazy(() => import('./pages/hr/PayrollManager'));
const InternPipeline = React.lazy(() => import('./pages/hr/InternPipeline'));
const AICompose = React.lazy(() => import('./pages/hr/AICompose'));
const OrgHealth = React.lazy(() => import('./pages/hr/OrgHealth'));

// Employee
const EmployeeDashboard = React.lazy(() => import('./pages/employee/EmployeeDashboard'));
const MyAttendance = React.lazy(() => import('./pages/employee/MyAttendance'));
const MyLeaves = React.lazy(() => import('./pages/employee/MyLeaves'));
const MyPayslips = React.lazy(() => import('./pages/employee/MyPayslips'));
const MyPerformance = React.lazy(() => import('./pages/employee/MyPerformance'));
const Recognitions = React.lazy(() => import('./pages/employee/Recognitions'));

// Intern
const InternDashboard = React.lazy(() => import('./pages/intern/InternDashboard'));

// Global Loading Spinner Component
function LoadingSpinner() {
  return (
    <div className="flex h-full w-full min-h-[50vh] items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-[#6366F1]" />
    </div>
  );
}

// Global Toast Component
function Toast() {
  const { toast, hideToast } = useUiStore();
  
  useEffect(() => {
    if (toast.visible) {
      const timer = setTimeout(() => {
        hideToast();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.visible, hideToast]);

  return (
    <AnimatePresence>
      {toast.visible && (
        <motion.div
          initial={{ opacity: 0, y: 50, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: 50, x: '-50%' }}
          className={`fixed bottom-4 left-1/2 z-50 px-6 py-3 rounded-lg shadow-xl text-white font-medium ${
            toast.type === 'error' ? 'bg-red-500' : 
            toast.type === 'success' ? 'bg-emerald-500' : 'bg-indigo-500'
          }`}
        >
          {toast.text}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Framer Motion Page Transition Wrapper
function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="h-full"
    >
      {children}
    </motion.div>
  );
}

function ProtectedRoute({ children, allowedRoles }) {
  const { user, isLoading } = useAuthStore();

  if (isLoading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <PageWrapper>{children}</PageWrapper>;
}

// Animated Routes Component
function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<Suspense fallback={<LoadingSpinner />}><Login /></Suspense>} />
        
        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]}><PageTransition><Suspense fallback={<LoadingSpinner />}><AdminDashboard /></Suspense></PageTransition></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]}><PageTransition><Suspense fallback={<LoadingSpinner />}><UserManagement /></Suspense></PageTransition></ProtectedRoute>} />
        <Route path="/admin/audit" element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]}><PageTransition><Suspense fallback={<LoadingSpinner />}><AuditLog /></Suspense></PageTransition></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]}><PageTransition><Suspense fallback={<LoadingSpinner />}><OrgSettings /></Suspense></PageTransition></ProtectedRoute>} />

        {/* HR Routes */}
        <Route path="/hr/dashboard" element={<ProtectedRoute allowedRoles={[ROLES.HR]}><PageTransition><Suspense fallback={<LoadingSpinner />}><HRDashboard /></Suspense></PageTransition></ProtectedRoute>} />
        <Route path="/hr/employees" element={<ProtectedRoute allowedRoles={[ROLES.HR]}><PageTransition><Suspense fallback={<LoadingSpinner />}><EmployeeList /></Suspense></PageTransition></ProtectedRoute>} />
        <Route path="/hr/attendance" element={<ProtectedRoute allowedRoles={[ROLES.HR]}><PageTransition><Suspense fallback={<LoadingSpinner />}><AttendanceGrid /></Suspense></PageTransition></ProtectedRoute>} />
        <Route path="/hr/payroll" element={<ProtectedRoute allowedRoles={[ROLES.HR]}><PageTransition><Suspense fallback={<LoadingSpinner />}><PayrollManager /></Suspense></PageTransition></ProtectedRoute>} />
        <Route path="/hr/interns" element={<ProtectedRoute allowedRoles={[ROLES.HR]}><PageTransition><Suspense fallback={<LoadingSpinner />}><InternPipeline /></Suspense></PageTransition></ProtectedRoute>} />
        <Route path="/hr/ai-compose" element={<ProtectedRoute allowedRoles={[ROLES.HR]}><PageTransition><Suspense fallback={<LoadingSpinner />}><AICompose /></Suspense></PageTransition></ProtectedRoute>} />
        <Route path="/hr/org-health" element={<ProtectedRoute allowedRoles={[ROLES.HR]}><PageTransition><Suspense fallback={<LoadingSpinner />}><OrgHealth /></Suspense></PageTransition></ProtectedRoute>} />

        {/* Employee Routes */}
        <Route path="/employee/dashboard" element={<ProtectedRoute allowedRoles={[ROLES.EMPLOYEE]}><PageTransition><Suspense fallback={<LoadingSpinner />}><EmployeeDashboard /></Suspense></PageTransition></ProtectedRoute>} />
        <Route path="/employee/attendance" element={<ProtectedRoute allowedRoles={[ROLES.EMPLOYEE]}><PageTransition><Suspense fallback={<LoadingSpinner />}><MyAttendance /></Suspense></PageTransition></ProtectedRoute>} />
        <Route path="/employee/leaves" element={<ProtectedRoute allowedRoles={[ROLES.EMPLOYEE]}><PageTransition><Suspense fallback={<LoadingSpinner />}><MyLeaves /></Suspense></PageTransition></ProtectedRoute>} />
        <Route path="/employee/payslips" element={<ProtectedRoute allowedRoles={[ROLES.EMPLOYEE]}><PageTransition><Suspense fallback={<LoadingSpinner />}><MyPayslips /></Suspense></PageTransition></ProtectedRoute>} />
        <Route path="/employee/performance" element={<ProtectedRoute allowedRoles={[ROLES.EMPLOYEE]}><PageTransition><Suspense fallback={<LoadingSpinner />}><MyPerformance /></Suspense></PageTransition></ProtectedRoute>} />
        <Route path="/employee/recognitions" element={<ProtectedRoute allowedRoles={[ROLES.EMPLOYEE]}><PageTransition><Suspense fallback={<LoadingSpinner />}><Recognitions /></Suspense></PageTransition></ProtectedRoute>} />

        {/* Intern Routes */}
        <Route path="/intern/dashboard" element={<ProtectedRoute allowedRoles={[ROLES.INTERN]}><PageTransition><Suspense fallback={<LoadingSpinner />}><InternDashboard /></Suspense></PageTransition></ProtectedRoute>} />
        <Route path="/intern/status" element={<ProtectedRoute allowedRoles={[ROLES.INTERN]}><PageTransition><Suspense fallback={<LoadingSpinner />}><InternDashboard /></Suspense></PageTransition></ProtectedRoute>} />
        <Route path="/intern/goals" element={<ProtectedRoute allowedRoles={[ROLES.INTERN]}><PageTransition><Suspense fallback={<LoadingSpinner />}><InternDashboard /></Suspense></PageTransition></ProtectedRoute>} />
        <Route path="/intern/feedback" element={<ProtectedRoute allowedRoles={[ROLES.INTERN]}><PageTransition><Suspense fallback={<LoadingSpinner />}><InternDashboard /></Suspense></PageTransition></ProtectedRoute>} />

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/unauthorized" element={<div className="p-8 text-center text-danger bg-background min-h-screen">Unauthorized</div>} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
      <Toast />
    </BrowserRouter>
  );
}
