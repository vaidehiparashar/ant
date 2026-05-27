import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Filter, Plus, X, Edit, Shield, 
  UserX, UserCheck, Download, Users, AlertTriangle, CheckCircle2
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { useEmployeeStore } from '../../store';

// --- ZOD SCHEMAS ---
const baseSchema = z.object({
  name: z.string().min(2, "Name required"),
  email: z.string().email("Invalid email"),
  role: z.enum(['admin', 'hr', 'employee', 'intern']),
  department: z.string().min(2, "Department required"),
  designation: z.string().min(2, "Designation required"),
  joinDate: z.string().min(1, "Join date required"),
  phone: z.string().min(10, "Valid phone required"),
});

// We refine schema based on role dynamically in the component or make them optional
const userSchema = baseSchema.extend({
  password: z.string().optional(), // Only required on create, handled manually
  basicSalary: z.string().optional(),
  college: z.string().optional(),
  appliedRole: z.string().optional(),
  interviewDate: z.string().optional(),
});

// --- HELPER COMPONENTS ---
const RoleBadge = ({ role }) => {
  switch(role) {
    case 'admin': return <span className="bg-purple-500/20 text-purple-400 border border-purple-500/30 px-2.5 py-1 rounded-full text-[10px] font-sans font-bold uppercase tracking-widest flex w-max items-center gap-1.5"><Shield size={10} /> Admin</span>;
    case 'hr': return <span className="bg-[#6366F1]/20 text-[#6366F1] border border-[#6366F1]/30 px-2.5 py-1 rounded-full text-[10px] font-sans font-bold uppercase tracking-widest flex w-max">HR</span>;
    case 'employee': return <span className="bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30 px-2.5 py-1 rounded-full text-[10px] font-sans font-bold uppercase tracking-widest flex w-max">Employee</span>;
    case 'intern': return <span className="bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30 px-2.5 py-1 rounded-full text-[10px] font-sans font-bold uppercase tracking-widest flex w-max">Intern</span>;
    default: return null;
  }
};

const StatusBadge = ({ status }) => {
  if (status === 'active') return <span className="bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30 px-2 py-0.5 rounded text-xs font-sans font-medium uppercase tracking-wider">Active</span>;
  return <span className="bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30 px-2 py-0.5 rounded text-xs font-sans font-medium uppercase tracking-wider">Inactive</span>;
};

