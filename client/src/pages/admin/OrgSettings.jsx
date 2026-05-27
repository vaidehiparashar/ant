import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, Building2, CalendarDays, Banknote, 
  Mail, BellRing, Save, UploadCloud, CheckCircle2,
  Sparkles, Wand2
} from 'lucide-react';
import { useForm } from 'react-hook-form';

// --- MOCK DATA FOR FORMS ---
const INITIAL_COMPANY = {
  name: 'antHR Inc.',
  industry: 'Enterprise Software',
  founded: '2026',
  domain: '@anthr.app',
  address: '100 Silicon Ave, Suite 400, San Francisco, CA 94107',
  logo: null
};

const INITIAL_LEAVE = {
  casual: 10,
  sick: 7,
  earned: 15,
  unpaid: 30,
  carryForward: true,
  resetMonth: 'January'
};

const INITIAL_SALARY = {
  hraPercent: 40,
  taxBracket: 10,
  payDay: 28,
  currency: 'USD ($)',
  locale: 'en-US'
};

const TEMPLATE_PROMPTS = {
  'congratulations': 'Draft a warm, professional congratulations email to the employee. Acknowledge their specific achievement. Keep it under 3 paragraphs.',
  'rejection': 'Draft a polite and constructive rejection email for a candidate. Thank them for their time, provide general positive feedback, and keep the door open for future opportunities.',
  'offer': 'Draft a formal offer letter email. Welcome them to the team, specify that HR will follow up with official paperwork, and express excitement about their upcoming joining.',
};

const INITIAL_NOTIFS = {
  payrollProcessed: true,
  leaveApproved: true,
  performancePublished: true,
  monthlyDigest: false,
  attendanceAnomaly: true
};


// --- TAB COMPONENTS ---

