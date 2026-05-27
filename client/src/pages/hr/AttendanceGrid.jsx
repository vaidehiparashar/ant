import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, ChevronRight, Search, Filter, Download, 
  Users, UserX, CalendarClock, Home
} from 'lucide-react';
import { 
  format, getDaysInMonth, addMonths, subMonths, 
  isWeekend, startOfMonth
} from 'date-fns';

import { useAttendanceStore } from '../../store';
// --- HELPER COMPONENTS ---
const StatCard = ({ title, value, icon: Icon, colorClass }) => (
  <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-5 flex items-center gap-4">
    <div className={`p-3 rounded-lg ${colorClass} bg-opacity-20 flex-shrink-0`}>
      <Icon size={24} className={colorClass.split(' ')[0].replace('text-', 'stroke-')} />
    </div>
    <div>
      <p className="text-sm text-gray-400 font-sans">{title}</p>
      <p className="text-2xl font-serif text-white">{value}</p>
    </div>
  </div>
);

const LegendBadge = ({ colorClass, label }) => (
  <div className="flex items-center gap-2">
    <div className={`w-3 h-3 rounded-sm ${colorClass}`} />
    <span className="text-xs text-gray-400 font-sans">{label}</span>
  </div>
);

export default function AttendanceGrid() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  
  const { teamAttendance, loading, error, fetchTeamAttendance } = useAttendanceStore();
  
  useEffect(() => {
    fetchTeamAttendance(currentDate.getMonth() + 1, currentDate.getFullYear(), deptFilter);
  }, [currentDate, deptFilter, fetchTeamAttendance]);

  // Use teamAttendance from API
  const baseData = teamAttendance || [];

  // Derived calendar info
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(currentDate);
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Filters
  const filteredData = useMemo(() => {
    return baseData.filter(emp => {
      const matchesSearch = emp.name.toLowerCase().includes(search.toLowerCase());
      const matchesDept = deptFilter === 'All' || emp.department === deptFilter;
      return matchesSearch && matchesDept;
    });
  }, [baseData, search, deptFilter]);

  // Calculations for Summary Row & Column
  const { summaryByEmployee, summaryByDay, totalStats } = useMemo(() => {
    const sByEmp = {};
    const sByDay = {};
    let presentToday = 0;
    let absentToday = 0;
    let leaveToday = 0;
    let wfhToday = 0;

    // Initialize day counters
    daysArray.forEach(d => {
      sByDay[d] = { present: 0, absent: 0 };
    });

    // Simulate "today" as the 15th for the stat cards logic if we are in the current month, else day 1
    const today = 15; 

    filteredData.forEach(emp => {
      let ePresent = 0;
      let eAbsent = 0;
      let eTotalWorkDays = 0;

      daysArray.forEach(d => {
        const status = emp.attendance[d].status;
        if (status !== 'weekend') {
          eTotalWorkDays++;
          
          if (['present', 'wfh'].includes(status)) {
            ePresent += 1;
            sByDay[d].present += 1;
          } else if (status === 'half-day') {
            ePresent += 0.5;
            sByDay[d].present += 0.5;
          } else if (status === 'absent') {
            eAbsent += 1;
            sByDay[d].absent += 1;
          }

          if (d === today) {
            if (status === 'present') presentToday++;
            if (status === 'absent') absentToday++;
            if (status === 'wfh') wfhToday++;
            // Assuming absent implies leave for simple mock
            if (status === 'absent') leaveToday++;
          }
        }
      });

      sByEmp[emp.id] = {
        present: ePresent,
        absent: eAbsent,
        percentage: eTotalWorkDays > 0 ? (ePresent / eTotalWorkDays) * 100 : 0
      };
    });

    return { 
      summaryByEmployee: sByEmp, 
      summaryByDay: sByDay,
      totalStats: { presentToday, absentToday, leaveToday, wfhToday }
    };
  }, [filteredData, daysArray]);

  // Handlers
  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const exportCSV = () => {
    const headers = ['Employee', 'Department', ...daysArray.map(d => `Day ${d}`), 'Total Present', 'Total Absent', 'Attendance %'];
    
    const rows = filteredData.map(emp => {
      const stats = summaryByEmployee[emp.id];
      const dayStatuses = daysArray.map(d => emp.attendance[d].status);
      return [
        emp.name, 
        emp.department, 
        ...dayStatuses, 
        stats.present, 
        stats.absent, 
        `${stats.percentage.toFixed(1)}%`
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Attendance_${format(currentDate, 'MMM_yyyy')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Status Colors Mapping
  const getStatusColor = (status) => {
    switch(status) {
      case 'present': return 'bg-[#10B981]';
      case 'absent': return 'bg-[#EF4444]';
      case 'half-day': return 'bg-[#F59E0B]';
      case 'wfh': return 'bg-[#6366F1]';
      case 'weekend': return 'bg-transparent';
      default: return 'bg-[#1E1E2E]';
    }
  };

  // Framer Motion Variants
  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.02 } } };
  const item = { hidden: { opacity: 0, scale: 0.5 }, show: { opacity: 1, scale: 1 } };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white p-6 md:p-10 font-sans flex flex-col h-screen overflow-hidden">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-6 flex-shrink-0">
        <div>
          <h1 className="text-[32px] font-serif tracking-wide leading-tight">Attendance Grid</h1>
          <p className="text-gray-400 text-sm mt-1">Holistic view of organizational attendance and time tracking.</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center bg-[#111118] border border-[#1E1E2E] rounded-lg p-1">
            <button onClick={handlePrevMonth} className="p-1.5 text-gray-400 hover:text-white rounded-md transition-colors"><ChevronLeft size={18}/></button>
            <span className="w-32 text-center font-medium font-sans text-sm">{format(currentDate, 'MMMM yyyy')}</span>
            <button onClick={handleNextMonth} className="p-1.5 text-gray-400 hover:text-white rounded-md transition-colors"><ChevronRight size={18}/></button>
          </div>

          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search employee..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-48 bg-[#111118] border border-[#1E1E2E] rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] transition-all"
            />
          </div>

          <select 
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="w-40 bg-[#111118] border border-[#1E1E2E] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] transition-all appearance-none"
          >
            <option value="All">All Departments</option>
            <option value="Engineering">Engineering</option>
            <option value="Design">Design</option>
            <option value="Human Resources">HR</option>
            <option value="IT">IT</option>
          </select>

          <button 
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-[#1E1E2E] hover:bg-[#2A2A35] border border-[#1E1E2E] text-white rounded-lg transition-all font-medium text-sm shadow-sm"
          >
            <Download size={16} />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6 flex-shrink-0">
        <StatCard title="Present Today" value={totalStats.presentToday} icon={Users} colorClass="text-[#10B981] bg-[#10B981]" />
        <StatCard title="Absent Today" value={totalStats.absentToday} icon={UserX} colorClass="text-[#EF4444] bg-[#EF4444]" />
        <StatCard title="On Leave Today" value={totalStats.leaveToday} icon={CalendarClock} colorClass="text-[#F59E0B] bg-[#F59E0B]" />
        <StatCard title="WFH Today" value={totalStats.wfhToday} icon={Home} colorClass="text-[#6366F1] bg-[#6366F1]" />
      </div>

      {/* LEGEND */}
      <div className="flex flex-wrap items-center gap-6 mb-4 px-2 flex-shrink-0">
        <LegendBadge colorClass="bg-[#10B981]" label="Present" />
        <LegendBadge colorClass="bg-[#6366F1]" label="WFH" />
        <LegendBadge colorClass="bg-[#F59E0B]" label="Half Day" />
        <LegendBadge colorClass="bg-[#EF4444]" label="Absent" />
        <LegendBadge colorClass="bg-[#1E1E2E]" label="Weekend/Holiday" />
      </div>

      {/* MAIN GRID */}
      <div className="flex-1 bg-[#111118] border border-[#1E1E2E] rounded-xl overflow-hidden shadow-2xl flex flex-col relative">
        <div className="overflow-auto flex-1 custom-scrollbar">
          <table className="w-full text-left text-xs whitespace-nowrap border-collapse">
            
            <thead className="bg-[#0A0A0F] sticky top-0 z-20 shadow-md">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-400 border-b border-r border-[#1E1E2E] sticky left-0 bg-[#0A0A0F] z-30 min-w-[200px]">Employee</th>
                {daysArray.map(d => {
                  const date = new Date(year, month, d);
                  const isWknd = isWeekend(date);
                  return (
                    <th key={d} className={`w-10 text-center py-3 border-b border-r border-[#1E1E2E] ${isWknd ? 'bg-[#1E1E2E]/20 text-gray-500' : 'text-gray-300'}`}>
                      <div className="font-mono">{d}</div>
                      <div className="text-[10px] uppercase font-sans mt-0.5 opacity-50">{format(date, 'eee')}</div>
                    </th>
                  );
                })}
                <th className="px-3 py-3 text-center border-b border-l border-[#1E1E2E] font-medium text-gray-400 sticky right-[120px] bg-[#0A0A0F] z-30 w-[60px]">Present</th>
                <th className="px-3 py-3 text-center border-b border-[#1E1E2E] font-medium text-gray-400 sticky right-[60px] bg-[#0A0A0F] z-30 w-[60px]">Absent</th>
                <th className="px-3 py-3 text-center border-b border-[#1E1E2E] font-medium text-gray-400 sticky right-0 bg-[#0A0A0F] z-30 w-[60px]">Rate</th>
              </tr>
            </thead>
            
            <motion.tbody 
              variants={container} 
              initial="hidden" 
              animate="show"
              className="divide-y divide-[#1E1E2E]"
            >
              {loading ? (
                <tr>
                  <td colSpan={daysArray.length + 4} className="px-4 py-12">
                    <div className="space-y-4">
                      {[1,2,3,4].map(i => (
                        <div key={i} className="h-12 w-full bg-[#1E1E2E] animate-pulse rounded-lg"></div>
                      ))}
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={daysArray.length + 4} className="px-4 py-12 text-center text-red-500">
                    Failed to load attendance data.
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={daysArray.length + 4} className="px-4 py-12 text-center text-gray-500">
                    No data found for the selected criteria.
                  </td>
                </tr>
              ) : filteredData.map((emp) => (
                <tr key={emp.id} className="hover:bg-[#1E1E2E]/30 transition-colors group">
                  <td className="px-4 py-2 border-r border-[#1E1E2E] sticky left-0 bg-[#111118] group-hover:bg-[#15151F] transition-colors z-10">
                    <div className="flex items-center gap-3">
                      <img src={emp.avatar} alt="" className="w-7 h-7 rounded-full border border-[#1E1E2E] object-cover" />
                      <div>
                        <p className="font-medium text-gray-200 truncate max-w-[140px]">{emp.name}</p>
                      </div>
                    </div>
                  </td>
                  
                  {daysArray.map(d => {
                    const date = new Date(year, month, d);
                    const isWknd = isWeekend(date);
                    // Ensure attendance object exists for the day
                    const att = (emp.attendance && emp.attendance[d]) || { status: isWknd ? 'weekend' : 'pending' };
                    
                    
                    return (
                      <td key={d} className={`text-center border-r border-[#1E1E2E]/50 relative group/cell ${isWknd ? 'bg-[#1E1E2E]/10' : ''}`}>
                        <div className="flex items-center justify-center h-full w-full py-2.5">
                          {att.status !== 'weekend' ? (
                            <motion.div variants={item} className={`w-3 h-3 rounded-sm ${getStatusColor(att.status)}`} />
                          ) : (
                            <div className="w-1.5 h-1.5 rounded-full bg-[#1E1E2E] opacity-50" />
                          )}
                        </div>
                        
                        {/* Tooltip */}
                        {att.status !== 'weekend' && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/cell:block z-50">
                            <div className="bg-[#0A0A0F] text-white text-[11px] p-2 rounded border border-[#1E1E2E] shadow-xl whitespace-nowrap">
                              <p className="font-medium text-[#6366F1] mb-1">{emp.name} — {format(date, 'MMM do')}</p>
                              <p className="capitalize text-gray-300">Status: {att.status}</p>
                              {att.checkIn && <p className="text-gray-400">In: {att.checkIn}</p>}
                              {att.checkOut && <p className="text-gray-400">Out: {att.checkOut}</p>}
                            </div>
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#0A0A0F] border-b border-r border-[#1E1E2E] rotate-45" />
                          </div>
                        )}
                      </td>
                    );
                  })}
                  
                  {/* Summary Columns for Employee */}
                  <td className="px-3 py-2 text-center border-l border-[#1E1E2E] sticky right-[120px] bg-[#111118] group-hover:bg-[#15151F] transition-colors z-10 font-mono text-gray-300">
                    {summaryByEmployee[emp.id]?.present || 0}
                  </td>
                  <td className="px-3 py-2 text-center sticky right-[60px] bg-[#111118] group-hover:bg-[#15151F] transition-colors z-10 font-mono text-gray-300">
                    {summaryByEmployee[emp.id]?.absent || 0}
                  </td>
                  <td className="px-3 py-2 text-center sticky right-0 bg-[#111118] group-hover:bg-[#15151F] transition-colors z-10 font-mono">
                    <span className={`${(summaryByEmployee[emp.id]?.percentage || 0) >= 80 ? 'text-[#10B981]' : (summaryByEmployee[emp.id]?.percentage || 0) >= 60 ? 'text-[#F59E0B]' : 'text-[#EF4444]'}`}>
                      {(summaryByEmployee[emp.id]?.percentage || 0).toFixed(0)}%
                    </span>
                  </td>
                </tr>
              ))}
            </motion.tbody>
            
            {/* BOTTOM SUMMARY ROW */}
            <tfoot className="bg-[#0A0A0F] sticky bottom-0 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.3)] border-t border-[#1E1E2E]">
              <tr>
                <td className="px-4 py-3 font-medium text-gray-400 border-r border-[#1E1E2E] sticky left-0 bg-[#0A0A0F] z-30">
                  Daily Present Count
                </td>
                {daysArray.map(d => {
                  const date = new Date(year, month, d);
                  const isWknd = isWeekend(date);
                  return (
                    <td key={d} className={`text-center py-3 border-r border-[#1E1E2E]/50 font-mono text-[10px] ${isWknd ? 'bg-[#1E1E2E]/20 text-gray-600' : 'text-[#10B981]'}`}>
                      {!isWknd ? summaryByDay[d].present : '-'}
                    </td>
                  );
                })}
                <td colSpan="3" className="border-l border-[#1E1E2E] sticky right-0 bg-[#0A0A0F] z-30"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
      
    </div>
  );
}
