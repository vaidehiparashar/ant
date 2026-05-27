import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, FileText, ChevronDown, CheckCircle2, 
  X, Banknote, CalendarDays
} from 'lucide-react';
import { format, subMonths } from 'date-fns';
import { generatePayslip } from '../../services/pdfService';

import { usePayrollStore } from '../../store/payrollStore';
import { useAuthStore } from '../../store/authStore';

const CURRENT_YEAR = new Date().getFullYear();
const AVAILABLE_YEARS = [CURRENT_YEAR.toString(), (CURRENT_YEAR - 1).toString(), (CURRENT_YEAR - 2).toString()];

// --- HELPER COMPONENT ---
const StatusBadge = ({ status }) => {
  switch(status) {
    case 'paid': 
      return <span className="bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30 px-2.5 py-1 rounded-md text-[10px] font-sans font-bold uppercase tracking-widest flex items-center gap-1"><CheckCircle2 size={12}/> Paid</span>;
    case 'processed': 
      return <span className="bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30 px-2.5 py-1 rounded-md text-[10px] font-sans font-bold uppercase tracking-widest">Processed</span>;
    case 'draft': 
      return <span className="bg-[#1E1E2E] text-gray-400 border border-gray-600 px-2.5 py-1 rounded-md text-[10px] font-sans font-bold uppercase tracking-widest">Draft</span>;
    default: return null;
  }
};

