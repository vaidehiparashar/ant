import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { 
  CheckCircle2, Clock, Calendar as CalendarIcon, 
  List, ChevronLeft, ChevronRight, Fingerprint, CalendarDays
} from 'lucide-react';
import { 
  format, getDaysInMonth, addMonths, subMonths, 
  isWeekend, startOfMonth, endOfMonth, startOfWeek, 
  endOfWeek, eachDayOfInterval, isSameDay, isToday, parseISO
} from 'date-fns';

// --- HELPER HOOK FOR COUNT UP ---
function CountUp({ end, suffix = '', decimals = 0, durationMs = 1500 }) {
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
        } else {
          setCount(start);
        }
      }, 16);

      return () => clearInterval(timer);
    }
  }, [end, isInView, durationMs]);

  return (
    <span ref={ref} className="font-mono">
      {count.toFixed(decimals)}{suffix}
    </span>
  );
}

import { useAttendanceStore } from '../../store';

// --- HELPER COMPONENTS ---
const StatCard = ({ title, value, icon: Icon, colorClass, suffix = '', decimals = 0 }) => (
  <motion.div 
    variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
    className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-5 flex items-center justify-between shadow-xl"
  >
    <div>
      <p className="text-sm text-gray-400 font-sans mb-1">{title}</p>
      <p className={`text-3xl font-serif ${colorClass.split(' ')[0]}`}>
        <CountUp end={value} suffix={suffix} decimals={decimals} />
      </p>
    </div>
    <div className={`p-3 rounded-lg ${colorClass} bg-opacity-10`}>
      <Icon size={24} className={colorClass.split(' ')[0].replace('text-', 'stroke-')} />
    </div>
  </motion.div>
);

const StatusBadge = ({ status }) => {
  switch(status) {
    case 'present': return <span className="bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30 px-2 py-0.5 rounded text-xs font-sans font-medium uppercase tracking-wider">Present</span>;
    case 'wfh': return <span className="bg-[#6366F1]/20 text-[#6366F1] border border-[#6366F1]/30 px-2 py-0.5 rounded text-xs font-sans font-medium uppercase tracking-wider">WFH</span>;
    case 'half-day': return <span className="bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30 px-2 py-0.5 rounded text-xs font-sans font-medium uppercase tracking-wider">Half Day</span>;
    case 'absent': return <span className="bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30 px-2 py-0.5 rounded text-xs font-sans font-medium uppercase tracking-wider">Absent</span>;
    case 'weekend': return <span className="bg-[#1E1E2E] text-gray-400 border border-gray-600 px-2 py-0.5 rounded text-xs font-sans font-medium uppercase tracking-wider">Weekend</span>;
    default: return <span className="text-gray-500 text-xs font-sans uppercase tracking-wider border border-transparent px-2 py-0.5">-</span>;
  }
};

const getStatusColor = (status) => {
  switch(status) {
    case 'present': return 'bg-[#10B981]';
    case 'absent': return 'bg-[#EF4444]';
    case 'half-day': return 'bg-[#F59E0B]';
    case 'wfh': return 'bg-[#6366F1]';
    case 'weekend': return 'bg-[#1E1E2E]/50';
    default: return 'bg-[#0A0A0F]';
  }
};

