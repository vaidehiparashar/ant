import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence, useAnimation, useInView } from 'framer-motion';
import { 
  ChevronLeft, ChevronRight, Download, Play, 
  CheckCircle2, FileText, Send, X, DollarSign, Users, Clock, Percent
} from 'lucide-react';
import { format, subMonths, addMonths } from 'date-fns';

import { usePayrollStore } from '../../store';

// --- HELPER HOOK FOR COUNT UP ---
function CountUp({ end, prefix = '', suffix = '', decimals = 0 }) {
  const [count, setCount] = useState(0);
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      let start = 0;
      const duration = 1500; // 1.5 seconds
      const increment = end / (duration / 16); // 60fps

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
  }, [end, isInView]);

  return (
    <span ref={ref} className="font-mono">
      {prefix}{count.toFixed(decimals).replace(/\\B(?=(\\d{3})+(?!\\d))/g, ",")}{suffix}
    </span>
  );
}

// --- HELPER COMPONENTS ---
const StatCard = ({ title, value, icon: Icon, colorClass, prefix = '', decimals = 0 }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-6 flex flex-col justify-between shadow-xl"
  >
    <div className="flex justify-between items-start mb-4">
      <p className="text-sm text-gray-400 font-sans">{title}</p>
      <div className={`p-2.5 rounded-lg ${colorClass} bg-opacity-20`}>
        <Icon size={20} className={colorClass.split(' ')[0].replace('text-', 'stroke-')} />
      </div>
    </div>
    <div className="text-3xl font-serif text-white">
      <CountUp end={value} prefix={prefix} decimals={decimals} />
    </div>
  </motion.div>
);

const Badge = ({ status }) => {
  switch(status) {
    case 'paid': return <span className="bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30 px-3 py-1 rounded-full text-xs font-sans font-medium uppercase tracking-wider">Paid</span>;
    case 'processed': return <span className="bg-[#6366F1]/20 text-[#6366F1] border border-[#6366F1]/30 px-3 py-1 rounded-full text-xs font-sans font-medium uppercase tracking-wider">Processed</span>;
    case 'draft': return <span className="bg-[#1E1E2E] text-gray-400 border border-gray-600 px-3 py-1 rounded-full text-xs font-sans font-medium uppercase tracking-wider">Draft</span>;
    default: return null;
  }
};