const CompanyInfoTab = ({ showToast }) => {
  const { register, handleSubmit, watch } = useForm({ defaultValues: INITIAL_COMPANY });
  const [logoPreview, setLogoPreview] = useState('https://i.pravatar.cc/150?u=anthr_logo_mock');
  
  const onSubmit = (data) => {
    console.log("Saving Company Info", data);
    showToast("Company Information saved successfully");
  };

  const handleLogoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setLogoPreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 font-sans">
      <div className="flex items-center gap-6 pb-6 border-b border-[#1E1E2E]">
        <div className="relative group cursor-pointer">
          <div className="w-24 h-24 rounded-2xl bg-[#0A0A0F] border-2 border-dashed border-[#1E1E2E] flex items-center justify-center overflow-hidden relative group-hover:border-[#6366F1] transition-colors">
            {logoPreview ? (
              <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <Building2 size={32} className="text-gray-500" />
            )}
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <UploadCloud size={20} className="text-white mb-1" />
              <span className="text-[10px] text-white uppercase tracking-widest">Upload</span>
            </div>
            <input type="file" accept="image/*" onChange={handleLogoChange} className="absolute inset-0 opacity-0 cursor-pointer" />
          </div>
        </div>
        <div>
          <h3 className="text-lg font-serif text-white">Company Logo</h3>
          <p className="text-xs text-gray-500">Upload a 1:1 ratio image. Max 2MB.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Company Name</label>
          <input {...register('name')} className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-sm text-white focus:border-[#6366F1] transition-colors outline-none" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Industry</label>
          <input {...register('industry')} className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-sm text-white focus:border-[#6366F1] transition-colors outline-none" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Founded Year</label>
          <input type="number" {...register('founded')} className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-sm text-white focus:border-[#6366F1] transition-colors outline-none" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Auth Email Domain</label>
          <input {...register('domain')} className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-sm text-white focus:border-[#6366F1] transition-colors outline-none" placeholder="@company.com" />
        </div>
        <div className="md:col-span-2 space-y-1">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">HQ Address</label>
          <textarea {...register('address')} rows={2} className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-sm text-white focus:border-[#6366F1] transition-colors outline-none resize-none" />
        </div>
      </div>

      <div className="pt-6 border-t border-[#1E1E2E] flex justify-end">
        <button type="submit" className="flex items-center gap-2 bg-[#6366F1] hover:bg-[#4F46E5] text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-[#6366F1]/20">
          <Save size={16} /> Save Changes
        </button>
      </div>
    </form>
  );
};


const LeavePolicyTab = ({ showToast }) => {
  const { register, handleSubmit } = useForm({ defaultValues: INITIAL_LEAVE });
  
  const onSubmit = (data) => {
    console.log("Saving Leave Policy", data);
    showToast("Leave Policy saved successfully");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 font-sans">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1">
          <label className="text-xs font-bold text-[#10B981] uppercase tracking-widest">Casual Leaves (Days/Yr)</label>
          <input type="number" {...register('casual')} className="w-full bg-[#10B981]/5 border border-[#10B981]/30 rounded-lg px-4 py-3 text-sm text-white focus:border-[#10B981] transition-colors outline-none" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-[#F59E0B] uppercase tracking-widest">Sick Leaves (Days/Yr)</label>
          <input type="number" {...register('sick')} className="w-full bg-[#F59E0B]/5 border border-[#F59E0B]/30 rounded-lg px-4 py-3 text-sm text-white focus:border-[#F59E0B] transition-colors outline-none" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-[#6366F1] uppercase tracking-widest">Earned Leaves (Days/Yr)</label>
          <input type="number" {...register('earned')} className="w-full bg-[#6366F1]/5 border border-[#6366F1]/30 rounded-lg px-4 py-3 text-sm text-white focus:border-[#6366F1] transition-colors outline-none" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Unpaid Limit (Days/Yr)</label>
          <input type="number" {...register('unpaid')} className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-sm text-white focus:border-gray-500 transition-colors outline-none" />
        </div>
      </div>

      <div className="space-y-6 pt-6 border-t border-[#1E1E2E]">
        <div className="flex items-center justify-between p-4 bg-[#0A0A0F] border border-[#1E1E2E] rounded-xl">
          <div>
            <h4 className="text-white text-sm font-medium">Carry Forward Unused Leaves</h4>
            <p className="text-xs text-gray-500 mt-1">Allow employees to roll over their remaining earned leaves to the next year.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" {...register('carryForward')} className="sr-only peer" />
            <div className="w-11 h-6 bg-[#1E1E2E] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#10B981]"></div>
          </label>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Annual Reset Month</label>
          <select {...register('resetMonth')} className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-sm text-white focus:border-[#6366F1] transition-colors outline-none cursor-pointer">
            {['January', 'April', 'July', 'October'].map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      <div className="pt-6 border-t border-[#1E1E2E] flex justify-end">
        <button type="submit" className="flex items-center gap-2 bg-[#6366F1] hover:bg-[#4F46E5] text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-[#6366F1]/20">
          <Save size={16} /> Save Changes
        </button>
      </div>
    </form>
  );
};


const SalaryConfigTab = ({ showToast }) => {
  const { register, handleSubmit } = useForm({ defaultValues: INITIAL_SALARY });
  
  const onSubmit = (data) => {
    console.log("Saving Salary Config", data);
    showToast("Salary Configuration saved successfully");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 font-sans">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Default HRA (% of Basic)</label>
          <div className="relative">
            <input type="number" {...register('hraPercent')} className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-sm text-white focus:border-[#6366F1] transition-colors outline-none" />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">%</span>
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Default Tax Bracket (%)</label>
          <div className="relative">
            <input type="number" {...register('taxBracket')} className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-sm text-white focus:border-[#6366F1] transition-colors outline-none" />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">%</span>
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Monthly Pay Day</label>
          <div className="relative">
            <input type="number" min={1} max={31} {...register('payDay')} className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-sm text-white focus:border-[#6366F1] transition-colors outline-none" />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-xs">of the month</span>
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Currency Locale</label>
          <select {...register('locale')} className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-sm text-white focus:border-[#6366F1] transition-colors outline-none cursor-pointer">
            <option value="en-US">US Dollar (USD)</option>
            <option value="en-GB">British Pound (GBP)</option>
            <option value="en-IN">Indian Rupee (INR)</option>
            <option value="en-EU">Euro (EUR)</option>
          </select>
        </div>
      </div>

      <div className="pt-6 border-t border-[#1E1E2E] flex justify-end">
        <button type="submit" className="flex items-center gap-2 bg-[#6366F1] hover:bg-[#4F46E5] text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-[#6366F1]/20">
          <Save size={16} /> Save Changes
        </button>
      </div>
    </form>
  );
};


const EmailTemplatesTab = ({ showToast }) => {
  const [selectedType, setSelectedType] = useState('congratulations');
  const [prompt, setPrompt] = useState(TEMPLATE_PROMPTS['congratulations']);
  const [preview, setPreview] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    setPrompt(TEMPLATE_PROMPTS[selectedType]);
    setPreview(null);
  }, [selectedType]);

  const handleSave = () => {
    console.log("Saving AI Prompt for", selectedType, ":", prompt);
    showToast("Email template prompt updated successfully");
  };

  const handleTestGenerate = () => {
    setIsGenerating(true);
    setPreview(null);
    setTimeout(() => {
      setPreview(`Subject: Re: ${selectedType === 'congratulations' ? 'Outstanding Work!' : selectedType === 'rejection' ? 'Update on your Application' : 'Welcome to the Team!'}\\n\\nDear [Name],\\n\\nThis is a mocked AI response generated based on your custom prompt instructions. The real system will pass this exact prompt string to Claude Sonnet to stream the generative text back to the end user.\\n\\nBest,\\nantHR System`);
      setIsGenerating(false);
    }, 1200);
  };

  return (
    <div className="space-y-8 font-sans">
      <div className="space-y-1">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Select Email Context</label>
        <select 
          value={selectedType} 
          onChange={(e) => setSelectedType(e.target.value)}
          className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-sm text-white focus:border-[#6366F1] transition-colors outline-none cursor-pointer"
        >
          <option value="congratulations">Congratulations / Praise</option>
          <option value="rejection">Candidate Rejection</option>
          <option value="offer">Offer Letter Welcome</option>
        </select>
      </div>

      <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl overflow-hidden shadow-inner">
        <div className="px-4 py-3 bg-[#6366F1]/10 border-b border-[#6366F1]/30 flex items-center gap-2">
          <Sparkles size={16} className="text-[#6366F1]" />
          <span className="text-sm font-medium text-[#6366F1]">AI System Prompt</span>
        </div>
        <textarea 
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          className="w-full bg-transparent p-4 text-sm text-gray-300 focus:outline-none focus:bg-[#0A0A0F] transition-colors resize-none leading-relaxed"
          placeholder="Instruct Claude on how to write this email..."
        />
      </div>

      {preview && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-5 bg-[#0A0A0F] border border-[#1E1E2E] rounded-xl relative">
          <span className="absolute -top-3 left-4 bg-[#0A0A0F] px-2 text-[10px] uppercase font-bold text-gray-500">Preview Output</span>
          <p className="text-sm text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">{preview}</p>
        </motion.div>
      )}

      <div className="pt-6 border-t border-[#1E1E2E] flex justify-between items-center">
        <button 
          onClick={handleTestGenerate} 
          disabled={isGenerating}
          className="flex items-center gap-2 bg-[#1E1E2E] hover:bg-[#2A2A35] text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border border-gray-700 disabled:opacity-50"
        >
          <Wand2 size={16} className={isGenerating ? "animate-pulse" : ""} /> 
          {isGenerating ? 'Generating...' : 'Test Generate'}
        </button>
        <button onClick={handleSave} className="flex items-center gap-2 bg-[#6366F1] hover:bg-[#4F46E5] text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-[#6366F1]/20">
          <Save size={16} /> Save Template
        </button>
      </div>
    </div>
  );
};


const NotificationsTab = ({ showToast }) => {
  const { register, handleSubmit } = useForm({ defaultValues: INITIAL_NOTIFS });
  
  const onSubmit = (data) => {
    console.log("Saving Notification Settings", data);
    showToast("Notification preferences updated");
  };

  const Toggle = ({ name, title, desc }) => (
    <div className="flex items-center justify-between p-4 bg-[#0A0A0F] border border-[#1E1E2E] rounded-xl hover:border-[#6366F1]/30 transition-colors">
      <div>
        <h4 className="text-white text-sm font-medium">{title}</h4>
        <p className="text-xs text-gray-500 mt-1">{desc}</p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
        <input type="checkbox" {...register(name)} className="sr-only peer" />
        <div className="w-11 h-6 bg-[#1E1E2E] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#6366F1]"></div>
      </label>
    </div>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 font-sans">
      <Toggle name="payrollProcessed" title="Payroll Processing Alerts" desc="Send automated emails to employees when their monthly payroll is finalized." />
      <Toggle name="leaveApproved" title="Leave Status Updates" desc="Notify employees immediately when their leave request is approved or rejected." />
      <Toggle name="performancePublished" title="Performance Reviews" desc="Alert employees when a new performance review has been published." />
      <Toggle name="monthlyDigest" title="Monthly Org Digest" desc="Automatically compile and send the AI-generated monthly organizational health digest." />
      <Toggle name="attendanceAnomaly" title="Attendance Anomalies" desc="Send immediate warnings to Admins/HR when the nightly anomaly detector flags an issue." />

      <div className="pt-6 mt-4 border-t border-[#1E1E2E] flex justify-end">
        <button type="submit" className="flex items-center gap-2 bg-[#6366F1] hover:bg-[#4F46E5] text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-[#6366F1]/20">
          <Save size={16} /> Save Changes
        </button>
      </div>
    </form>
  );
};


// --- MAIN COMPONENT ---
export default function OrgSettings() {
  const [activeTab, setActiveTab] = useState('company');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message) => {
    setToast(message);
  };

  const tabs = [
    { id: 'company', label: 'Company Info', icon: Building2 },
    { id: 'leave', label: 'Leave Policy', icon: CalendarDays },
    { id: 'salary', label: 'Salary Config', icon: Banknote },
    { id: 'email', label: 'Email Templates', icon: Mail },
    { id: 'notifications', label: 'Notifications', icon: BellRing },
  ];

  const tabContentVariants = {
    hidden: { opacity: 0, x: 20 },
    enter: { opacity: 1, x: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, x: -20, transition: { duration: 0.2 } }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white p-6 md:p-10 font-sans relative">
      
      {/* HEADER */}
      <div className="mb-8 border-b border-[#1E1E2E] pb-6">
        <h1 className="text-[32px] font-serif tracking-wide leading-tight flex items-center gap-3">
          <Settings className="text-[#6366F1]" size={32} />
          Organization Settings
        </h1>
        <p className="text-gray-400 text-sm mt-2">Configure core business rules, AI prompts, and system behaviors.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 min-h-[600px]">
        
        {/* LEFT NAV MENU */}
        <div className="w-full lg:w-64 shrink-0 flex flex-col gap-2">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium ${
                  isActive 
                    ? 'bg-[#6366F1]/10 text-[#6366F1] border border-[#6366F1]/30 shadow-inner' 
                    : 'bg-transparent text-gray-400 hover:bg-[#1E1E2E] hover:text-white border border-transparent'
                }`}
              >
                <Icon size={18} className={isActive ? "text-[#6366F1]" : "text-gray-500"} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* RIGHT CONTENT AREA */}
        <div className="flex-1 bg-[#111118] border border-[#1E1E2E] rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
          <AnimatePresence mode="wait">
            
            {activeTab === 'company' && (
              <motion.div key="company" variants={tabContentVariants} initial="hidden" animate="enter" exit="exit">
                <h2 className="text-xl font-serif text-white mb-6">Company Information</h2>
                <CompanyInfoTab showToast={showToast} />
              </motion.div>
            )}

            {activeTab === 'leave' && (
              <motion.div key="leave" variants={tabContentVariants} initial="hidden" animate="enter" exit="exit">
                <h2 className="text-xl font-serif text-white mb-6">Global Leave Policy</h2>
                <LeavePolicyTab showToast={showToast} />
              </motion.div>
            )}

            {activeTab === 'salary' && (
              <motion.div key="salary" variants={tabContentVariants} initial="hidden" animate="enter" exit="exit">
                <h2 className="text-xl font-serif text-white mb-6">Salary Configuration</h2>
                <SalaryConfigTab showToast={showToast} />
              </motion.div>
            )}

            {activeTab === 'email' && (
              <motion.div key="email" variants={tabContentVariants} initial="hidden" animate="enter" exit="exit">
                <h2 className="text-xl font-serif text-white mb-6">AI Email Templates</h2>
                <EmailTemplatesTab showToast={showToast} />
              </motion.div>
            )}

            {activeTab === 'notifications' && (
              <motion.div key="notifications" variants={tabContentVariants} initial="hidden" animate="enter" exit="exit">
                <h2 className="text-xl font-serif text-white mb-6">System Notifications</h2>
                <NotificationsTab showToast={showToast} />
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

      {/* TOAST */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-8 right-8 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border border-[#10B981]/30 bg-[#10B981]/10 text-white font-sans text-sm font-medium z-50 backdrop-blur-md"
          >
            <CheckCircle2 size={18} className="text-[#10B981]" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
