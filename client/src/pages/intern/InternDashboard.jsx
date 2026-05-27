import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { 
  CheckCircle2, Circle, Clock, Mail, ChevronRight, 
  Target, TrendingUp, MessageSquare, Calendar
} from 'lucide-react';
import { differenceInDays, parseISO, formatDistanceToNow, format } from 'date-fns';

import { useInternStore } from '../../store/internStore';
import { useAuthStore } from '../../store/authStore';

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

export default function InternDashboard() {
  const { user } = useAuthStore();
  const { interns, loading, error, fetchInterns } = useInternStore();
  
  useEffect(() => {
    fetchInterns();
  }, [fetchInterns]);

  const internData = useMemo(() => {
    return interns.find(i => i.email === user?.email) || null;
  }, [interns, user]);

  const PIPELINE_STAGES = ['Applied', 'Screening', 'Interview', 'Offer', 'Onboarded'];
  
  // Use mock fallback if specific fields are missing from internData
  const [goals, setGoals] = useState([]);
  
  useEffect(() => {
    if (internData?.goals) {
      setGoals(internData.goals);
    } else {
      setGoals([
        { id: 1, title: "Complete Onboarding", dueDate: new Date().toISOString(), done: false }
      ]);
    }
  }, [internData]);

  const currentStage = internData?.stage || 'Applied';
  const stageIndex = PIPELINE_STAGES.indexOf(currentStage);
  
  const completedGoals = goals.filter(g => g.done).length;
  const totalGoals = goals.length;
  const goalProgress = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;
  
  const joinDate = internData?.joinDate || new Date().toISOString();
  const daysSinceJoining = differenceInDays(new Date(), parseISO(joinDate));
  
  const toggleGoal = (id) => {
    setGoals(goals.map(g => g.id === id ? { ...g, done: !g.done } : g));
  };

  // Next expected step mapping
  const nextStepMap = {
    'Applied': 'Initial HR Screening call',
    'Screening': 'Technical Interview scheduling',
    'Interview': 'Final decision and Offer',
    'Offer': 'Offer acceptance and Onboarding',
    'Onboarded': 'Start your first sprint'
  };

  // Framer Motion Variants
  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white p-6 md:p-10 font-sans overflow-x-hidden">
      
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-[32px] font-serif tracking-wide leading-tight">Intern Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">Welcome back, {MOCK_DATA.internName.split(' ')[0]}. Track your journey and upcoming milestones.</p>
      </div>

      <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex flex-col gap-6">
        
        {loading ? (
          <div className="bg-[#111118] border border-[#1E1E2E] rounded-2xl p-6 md:p-8 h-64 animate-pulse"></div>
        ) : error ? (
          <div className="bg-red-500/10 text-red-500 p-6 rounded-2xl">Failed to load intern dashboard.</div>
        ) : !internData ? (
          <div className="bg-[#111118] text-gray-400 p-6 rounded-2xl text-center">No intern profile found.</div>
        ) : (
        <>
        {/* TOP PIPELINE CARD */}
        <motion.div variants={itemVariants} className="bg-[#111118] border border-[#1E1E2E] rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
          {/* Subtle Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#6366F1]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />

          <h2 className="text-xl font-serif text-white tracking-wide border-b border-[#1E1E2E] pb-4 mb-8">Internship Pipeline</h2>
          
          {/* Visual Pipeline Bar */}
          <div className="relative mb-12 flex items-center justify-between z-10 w-full max-w-4xl mx-auto px-4 md:px-12">
            {/* Background Line */}
            <div className="absolute left-[10%] right-[10%] top-1/2 -translate-y-1/2 h-1 bg-[#1E1E2E] z-0" />
            
            {/* Active Line Fill */}
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${(stageIndex / (PIPELINE_STAGES.length - 1)) * 80 + 10}%` }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-[#10B981] z-0"
            />

            {PIPELINE_STAGES.map((stage, idx) => {
              const isCompleted = idx < stageIndex;
              const isCurrent = idx === stageIndex;
              const isUpcoming = idx > stageIndex;

              return (
                <div key={stage} className="relative z-10 flex flex-col items-center">
                  <motion.div 
                    initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: idx * 0.2 }}
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-4 ${
                      isCompleted ? 'bg-[#10B981] border-[#10B981] shadow-[0_0_15px_rgba(16,185,129,0.3)]' :
                      isCurrent ? 'bg-[#0A0A0F] border-[#6366F1] shadow-[0_0_20px_rgba(99,102,241,0.5)]' :
                      'bg-[#0A0A0F] border-[#1E1E2E]'
                    }`}
                  >
                    {isCompleted && <CheckCircle2 size={16} className="text-white" />}
                    {isCurrent && (
                      <motion.div 
                        animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }} 
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="w-3 h-3 bg-[#6366F1] rounded-full" 
                      />
                    )}
                    {isUpcoming && <Circle size={10} className="text-[#1E1E2E] fill-current" />}
                  </motion.div>
                  <p className={`absolute top-12 text-xs font-bold uppercase tracking-wider whitespace-nowrap ${
                    isCompleted ? 'text-[#10B981]' : isCurrent ? 'text-[#6366F1]' : 'text-gray-500'
                  }`}>
                    {stage}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Stage Details */}
          <div className="bg-[#0A0A0F] border border-[#1E1E2E] rounded-xl p-6 flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
            <div>
              <p className="text-gray-400 text-sm mb-1 uppercase tracking-widest font-bold">Current Stage</p>
              <h3 className="text-2xl font-serif text-[#6366F1]">{currentStage} Phase</h3>
              <p className="text-sm text-gray-400 mt-2">Next Expected Step: <span className="text-gray-200">{nextStepMap[currentStage]}</span></p>
            </div>
            
            <div className="flex gap-4">
              <div className="bg-[#111118] border border-[#1E1E2E] rounded-lg px-6 py-4 text-center min-w-[120px]">
                <p className="text-3xl font-mono text-white"><CountUp end={internData?.daysInStage || 0} /></p>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Days in Stage</p>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* STATS COLUMN (Left) */}
          <div className="xl:col-span-1 flex flex-col gap-6">
            
            <div className="grid grid-cols-2 gap-4">
              <motion.div variants={itemVariants} className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-5 shadow-lg">
                <Clock size={20} className="text-gray-500 mb-2" />
                <p className="text-3xl font-serif text-white mb-1"><CountUp end={daysSinceJoining} /></p>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Days in Program</p>
              </motion.div>
              
              <motion.div variants={itemVariants} className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-5 shadow-lg">
                <TrendingUp size={20} className="text-[#10B981] mb-2" />
                <p className="text-3xl font-serif text-white mb-1"><CountUp end={internData?.performanceScore || 0} /></p>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Perf Score</p>
              </motion.div>
            </div>

            {/* UPCOMING COUNTDOWN */}
            <motion.div variants={itemVariants} className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-6 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#F59E0B] to-[#D97706]" />
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Calendar size={16} className="text-[#F59E0B]" />
                Upcoming
              </h3>
              
              {internData?.upcomingEvent && (
              <div className="flex items-center gap-5">
                <motion.div 
                  animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 2 }}
                  className="w-16 h-16 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/30 flex flex-col items-center justify-center text-[#F59E0B]"
                >
                  <span className="text-2xl font-mono font-bold">{differenceInDays(parseISO(internData.upcomingEvent.date), new Date())}</span>
                  <span className="text-[10px] uppercase font-bold">Days</span>
                </motion.div>
                <div>
                  <p className="text-lg font-serif text-white">{internData.upcomingEvent.title}</p>
                  <p className="text-xs text-gray-400 font-mono mt-1">{format(parseISO(internData.upcomingEvent.date), 'MMM do, yyyy')}</p>
                </div>
              </div>
              )}
            </motion.div>

            {internData?.mentor && (
            <motion.div variants={itemVariants} className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-6 shadow-lg">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Assigned Mentor</h3>
              
              <div className="flex items-center gap-4 mb-6">
                <img src={internData.mentor.avatar || 'https://i.pravatar.cc/150'} alt="" className="w-14 h-14 rounded-full border-2 border-[#1E1E2E] object-cover" />
                <div>
                  <p className="text-lg font-serif text-white">{internData.mentor.name}</p>
                  <p className="text-xs text-[#6366F1] font-mono">{internData.mentor.designation}</p>
                </div>
              </div>

              <a 
                href={`mailto:${internData.mentor.email}`}
                className="w-full flex items-center justify-center gap-2 bg-[#1E1E2E] hover:bg-[#2A2A35] text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                <Mail size={16} />
                Send Message
              </a>
            </motion.div>
            )}
          </div>

          {/* MAIN CONTENT COLUMN (Right) */}
          <div className="xl:col-span-2 flex flex-col gap-6">
            
            {/* GOALS SECTION */}
            <motion.div variants={itemVariants} className="bg-[#111118] border border-[#1E1E2E] rounded-2xl p-6 md:p-8 shadow-xl flex-1 flex flex-col">
              <div className="flex justify-between items-end border-b border-[#1E1E2E] pb-4 mb-6">
                <h2 className="text-xl font-serif text-white flex items-center gap-2">
                  <Target className="text-[#6366F1]" size={20} />
                  Onboarding Goals
                </h2>
                <div className="text-right">
                  <p className="text-xs text-gray-400 font-mono mb-1">{completedGoals} of {totalGoals} Completed</p>
                  <div className="w-32 h-2 bg-[#0A0A0F] rounded-full border border-[#1E1E2E] overflow-hidden">
                    <motion.div 
                      className="h-full bg-[#6366F1] rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${goalProgress}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {goals.map(goal => (
                  <div 
                    key={goal.id} 
                    className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
                      goal.done 
                        ? 'bg-[#10B981]/5 border-[#10B981]/30' 
                        : 'bg-[#0A0A0F] border-[#1E1E2E] hover:border-[#6366F1]/50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div 
                        onClick={() => toggleGoal(goal.id)}
                        className={`w-6 h-6 rounded-full border flex items-center justify-center cursor-pointer transition-colors ${
                          goal.done ? 'bg-[#10B981] border-[#10B981]' : 'border-gray-500 hover:border-[#6366F1]'
                        }`}
                      >
                        {goal.done && <CheckCircle2 size={14} className="text-[#111118]" strokeWidth={3} />}
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${goal.done ? 'text-gray-400 line-through' : 'text-white'}`}>
                          {goal.title}
                        </p>
                        <p className="text-[10px] text-gray-500 font-mono mt-0.5">Due: {format(parseISO(goal.dueDate), 'MMM do, yyyy')}</p>
                      </div>
                    </div>
                    
                    <div>
                      {goal.done 
                        ? <span className="bg-[#10B981]/20 text-[#10B981] px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest">Done</span>
                        : <span className="bg-[#1E1E2E] text-gray-400 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest">Pending</span>
                      }
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* RECENT FEEDBACK */}
            {internData?.feedback && (
            <motion.div variants={itemVariants} className="bg-[#111118] border-y border-r border-[#1E1E2E] border-l-4 border-l-[#10B981] rounded-2xl p-6 shadow-xl">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-sm font-bold text-[#10B981] uppercase tracking-widest flex items-center gap-2">
                  <MessageSquare size={16} />
                  Latest Feedback
                </h3>
                <span className="text-[10px] text-gray-500 font-mono">{formatDistanceToNow(parseISO(internData.feedback.date))} ago</span>
              </div>
              
              <p className="text-sm text-gray-300 leading-relaxed italic border-l-2 border-[#1E1E2E] pl-4 py-2 mb-4">
                "{internData.feedback.text}"
              </p>
              
              <div className="flex justify-between items-center border-t border-[#1E1E2E] pt-4">
                <p className="text-xs text-gray-400">From <span className="text-white font-medium">{internData.feedback.reviewer}</span></p>
                <button className="text-xs text-[#6366F1] hover:text-white transition-colors flex items-center gap-1 font-medium">
                  View All Feedback <ChevronRight size={14} />
                </button>
              </div>
            </motion.div>
            )}

          </div>
        </div>

        </>
        )}
      </motion.div>
    </div>
  );
}
