import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { 
  ShieldAlert, Download, Filter, Search, 
  ChevronDown, ChevronRight, Activity, Cpu, 
  UserX, Database, FileText
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { format, parseISO, subDays, isSameDay, isAfter, isBefore } from 'date-fns';

// --- HELPER HOOK FOR COUNT UP ---
function CountUp({ end, durationMs = 1500 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      let start = 0;
      const increment = end / (durationMs / 16); 
      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          clearInterval(timer);
          setCount(end);
        } else setCount(start);
      }, 16);
      return () => clearInterval(timer);
    }
  }, [end, isInView, durationMs]);

  return <span ref={ref}>{count.toFixed(0)}</span>;
}

// --- MOCK DATA GENERATION ---
const MOCK_USERS = [
  { name: 'Admin Supremo', role: 'admin', avatar: 'https://i.pravatar.cc/150?u=a1' },
  { name: 'Charlie Day', role: 'hr', avatar: 'https://i.pravatar.cc/150?u=a2' },
  { name: 'Alice Smith', role: 'employee', avatar: 'https://i.pravatar.cc/150?u=1' },
];

const ACTIONS = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'EXPORT', 'AI_CALL'];
const MODULES = ['Employees', 'Payroll', 'Attendance', 'Interns', 'AI', 'Auth'];

const generateMockLogs = () => {
  const logs = [];
  const now = new Date();
  
  // Generate 200 random logs over last 30 days
  for (let i = 0; i < 200; i++) {
    const action = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
    const moduleName = MODULES[Math.floor(Math.random() * MODULES.length)];
    const user = MOCK_USERS[Math.floor(Math.random() * MOCK_USERS.length)];
    const date = subDays(now, Math.floor(Math.random() * 30));
    date.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));

    let desc = `Performed ${action} in ${moduleName} module`;
    let payload = null;

    if (action === 'UPDATE') {
      desc = `Updated employee profile settings`;
      payload = { before: { status: 'active', department: 'Sales' }, after: { status: 'inactive', department: 'Sales' } };
    } else if (action === 'AI_CALL') {
      desc = `Requested Claude API generation`;
      payload = { endpoint: '/api/ai/performance-review', tokensUsed: 432, latencyMs: 1205 };
    } else if (action === 'EXPORT') {
      desc = `Exported CSV payroll report`;
      payload = { rowsExported: 142, filtersApplied: { month: 'May', year: '2026' } };
    } else if (action === 'LOGIN' && Math.random() > 0.8) {
      desc = `Failed login attempt`;
      payload = { reason: 'Invalid credentials', attemptsRemaining: 2 };
    }

    logs.push({
      id: `log_${i}`,
      timestamp: date.toISOString(),
      user,
      action,
      module: moduleName,
      description: desc,
      ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      payload
    });
  }
  
  // Sort newest first
  return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
};

const MOCK_LOGS = generateMockLogs();

const generateChartData = (logs) => {
  const days = [];
  for (let i = 29; i >= 0; i--) {
    const d = subDays(new Date(), i);
    const dayData = { date: format(d, 'MMM dd'), CREATE: 0, UPDATE: 0, DELETE: 0, LOGIN: 0, EXPORT: 0, AI_CALL: 0 };
    
    logs.forEach(log => {
      if (isSameDay(parseISO(log.timestamp), d)) {
        dayData[log.action]++;
      }
    });
    days.push(dayData);
  }
  return days;
};

const CHART_DATA = generateChartData(MOCK_LOGS);

// --- HELPER COMPONENTS ---
const RoleBadge = ({ role }) => {
  switch(role) {
    case 'admin': return <span className="bg-purple-500/20 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded text-[10px] font-sans font-bold uppercase tracking-widest">Admin</span>;
    case 'hr': return <span className="bg-[#6366F1]/20 text-[#6366F1] border border-[#6366F1]/30 px-2 py-0.5 rounded text-[10px] font-sans font-bold uppercase tracking-widest">HR</span>;
    default: return <span className="bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30 px-2 py-0.5 rounded text-[10px] font-sans font-bold uppercase tracking-widest">Emp</span>;
  }
};

