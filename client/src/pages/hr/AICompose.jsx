import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Send, RotateCcw, Trash2, ChevronDown, 
  Search, CheckCircle2, Mail, Clock, Inbox
} from 'lucide-react';
import { format } from 'date-fns';

// --- MOCK DATA ---
const MOCK_USERS = [
  { id: '1', name: 'Alice Smith', role: 'Frontend Engineer', avatar: 'https://i.pravatar.cc/150?u=1' },
  { id: '2', name: 'Bob Jones', role: 'Backend Engineer', avatar: 'https://i.pravatar.cc/150?u=2' },
  { id: '3', name: 'Charlie Day', role: 'HR Manager', avatar: 'https://i.pravatar.cc/150?u=3' },
  { id: '4', name: 'Diana Prince', role: 'Product Designer', avatar: 'https://i.pravatar.cc/150?u=4' },
  { id: '5', name: 'Ethan Hunt', role: 'Security Analyst', avatar: 'https://i.pravatar.cc/150?u=5' },
  { id: '6', name: 'Fiona Gallagher', role: 'Intern', avatar: 'https://i.pravatar.cc/150?u=6' },
  { id: '7', name: 'George Miller', role: 'Intern', avatar: 'https://i.pravatar.cc/150?u=7' }
];

const EMAIL_TYPES = [
  'Congratulations', 'Rejection', 'Meeting Invite', 
  'Offer Letter', 'Check-in', 'Payroll Notification'
];

const MOCK_RECENT_EMAILS = [
  { id: 1, type: 'Meeting Invite', recipient: 'Alice Smith', time: new Date(Date.now() - 1000 * 60 * 30) },
  { id: 2, type: 'Offer Letter', recipient: 'Fiona Gallagher', time: new Date(Date.now() - 1000 * 60 * 60 * 2) },
  { id: 3, type: 'Check-in', recipient: 'Bob Jones', time: new Date(Date.now() - 1000 * 60 * 60 * 24) },
];

// --- MOCK GENERATOR ENGINE ---
const generateMockAiResponse = (type, recipient, context) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      let subject = '';
      let body = '';
      
      switch(type) {
        case 'Congratulations':
          subject = `Congratulations on your great work, ${recipient.name}!`;
          body = `Dear ${recipient.name},\\n\\nI wanted to take a moment to sincerely congratulate you on your outstanding contributions as a ${recipient.role}. Your dedication has not gone unnoticed by the leadership team.\\n\\n${context ? `Regarding your specific note: ${context}\\n\\n` : ''}Keep up the excellent work!\\n\\nBest regards,\\nHR Team`;
          break;
        case 'Rejection':
          subject = `Update regarding your application`;
          body = `Dear ${recipient.name},\\n\\nThank you for taking the time to speak with us about the ${recipient.role} position. We appreciate your interest in joining our team.\\n\\nAfter careful consideration, we have decided to move forward with other candidates at this time. ${context ? `\\n\\n${context}\\n\\n` : ''}We wish you the best in your future endeavors.\\n\\nSincerely,\\nHR Team`;
          break;
        case 'Meeting Invite':
          subject = `Invitation: Quick catch-up`;
          body = `Hi ${recipient.name},\\n\\nI'd like to schedule a brief meeting with you to discuss some upcoming initiatives related to your role as ${recipient.role}.\\n\\n${context ? `Agenda: ${context}\\n\\n` : ''}Please let me know what times work best for you this week.\\n\\nBest,\\nHR Team`;
          break;
        case 'Offer Letter':
          subject = `Offer of Employment: ${recipient.role}`;
          body = `Dear ${recipient.name},\\n\\nWe are absolutely thrilled to extend an offer of employment for the position of ${recipient.role} at antHR.\\n\\n${context ? `${context}\\n\\n` : ''}Please find the official details attached. We look forward to welcoming you to the team!\\n\\nWarmly,\\nHR Team`;
          break;
        case 'Payroll Notification':
          subject = `Salary Credited - ${format(new Date(), 'MMMM yyyy')}`;
          body = `Dear ${recipient.name},\\n\\nThis is an automated notification to inform you that your salary for ${format(new Date(), 'MMMM yyyy')} has been successfully processed and credited to your account.\\n\\n${context ? `${context}\\n\\n` : ''}You can view your detailed payslip in your portal.\\n\\nRegards,\\nPayroll Dept`;
          break;
        default:
          subject = `Checking in`;
          body = `Hi ${recipient.name},\\n\\nJust wanted to do a quick check-in to see how things are going in your role as ${recipient.role}.\\n\\n${context ? `${context}\\n\\n` : ''}Let me know if you need anything!\\n\\nBest,\\nHR`;
      }
      resolve({ subject, body });
    }, 1500); // simulate network delay
  });
};


