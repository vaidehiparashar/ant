import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Plus, X, Edit, Eye, UserMinus, MoreVertical, CheckCircle2, AlertCircle, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { useEmployeeStore } from '../../store';

// --- ZOD SCHEMA ---
const employeeSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().min(10, "Phone number required"),
  designation: z.string().min(2, "Designation required"),
  department: z.string().min(2, "Department required"),
  joinDate: z.string().min(1, "Join Date required"),
  basicSalary: z.string().min(1, "Basic Salary required"),
  hra: z.string().min(1, "HRA required"),
  allowances: z.string().min(1, "Allowances required"),
  deductions: z.string().min(1, "Deductions required"),
});

// --- HELPER COMPONENTS ---
const Badge = ({ value, type = 'score' }) => {
  let color = 'bg-[#1E1E2E] text-gray-300';
  
  if (type === 'score') {
    if (value >= 80) color = 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30';
    else if (value >= 60) color = 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30';
    else color = 'bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30';
    return <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-medium ${color}`}>{value}%</span>;
  }
  
  if (type === 'status') {
    if (value === 'Active') color = 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30';
    else color = 'bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30';
    return <span className={`px-2.5 py-1 rounded-full text-xs font-sans font-medium ${color}`}>{value}</span>;
  }

  return <span className={`px-2.5 py-1 rounded-full text-xs font-sans ${color}`}>{value}</span>;
};

// --- DRAWER COMPONENT ---
const EmployeeDrawer = ({ employee, onClose }) => {
  const [activeTab, setActiveTab] = useState('Overview');
  const tabs = ['Overview', 'Attendance', 'Leaves', 'Payroll', 'Performance'];

  return (
    <>
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
      />
      <motion.div 
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed top-0 right-0 w-full max-w-[480px] h-full bg-[#111118] border-l border-[#1E1E2E] z-50 flex flex-col shadow-2xl"
      >
        {/* Drawer Header */}
        <div className="p-6 border-b border-[#1E1E2E] flex justify-between items-start bg-[#0A0A0F]/50">
          <div className="flex items-center gap-4">
            <img src={employee.avatar} alt={employee.name} className="w-16 h-16 rounded-full border-2 border-[#6366F1]/50 object-cover" />
            <div>
              <h2 className="text-2xl font-serif text-white">{employee.name}</h2>
              <p className="text-sm text-gray-400 font-sans">{employee.designation} • {employee.department}</p>
              <div className="mt-2"><Badge value={employee.status} type="status" /></div>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors bg-[#1E1E2E] p-2 rounded-full">
            <X size={20} />
          </button>
        </div>

        {/* Drawer Tabs */}
        <div className="flex border-b border-[#1E1E2E] px-2 overflow-x-auto hide-scrollbar bg-[#0A0A0F]/30">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium font-sans whitespace-nowrap transition-colors relative ${
                activeTab === tab ? 'text-[#6366F1]' : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <motion.div layoutId="drawer-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6366F1]" />
              )}
            </button>
          ))}
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-6 font-sans text-gray-300">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'Overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#1E1E2E]/50 p-4 rounded-xl border border-[#1E1E2E]">
                      <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Email</p>
                      <p className="text-sm text-white truncate">{employee.email}</p>
                    </div>
                    <div className="bg-[#1E1E2E]/50 p-4 rounded-xl border border-[#1E1E2E]">
                      <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Join Date</p>
                      <p className="text-sm font-mono text-white">
                        {format(parseISO(employee.joinDate), 'dd MMM yyyy')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-[#1E1E2E]/50 p-5 rounded-xl border border-[#1E1E2E]">
                    <h3 className="text-white font-serif text-xl mb-4">Quick Stats</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1 text-sm">
                          <span>Attendance Rate</span>
                          <span className="font-mono text-[#10B981]">{employee.attendance}%</span>
                        </div>
                        <div className="w-full bg-[#0A0A0F] rounded-full h-2">
                          <div className="bg-[#10B981] h-2 rounded-full" style={{ width: `${employee.attendance}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1 text-sm">
                          <span>Performance Score</span>
                          <span className="font-mono text-[#6366F1]">{employee.performance}%</span>
                        </div>
                        <div className="w-full bg-[#0A0A0F] rounded-full h-2">
                          <div className="bg-[#6366F1] h-2 rounded-full" style={{ width: `${employee.performance}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'Attendance' && (
                <div className="space-y-6">
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={MOCK_ATTENDANCE_DATA}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1E1E2E" vertical={false} />
                        <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip 
                          cursor={{fill: '#1E1E2E', opacity: 0.4}}
                          contentStyle={{ backgroundColor: '#111118', border: '1px solid #1E1E2E', borderRadius: '8px' }}
                        />
                        <Bar dataKey="hours" fill="#6366F1" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {activeTab === 'Performance' && (
                <div className="space-y-6">
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={MOCK_PERFORMANCE_DATA}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1E1E2E" vertical={false} />
                        <XAxis dataKey="month" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis domain={[0, 100]} stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#111118', border: '1px solid #1E1E2E', borderRadius: '8px' }}
                        />
                        <Line type="monotone" dataKey="score" stroke="#10B981" strokeWidth={3} dot={{ fill: '#111118', stroke: '#10B981', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {activeTab === 'Payroll' && (
                <div className="space-y-4">
                  {MOCK_PAYROLL.map((pay, i) => (
                    <div key={i} className="p-4 bg-[#1E1E2E]/40 border border-[#1E1E2E] rounded-xl flex items-center justify-between">
                      <div>
                        <p className="font-medium text-white">{pay.month}</p>
                        <p className="text-xs text-gray-400 font-mono mt-1">Net: ${pay.net}</p>
                      </div>
                      <Badge value={pay.status} type="status" />
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'Leaves' && (
                <div className="text-center py-12 text-gray-500">
                  <Calendar className="mx-auto h-12 w-12 opacity-20 mb-4" />
                  <p>No recent leave requests found.</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
};

// --- MODAL COMPONENT ---
const EmployeeModal = ({ employee, onClose, onSave }) => {
  const isEditing = !!employee;
  
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(employeeSchema),
    defaultValues: employee ? {
      name: employee.name,
      email: employee.email,
      department: employee.department,
      designation: employee.designation,
      joinDate: employee.joinDate,
      phone: '123-456-7890',
      basicSalary: '5000',
      hra: '2000',
      allowances: '500',
      deductions: '200',
    } : {}
  });

  const onSubmit = (data) => {
    onSave(data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-[#111118] border border-[#1E1E2E] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        <div className="px-6 py-5 border-b border-[#1E1E2E] flex justify-between items-center bg-[#0A0A0F]/50">
          <h2 className="text-2xl font-serif text-white">{isEditing ? 'Edit Employee' : 'Add New Employee'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white bg-[#1E1E2E] p-2 rounded-full transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <form id="employee-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6 font-sans">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-300">Full Name</label>
                <input {...register('name')} className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] transition-all" />
                {errors.name && <p className="text-[#EF4444] text-xs mt-1">{errors.name.message}</p>}
              </div>
              
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-300">Email Address</label>
                <input {...register('email')} className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] transition-all" />
                {errors.email && <p className="text-[#EF4444] text-xs mt-1">{errors.email.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-300">Phone Number</label>
                <input {...register('phone')} className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] transition-all font-mono text-sm" />
                {errors.phone && <p className="text-[#EF4444] text-xs mt-1">{errors.phone.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-300">Join Date</label>
                <input type="date" {...register('joinDate')} className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] transition-all font-mono text-sm [color-scheme:dark]" />
                {errors.joinDate && <p className="text-[#EF4444] text-xs mt-1">{errors.joinDate.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-300">Department</label>
                <select {...register('department')} className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] transition-all appearance-none">
                  <option value="">Select Department</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Design">Design</option>
                  <option value="Human Resources">Human Resources</option>
                  <option value="IT">IT</option>
                </select>
                {errors.department && <p className="text-[#EF4444] text-xs mt-1">{errors.department.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-300">Designation</label>
                <input {...register('designation')} className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] transition-all" />
                {errors.designation && <p className="text-[#EF4444] text-xs mt-1">{errors.designation.message}</p>}
              </div>
            </div>

            <hr className="border-[#1E1E2E]" />
            <h3 className="text-lg font-serif text-white">Payroll Configuration</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-300">Basic Salary ($)</label>
                <input type="number" {...register('basicSalary')} className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] transition-all font-mono" />
                {errors.basicSalary && <p className="text-[#EF4444] text-xs mt-1">{errors.basicSalary.message}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-300">HRA ($)</label>
                <input type="number" {...register('hra')} className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] transition-all font-mono" />
                {errors.hra && <p className="text-[#EF4444] text-xs mt-1">{errors.hra.message}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-300">Allowances ($)</label>
                <input type="number" {...register('allowances')} className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] transition-all font-mono" />
                {errors.allowances && <p className="text-[#EF4444] text-xs mt-1">{errors.allowances.message}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-300">Deductions ($)</label>
                <input type="number" {...register('deductions')} className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] transition-all font-mono" />
                {errors.deductions && <p className="text-[#EF4444] text-xs mt-1">{errors.deductions.message}</p>}
              </div>
            </div>
          </form>
        </div>

        <div className="px-6 py-4 border-t border-[#1E1E2E] bg-[#0A0A0F]/50 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-medium font-sans text-gray-300 hover:text-white bg-[#1E1E2E] rounded-lg transition-colors">
            Cancel
          </button>
          <button type="submit" form="employee-form" className="px-5 py-2.5 text-sm font-medium font-sans text-white bg-[#6366F1] hover:bg-[#4F46E5] rounded-lg transition-colors shadow-lg shadow-[#6366F1]/20">
            {isEditing ? 'Save Changes' : 'Create Employee'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// --- MAIN PAGE COMPONENT ---
export default function EmployeeList() {
  const { employees, loading, error, fetchEmployees, deactivateEmployee, updateEmployee } = useEmployeeStore();
  
  React.useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSave = async (data) => {
    // If editing, call update. If creating, call registerUser API via store.
    if (editingEmployee) {
      await updateEmployee(editingEmployee.id, data);
    } else {
      // Assuming you added a createEmployee or it uses api.registerUser directly.
      // For now, we simulate update just for UI parity if create isn't explicitly in employeeStore
      await updateEmployee('new', data); 
    }
    setIsModalOpen(false);
  };

  // Filter logic
  const filteredEmployees = useMemo(() => {
    if (!employees) return [];
    return employees.filter(emp => {
      const matchesSearch = emp.name.toLowerCase().includes(search.toLowerCase()) || 
                            emp.email.toLowerCase().includes(search.toLowerCase()) ||
                            (emp.designation && emp.designation.toLowerCase().includes(search.toLowerCase()));
      const matchesDept = deptFilter === 'All' || emp.department === deptFilter;
      const matchesStatus = statusFilter === 'All' || emp.status === statusFilter;
      
      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [search, deptFilter, statusFilter, employees]);

  // Stagger variants for table rows
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white p-6 md:p-10 font-sans">
      
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <h1 className="text-[32px] font-serif tracking-wide leading-tight">Employees</h1>
          <p className="text-gray-400 text-sm mt-1">Manage your workforce, view analytics, and update profiles.</p>
        </div>
        
        <button 
          onClick={() => { setEditingEmployee(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#6366F1] hover:bg-[#4F46E5] text-white rounded-lg transition-all font-medium text-sm shadow-lg shadow-[#6366F1]/20"
        >
          <Plus size={18} />
          <span>Add Employee</span>
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 bg-[#111118] p-4 rounded-xl border border-[#1E1E2E]">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input 
            type="text" 
            placeholder="Search by name, email, or role..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] transition-all"
          />
        </div>
        
        <div className="flex gap-4">
          <div className="relative">
            <select 
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="appearance-none bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg pl-4 pr-10 py-2.5 text-sm text-white focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] transition-all min-w-[140px]"
            >
              <option value="All">All Departments</option>
              <option value="Engineering">Engineering</option>
              <option value="Design">Design</option>
              <option value="Human Resources">HR</option>
              <option value="IT">IT</option>
            </select>
            <Filter size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          </div>

          <div className="relative">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg pl-4 pr-10 py-2.5 text-sm text-white focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] transition-all min-w-[120px]"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            <Filter size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#0A0A0F] border-b border-[#1E1E2E] text-gray-400 font-medium tracking-wide">
              <tr>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Designation</th>
                <th className="px-6 py-4">Join Date</th>
                <th className="px-6 py-4 text-center">Attendance</th>
                <th className="px-6 py-4 text-center">Performance</th>
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
                  <td colSpan="7" className="px-6 py-12">
                    <div className="space-y-4">
                      {[1,2,3,4].map(i => (
                        <div key={i} className="h-16 w-full bg-[#1E1E2E] animate-pulse rounded-lg"></div>
                      ))}
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-red-500 font-sans">
                    <AlertCircle className="mx-auto h-12 w-12 mb-3 opacity-50" />
                    Failed to load employees.
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500 font-sans">
                    <UserMinus className="mx-auto h-12 w-12 opacity-20 mb-3" />
                    No employees found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <motion.tr key={emp.id} variants={itemVariants} className="hover:bg-[#1E1E2E]/20 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <img src={emp.avatar} alt="" className="w-10 h-10 rounded-full border border-[#1E1E2E] object-cover" />
                        <div>
                          <p className="font-medium text-white">{emp.name}</p>
                          <p className="text-xs text-gray-500">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-white">{emp.designation}</p>
                      <p className="text-xs text-gray-500">{emp.department}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-gray-300">
                        {emp.joinDate ? format(parseISO(emp.joinDate), 'dd MMM yyyy') : 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge value={emp.attendance} type="score" />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge value={emp.performance} type="score" />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge value={emp.status} type="status" />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => setSelectedEmployee(emp)}
                          className="p-2 text-gray-400 hover:text-white hover:bg-[#1E1E2E] rounded-lg transition-colors"
                          title="View Profile"
                        >
                          <Eye size={18} />
                        </button>
                        <button 
                          onClick={() => { setEditingEmployee(emp); setIsModalOpen(true); }}
                          className="p-2 text-gray-400 hover:text-[#6366F1] hover:bg-[#1E1E2E] rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => deactivateEmployee(emp.id)}
                          className="p-2 text-gray-400 hover:text-[#EF4444] hover:bg-[#1E1E2E] rounded-lg transition-colors"
                          title="Deactivate"
                        >
                          <UserMinus size={18} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </motion.tbody>
          </table>
        </div>
      </div>

      {/* Drawer Overlay */}
      <AnimatePresence>
        {selectedEmployee && (
          <EmployeeDrawer employee={selectedEmployee} onClose={() => setSelectedEmployee(null)} />
        )}
      </AnimatePresence>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <EmployeeModal employee={editingEmployee} onClose={() => setIsModalOpen(false)} onSave={handleSave} />
        )}
      </AnimatePresence>

    </div>
  );
}