const ActionBadge = ({ action }) => {
  switch(action) {
    case 'CREATE': return <span className="bg-[#10B981]/20 text-[#10B981] px-2 py-1 rounded text-xs font-sans font-bold tracking-widest flex w-max border border-[#10B981]/30">CREATE</span>;
    case 'UPDATE': return <span className="bg-[#6366F1]/20 text-[#6366F1] px-2 py-1 rounded text-xs font-sans font-bold tracking-widest flex w-max border border-[#6366F1]/30">UPDATE</span>;
    case 'DELETE': return <span className="bg-[#EF4444]/20 text-[#EF4444] px-2 py-1 rounded text-xs font-sans font-bold tracking-widest flex w-max border border-[#EF4444]/30">DELETE</span>;
    case 'LOGIN': return <span className="bg-gray-500/20 text-gray-400 px-2 py-1 rounded text-xs font-sans font-bold tracking-widest flex w-max border border-gray-500/30">LOGIN</span>;
    case 'EXPORT': return <span className="bg-[#F59E0B]/20 text-[#F59E0B] px-2 py-1 rounded text-xs font-sans font-bold tracking-widest flex w-max border border-[#F59E0B]/30">EXPORT</span>;
    case 'AI_CALL': return <span className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded text-xs font-sans font-bold tracking-widest flex w-max border border-purple-500/30">AI_CALL</span>;
    default: return null;
  }
};