// --- MODAL COMPONENT ---
const PayslipModal = ({ payslip, employee, onClose, onDownload }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white text-gray-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <div>
            <h2 className="text-xl font-serif font-bold text-gray-900">Payslip Breakdown</h2>
            <p className="text-sm text-gray-500 font-sans">{payslip.month} {payslip.year}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 bg-gray-200 p-2 rounded-full transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 font-sans bg-white custom-scrollbar">
          
          {/* Header Info */}
          <div className="flex justify-between items-end mb-8 pb-6 border-b border-gray-200">
            <div>
              <h1 className="text-2xl font-serif font-bold text-indigo-600 tracking-wide mb-1">antHR</h1>
              <p className="text-sm text-gray-500">{employee.name}</p>
              <p className="text-sm text-gray-500">{employee.designation}</p>
              <p className="text-xs text-gray-400 mt-1">ID: {employee.id}</p>
            </div>
            <div className="text-right">
              <StatusBadge status={payslip.status} />
              <p className="text-sm text-gray-500 mt-2 font-mono">{payslip.month} {payslip.year}</p>
            </div>
          </div>

          {/* Tables */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Earnings */}
            <div>
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-3 pb-2 border-b-2 border-emerald-500 inline-block">Earnings</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Basic Salary</span>
                  <span className="font-mono text-gray-900">${payslip.basic.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">House Rent Allowance</span>
                  <span className="font-mono text-gray-900">${payslip.hra.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Special Allowances</span>
                  <span className="font-mono text-gray-900">${payslip.allowances.toFixed(2)}</span>
                </div>
              </div>
              <div className="flex justify-between text-sm font-bold mt-4 pt-3 border-t border-gray-200">
                <span className="text-gray-800">Gross Earnings</span>
                <span className="font-mono text-emerald-600">${payslip.gross.toFixed(2)}</span>
              </div>
            </div>

            {/* Deductions */}
            <div>
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-3 pb-2 border-b-2 border-red-500 inline-block">Deductions</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Income Tax</span>
                  <span className="font-mono text-red-600">-${payslip.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Provident Fund (PF)</span>
                  <span className="font-mono text-red-600">-${payslip.pf.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Other Deductions</span>
                  <span className="font-mono text-red-600">-${payslip.otherDeductions.toFixed(2)}</span>
                </div>
              </div>
              <div className="flex justify-between text-sm font-bold mt-4 pt-3 border-t border-gray-200">
                <span className="text-gray-800">Total Deductions</span>
                <span className="font-mono text-red-600">-${payslip.totalDeductions.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Net Pay */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 flex justify-between items-center">
            <span className="font-bold text-indigo-900 uppercase tracking-widest text-sm">Net Pay Transfer</span>
            <span className="text-3xl font-mono font-bold text-indigo-700">${payslip.net.toFixed(2)}</span>
          </div>

        </div>

        <div className="px-6 py-5 bg-gray-50 border-t border-gray-200 flex justify-end gap-4">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-medium font-sans text-gray-600 hover:text-gray-900 transition-colors">
            Close
          </button>
          <button 
            onClick={() => onDownload(payslip)} 
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium font-sans text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-md shadow-indigo-600/20"
          >
            <Download size={16} />
            <span>Download PDF</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// --- MAIN PAGE COMPONENT ---
export default function MyPayslips() {
  const { user } = useAuthStore();
  const { myPayroll: MOCK_PAYSLIPS, loading, error, fetchMyPayroll } = usePayrollStore();

  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR.toString());
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchMyPayroll();
  }, [fetchMyPayroll]);

  // Filter payslips based on selected year
  const filteredPayslips = useMemo(() => {
    return (MOCK_PAYSLIPS || []).filter(ps => ps.year === selectedYear);
  }, [selectedYear, MOCK_PAYSLIPS]);

  // Calculate total earned this year
  const totalEarned = useMemo(() => {
    return filteredPayslips.reduce((acc, curr) => acc + (curr.status === 'paid' ? curr.net : 0), 0);
  }, [filteredPayslips]);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleDownloadPDF = async (payslip) => {
    setToast({ message: `Downloading payslip for ${payslip.month} ${payslip.year}...` });
    
    await generatePayslip(user || { name: 'Unknown', id: '000', designation: 'Employee' }, payslip);
    
    // Close modal if open
    if (selectedPayslip) setSelectedPayslip(null);
  };

  // Framer Motion Variants
  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white p-6 md:p-10 font-sans relative">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h1 className="text-[32px] font-serif tracking-wide leading-tight">My Payslips</h1>
          <p className="text-gray-400 text-sm mt-1">View, download, and track your monthly salary history.</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="appearance-none bg-[#111118] border border-[#1E1E2E] rounded-lg pl-4 pr-10 py-2.5 text-sm font-medium text-white focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] transition-all cursor-pointer"
            >
              {AVAILABLE_YEARS.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* STATISTIC CARD */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-[#111118] border border-[#1E1E2E] rounded-2xl p-6 md:p-8 shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 relative overflow-hidden"
      >
        <div className="absolute right-0 top-0 w-64 h-64 bg-[#6366F1]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        
        <div className="relative z-10 flex items-center gap-4">
          <div className="p-4 rounded-xl bg-[#6366F1]/10 text-[#6366F1]">
            <Banknote size={32} />
          </div>
          <div>
            <p className="text-sm font-sans text-gray-400 uppercase tracking-widest font-bold mb-1">Total Earned ({selectedYear})</p>
            <p className="text-4xl md:text-5xl font-mono text-white font-bold tracking-tight">
              $<span className="text-[#6366F1]">{totalEarned.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </p>
          </div>
        </div>
        
        <div className="relative z-10 bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 flex flex-col items-center justify-center min-w-[120px]">
          <span className="text-xs text-gray-500 uppercase tracking-wider mb-1">Payslips</span>
          <span className="text-2xl font-serif text-white">{filteredPayslips.length}</span>
        </div>
      </motion.div>

      {/* PAYSLIPS GRID */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1,2,3].map(i => (
            <div key={i} className="h-64 bg-[#111118] border border-[#1E1E2E] animate-pulse rounded-2xl p-6"></div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/30 text-red-500 rounded-2xl p-6 text-center">
          Failed to load payslips.
        </div>
      ) : filteredPayslips.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="bg-[#111118] border border-[#1E1E2E] rounded-2xl p-12 flex flex-col items-center justify-center text-center"
        >
          <CalendarDays size={48} className="text-[#1E1E2E] mb-4" />
          <h3 className="text-xl font-serif text-white mb-2">No Payslips Found</h3>
          <p className="text-gray-500 text-sm">There are no generated payslips for the year {selectedYear}.</p>
        </motion.div>
      ) : (
        <motion.div 
          variants={containerVariants} initial="hidden" animate="show"
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
        >
          {filteredPayslips.map((ps) => (
            <motion.div 
              key={ps.id} variants={itemVariants}
              className="bg-[#111118] border border-[#1E1E2E] hover:border-[#6366F1]/50 rounded-2xl p-6 transition-all duration-300 flex flex-col group relative"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-serif text-white tracking-wide">{ps.month}</h3>
                  <p className="text-xs text-gray-500 font-mono mt-1">{ps.year}</p>
                </div>
                <StatusBadge status={ps.status} />
              </div>

              <div className="mb-6">
                <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1">Net Pay</p>
                <p className="text-3xl font-mono text-[#10B981] font-bold">${ps.net.toFixed(2)}</p>
              </div>

              <div className="grid grid-cols-3 gap-2 border-t border-b border-[#1E1E2E] py-4 mb-6">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase mb-1">Basic</p>
                  <p className="font-mono text-xs text-gray-300">${ps.basic}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase mb-1">HRA</p>
                  <p className="font-mono text-xs text-gray-300">${ps.hra}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase mb-1">Deduct</p>
                  <p className="font-mono text-xs text-[#EF4444]">-${ps.totalDeductions}</p>
                </div>
              </div>

              <div className="mt-auto flex flex-col gap-3">
                <button 
                  onClick={() => handleDownloadPDF(ps)}
                  className="w-full flex items-center justify-center gap-2 bg-[#6366F1] hover:bg-[#4F46E5] text-white py-2.5 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-[#6366F1]/20"
                >
                  <Download size={16} />
                  Download PDF
                </button>
                <button 
                  onClick={() => setSelectedPayslip(ps)}
                  className="w-full flex items-center justify-center gap-2 bg-transparent border border-[#1E1E2E] hover:border-gray-500 text-gray-400 hover:text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
                >
                  <FileText size={16} />
                  View Details
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* PAYSLIP MODAL */}
      <AnimatePresence>
        {selectedPayslip && (
          <PayslipModal 
            payslip={selectedPayslip} 
            employee={user || { name: 'Unknown', id: '000', designation: 'Employee' }}
            onClose={() => setSelectedPayslip(null)} 
            onDownload={handleDownloadPDF}
          />
        )}
      </AnimatePresence>

      {/* TOAST */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-8 right-8 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border border-[#6366F1]/30 bg-[#6366F1]/10 text-white font-sans text-sm font-medium z-50 backdrop-blur-md"
          >
            <Download size={18} className="text-[#6366F1] animate-bounce" />
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