// --- MODALS ---
const UserFormModal = ({ user, onClose, onSave }) => {
  const isEditing = !!user;
  
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(userSchema),
    defaultValues: user ? {
      name: user.name, email: user.email, role: user.role, 
      department: user.department, designation: 'Staff', 
      joinDate: user.joinDate, phone: '555-0199',
      basicSalary: '5000', college: 'State University', appliedRole: 'Junior Dev', interviewDate: '2026-05-01'
    } : { role: 'employee' }
  });

  const selectedRole = watch('role');

  const onSubmit = (data) => {
    onSave(data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-[#111118] border border-[#1E1E2E] rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col overflow-hidden max-h-[90vh]"
      >
        <div className="px-6 py-5 border-b border-[#1E1E2E] flex justify-between items-center bg-[#0A0A0F]/50">
          <h2 className="text-2xl font-serif text-white">{isEditing ? 'Edit User Profile' : 'Create New User'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white bg-[#1E1E2E] p-2 rounded-full transition-colors"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
          <form id="user-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6 font-sans">
            
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest border-b border-[#1E1E2E] pb-2">Core Identity</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-400 uppercase">Full Name</label>
                <input {...register('name')} className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-2.5 text-white focus:border-[#6366F1] transition-all" />
                {errors.name && <p className="text-[#EF4444] text-xs mt-1">{errors.name.message}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-400 uppercase">Email Address</label>
                <input {...register('email')} className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-2.5 text-white focus:border-[#6366F1] transition-all" />
                {errors.email && <p className="text-[#EF4444] text-xs mt-1">{errors.email.message}</p>}
              </div>
              {!isEditing && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-400 uppercase">Initial Password</label>
                  <input type="password" {...register('password')} className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-2.5 text-white focus:border-[#6366F1] transition-all" />
                </div>
              )}
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-400 uppercase">Phone</label>
                <input {...register('phone')} className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-2.5 text-white focus:border-[#6366F1] transition-all font-mono text-sm" />
              </div>
            </div>

            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest border-b border-[#1E1E2E] pb-2 pt-4">Employment Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-400 uppercase">Role Level</label>
                <select {...register('role')} className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-2.5 text-white focus:border-[#6366F1] transition-all appearance-none cursor-pointer">
                  <option value="employee">Employee</option>
                  <option value="intern">Intern</option>
                  <option value="hr">HR Manager</option>
                  <option value="admin">System Admin</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-400 uppercase">Department</label>
                <select {...register('department')} className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-2.5 text-white focus:border-[#6366F1] transition-all appearance-none cursor-pointer">
                  <option value="Engineering">Engineering</option>
                  <option value="Design">Design</option>
                  <option value="Human Resources">Human Resources</option>
                  <option value="Management">Management</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-400 uppercase">Designation</label>
                <input {...register('designation')} className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-2.5 text-white focus:border-[#6366F1] transition-all" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-400 uppercase">Join Date</label>
                <input type="date" {...register('joinDate')} className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-2.5 text-white focus:border-[#6366F1] transition-all [color-scheme:dark]" />
              </div>
            </div>

            {/* CONDITIONAL FIELDS BASED ON ROLE */}
            <AnimatePresence mode="popLayout">
              {selectedRole === 'intern' ? (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-[#F59E0B] uppercase">College / Univ</label>
                      <input {...register('college')} className="w-full bg-[#F59E0B]/5 border border-[#F59E0B]/30 rounded-lg px-4 py-2.5 text-white focus:border-[#F59E0B] transition-all" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-[#F59E0B] uppercase">Applied Role</label>
                      <input {...register('appliedRole')} className="w-full bg-[#F59E0B]/5 border border-[#F59E0B]/30 rounded-lg px-4 py-2.5 text-white focus:border-[#F59E0B] transition-all" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-[#F59E0B] uppercase">Interview Date</label>
                      <input type="date" {...register('interviewDate')} className="w-full bg-[#F59E0B]/5 border border-[#F59E0B]/30 rounded-lg px-4 py-2.5 text-white focus:border-[#F59E0B] transition-all [color-scheme:dark]" />
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-[#10B981] uppercase">Basic Salary ($)</label>
                      <input type="number" {...register('basicSalary')} className="w-full bg-[#10B981]/5 border border-[#10B981]/30 rounded-lg px-4 py-2.5 text-white font-mono focus:border-[#10B981] transition-all" />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </form>
        </div>

        <div className="px-6 py-5 bg-[#0A0A0F]/50 border-t border-[#1E1E2E] flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-gray-400 hover:text-white bg-[#1E1E2E] rounded-lg transition-colors">Cancel</button>
          <button type="submit" form="user-form" className="px-6 py-2.5 text-sm font-medium text-white bg-[#6366F1] hover:bg-[#4F46E5] rounded-lg transition-colors shadow-lg shadow-[#6366F1]/20">
            {isEditing ? 'Save Changes' : 'Create User'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const RoleChangeModal = ({ user, onClose, onConfirm }) => {
  const [newRole, setNewRole] = useState(user.role);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-[#111118] border border-[#1E1E2E] rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden"
      >
        <div className="p-6">
          <h2 className="text-2xl font-serif text-white mb-6">Change Security Role</h2>
          
          <div className="bg-[#0A0A0F] border border-[#1E1E2E] rounded-xl p-4 mb-6 flex items-center gap-4">
            <img src={user.avatar} className="w-12 h-12 rounded-full border border-[#1E1E2E]" alt=""/>
            <div>
              <p className="text-white font-medium">{user.name}</p>
              <div className="mt-1"><RoleBadge role={user.role} /></div>
            </div>
          </div>

          <div className="space-y-2 mb-6">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Select New Role</label>
            <select value={newRole} onChange={e => setNewRole(e.target.value)} className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-sm text-white focus:border-[#6366F1] transition-all appearance-none cursor-pointer">
              <option value="employee">Employee</option>
              <option value="intern">Intern</option>
              <option value="hr">HR Manager</option>
              <option value="admin">System Admin</option>
            </select>
          </div>

          <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-lg p-4 flex gap-3 text-[#F59E0B]">
            <AlertTriangle size={20} className="shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed">
              <strong>Warning:</strong> Changing this user's role will immediately update all platform access permissions and reconfigure their dashboard layout upon next login.
            </p>
          </div>
        </div>

        <div className="px-6 py-4 bg-[#0A0A0F]/50 border-t border-[#1E1E2E] flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white bg-[#1E1E2E] rounded-lg">Cancel</button>
          <button onClick={() => onConfirm(newRole)} className="px-4 py-2 text-sm font-medium text-white bg-[#6366F1] hover:bg-[#4F46E5] rounded-lg">Update Role</button>
        </div>
      </motion.div>
    </div>
  );
};


// --- MAIN PAGE COMPONENT ---
export default function UserManagement() {
  const { employees: users, loading, error, fetchEmployees, updateEmployee, deactivateEmployee } = useEmployeeStore();
  
  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState([]);

  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [roleChangeUser, setRoleChangeUser] = useState(null);

  // Derived Stats
  const stats = useMemo(() => {
    let active = 0, inactive = 0;
    const byRole = { admin: 0, hr: 0, employee: 0, intern: 0 };
    users.forEach(u => {
      if (u.status === 'active') active++; else inactive++;
      byRole[u.role]++;
    });
    return { total: users.length, active, inactive, byRole };
  }, [users]);

  // Filtering
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      const matchStatus = statusFilter === 'all' || u.status === statusFilter;
      return matchSearch && matchRole && matchStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  // Handlers
  const toggleSelectAll = (e) => setSelectedIds(e.target.checked ? filteredUsers.map(u => u.id) : []);
  const toggleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  const handleToggleStatus = async (id) => {
    await deactivateEmployee(id); // assuming toggle logic is handled or just deactivates
  };

  const handleSaveUser = async (data) => {
    if (editingUser) {
      await updateEmployee(editingUser.id, data);
    } else {
      await updateEmployee('new', data); // mock mapping to create user
    }
    setIsFormOpen(false);
  };

  const handleRoleChangeConfirm = async (newRole) => {
    await updateEmployee(roleChangeUser.id, { role: newRole });
    setRoleChangeUser(null);
  };

  const handleBulkDeactivate = async () => {
    for (const id of selectedIds) {
      await deactivateEmployee(id);
    }
    setSelectedIds([]);
  };

  const handleBulkExport = () => {
    const csvContent = "Name,Email,Role,Department,Status\\n" + 
      users.filter(u => selectedIds.includes(u.id))
      .map(u => `${u.name},${u.email},${u.role},${u.department},${u.status}`)
      .join("\\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "users_export.csv";
    link.click();
    setSelectedIds([]);
  };

  // Framer Motion
  const containerVars = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
  const itemVars = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white p-6 md:p-10 font-sans relative">
      
      {/* HEADER */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-8">
        <div>
          <h1 className="text-[32px] font-serif tracking-wide leading-tight">User Management</h1>
          <p className="text-gray-400 text-sm mt-1">Administer platform access, assign security roles, and manage identities.</p>
        </div>
        
        <button 
          onClick={() => { setEditingUser(null); setIsFormOpen(true); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#6366F1] hover:bg-[#4F46E5] text-white rounded-lg transition-all font-medium text-sm shadow-lg shadow-[#6366F1]/20"
        >
          <Plus size={18} />
          Create User
        </button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-5 shadow-lg flex items-center justify-between">
          <div><p className="text-xs text-gray-500 uppercase font-bold mb-1">Total Users</p><p className="text-3xl font-serif">{stats.total}</p></div>
          <Users size={24} className="text-[#6366F1] opacity-50" />
        </div>
        <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-5 shadow-lg flex items-center justify-between">
          <div><p className="text-xs text-[#10B981] uppercase font-bold mb-1">Active</p><p className="text-3xl font-serif">{stats.active}</p></div>
          <UserCheck size={24} className="text-[#10B981] opacity-50" />
        </div>
        <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-5 shadow-lg flex items-center justify-between">
          <div><p className="text-xs text-[#EF4444] uppercase font-bold mb-1">Inactive</p><p className="text-3xl font-serif">{stats.inactive}</p></div>
          <UserX size={24} className="text-[#EF4444] opacity-50" />
        </div>
        <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-5 shadow-lg flex flex-col justify-center gap-1.5">
          <div className="flex justify-between text-xs"><span className="text-gray-400">Admins</span><span className="font-mono text-purple-400">{stats.byRole.admin}</span></div>
          <div className="flex justify-between text-xs"><span className="text-gray-400">HR</span><span className="font-mono text-[#6366F1]">{stats.byRole.hr}</span></div>
          <div className="flex justify-between text-xs"><span className="text-gray-400">Employees</span><span className="font-mono text-[#10B981]">{stats.byRole.employee}</span></div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 bg-[#111118] p-4 rounded-xl border border-[#1E1E2E]">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input 
            type="text" placeholder="Search users by name or email..." 
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:border-[#6366F1] transition-all outline-none"
          />
        </div>
        
        <div className="flex gap-4">
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-2.5 text-sm text-white focus:border-[#6366F1] outline-none cursor-pointer">
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="hr">HR</option>
            <option value="employee">Employee</option>
            <option value="intern">Intern</option>
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-2.5 text-sm text-white focus:border-[#6366F1] outline-none cursor-pointer">
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl overflow-hidden shadow-2xl mb-24">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#0A0A0F] border-b border-[#1E1E2E] text-gray-400 font-medium tracking-wide">
              <tr>
                <th className="px-6 py-4 w-12">
                  <input 
                    type="checkbox" 
                    onChange={toggleSelectAll} 
                    checked={selectedIds.length === filteredUsers.length && filteredUsers.length > 0}
                    className="accent-[#6366F1] w-4 h-4 rounded border-[#1E1E2E] cursor-pointer"
                  />
                </th>
                <th className="px-6 py-4">User Details</th>
                <th className="px-6 py-4">Security Role</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Join Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <motion.tbody variants={containerVars} initial="hidden" animate="show" className="divide-y divide-[#1E1E2E]/50">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12">
                    <div className="space-y-4">
                      {[1,2,3,4].map(i => (
                        <div key={i} className="h-14 w-full bg-[#1E1E2E] animate-pulse rounded-lg"></div>
                      ))}
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-red-500 font-sans">
                    <AlertTriangle className="mx-auto h-12 w-12 mb-3 opacity-50" />
                    Failed to load users.
                  </td>
                </tr>
              ) : filteredUsers.map(u => (
                <motion.tr key={u.id} variants={itemVars} className="hover:bg-[#1E1E2E]/20 transition-colors group">
                  <td className="px-6 py-4">
                    <input 
                      type="checkbox" 
                      onChange={() => toggleSelect(u.id)} 
                      checked={selectedIds.includes(u.id)}
                      className="accent-[#6366F1] w-4 h-4 rounded border-[#1E1E2E] cursor-pointer"
                    />
                  </td>
                  <td className="px-6 py-4 flex items-center gap-3">
                    <img src={u.avatar} className="w-10 h-10 rounded-full border border-[#1E1E2E]" alt=""/>
                    <div>
                      <p className="font-medium text-white">{u.name}</p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4"><RoleBadge role={u.role} /></td>
                  <td className="px-6 py-4 text-gray-300">{u.department}</td>
                  <td className="px-6 py-4"><StatusBadge status={u.status} /></td>
                  <td className="px-6 py-4 text-gray-400 font-mono text-xs">{u.joinDate ? format(parseISO(u.joinDate), 'MMM dd, yyyy') : 'N/A'}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setRoleChangeUser(u)} className="p-2 text-gray-400 hover:text-[#F59E0B] hover:bg-[#1E1E2E] rounded-lg transition-colors" title="Change Role"><Shield size={16}/></button>
                      <button onClick={() => handleToggleStatus(u.id)} className={`p-2 rounded-lg transition-colors ${u.status === 'active' ? 'text-gray-400 hover:text-[#EF4444] hover:bg-[#1E1E2E]' : 'text-[#EF4444] hover:text-[#10B981] hover:bg-[#1E1E2E]'}`} title={u.status === 'active' ? "Deactivate" : "Activate"}>
                        {u.status === 'active' ? <UserX size={16}/> : <UserCheck size={16}/>}
                      </button>
                      <button onClick={() => { setEditingUser(u); setIsFormOpen(true); }} className="p-2 text-gray-400 hover:text-[#6366F1] hover:bg-[#1E1E2E] rounded-lg transition-colors" title="Edit User"><Edit size={16}/></button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </motion.tbody>
          </table>
        </div>
      </div>

      {/* BULK ACTIONS BAR */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-[#6366F1] text-white px-6 py-4 rounded-xl shadow-[0_20px_50px_rgba(99,102,241,0.3)] flex items-center gap-6 z-40 border border-[#818cf8]/30"
          >
            <div className="flex items-center gap-3 border-r border-white/20 pr-6">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white text-[#6366F1] font-mono font-bold text-sm">{selectedIds.length}</span>
              <span className="font-medium tracking-wide">Users Selected</span>
            </div>
            <div className="flex gap-3">
              <button onClick={handleBulkExport} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"><Download size={16} /> Export CSV</button>
              <button onClick={handleBulkDeactivate} className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-sm font-bold transition-colors shadow-sm"><UserX size={16} /> Deactivate All</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODALS */}
      <AnimatePresence>
        {isFormOpen && <UserFormModal user={editingUser} onClose={() => setIsFormOpen(false)} onSave={handleSaveUser} />}
        {roleChangeUser && <RoleChangeModal user={roleChangeUser} onClose={() => setRoleChangeUser(null)} onConfirm={handleRoleChangeConfirm} />}
      </AnimatePresence>

    </div>
  );
}