// --- CUSTOM SEARCHABLE SELECT COMPONENT ---
const UserSelect = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [wrapperRef]);

  const filteredUsers = useMemo(() => {
    return MOCK_USERS.filter(u => 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.role.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  return (
    <div className="relative" ref={wrapperRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-sm text-white flex justify-between items-center cursor-pointer hover:border-[#6366F1] transition-colors"
      >
        {value ? (
          <div className="flex items-center gap-3">
            <img src={value.avatar} alt="" className="w-6 h-6 rounded-full border border-[#1E1E2E]" />
            <span className="font-medium text-white">{value.name}</span>
            <span className="text-gray-500 text-xs hidden sm:inline">({value.role})</span>
          </div>
        ) : (
          <span className="text-gray-500">Select recipient...</span>
        )}
        <ChevronDown size={16} className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-2 bg-[#111118] border border-[#1E1E2E] rounded-lg shadow-2xl overflow-hidden"
          >
            <div className="p-2 border-b border-[#1E1E2E] flex items-center gap-2">
              <Search size={14} className="text-gray-500 ml-2" />
              <input 
                type="text" 
                placeholder="Search name or role..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-sm text-white py-1.5"
                autoFocus
              />
            </div>
            <div className="max-h-60 overflow-y-auto custom-scrollbar">
              {filteredUsers.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">No users found</div>
              ) : (
                filteredUsers.map(user => (
                  <div 
                    key={user.id}
                    onClick={() => {
                      onChange(user);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    className="p-3 hover:bg-[#1E1E2E]/50 cursor-pointer flex items-center gap-3 transition-colors border-b border-[#1E1E2E]/30 last:border-0"
                  >
                    <img src={user.avatar} alt="" className="w-8 h-8 rounded-full border border-[#1E1E2E]" />
                    <div>
                      <p className="text-sm font-medium text-white">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.role}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


// --- MAIN PAGE COMPONENT ---
export default function AICompose() {
  // Form State
  const [type, setType] = useState('Congratulations');
  const [recipient, setRecipient] = useState(null);
  const [context, setContext] = useState('');
  
  // Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  
  // Full Text Cache (for typewriter effect)
  const [targetBody, setTargetBody] = useState('');
  
  // Toast State
  const [toast, setToast] = useState(null);

  // Typewriter effect
  useEffect(() => {
    if (isTyping && targetBody.length > 0) {
      let i = 0;
      setBody(''); // Reset body before typing starts
      
      const interval = setInterval(() => {
        setBody(targetBody.substring(0, i + 1));
        i++;
        if (i >= targetBody.length) {
          clearInterval(interval);
          setIsTyping(false);
        }
      }, 18); // 18ms per character
      
      return () => clearInterval(interval);
    }
  }, [isTyping, targetBody]);

  // Toast Auto-dismiss
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleGenerate = async () => {
    if (!recipient) {
      setToast({ type: 'error', message: 'Please select a recipient first.' });
      return;
    }
    
    setIsGenerating(true);
    setSubject('');
    setBody('');
    setTargetBody('');
    
    // Call mock API
    const res = await generateMockAiResponse(type, recipient, context);
    
    setIsGenerating(false);
    setSubject(res.subject);
    setTargetBody(res.body);
    setIsTyping(true); // Triggers the typewriter effect
  };

  const handleSend = () => {
    if (!recipient || !body) return;
    setToast({ type: 'success', message: `Email sent to ${recipient.name}` });
    // Keep the UI state for visual satisfaction, or we could clear it here.
  };

  const handleClear = () => {
    setSubject('');
    setBody('');
    setTargetBody('');
    setIsTyping(false);
  };

  // Badges helper for recent emails
  const getTypeColor = (t) => {
    if (t.includes('Congratulations') || t.includes('Offer')) return 'bg-[#10B981]/20 text-[#10B981]';
    if (t.includes('Rejection')) return 'bg-[#EF4444]/20 text-[#EF4444]';
    if (t.includes('Meeting')) return 'bg-[#6366F1]/20 text-[#6366F1]';
    return 'bg-gray-800 text-gray-300';
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white p-6 md:p-10 font-sans flex flex-col md:flex-row gap-8">
      
      {/* LEFT PANEL (40%) */}
      <motion.div 
        initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}
        className="w-full md:w-[40%] xl:w-[35%] flex flex-col gap-6"
      >
        <div className="mb-2">
          <h1 className="text-[36px] font-serif tracking-wide leading-tight flex items-center gap-3">
            <Sparkles className="text-[#6366F1]" size={32} />
            AI Compose
          </h1>
          <p className="text-gray-400 text-sm mt-2">Generate hyper-personalized emails instantly utilizing Claude AI.</p>
        </div>

        <div className="bg-[#111118] border border-[#1E1E2E] rounded-2xl p-6 shadow-xl flex flex-col gap-5 relative overflow-hidden">
          {/* Subtle gradient background element */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#6366F1]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

          <div className="space-y-1 relative z-10">
            <label className="text-sm font-medium text-gray-300">Email Type</label>
            <div className="relative">
              <select 
                value={type} 
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] transition-all appearance-none cursor-pointer"
              >
                {EMAIL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-1 relative z-10">
            <label className="text-sm font-medium text-gray-300">Recipient</label>
            <UserSelect value={recipient} onChange={setRecipient} />
          </div>

          <div className="space-y-1 relative z-10">
            <label className="text-sm font-medium text-gray-300 flex justify-between">
              <span>Additional Context</span>
              <span className="text-gray-600 text-xs font-mono">Optional</span>
            </label>
            <textarea 
              rows={3}
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Add any specific details for the AI..."
              className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] transition-all resize-none custom-scrollbar"
            />
          </div>

          <button 
            onClick={handleGenerate}
            disabled={isGenerating || isTyping}
            className="w-full mt-2 bg-gradient-to-r from-[#6366F1] to-[#4F46E5] hover:from-[#4F46E5] hover:to-[#4338CA] text-white rounded-lg py-3.5 font-medium transition-all shadow-lg shadow-[#6366F1]/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed relative z-10"
          >
            {isGenerating ? (
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            ) : (
              <>
                <Sparkles size={18} />
                <span>Generate Email</span>
              </>
            )}
          </button>
        </div>

        {/* Recent Emails Section */}
        <div className="mt-4">
          <h3 className="text-sm font-serif text-gray-400 mb-4 tracking-wider uppercase">Recent AI Drafts</h3>
          <div className="flex flex-col gap-3">
            {MOCK_RECENT_EMAILS.map(email => (
              <div key={email.id} className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-4 flex items-center justify-between hover:bg-[#1E1E2E]/30 transition-colors cursor-pointer group">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-[#1E1E2E] text-gray-400 group-hover:text-white transition-colors">
                    <Mail size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white mb-1">{email.recipient}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wider ${getTypeColor(email.type)}`}>
                      {email.type}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-gray-500 text-xs font-mono">
                  <Clock size={12} />
                  {format(email.time, 'HH:mm')}
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* RIGHT PANEL (60%) */}
      <motion.div 
        initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
        className="flex-1 bg-[#111118] border border-[#1E1E2E] rounded-2xl shadow-2xl flex flex-col overflow-hidden relative"
      >
        <AnimatePresence mode="wait">
          {!subject && !body && !isGenerating ? (
            /* EMPTY STATE */
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center p-10 text-center"
            >
              <div className="w-24 h-24 rounded-full bg-[#1E1E2E]/50 border border-[#1E1E2E] flex items-center justify-center mb-6 relative">
                <Sparkles size={40} className="text-[#6366F1] absolute opacity-50 blur-sm" />
                <Inbox size={40} className="text-gray-500 relative z-10" />
              </div>
              <h2 className="text-2xl font-serif text-white mb-2">Generate an email to get started</h2>
              <p className="text-gray-400 max-w-md">Select an email type, choose a recipient, and let Claude draft a highly professional, context-aware email in seconds.</p>
            </motion.div>
          ) : (
            /* GENERATED STATE */
            <motion.div 
              key="generated"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex-1 flex flex-col h-full"
            >
              <div className="p-6 md:p-8 flex-1 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
                
                {/* Subject Line Input */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Subject</label>
                  <input 
                    type="text" 
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-transparent border-b-2 border-[#1E1E2E] focus:border-[#6366F1] px-0 py-2 text-xl font-medium text-white focus:outline-none transition-colors"
                  />
                </div>

                {/* Email Body Textarea */}
                <div className="space-y-2 flex-1 flex flex-col">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex justify-between items-center">
                    <span>Message Body</span>
                    {isTyping && <span className="text-[#6366F1] animate-pulse normal-case text-xs font-mono font-normal">AI is writing...</span>}
                  </label>
                  <textarea 
                    value={body}
                    onChange={(e) => {
                      if (!isTyping) {
                        setBody(e.target.value);
                        setTargetBody(e.target.value);
                      }
                    }}
                    disabled={isTyping}
                    className="flex-1 w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-xl p-5 text-[15px] leading-relaxed text-gray-300 focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] transition-all resize-none custom-scrollbar font-sans disabled:opacity-90 disabled:cursor-default"
                  />
                </div>

              </div>

              {/* Bottom Action Bar */}
              <div className="p-6 bg-[#0A0A0F] border-t border-[#1E1E2E] flex justify-between items-center mt-auto">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={handleGenerate}
                    disabled={isTyping}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#1E1E2E] text-gray-300 hover:text-white hover:bg-[#1E1E2E] transition-all text-sm font-medium disabled:opacity-50"
                  >
                    <RotateCcw size={16} />
                    Regenerate
                  </button>
                  <button 
                    onClick={handleClear}
                    disabled={isTyping}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all text-sm font-medium disabled:opacity-50"
                  >
                    <Trash2 size={16} />
                    Clear
                  </button>
                </div>

                <div className="flex items-center gap-6">
                  <span className="text-xs font-mono text-gray-500">
                    {body.length} chars
                  </span>
                  <button 
                    onClick={handleSend}
                    disabled={isTyping || !body}
                    className="flex items-center gap-2 px-6 py-2.5 bg-[#10B981] hover:bg-[#059669] text-white rounded-lg transition-all font-medium text-sm shadow-lg shadow-[#10B981]/20 disabled:opacity-50 disabled:shadow-none"
                  >
                    <Send size={16} />
                    Send Email
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* TOAST NOTIFICATION */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`fixed bottom-8 right-8 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border font-sans text-sm font-medium z-50 ${
              toast.type === 'success' 
                ? 'bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]' 
                : 'bg-red-500/10 border-red-500/30 text-red-500'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 size={18} /> : <Trash2 size={18} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