// --- MODAL COMPONENT ---
const PayslipModal = ({ record, currentDate, onClose }) => {
  const handleDownload = async () => {
    const { pdfService } = await import("../../services/pdfService");
    const employeeData = { name: record.name, id: record.empId, designation: record.designation };
    const payrollData = { ...record, month: format(currentDate, 'MMMM'), year: format(currentDate, 'yyyy'), totalDeductions: record.deductions + record.tax, gross: record.basic + record.hra + record.allowances };
    await pdfService.generatePayslip(employeeData, payrollData);
  };

  const handleSend = () => {
    console.log("Mock sending payslip to", record.name);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white text-gray-900 rounded-lg shadow-2xl w-full max-w-3xl flex flex-col overflow-hidden"
      >
        <div className="px-8 py-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <div>
            <h2 className="text-2xl font-serif font-bold tracking-tight">Payslip Preview</h2>
            <p className="text-sm text-gray-500 font-sans mt-1">Pay period: {format(currentDate, 'MMMM yyyy')}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 bg-gray-200 p-2 rounded-full transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Payslip Document Preview */}
        <div className="flex-1 overflow-y-auto p-10 font-sans bg-white border-b border-gray-200 custom-scrollbar">
          
          {/* Header */}
          <div className="flex justify-between items-start mb-10 pb-6 border-b-2 border-gray-900">
            <div>
              <h1 className="text-3xl font-serif font-bold text-indigo-600 tracking-wider">antHR</h1>
              <p className="text-sm text-gray-500 mt-1">123 Tech Boulevard, Suite 400<br/>San Francisco, CA 94105</p>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-bold uppercase tracking-widest text-gray-800">Payslip</h2>
              <p className="text-sm text-gray-600 mt-1 font-mono">{format(currentDate, 'MMMM yyyy')}</p>
            </div>
          </div>

          {/* Employee Details */}
          <div className="grid grid-cols-2 gap-8 mb-10">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Employee Details</p>
              <p className="font-bold text-lg">{record.name}</p>
              <p className="text-gray-600">{record.designation}</p>
              <p className="text-gray-600 text-sm mt-1">Emp ID: #{record.empId.padStart(4, '0')}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Payment Status</p>
              <p className={`font-bold uppercase tracking-wider ${record.status === 'paid' ? 'text-emerald-600' : 'text-gray-400'}`}>
                {record.status}
              </p>
            </div>
          </div>

          {/* Earnings & Deductions Table */}
          <div className="grid grid-cols-2 gap-0 border border-gray-300 rounded-lg overflow-hidden mb-10">
            {/* Earnings Col */}
            <div className="border-r border-gray-300">
              <div className="bg-gray-100 px-4 py-2 font-bold text-sm text-gray-800 border-b border-gray-300">Earnings</div>
              <div className="px-4 py-3 flex justify-between border-b border-gray-100">
                <span className="text-sm text-gray-600">Basic Salary</span>
                <span className="font-mono text-sm">${record.basic.toFixed(2)}</span>
              </div>
              <div className="px-4 py-3 flex justify-between border-b border-gray-100">
                <span className="text-sm text-gray-600">House Rent Allowance (HRA)</span>
                <span className="font-mono text-sm">${record.hra.toFixed(2)}</span>
              </div>
              <div className="px-4 py-3 flex justify-between">
                <span className="text-sm text-gray-600">Special Allowances</span>
                <span className="font-mono text-sm">${record.allowances.toFixed(2)}</span>
              </div>
            </div>

            {/* Deductions Col */}
            <div>
              <div className="bg-gray-100 px-4 py-2 font-bold text-sm text-gray-800 border-b border-gray-300">Deductions</div>
              <div className="px-4 py-3 flex justify-between border-b border-gray-100">
                <span className="text-sm text-gray-600">Income Tax (10%)</span>
                <span className="font-mono text-sm text-red-600">-${record.tax.toFixed(2)}</span>
              </div>
              <div className="px-4 py-3 flex justify-between border-b border-gray-100">
                <span className="text-sm text-gray-600">Other Deductions</span>
                <span className="font-mono text-sm text-red-600">-${record.deductions.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Net Pay Total */}
          <div className="flex justify-end">
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-8 py-4 w-1/2 flex justify-between items-center">
              <span className="font-bold text-indigo-900 uppercase tracking-widest text-sm">Net Pay</span>
              <span className="text-2xl font-mono font-bold text-indigo-700">${record.net.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="px-8 py-5 bg-gray-50 flex justify-end gap-4">
          <button onClick={handleSend} className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium font-sans text-gray-700 hover:text-indigo-600 bg-white border border-gray-300 hover:border-indigo-300 rounded-lg transition-colors shadow-sm">
            <Send size={16} />
            <span>Send to Employee</span>
          </button>
          <button onClick={handleDownload} className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium font-sans text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-md shadow-indigo-600/20">
            <Download size={16} />
            <span>Download PDF</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// --- MAIN PAGE COMPONENT ---
export default function PayrollManager() {
  const { allPayroll: payrollData, loading, error, fetchAllPayroll, generatePayroll, markPaid } = usePayrollStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedRows, setSelectedRows] = useState([]);
  const [previewRecord, setPreviewRecord] = useState(null);

  useEffect(() => {
    fetchAllPayroll(currentDate.getMonth() + 1, currentDate.getFullYear());
  }, [currentDate, fetchAllPayroll]);

  // Derived Stats
  const stats = useMemo(() => {
    let totalPayroll = 0;
    let paidCount = 0;
    let pendingCount = 0;
    let totalTax = 0;

    payrollData.forEach(p => {
      totalPayroll += p.net;
      totalTax += p.tax;
      if (p.status === 'paid') paidCount++;
      else pendingCount++;
    });

    return { totalPayroll, paidCount, pendingCount, totalTax };
  }, [payrollData]);

  // Handlers
  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const toggleSelectAll = (e) => {
    if (e.target.checked) setSelectedRows(payrollData.map(p => p.id));
    else setSelectedRows([]);
  };

  const toggleSelectRow = (id) => {
    if (selectedRows.includes(id)) setSelectedRows(selectedRows.filter(rId => rId !== id));
    else setSelectedRows([...selectedRows, id]);
  };

  const handleMarkAsPaid = async (id) => {
    await markPaid(id);
    await fetchAllPayroll(currentDate.getMonth() + 1, currentDate.getFullYear());
  };

  const handleGenerateDraft = async (id) => {
    await generatePayroll(id);
    await fetchAllPayroll(currentDate.getMonth() + 1, currentDate.getFullYear());
  };

  const handleBulkMarkPaid = async () => {
    for (const id of selectedRows) {
      await markPaid(id);
    }
    setSelectedRows([]);
    await fetchAllPayroll(currentDate.getMonth() + 1, currentDate.getFullYear());
  };

  const handleBulkGenerate = async () => {
    for (const id of selectedRows) {
      const p = payrollData.find(x => x.id === id);
      if (p && p.status === 'draft') await generatePayroll(id);
    }
    setSelectedRows([]);
    await fetchAllPayroll(currentDate.getMonth() + 1, currentDate.getFullYear());
  };

  // Framer Motion Variants
  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
  const itemVariants = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };
  const bulkBarVariants = { hidden: { y: 100, opacity: 0 }, show: { y: 0, opacity: 1 } };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white p-6 md:p-10 font-sans relative">
      
      {/* Top Bar */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-8">
        <div>
          <h1 className="text-[32px] font-serif tracking-wide leading-tight">Payroll Manager</h1>
          <p className="text-gray-400 text-sm mt-1">Generate payslips, process mass payouts, and track taxes.</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center bg-[#111118] border border-[#1E1E2E] rounded-lg p-1">
            <button onClick={handlePrevMonth} className="p-1.5 text-gray-400 hover:text-white rounded-md transition-colors"><ChevronLeft size={18}/></button>
            <span className="w-36 text-center font-medium font-sans text-sm tracking-wide">{format(currentDate, 'MMMM yyyy')}</span>
            <button onClick={handleNextMonth} className="p-1.5 text-gray-400 hover:text-white rounded-md transition-colors"><ChevronRight size={18}/></button>
          </div>

          <button className="flex items-center gap-2 px-5 py-2.5 bg-[#F59E0B] hover:bg-[#D97706] text-white rounded-lg transition-all font-bold text-sm shadow-lg shadow-[#F59E0B]/20 uppercase tracking-wider">
            <Play size={16} fill="currentColor" />
            <span>Run Payroll</span>
          </button>

          <button className="flex items-center gap-2 px-4 py-2.5 bg-[#1E1E2E] hover:bg-[#2A2A35] border border-[#1E1E2E] text-white rounded-lg transition-all font-medium text-sm shadow-sm">
            <Download size={16} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        <StatCard title="Total Payroll (Net)" value={stats.totalPayroll} icon={DollarSign} colorClass="text-[#6366F1] bg-[#6366F1]" prefix="$" />
        <StatCard title="Employees Paid" value={stats.paidCount} icon={CheckCircle2} colorClass="text-[#10B981] bg-[#10B981]" />
        <StatCard title="Pending Payouts" value={stats.pendingCount} icon={Clock} colorClass="text-[#F59E0B] bg-[#F59E0B]" />
        <StatCard title="Total Tax Deducted" value={stats.totalTax} icon={Percent} colorClass="text-[#EF4444] bg-[#EF4444]" prefix="$" />
      </div>

      {/* MAIN TABLE */}
      <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl overflow-hidden shadow-2xl mb-20">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#0A0A0F] border-b border-[#1E1E2E] text-gray-400 font-medium tracking-wide">
              <tr>
                <th className="px-6 py-4 w-12">
                  <input 
                    type="checkbox" 
                    className="accent-[#6366F1] w-4 h-4 rounded border-[#1E1E2E] bg-[#0A0A0F] cursor-pointer"
                    onChange={toggleSelectAll}
                    checked={selectedRows.length === payrollData.length && payrollData.length > 0}
                  />
                </th>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4 text-right">Basic</th>
                <th className="px-6 py-4 text-right">HRA</th>
                <th className="px-6 py-4 text-right">Allowances</th>
                <th className="px-6 py-4 text-right">Deductions</th>
                <th className="px-6 py-4 text-right">Tax (10%)</th>
                <th className="px-6 py-4 text-right">Net Pay</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            
            <motion.tbody 
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="divide-y divide-[#1E1E2E]/50"
            >
              {loading ? (
                <tr>
                  <td colSpan="10" className="px-6 py-12">
                    <div className="space-y-4">
                      {[1,2,3,4].map(i => (
                        <div key={i} className="h-14 w-full bg-[#1E1E2E] animate-pulse rounded-lg"></div>
                      ))}
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="10" className="px-6 py-12 text-center text-red-500 font-sans">
                    Failed to load payroll data.
                  </td>
                </tr>
              ) : payrollData.length === 0 ? (
                <tr>
                  <td colSpan="10" className="px-6 py-12 text-center text-gray-500 font-sans">
                    No payroll data found.
                  </td>
                </tr>
              ) : payrollData.map((emp) => (
                <motion.tr key={emp.id} variants={itemVariants} className="hover:bg-[#1E1E2E]/20 transition-colors group">
                  <td className="px-6 py-4">
                    <input 
                      type="checkbox" 
                      className="accent-[#6366F1] w-4 h-4 rounded border-[#1E1E2E] bg-[#0A0A0F] cursor-pointer"
                      checked={selectedRows.includes(emp.id)}
                      onChange={() => toggleSelectRow(emp.id)}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={emp.avatar || 'https://i.pravatar.cc/150'} alt="" className="w-9 h-9 rounded-full border border-[#1E1E2E] object-cover" />
                      <div>
                        <p className="font-medium text-white">{emp.name || 'Unknown'}</p>
                        <p className="text-[11px] text-gray-500 uppercase tracking-wider">{emp.designation}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-gray-300">${emp.basic}</td>
                  <td className="px-6 py-4 text-right font-mono text-gray-300">${emp.hra}</td>
                  <td className="px-6 py-4 text-right font-mono text-[#10B981]">+${emp.allowances}</td>
                  <td className="px-6 py-4 text-right font-mono text-[#EF4444]">-${emp.deductions}</td>
                  <td className="px-6 py-4 text-right font-mono text-[#EF4444]">-${emp.tax}</td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-[#6366F1] text-base">${emp.net}</td>
                  <td className="px-6 py-4 text-center">
                    <Badge status={emp.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {emp.status === 'draft' && (
                        <button 
                          onClick={() => handleGenerateDraft(emp.id)}
                          className="px-3 py-1.5 text-xs font-medium text-white bg-[#1E1E2E] hover:bg-[#6366F1] rounded transition-colors"
                        >
                          Generate
                        </button>
                      )}
                      {emp.status === 'processed' && (
                        <button 
                          onClick={() => handleMarkAsPaid(emp.id)}
                          className="px-3 py-1.5 text-xs font-medium text-[#10B981] bg-[#10B981]/10 hover:bg-[#10B981] hover:text-white rounded transition-colors"
                        >
                          Mark Paid
                        </button>
                      )}
                      {emp.status === 'paid' && (
                        <button 
                          onClick={() => setPreviewRecord(emp)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#1E1E2E] hover:bg-[#313142] rounded transition-colors"
                        >
                          <FileText size={14} />
                          View Slip
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </motion.tbody>
          </table>
        </div>
      </div>

      {/* BULK ACTIONS BAR (Fixed Bottom) */}
      <AnimatePresence>
        {selectedRows.length > 0 && (
          <motion.div 
            variants={bulkBarVariants}
            initial="hidden" animate="show" exit="hidden"
            className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-[#6366F1] text-white px-6 py-4 rounded-xl shadow-[0_20px_50px_rgba(99,102,241,0.3)] flex items-center gap-6 z-40 border border-[#818cf8]/30"
          >
            <div className="flex items-center gap-3 border-r border-white/20 pr-6">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white text-[#6366F1] font-mono font-bold text-sm">
                {selectedRows.length}
              </span>
              <span className="font-medium tracking-wide">Records Selected</span>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={handleBulkGenerate}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
              >
                Generate Drafts
              </button>
              <button 
                onClick={handleBulkMarkPaid}
                className="flex items-center gap-2 px-4 py-2 bg-white text-[#6366F1] hover:bg-gray-100 rounded-lg text-sm font-bold transition-colors shadow-sm"
              >
                <CheckCircle2 size={16} />
                Mark as Paid
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PAYSLIP PREVIEW MODAL */}
      <AnimatePresence>
        {previewRecord && (
          <PayslipModal record={previewRecord} currentDate={currentDate} onClose={() => setPreviewRecord(null)} />
        )}
      </AnimatePresence>

    </div>
  );
}
