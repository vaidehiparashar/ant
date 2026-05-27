import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Plus, X, CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useLeaveStore } from '../../store/leaveStore';
import { useAuthStore } from '../../store/authStore';
import { format, parseISO } from 'date-fns';

const StatusBadge = ({ status }) => {
  switch(status) {
    case 'approved': return <span className="bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30 px-2.5 py-1 rounded-full text-xs font-sans font-medium uppercase tracking-wider flex items-center gap-1 w-max"><CheckCircle2 size={12}/> Approved</span>;
    case 'pending': return <span className="bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30 px-2.5 py-1 rounded-full text-xs font-sans font-medium uppercase tracking-wider flex items-center gap-1 w-max"><Clock size={12}/> Pending</span>;
    case 'rejected': return <span className="bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30 px-2.5 py-1 rounded-full text-xs font-sans font-medium uppercase tracking-wider flex items-center gap-1 w-max"><XCircle size={12}/> Rejected</span>;
    default: return null;
  }
};

const LeaveModal = ({ onClose, onSave }) => {
  const { register, handleSubmit, formState: { errors } } = useForm();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-[#111118] border border-[#1E1E2E] rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden"
      >
        <div className="px-6 py-5 border-b border-[#1E1E2E] flex justify-between items-center bg-[#0A0A0F]/50">
          <h2 className="text-xl font-serif text-white">Apply for Leave</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white bg-[#1E1E2E] p-2 rounded-full transition-colors"><X size={16} /></button>
        </div>
        <div className="p-6">
          <form id="leave-form" onSubmit={handleSubmit(onSave)} className="space-y-4 font-sans">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-400 uppercase">Leave Type</label>
              <select {...register('type', { required: true })} className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-2.5 text-white focus:border-[#6366F1] transition-all appearance-none cursor-pointer">
                <option value="annual">Annual Leave</option>
                <option value="sick">Sick Leave</option>
                <option value="casual">Casual Leave</option>
                <option value="unpaid">Unpaid Leave</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-400 uppercase">Start Date</label>
                <input type="date" {...register('startDate', { required: true })} className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-2.5 text-white focus:border-[#6366F1] transition-all [color-scheme:dark]" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-400 uppercase">End Date</label>
                <input type="date" {...register('endDate', { required: true })} className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-2.5 text-white focus:border-[#6366F1] transition-all [color-scheme:dark]" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-400 uppercase">Reason</label>
              <textarea {...register('reason', { required: true })} rows={3} className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-2.5 text-white focus:border-[#6366F1] transition-all resize-none" placeholder="Briefly describe your reason for leave..."></textarea>
            </div>
          </form>
        </div>
        <div className="px-6 py-4 bg-[#0A0A0F]/50 border-t border-[#1E1E2E] flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white bg-[#1E1E2E] rounded-lg">Cancel</button>
          <button type="submit" form="leave-form" className="px-4 py-2 text-sm font-medium text-white bg-[#6366F1] hover:bg-[#4F46E5] rounded-lg">Submit Request</button>
        </div>
      </motion.div>
    </div>
  );
};

export default function MyLeaves() {
  const { user } = useAuthStore();
  const { myLeaves, balance, loading, error, fetchMyLeaves, fetchBalance, applyLeave, rejectLeave } = useLeaveStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      fetchMyLeaves();
      fetchBalance(user.uid);
    }
  }, [user, fetchMyLeaves, fetchBalance]);

  const handleApply = async (data) => {
    await applyLeave({ ...data, uid: user.uid, status: 'pending', appliedOn: new Date().toISOString() });
    setIsModalOpen(false);
  };

  const handleCancel = async (id) => {
    if (window.confirm("Are you sure you want to cancel this leave request?")) {
      await rejectLeave(id, "Cancelled by user");
      fetchMyLeaves(); // refresh
    }
  };

  // Safe parsing
  const safeBalance = balance || { annual: 0, sick: 0, casual: 0, unpaid: 0 };
  const safeLeaves = myLeaves || [];

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white p-6 md:p-10 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <h1 className="text-[32px] font-serif tracking-wide leading-tight">My Leaves</h1>
          <p className="text-gray-400 text-sm mt-1">Manage your time off, view balances, and apply for leaves.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 bg-[#6366F1] hover:bg-[#4F46E5] text-white rounded-lg transition-all font-medium text-sm shadow-lg shadow-[#6366F1]/20">
          <Plus size={18} /> Apply Leave
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl flex items-center gap-3">
          <AlertCircle size={20} /> Failed to load leave data.
        </div>
      )}

      {loading && !myLeaves.length ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[1,2,3,4].map(i => <div key={i} className="h-28 bg-[#1E1E2E] animate-pulse rounded-xl"></div>)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-5">
            <p className="text-xs text-gray-500 uppercase font-bold mb-1">Annual</p>
            <p className="text-3xl font-serif text-[#10B981]">{safeBalance.annual || 14}<span className="text-sm font-sans text-gray-500 ml-1">days left</span></p>
          </div>
          <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-5">
            <p className="text-xs text-gray-500 uppercase font-bold mb-1">Sick</p>
            <p className="text-3xl font-serif text-[#F59E0B]">{safeBalance.sick || 7}<span className="text-sm font-sans text-gray-500 ml-1">days left</span></p>
          </div>
          <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-5">
            <p className="text-xs text-gray-500 uppercase font-bold mb-1">Casual</p>
            <p className="text-3xl font-serif text-[#6366F1]">{safeBalance.casual || 5}<span className="text-sm font-sans text-gray-500 ml-1">days left</span></p>
          </div>
          <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-5">
            <p className="text-xs text-gray-500 uppercase font-bold mb-1">Unpaid</p>
            <p className="text-3xl font-serif text-gray-400">{safeBalance.unpaid || 0}<span className="text-sm font-sans text-gray-500 ml-1">days taken</span></p>
          </div>
        </div>
      )}

      <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-[#1E1E2E] bg-[#0A0A0F]/50">
          <h2 className="text-lg font-serif">Leave History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#0A0A0F] border-b border-[#1E1E2E] text-gray-400 font-medium tracking-wide">
              <tr>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Duration</th>
                <th className="px-6 py-4">Reason</th>
                <th className="px-6 py-4">Applied On</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E1E2E]/50">
              {loading && safeLeaves.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12">
                    <div className="space-y-4">
                      {[1,2,3].map(i => <div key={i} className="h-10 w-full bg-[#1E1E2E] animate-pulse rounded-lg"></div>)}
                    </div>
                  </td>
                </tr>
              ) : safeLeaves.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    <Calendar className="mx-auto h-12 w-12 opacity-20 mb-3" />
                    No leave history found.
                  </td>
                </tr>
              ) : safeLeaves.map(leave => (
                <tr key={leave.id} className="hover:bg-[#1E1E2E]/20 transition-colors">
                  <td className="px-6 py-4 capitalize font-medium">{leave.type}</td>
                  <td className="px-6 py-4 font-mono text-gray-300">
                    {leave.startDate} <span className="text-gray-500 mx-1">→</span> {leave.endDate}
                  </td>
                  <td className="px-6 py-4 text-gray-400 truncate max-w-[200px]">{leave.reason}</td>
                  <td className="px-6 py-4 font-mono text-xs text-gray-500">{leave.appliedOn ? format(parseISO(leave.appliedOn), 'MMM dd, yyyy') : '-'}</td>
                  <td className="px-6 py-4"><StatusBadge status={leave.status} /></td>
                  <td className="px-6 py-4 text-right">
                    {leave.status === 'pending' && (
                      <button onClick={() => handleCancel(leave.id)} className="text-xs text-red-500 hover:bg-red-500/10 px-3 py-1.5 rounded transition-colors font-medium">Cancel</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && <LeaveModal onClose={() => setIsModalOpen(false)} onSave={handleApply} />}
      </AnimatePresence>
    </div>
  );
}
