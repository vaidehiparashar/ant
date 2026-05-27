import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Bell, Clock, Calendar } from 'lucide-react';
import Card from '../../components/ui/Card';
import { useAuthStore } from '../../store/authStore';
import { useEmployeeStore } from '../../store/employeeStore';
import { useAttendanceStore } from '../../store/attendanceStore';
import { useLeaveStore } from '../../store/leaveStore';
import { useInternStore } from '../../store/internStore';



export default function HRDashboard() {
  const user = useAuthStore((state) => state.user);
  
  const { employees, loading: empLoading, error: empErr, fetchEmployees } = useEmployeeStore();
  const { teamAttendance, loading: attLoading, error: attErr, fetchTeamAttendance } = useAttendanceStore();
  const { pendingLeaves, loading: leaveLoading, error: leaveErr, fetchPendingLeaves } = useLeaveStore();
  const { interns, loading: intLoading, error: intErr, fetchInterns } = useInternStore();

  useEffect(() => {
    fetchEmployees();
    fetchTeamAttendance(new Date().getMonth() + 1, new Date().getFullYear(), 'All');
    fetchPendingLeaves();
    fetchInterns();
  }, [fetchEmployees, fetchTeamAttendance, fetchPendingLeaves, fetchInterns]);

  const isLoading = empLoading || attLoading || leaveLoading || intLoading;
  const error = empErr || attErr || leaveErr || intErr;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-[#1E1E2E] rounded-lg animate-pulse mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-6 h-28 animate-pulse">
              <div className="h-4 w-24 bg-[#1E1E2E] rounded mb-4"></div>
              <div className="h-8 w-16 bg-[#1E1E2E] rounded"></div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {[1,2].map(i => (
            <div key={i} className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-6 h-64 animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-4 text-red-500">
        <AlertCircle size={24} />
        <p>Failed to load dashboard data. Please refresh.</p>
      </div>
    );
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const absentToday = teamAttendance.filter(a => a.date === todayStr && a.status === 'absent').length;

  // Notification bell logic
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Compute anomalies
  const attendanceAnomalies = teamAttendance.filter(a => a.date === todayStr && a.status === 'absent');
  const totalNotifications = pendingLeaves.length + attendanceAnomalies.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between relative">
        <h1 className="text-3xl font-display text-primary">HR Dashboard</h1>
        
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 bg-surface border border-border rounded-full hover:border-primary transition-colors relative"
          >
            <Bell className="w-5 h-5 text-text-muted hover:text-white transition-colors" />
            {totalNotifications > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">
                {totalNotifications}
              </span>
            )}
          </button>
          
          <AnimatePresence>
            {showNotifications && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-2 w-80 bg-surface border border-border shadow-2xl rounded-xl overflow-hidden z-50 flex flex-col max-h-96"
              >
                <div className="p-4 border-b border-border font-medium text-white flex items-center justify-between">
                  <span>Notifications</span>
                  <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">{totalNotifications} New</span>
                </div>
                
                <div className="overflow-y-auto custom-scrollbar p-2">
                  {totalNotifications === 0 ? (
                    <div className="p-4 text-center text-sm text-text-muted">No new notifications.</div>
                  ) : (
                    <>
                      {pendingLeaves.length > 0 && (
                        <div className="mb-2">
                          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 px-2">Pending Leaves ({pendingLeaves.length})</h4>
                          {pendingLeaves.map(leave => (
                            <div key={leave.id} className="p-2 hover:bg-background rounded-lg cursor-pointer transition-colors flex items-start gap-3">
                              <div className="p-2 rounded-full bg-warning/10 text-warning mt-0.5"><Calendar className="w-4 h-4" /></div>
                              <div>
                                <p className="text-sm font-medium text-white">{leave.employeeName}</p>
                                <p className="text-xs text-text-muted">{leave.type} leave • {leave.startDate} to {leave.endDate}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {attendanceAnomalies.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 px-2">Attendance Anomalies ({attendanceAnomalies.length})</h4>
                          {attendanceAnomalies.map(att => (
                            <div key={att.id} className="p-2 hover:bg-background rounded-lg cursor-pointer transition-colors flex items-start gap-3">
                              <div className="p-2 rounded-full bg-danger/10 text-danger mt-0.5"><AlertCircle className="w-4 h-4" /></div>
                              <div>
                                <p className="text-sm font-medium text-white">{att.employeeName}</p>
                                <p className="text-xs text-text-muted">Absent without prior leave notice today.</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <h3 className="text-text-muted text-sm font-medium">Total Employees</h3>
          <p className="text-3xl mt-2 font-display text-text-primary">{employees.length}</p>
        </Card>
        <Card>
          <h3 className="text-text-muted text-sm font-medium">Pending Leaves</h3>
          <p className="text-3xl mt-2 font-display text-warning">{pendingLeaves.length}</p>
        </Card>
        <Card>
          <h3 className="text-text-muted text-sm font-medium">Absent Today</h3>
          <p className="text-3xl mt-2 font-display text-danger">{absentToday}</p>
        </Card>
        <Card>
          <h3 className="text-text-muted text-sm font-medium">Intern Pipeline</h3>
          <p className="text-3xl mt-2 font-display text-secondary">{interns.length}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <Card>
          <h2 className="text-lg font-medium mb-4">Quick Actions</h2>
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => window.location.href = '/hr/compose'}
              className="text-left px-4 py-2 bg-surface border border-border rounded-md hover:border-primary hover:text-primary transition-colors"
            >
              Compose AI Email
            </button>
            <button className="text-left px-4 py-2 bg-surface border border-border rounded-md hover:border-primary hover:text-primary transition-colors">
              Generate Performance Review
            </button>
            <button className="text-left px-4 py-2 bg-surface border border-border rounded-md hover:border-primary hover:text-primary transition-colors">
              Process Payroll
            </button>
          </div>
        </Card>
        <Card 
          className="cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => window.location.href = '/hr/org-health'}
        >
          <h2 className="text-lg font-medium mb-4">Org Health Insight</h2>
          <div className="p-4 bg-background border border-border rounded-lg">
            <p className="text-text-muted text-sm leading-relaxed">
              <span className="font-medium text-text-primary">AI Insight:</span> Attendance is stable at 94% this week. We noticed a 10% increase in sick leaves among the engineering team. Intern conversion is on track for Q3 targets.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
