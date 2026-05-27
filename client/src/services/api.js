import axios from 'axios';
import { getAuth } from 'firebase/auth';

// Create central axios instance
export const api = axios.create({
  baseURL: import.meta.env.VITE_FUNCTIONS_URL || 'http://localhost:5001/api', // Fallback for local dev if env missing
});

// --- REQUEST INTERCEPTOR ---
api.interceptors.request.use(async (config) => {
  const auth = getAuth();
  if (auth.currentUser) {
    try {
      const token = await auth.currentUser.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    } catch (error) {
      console.error("Error getting auth token", error);
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// --- RESPONSE INTERCEPTOR ---
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response) {
      const status = error.response.status;
      
      if (status === 401) {
        // Unauthorized - Invalid or expired token
        const auth = getAuth();
        try {
          await auth.signOut();
        } catch (e) {
          console.error("Error signing out", e);
        }
        window.location.href = '/login';
      } 
      else if (status === 403) {
        // Forbidden - Insufficient role permissions
        window.location.href = '/unauthorized';
      } 
      else if (status >= 500) {
        // Server Error - Global toast dispatch
        window.dispatchEvent(new CustomEvent('global-toast', {
          detail: { 
            type: 'error', 
            message: error.response.data?.message || 'Internal Server Error. Please try again.' 
          }
        }));
      }
    }
    return Promise.reject(error);
  }
);

// ==========================================
// API ENDPOINTS
// ==========================================

// --- Auth ---
export const registerUser = (data) => api.post('/auth/register', data);
export const getMe = () => api.get('/auth/me');
export const setRole = (uid, role) => api.post('/auth/set-role', { uid, role });

// --- Employees ---
export const getEmployees = () => api.get('/employees');
export const getEmployee = (uid) => api.get(`/employees/${uid}`);
export const updateEmployee = (uid, data) => api.put(`/employees/${uid}`, data);
export const deactivateEmployee = (uid) => api.delete(`/employees/${uid}`);
export const getEmployeeSummary = (uid) => api.get(`/employees/${uid}/summary`);

// --- Attendance ---
export const checkIn = () => api.post('/attendance/checkin');
export const checkOut = () => api.post('/attendance/checkout');
export const getMyAttendance = (month, year) => api.get('/attendance/my', { params: { month, year } });
export const getTeamAttendance = (month, year, dept) => api.get('/attendance/team', { params: { month, year, dept } });
export const getAttendanceStats = (uid, month, year) => api.get(`/attendance/stats/${uid}`, { params: { month, year } });

// --- Leaves ---
export const applyLeave = (data) => api.post('/leaves/apply', data);
export const getMyLeaves = () => api.get('/leaves/my');
export const getPendingLeaves = () => api.get('/leaves/pending');
export const approveLeave = (id) => api.put(`/leaves/${id}/approve`);
export const rejectLeave = (id, reason) => api.put(`/leaves/${id}/reject`, { reason });
export const getLeaveBalance = (uid) => api.get(`/leaves/balance/${uid}`);

// --- Payroll ---
export const getAllPayroll = (month, year) => api.get('/payroll/all', { params: { month, year } });
export const getMyPayroll = () => api.get('/payroll/my');
export const generatePayroll = (uid) => api.post(`/payroll/generate/${uid}`);
export const markPaid = (id) => api.put(`/payroll/${id}/mark-paid`);

// --- Performance ---
export const getPerformance = (uid) => api.get(`/performance/${uid}`);
export const calculatePerformance = (uid, taskScore) => api.post(`/performance/calculate/${uid}`, { taskScore });
export const getAIReview = (uid) => api.post(`/performance/ai-review/${uid}`);
export const publishReview = (id, finalReview) => api.put(`/performance/${id}/publish`, { finalReview });

// --- Interns ---
export const getInterns = () => api.get('/interns');
export const createIntern = (data) => api.post('/interns', data);
export const updateInternStage = (id, stage) => api.put(`/interns/${id}/stage`, { stage });
export const updateIntern = (id, data) => api.put(`/interns/${id}`, data);
export const deleteIntern = (id) => api.delete(`/interns/${id}`);

// --- AI ---
export const composeEmail = (data) => api.post('/ai/compose-email', data);
export const nlSearch = (query, employeeData) => api.post('/ai/nl-search', { query, employeeData });
export const getOrgHealthInsight = (stats) => api.post('/ai/org-health-insight', stats);

// --- Recognitions ---
export const sendRecognition = (data) => api.post('/recognitions', data);
export const getLeaderboard = (month, year) => api.get('/recognitions/leaderboard', { params: { month, year } });
export const getMyRecognitions = () => api.get('/recognitions/my');

// --- Org Health ---
export const getOrgHealth = () => api.get('/org-health/current');
export const calculateOrgHealth = () => api.post('/org-health/calculate');
