import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { 
  Heart, Send, Search, ChevronDown, Award, 
  Medal, Star, Calendar, MessageSquare
} from 'lucide-react';
import { formatDistanceToNow, parseISO, isThisMonth, isSameMonth, subMonths } from 'date-fns';
const isLastMonth = (date) => isSameMonth(date, subMonths(new Date(), 1));

// --- CSS KEYFRAMES FOR CONFETTI ---
const confettiStyles = `
  @keyframes confetti-fall {
    0% { transform: translateY(-100%) rotate(0deg); opacity: 1; }
    100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
  }
  .confetti-piece {
    position: fixed;
    top: -10px;
    width: 10px;
    height: 20px;
    animation: confetti-fall 3s linear forwards;
    z-index: 100;
  }
`;

import { useRecognitionStore } from '../../store/recognitionStore';
import { useEmployeeStore } from '../../store/employeeStore';

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

// --- CUSTOM SEARCHABLE SELECT COMPONENT ---
const UserSelect = ({ value, onChange, users }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setIsOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [wrapperRef]);

  const filteredUsers = useMemo(() => {
    return (users || []).filter(u => 
      u.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, users]);

  return (
    <div className="relative z-50" ref={wrapperRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-sm text-white flex justify-between items-center cursor-pointer hover:border-[#6366F1] transition-colors"
      >
        {value ? (
          <div className="flex items-center gap-3">
            <img src={value.avatar} alt="" className="w-6 h-6 rounded-full border border-[#1E1E2E]" />
            <span className="font-medium text-white">{value.name}</span>
          </div>
        ) : (
          <span className="text-gray-500">Search colleague by name...</span>
        )}
        <ChevronDown size={16} className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-2 bg-[#111118] border border-[#1E1E2E] rounded-lg shadow-2xl overflow-hidden"
          >
            <div className="p-2 border-b border-[#1E1E2E] flex items-center gap-2">
              <Search size={14} className="text-gray-500 ml-2" />
              <input 
                type="text" 
                placeholder="Search..." 
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
                    onClick={() => { onChange(user); setIsOpen(false); setSearchTerm(''); }}
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
export default function Recognitions() {
  const { received, leaderboard, loading, error, fetchMyRecognitions, fetchLeaderboard, sendRecognition } = useRecognitionStore();
  const { employees, fetchEmployees } = useEmployeeStore();
  
  const [recipient, setRecipient] = useState(null);
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState('All'); // 'All' | 'This Month' | 'Last Month'
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    fetchMyRecognitions();
    fetchLeaderboard(new Date().getMonth() + 1, new Date().getFullYear());
    fetchEmployees();
  }, [fetchMyRecognitions, fetchLeaderboard, fetchEmployees]);

  const handleSend = async () => {
    if (!recipient || !selectedBadge) return;
    
    await sendRecognition({
      recipientId: recipient.id,
      badge: selectedBadge,
      message
    });
    
    setShowConfetti(true);
    
    // Reset form after a delay
    setTimeout(() => {
      setRecipient(null);
      setSelectedBadge(null);
      setMessage('');
    }, 1000);

    // Stop confetti
    setTimeout(() => {
      setShowConfetti(false);
    }, 4000);
  };

  // Filtering
  const filteredReceived = useMemo(() => {
    return (received || []).filter(rec => {
      const date = parseISO(rec.date);
      if (filter === 'This Month') return isThisMonth(date);
      if (filter === 'Last Month') return isLastMonth(date);
      return true; // 'All'
    });
  }, [filter, received]);

  // Framer Motion
  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  // Generate random confetti pieces
  const confettiPieces = useMemo(() => {
    const colors = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
    return Array.from({ length: 50 }).map((_, i) => ({
      left: `${Math.random() * 100}vw`,
      backgroundColor: colors[Math.floor(Math.random() * colors.length)],
      animationDelay: `${Math.random() * 0.5}s`,
      transform: `rotate(${Math.random() * 360}deg)`
    }));
  }, [showConfetti]);

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white p-6 md:p-10 font-sans overflow-x-hidden relative">
      <style>{confettiStyles}</style>
      
      {/* CONFETTI LAYER */}
      {showConfetti && (
        <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden">
          {confettiPieces.map((style, i) => (
            <div key={i} className="confetti-piece" style={style} />
          ))}
        </div>
      )}

      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-[32px] font-serif tracking-wide leading-tight flex items-center gap-3">
          <Heart className="text-[#EF4444]" size={32} />
          Peer Recognitions
        </h1>
        <p className="text-gray-400 text-sm mt-1">Celebrate your colleagues' achievements and track badges you've earned.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 mb-12">
        
        {/* LEFT SECTION (45%) */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}
          className="w-full lg:w-[45%] flex flex-col gap-6"
        >
          <div className="bg-[#111118] border border-[#1E1E2E] rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#10B981]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            
            <h2 className="text-xl font-serif text-white tracking-wide border-b border-[#1E1E2E] pb-4 mb-6 flex items-center gap-2 relative z-10">
              <Award className="text-[#10B981]" size={20} />
              Recognize a Colleague
            </h2>

            <div className="space-y-6 flex-1 relative z-10">
              {/* Select Colleague */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Select Colleague</label>
                <UserSelect value={recipient} onChange={setRecipient} users={employees} />
              </div>

              {/* Badge Type Selector (2x3 Grid) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Choose Badge</label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Since BADGE_TYPES is removed, we'll redefine it locally for UI or fetch from somewhere. 
                      Let's redefine it here since it was removed. */}
                  {[
                    { id: 'top-performer', emoji: '🏆', name: 'Top Performer', desc: 'Exceptional results' },
                    { id: 'team-player', emoji: '🤝', name: 'Team Player', desc: 'Always collaborative' },
                    { id: 'innovator', emoji: '💡', name: 'Innovator', desc: 'Creative problem solver' },
                    { id: 'mentor', emoji: '🎓', name: 'Mentor', desc: 'Lifts others up' },
                    { id: 'fast-learner', emoji: '⚡', name: 'Fast Learner', desc: 'Adapts quickly' },
                    { id: 'reliable', emoji: '🎯', name: 'Reliable', desc: 'Always delivers' },
                  ].map(badge => (
                    <div 
                      key={badge.id}
                      onClick={() => setSelectedBadge(badge)}
                      className={`cursor-pointer border rounded-xl p-3 flex items-center gap-3 transition-all duration-200 ${
                        selectedBadge?.id === badge.id 
                          ? 'border-[#6366F1] bg-[#6366F1]/10 shadow-[0_0_15px_rgba(99,102,241,0.2)]' 
                          : 'border-[#1E1E2E] bg-[#0A0A0F] hover:border-gray-600'
                      }`}
                    >
                      <span className="text-2xl drop-shadow-sm">{badge.emoji}</span>
                      <div>
                        <p className="text-sm font-medium text-white">{badge.name}</p>
                        <p className="text-[10px] text-gray-500">{badge.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Message Textarea */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex justify-between">
                  <span>Message (Optional)</span>
                  <span className={`font-mono ${message.length >= 120 ? 'text-[#EF4444]' : 'text-gray-500'}`}>
                    {message.length}/120
                  </span>
                </label>
                <textarea 
                  rows={2}
                  maxLength={120}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Say why they deserve this..."
                  className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] transition-all resize-none"
                />
              </div>
            </div>

            <button 
              onClick={handleSend}
              disabled={!recipient || !selectedBadge}
              className="w-full mt-6 bg-[#10B981] hover:bg-[#059669] text-white rounded-lg py-3.5 font-medium transition-all shadow-lg shadow-[#10B981]/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed relative z-10"
            >
              <Send size={18} />
              Send Recognition
            </button>
          </div>
        </motion.div>

        {/* RIGHT SECTION (55%) */}
        <motion.div 
          initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
          className="w-full lg:w-[55%] flex flex-col gap-4"
        >
          <div className="flex justify-between items-end border-b border-[#1E1E2E] pb-3">
            <h2 className="text-2xl font-serif text-white flex items-center gap-3">
              Received
              <span className="bg-[#1E1E2E] text-white text-xs font-sans px-2.5 py-1 rounded-full">{filteredReceived.length}</span>
            </h2>
            
            <div className="flex bg-[#111118] border border-[#1E1E2E] rounded-lg p-1">
              {['All', 'This Month', 'Last Month'].map(f => (
                <button 
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${filter === f ? 'bg-[#6366F1] text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4 max-h-[600px]">
            <AnimatePresence mode="popLayout">
              {loading ? (
                <div className="flex flex-col gap-4">
                  {[1,2,3].map(i => (
                    <div key={i} className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-5 h-28 animate-pulse"></div>
                  ))}
                </div>
              ) : error ? (
                <div className="bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl p-5 text-center">
                  Failed to load recognitions.
                </div>
              ) : filteredReceived.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="bg-[#111118] border border-[#1E1E2E] rounded-2xl p-12 text-center flex flex-col items-center justify-center h-full min-h-[300px]"
                >
                  <MessageSquare size={48} className="text-[#1E1E2E] mb-4" />
                  <p className="text-gray-400 text-sm">No recognitions found for this period.</p>
                </motion.div>
              ) : (
                filteredReceived.map(rec => (
                  <motion.div 
                    key={rec.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-[#111118] border border-[#1E1E2E] hover:border-[#6366F1]/30 rounded-xl p-5 shadow-lg transition-colors flex gap-4"
                  >
                    <div className="w-12 h-12 rounded-full bg-[#0A0A0F] border border-[#1E1E2E] flex items-center justify-center text-2xl shadow-inner shrink-0 mt-1">
                      {rec.badge.emoji}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-white font-medium flex items-center gap-2">
                            {rec.badge.name}
                            <span className="text-gray-500 text-xs font-normal font-mono">• {formatDistanceToNow(parseISO(rec.date))} ago</span>
                          </p>
                          <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
                            From: 
                            <img src={rec.sender.avatar} className="w-4 h-4 rounded-full ml-1" alt="" />
                            <span className="font-medium text-gray-300">{rec.sender.name}</span>
                          </div>
                        </div>
                      </div>
                      {rec.message && (
                        <p className="text-sm text-gray-300 leading-relaxed bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg p-3 mt-3 italic border-l-2 border-l-[#10B981]">
                          "{rec.message}"
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>

        </motion.div>
      </div>

      {/* BOTTOM SECTION — LEADERBOARD */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        className="w-full bg-[#111118] border border-[#1E1E2E] rounded-2xl shadow-2xl p-6 md:p-8"
      >
        <h2 className="text-xl font-serif text-white tracking-wide border-b border-[#1E1E2E] pb-4 mb-6 flex items-center gap-2">
          <Star className="text-[#F59E0B]" size={20} />
          Top Recognized This Month
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-32 bg-[#111118] border border-[#1E1E2E] rounded-xl animate-pulse"></div>
            ))
          ) : (leaderboard || []).map((user, idx) => {
            // Rank styling
            let rankColor = "text-gray-400 border-[#1E1E2E]";
            let rankBg = "bg-[#0A0A0F]";
            
            if (user.rank === 1) { rankColor = "text-[#F59E0B] border-[#F59E0B]/30"; rankBg = "bg-[#F59E0B]/10"; }
            else if (user.rank === 2) { rankColor = "text-gray-300 border-gray-400/30"; rankBg = "bg-gray-400/10"; }
            else if (user.rank === 3) { rankColor = "text-[#B45309] border-[#B45309]/30"; rankBg = "bg-[#B45309]/10"; }

            return (
              <motion.div 
                key={user.rank}
                variants={itemVariants} initial="hidden" animate="show" transition={{ delay: idx * 0.1 }}
                className={`flex flex-col items-center justify-center text-center p-5 rounded-xl border ${rankColor} ${rankBg} relative`}
              >
                <div className="absolute top-2 left-2 text-xs font-mono font-bold opacity-80">#{user.rank}</div>
                
                <img src={user.avatar} className="w-16 h-16 rounded-full border-2 border-white/10 shadow-lg mb-3 object-cover" alt="" />
                
                <p className="text-sm font-medium text-white line-clamp-1">{user.name}</p>
                <p className="text-xl font-mono font-bold text-white mt-1">
                  <CountUp end={user.count} /> <span className="text-[10px] text-gray-500 uppercase tracking-widest font-sans ml-0.5">Badges</span>
                </p>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

    </div>
  );
}