// --- MAIN PAGE COMPONENT ---
export default function MyAttendance() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' | 'table'
  const [selectedDate, setSelectedDate] = useState(null); // For Popover
  const popoverRef = useRef(null);

  // Table Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const { 
    myAttendance: monthDataStr, 
    todayRecord,
    loading, 
    error, 
    fetchMyAttendance, 
    checkIn, 
    checkOut 
  } = useAttendanceStore();

  useEffect(() => {
    fetchMyAttendance(currentDate.getMonth() + 1, currentDate.getFullYear());
  }, [currentDate, fetchMyAttendance]);

  // The backend might return string dates, parse them so isSameDay works
  const monthData = useMemo(() => {
    if (!monthDataStr) return [];
    return monthDataStr.map(d => ({
      ...d,
      date: typeof d.date === 'string' ? parseISO(d.date) : d.date
    }));
  }, [monthDataStr]);

  // Override today's status purely from todayRecord
  useEffect(() => {
    if (todayRecord) {
      if (todayRecord.checkOut) {
        setTodayStatus('completed');
        setTodayCheckIn(todayRecord.checkIn);
        setTodayCheckOut(todayRecord.checkOut);
        setTodayHours(todayRecord.hours);
      } else if (todayRecord.checkIn) {
        setTodayStatus('checked-in');
        setTodayCheckIn(todayRecord.checkIn);
      } else {
        setTodayStatus('none');
      }
    } else {
      setTodayStatus(isWeekend(new Date()) ? 'weekend' : 'none');
    }
  }, [todayRecord]);

  const activeMonthData = useMemo(() => {
    if (!monthData) return [];
    if (currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear()) {
      return monthData.map(d => {
        if (isToday(d.date)) {
          let s = d.status || 'pending';
          if (todayStatus === 'checked-in') s = 'present'; 
          if (todayStatus === 'completed') {
            s = todayHours >= 8 ? 'present' : 'half-day';
          }
          if (todayStatus === 'weekend') s = 'weekend';
          return { ...d, status: s, checkIn: todayCheckIn, checkOut: todayCheckOut, hours: todayHours };
        }
        return d;
      });
    }
    return monthData;
  }, [monthData, todayStatus, todayCheckIn, todayCheckOut, todayHours, currentDate]);

  // Derived Stats for the viewed month
  const stats = useMemo(() => {
    let present = 0, absent = 0, half = 0, workDays = 0;
    activeMonthData.forEach(d => {
      if (d.status !== 'weekend' && d.date <= new Date()) {
        workDays++;
        if (['present', 'wfh'].includes(d.status)) present++;
        else if (d.status === 'absent') absent++;
        else if (d.status === 'half-day') { half++; present += 0.5; }
      }
    });
    return {
      presentDays: Math.floor(present),
      absentDays: absent,
      halfDays: half,
      percentage: workDays > 0 ? (present / workDays) * 100 : 0
    };
  }, [activeMonthData]);

  // Calendar Logic
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  // Popover Outside Click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setSelectedDate(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCheckIn = async () => {
    await checkIn();
    await fetchMyAttendance(currentDate.getMonth() + 1, currentDate.getFullYear());
  };

  const handleCheckOut = async () => {
    await checkOut();
    await fetchMyAttendance(currentDate.getMonth() + 1, currentDate.getFullYear());
  };

  const getAttendanceForDate = (date) => activeMonthData.find(d => isSameDay(d.date, date));

  // Table Data
  const sortedTableData = [...activeMonthData].sort((a, b) => b.date - a.date);
  const totalPages = Math.ceil(sortedTableData.length / rowsPerPage);
  const currentTableData = sortedTableData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  // Framer Motion
  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white p-6 md:p-10 font-sans">
      
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-[32px] font-serif tracking-wide leading-tight">My Attendance</h1>
        <p className="text-gray-400 text-sm mt-1">Track your daily clock-ins, clock-outs, and monthly performance.</p>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl">
          Failed to load attendance data.
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
        
        {/* CHECK IN ACTION CARD */}
        <div className="xl:col-span-1 bg-[#111118] border border-[#1E1E2E] rounded-2xl p-8 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-64 h-64 bg-[#10B981]/5 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2 pointer-events-none" />
          
          <h2 className="text-xl font-serif text-white mb-2 relative z-10">Today's Status</h2>
          <p className="text-sm font-mono text-gray-400 mb-8 relative z-10">{format(new Date(), 'EEEE, MMMM do, yyyy')}</p>

          <div className="flex-1 flex flex-col items-center justify-center w-full relative z-10">
            {todayStatus === 'weekend' ? (
              <div className="text-center">
                <CalendarDays size={48} className="text-[#1E1E2E] mx-auto mb-4" />
                <p className="text-gray-500 font-medium">No work today.</p>
                <p className="text-xs text-gray-600 mt-1 uppercase tracking-widest">Enjoy your weekend!</p>
              </div>
            ) : todayStatus === 'none' ? (
              <motion.button 
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                animate={{ boxShadow: ['0px 0px 0px 0px rgba(16,185,129,0.4)', '0px 0px 0px 20px rgba(16,185,129,0)', '0px 0px 0px 40px rgba(16,185,129,0)'] }}
                transition={{ repeat: Infinity, duration: 2 }}
                onClick={handleCheckIn}
                className="w-48 h-48 rounded-full bg-gradient-to-b from-[#10B981] to-[#059669] flex flex-col items-center justify-center gap-3 shadow-[0_10px_40px_rgba(16,185,129,0.3)] border-4 border-[#111118]"
              >
                <Fingerprint size={48} className="text-white" strokeWidth={1.5} />
                <span className="text-xl font-bold tracking-wider uppercase text-white">Check In</span>
              </motion.button>
            ) : todayStatus === 'checked-in' ? (
              <div className="text-center w-full">
                <div className="mb-6 inline-block bg-[#1E1E2E]/50 px-4 py-2 rounded-lg border border-[#1E1E2E]">
                  <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Checked In At</p>
                  <p className="font-mono text-xl text-[#10B981]">{todayCheckIn}</p>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={handleCheckOut}
                  className="w-40 h-40 mx-auto rounded-full bg-gradient-to-b from-[#EF4444] to-[#B91C1C] flex flex-col items-center justify-center gap-2 shadow-[0_10px_40px_rgba(239,68,68,0.3)] border-4 border-[#111118]"
                >
                  <Clock size={36} className="text-white" strokeWidth={1.5} />
                  <span className="text-lg font-bold tracking-wider uppercase text-white">Check Out</span>
                </motion.button>
              </div>
            ) : (
              <div className="text-center w-full space-y-4">
                <div className="inline-block p-4 rounded-full bg-[#10B981]/10 mb-2">
                  <CheckCircle2 size={48} className="text-[#10B981]" />
                </div>
                <h3 className="text-2xl font-serif text-white">Shift Completed</h3>
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg p-3">
                    <p className="text-xs text-gray-500 uppercase">In</p>
                    <p className="font-mono text-[#10B981]">{todayCheckIn}</p>
                  </div>
                  <div className="bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg p-3">
                    <p className="text-xs text-gray-500 uppercase">Out</p>
                    <p className="font-mono text-[#EF4444]">{todayCheckOut}</p>
                  </div>
                </div>
                <div className="bg-[#6366F1]/10 border border-[#6366F1]/30 rounded-lg p-3 mt-4">
                  <p className="text-xs text-[#6366F1] uppercase tracking-widest mb-1 font-bold">Hours Logged</p>
                  <p className="font-mono text-xl text-white">{todayHours}h</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* STATS CARDS */}
        <motion.div 
          variants={containerVariants} initial="hidden" animate="show"
          className="xl:col-span-2 grid grid-cols-2 gap-4"
        >
          <StatCard title="Present Days" value={stats.presentDays} icon={CheckCircle2} colorClass="text-[#10B981] bg-[#10B981]" />
          <StatCard title="Absent Days" value={stats.absentDays} icon={CalendarIcon} colorClass="text-[#EF4444] bg-[#EF4444]" />
          <StatCard title="Half Days" value={stats.halfDays} icon={Clock} colorClass="text-[#F59E0B] bg-[#F59E0B]" />
          <StatCard 
            title="Attendance Rate" 
            value={stats.percentage} 
            icon={List} 
            suffix="%" 
            colorClass={stats.percentage >= 80 ? 'text-[#10B981] bg-[#10B981]' : stats.percentage >= 60 ? 'text-[#F59E0B] bg-[#F59E0B]' : 'text-[#EF4444] bg-[#EF4444]'} 
          />
        </motion.div>
      </div>

      {/* VIEW CONTROLS & CALENDAR/TABLE */}
      <div className="bg-[#111118] border border-[#1E1E2E] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Toolbar */}
        <div className="p-6 border-b border-[#1E1E2E] flex flex-col md:flex-row justify-between items-center gap-4 bg-[#0A0A0F]/50">
          <div className="flex items-center gap-4">
            <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-2 text-gray-400 hover:text-white bg-[#1E1E2E] rounded-lg transition-colors"><ChevronLeft size={18}/></button>
            <span className="w-40 text-center font-serif text-xl tracking-wide">{format(currentDate, 'MMMM yyyy')}</span>
            <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-2 text-gray-400 hover:text-white bg-[#1E1E2E] rounded-lg transition-colors"><ChevronRight size={18}/></button>
          </div>

          <div className="flex items-center bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg p-1">
            <button 
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'calendar' ? 'bg-[#6366F1] text-white' : 'text-gray-400 hover:text-white'}`}
            >
              <CalendarIcon size={16} /> Calendar
            </button>
            <button 
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'table' ? 'bg-[#6366F1] text-white' : 'text-gray-400 hover:text-white'}`}
            >
              <List size={16} /> Table
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            
            {/* CALENDAR VIEW */}
            {viewMode === 'calendar' && (
              <motion.div 
                key="calendar"
                initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
                className="w-full"
              >
                {/* Days Header */}
                <div className="grid grid-cols-7 gap-2 mb-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-xs font-bold text-gray-500 uppercase tracking-widest py-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-2 relative">
                  {calendarDays.map((day, idx) => {
                    const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                    const attendance = getAttendanceForDate(day);
                    const status = attendance ? attendance.status : 'pending';
                    const isSelected = selectedDate && isSameDay(selectedDate, day);

                    return (
                      <div key={idx} className="relative">
                        <div 
                          onClick={() => {
                            if (isCurrentMonth && status !== 'pending') {
                              setSelectedDate(isSelected ? null : day);
                            }
                          }}
                          className={`aspect-square rounded-xl border flex flex-col items-center justify-center relative transition-all ${
                            isCurrentMonth 
                              ? (status !== 'pending' ? 'cursor-pointer hover:border-gray-400' : 'opacity-50 cursor-default')
                              : 'opacity-10 cursor-default'
                          } ${isSelected ? 'border-white shadow-[0_0_15px_rgba(255,255,255,0.2)]' : 'border-[#1E1E2E] bg-[#0A0A0F]'}`}
                        >
                          <span className={`text-lg font-mono ${isCurrentMonth ? 'text-gray-300' : 'text-gray-700'}`}>
                            {format(day, 'd')}
                          </span>
                          
                          {/* Status Dot/Bar */}
                          {isCurrentMonth && (
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center justify-center w-full px-2">
                              {status !== 'pending' && status !== 'weekend' && (
                                <div className={`h-1 w-full max-w-[24px] rounded-full ${getStatusColor(status)}`} />
                              )}
                              {status === 'weekend' && (
                                <div className="h-1 w-1 rounded-full bg-[#1E1E2E] opacity-50" />
                              )}
                            </div>
                          )}
                        </div>

                        {/* POPOVER */}
                        <AnimatePresence>
                          {isSelected && (
                            <motion.div 
                              ref={popoverRef}
                              initial={{ opacity: 0, y: 10, scale: 0.9 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.9 }}
                              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-48 bg-[#111118] border border-[#1E1E2E] rounded-xl shadow-2xl p-4 z-50 pointer-events-none"
                            >
                              <div className="text-center mb-3">
                                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{format(day, 'MMM do, yyyy')}</p>
                                <StatusBadge status={status} />
                              </div>
                              {status !== 'weekend' && status !== 'absent' && (
                                <div className="space-y-2 border-t border-[#1E1E2E] pt-3">
                                  <div className="flex justify-between text-xs">
                                    <span className="text-gray-500">In:</span>
                                    <span className="font-mono text-gray-300">{attendance?.checkIn || '-'}</span>
                                  </div>
                                  <div className="flex justify-between text-xs">
                                    <span className="text-gray-500">Out:</span>
                                    <span className="font-mono text-gray-300">{attendance?.checkOut || '-'}</span>
                                  </div>
                                  <div className="flex justify-between text-xs font-bold pt-1">
                                    <span className="text-gray-400">Total:</span>
                                    <span className="font-mono text-[#6366F1]">{attendance?.hours || 0}h</span>
                                  </div>
                                </div>
                              )}
                              {/* Triangle arrow */}
                              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#111118] border-b border-r border-[#1E1E2E] rotate-45" />
                            </motion.div>
                          )}
                        </AnimatePresence>

                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* TABLE VIEW */}
            {viewMode === 'table' && (
              <motion.div 
                key="table"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="w-full"
              >
                <div className="border border-[#1E1E2E] rounded-xl overflow-hidden bg-[#0A0A0F]">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-[#111118] border-b border-[#1E1E2E] text-gray-400 font-medium tracking-wide">
                      <tr>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Day</th>
                        <th className="px-6 py-4">Check In</th>
                        <th className="px-6 py-4">Check Out</th>
                        <th className="px-6 py-4 text-center">Hours</th>
                        <th className="px-6 py-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1E1E2E]">
                      {loading ? (
                        <tr>
                          <td colSpan="6" className="px-6 py-12">
                            <div className="space-y-4">
                              {[1,2,3,4].map(i => (
                                <div key={i} className="h-10 w-full bg-[#1E1E2E] animate-pulse rounded-lg"></div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ) : currentTableData.map((row, i) => (
                        <tr key={i} className="hover:bg-[#1E1E2E]/20 transition-colors">
                          <td className="px-6 py-4 font-mono text-gray-300">{format(row.date, 'MMM dd, yyyy')}</td>
                          <td className="px-6 py-4 text-gray-500 uppercase text-xs tracking-wider">{format(row.date, 'EEEE')}</td>
                          <td className="px-6 py-4 font-mono text-gray-400">{row.checkIn || '-'}</td>
                          <td className="px-6 py-4 font-mono text-gray-400">{row.checkOut || '-'}</td>
                          <td className="px-6 py-4 text-center font-mono font-bold text-[#6366F1]">{row.hours > 0 ? `${row.hours}h` : '-'}</td>
                          <td className="px-6 py-4 text-right"><StatusBadge status={row.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {/* Pagination */}
                  <div className="px-6 py-4 border-t border-[#1E1E2E] flex justify-between items-center bg-[#111118]">
                    <span className="text-xs text-gray-500 uppercase tracking-widest font-bold">
                      Page {currentPage} of {totalPages}
                    </span>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 bg-[#1E1E2E] hover:bg-[#2A2A35] disabled:opacity-50 text-white rounded text-sm transition-colors"
                      >
                        Prev
                      </button>
                      <button 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 bg-[#1E1E2E] hover:bg-[#2A2A35] disabled:opacity-50 text-white rounded text-sm transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>

                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

    </div>
  );
}