// --- MAIN PAGE COMPONENT ---
export default function AuditLog() {
  const [logs, setLogs] = useState(MOCK_LOGS);
  
  // Filters
  const [actionFilter, setActionFilter] = useState('all');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [expandedRows, setExpandedRows] = useState({});

  // Stats Derived
  const stats = useMemo(() => {
    let todayActions = 0, aiCalls = 0, failedLogins = 0, exports = 0;
    MOCK_LOGS.forEach(l => {
      if (isSameDay(parseISO(l.timestamp), new Date())) todayActions++;
      if (l.action === 'AI_CALL') aiCalls++;
      if (l.action === 'EXPORT') exports++;
      if (l.action === 'LOGIN' && l.description.includes('Failed')) failedLogins++;
    });
    return { todayActions, aiCalls, failedLogins, exports };
  }, []);

  // Filter Logic
  const filteredLogs = useMemo(() => {
    return logs.filter(l => {
      const matchAction = actionFilter === 'all' || l.action === actionFilter;
      const matchModule = moduleFilter === 'all' || l.module === moduleFilter;
      const matchUser = userFilter === 'all' || l.user.name === userFilter;
      
      let matchDate = true;
      if (dateFrom) matchDate = matchDate && isAfter(parseISO(l.timestamp), new Date(dateFrom));
      if (dateTo) {
        const toEnd = new Date(dateTo);
        toEnd.setHours(23, 59, 59);
        matchDate = matchDate && isBefore(parseISO(l.timestamp), toEnd);
      }
      
      return matchAction && matchModule && matchUser && matchDate;
    });
  }, [logs, actionFilter, moduleFilter, userFilter, dateFrom, dateTo]);

  const toggleRow = (id) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleExport = () => {
    const csv = "Timestamp,User,Action,Module,Description,IP\\n" + 
      filteredLogs.map(l => `${l.timestamp},${l.user.name},${l.action},${l.module},${l.description},${l.ip}`).join("\\n");
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'audit_log_export.csv';
    a.click();
  };

  // Unique users and modules for dropdowns
  const uniqueUsers = [...new Set(MOCK_LOGS.map(l => l.user.name))];

  // Framer Motion Variants
  const containerVars = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
  const itemVars = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white p-6 md:p-10 font-sans overflow-x-hidden">
      
      {/* HEADER */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-8">
        <div>
          <h1 className="text-[32px] font-serif tracking-wide leading-tight flex items-center gap-3">
            <ShieldAlert className="text-[#EF4444]" size={32} />
            System Audit Log
          </h1>
          <p className="text-gray-400 text-sm mt-1">Immutable record of all critical system actions and data mutations.</p>
        </div>
        
        <button 
          onClick={handleExport}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#1E1E2E] hover:bg-[#2A2A35] text-white rounded-lg transition-colors font-medium text-sm border border-gray-700"
        >
          <Download size={18} className="text-[#10B981]" />
          Export Log CSV
        </button>
      </div>

      {/* STATS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-5 shadow-lg flex items-center justify-between">
          <div><p className="text-xs text-gray-400 uppercase font-bold mb-1">Actions Today</p><p className="text-3xl font-serif text-white"><CountUp end={stats.todayActions} /></p></div>
          <Activity size={24} className="text-[#6366F1] opacity-50" />
        </div>
        <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-5 shadow-lg flex items-center justify-between">
          <div><p className="text-xs text-gray-400 uppercase font-bold mb-1">AI Calls (Month)</p><p className="text-3xl font-serif text-white"><CountUp end={stats.aiCalls} /></p></div>
          <Cpu size={24} className="text-purple-500 opacity-50" />
        </div>
        <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-5 shadow-lg flex items-center justify-between">
          <div><p className="text-xs text-gray-400 uppercase font-bold mb-1">Failed Logins</p><p className="text-3xl font-serif text-[#EF4444]"><CountUp end={stats.failedLogins} /></p></div>
          <UserX size={24} className="text-[#EF4444] opacity-50" />
        </div>
        <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-5 shadow-lg flex items-center justify-between">
          <div><p className="text-xs text-gray-400 uppercase font-bold mb-1">Data Exports</p><p className="text-3xl font-serif text-white"><CountUp end={stats.exports} /></p></div>
          <Database size={24} className="text-[#F59E0B] opacity-50" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        
        {/* ACTIVITY CHART */}
        <div className="lg:col-span-2 bg-[#111118] border border-[#1E1E2E] rounded-xl p-6 shadow-xl h-[300px] flex flex-col">
          <h3 className="text-lg font-serif text-white mb-4">Activity Volume (30 Days)</h3>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={CHART_DATA} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E1E2E" vertical={false} />
                <XAxis dataKey="date" stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{fill: '#1E1E2E', opacity: 0.4}}
                  contentStyle={{ backgroundColor: '#0A0A0F', border: '1px solid #1E1E2E', borderRadius: '8px', fontSize: '12px' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                <Bar dataKey="CREATE" stackId="a" fill="#10B981" />
                <Bar dataKey="UPDATE" stackId="a" fill="#6366F1" />
                <Bar dataKey="DELETE" stackId="a" fill="#EF4444" />
                <Bar dataKey="AI_CALL" stackId="a" fill="#A855F7" />
                <Bar dataKey="EXPORT" stackId="a" fill="#F59E0B" />
                <Bar dataKey="LOGIN" stackId="a" fill="#6B7280" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* FILTERS PANEL */}
        <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-6 shadow-xl flex flex-col gap-4">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-2">
            <Filter size={16} /> Filters
          </h3>
          
          <div className="space-y-1">
            <label className="text-[10px] uppercase text-gray-500">Date Range</label>
            <div className="flex items-center gap-2">
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-1/2 bg-[#0A0A0F] border border-[#1E1E2E] rounded px-2 py-1.5 text-xs text-white [color-scheme:dark]" />
              <span className="text-gray-500">-</span>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-1/2 bg-[#0A0A0F] border border-[#1E1E2E] rounded px-2 py-1.5 text-xs text-white [color-scheme:dark]" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase text-gray-500">Action Type</label>
            <select value={actionFilter} onChange={e => setActionFilter(e.target.value)} className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded px-3 py-2 text-sm text-white">
              <option value="all">All Actions</option>
              {ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase text-gray-500">Module</label>
            <select value={moduleFilter} onChange={e => setModuleFilter(e.target.value)} className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded px-3 py-2 text-sm text-white">
              <option value="all">All Modules</option>
              {MODULES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase text-gray-500">User</label>
            <select value={userFilter} onChange={e => setUserFilter(e.target.value)} className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded px-3 py-2 text-sm text-white">
              <option value="all">All Users</option>
              {uniqueUsers.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl overflow-hidden shadow-2xl mb-12">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#0A0A0F] border-b border-[#1E1E2E] text-gray-400 font-medium tracking-wide">
              <tr>
                <th className="px-6 py-4 w-10"></th>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Module</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4 text-right">IP Address</th>
              </tr>
            </thead>
            
            <AnimatePresence>
              {filteredLogs.length === 0 ? (
                <tbody>
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <FileText size={48} className="text-[#1E1E2E] mx-auto mb-4" />
                      <p className="text-gray-400">No logs found matching your filters.</p>
                    </td>
                  </tr>
                </tbody>
              ) : (
                <motion.tbody variants={containerVars} initial="hidden" animate="show" className="divide-y divide-[#1E1E2E]/50">
                  {filteredLogs.map(log => (
                    <React.Fragment key={log.id}>
                      <motion.tr variants={itemVars} className={`hover:bg-[#1E1E2E]/20 transition-colors cursor-pointer ${expandedRows[log.id] ? 'bg-[#1E1E2E]/10' : ''}`} onClick={() => toggleRow(log.id)}>
                        <td className="px-6 py-4">
                          <ChevronRight size={16} className={`text-gray-500 transition-transform ${expandedRows[log.id] ? 'rotate-90 text-[#6366F1]' : ''}`} />
                        </td>
                        <td className="px-6 py-4 font-mono text-gray-300 text-xs">{format(parseISO(log.timestamp), 'dd MMM yyyy HH:mm:ss')}</td>
                        <td className="px-6 py-4 flex items-center gap-3">
                          <img src={log.user.avatar} className="w-8 h-8 rounded-full border border-[#1E1E2E]" alt=""/>
                          <div>
                            <p className="font-medium text-white text-xs">{log.user.name}</p>
                            <div className="mt-0.5"><RoleBadge role={log.user.role} /></div>
                          </div>
                        </td>
                        <td className="px-6 py-4"><ActionBadge action={log.action} /></td>
                        <td className="px-6 py-4 text-gray-300 text-xs">{log.module}</td>
                        <td className="px-6 py-4 text-gray-400 text-xs truncate max-w-xs">{log.description}</td>
                        <td className="px-6 py-4 text-right font-mono text-gray-500 text-xs">{log.ip}</td>
                      </motion.tr>

                      {/* EXPANDED PAYLOAD ROW */}
                      <AnimatePresence>
                        {expandedRows[log.id] && (
                          <tr>
                            <td colSpan="7" className="bg-[#0A0A0F] border-b border-[#1E1E2E]">
                              <motion.div 
                                initial={{ height: 0, opacity: 0 }} 
                                animate={{ height: 'auto', opacity: 1 }} 
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="p-6 md:pl-20 border-l-2 border-[#6366F1] ml-6 my-4 bg-[#111118]/50 rounded-r-xl">
                                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Event Payload Data</h4>
                                  {log.payload ? (
                                    <pre className="bg-[#0A0A0F] p-4 rounded-lg border border-[#1E1E2E] overflow-x-auto text-[11px] font-mono text-gray-300">
                                      {JSON.stringify(log.payload, null, 2)}
                                    </pre>
                                  ) : (
                                    <p className="text-sm text-gray-600 italic font-mono">{"{ no_payload_recorded: true }"}</p>
                                  )}
                                </div>
                              </motion.div>
                            </td>
                          </tr>
                        )}
                      </AnimatePresence>
                    </React.Fragment>
                  ))}
                </motion.tbody>
              )}
            </AnimatePresence>
          </table>
        </div>
      </div>

    </div>
  );
}
