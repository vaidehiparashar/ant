import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { 
  Sparkles, RotateCcw, Activity, Users, Clock, 
  UserMinus, Briefcase, ChevronRight
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';
import { format } from 'date-fns';

import { useOrgHealthStore } from '../../store/orgHealthStore';

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

// --- GAUGE COMPONENT ---
const CircularGauge = ({ value }) => {
  const size = 300;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  const [offset, setOffset] = useState(circumference);
  
  useEffect(() => {
    // Animate to value
    const progress = value / 100;
    const targetOffset = circumference - (progress * circumference);
    // Slight delay for effect
    const timer = setTimeout(() => {
      setOffset(targetOffset);
    }, 300);
    return () => clearTimeout(timer);
  }, [value, circumference]);

  let color = '#EF4444'; // Red
  if (value >= 75) color = '#10B981'; // Emerald
  else if (value >= 50) color = '#F59E0B'; // Amber

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90 drop-shadow-2xl">
        {/* Background Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#1E1E2E"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1500 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-6xl font-serif text-white tracking-tight" style={{ color }}>
          <CountUp end={value} />
        </span>
        <span className="text-sm font-sans text-gray-400 mt-2 uppercase tracking-widest font-bold">Org Health Score</span>
      </div>
    </div>
  );
};

// --- PROGRESS BAR COMPONENT ---
const SubScoreBar = ({ label, value, invertColorLogic = false }) => {
  // If inverted, lower value = better (e.g. Leave Rate or Turnover)
  let normalizedValue = invertColorLogic ? Math.max(0, 100 - value) : value;
  
  let color = 'bg-[#EF4444]'; // Red
  if (normalizedValue >= 75) color = 'bg-[#10B981]'; // Emerald
  else if (normalizedValue >= 50) color = 'bg-[#F59E0B]'; // Amber

  return (
    <div className="flex items-center gap-4">
      <span className="w-32 text-sm text-gray-300 font-medium text-right">{label}</span>
      <div className="flex-1 bg-[#0A0A0F] rounded-full h-3 border border-[#1E1E2E] overflow-hidden relative">
        <motion.div 
          initial={{ width: 0 }}
          whileInView={{ width: `${value}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
      <span className="w-12 text-sm font-mono text-gray-400 text-right">{value}%</span>
    </div>
  );
};

// --- MAIN PAGE COMPONENT ---
export default function OrgHealth() {
  const { health, loading, error, fetchOrgHealth, calculateOrgHealth } = useOrgHealthStore();
  const [insight, setInsight] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [insightTime, setInsightTime] = useState(new Date());

  useEffect(() => {
    fetchOrgHealth();
  }, [fetchOrgHealth]);

  useEffect(() => {
    if (health?.insight && !isRegenerating) {
      setIsTyping(true);
    }
  }, [health?.insight, isRegenerating]);

  // Typewriter effect for AI Insight
  useEffect(() => {
    if (isTyping && health?.insight) {
      let i = 0;
      setInsight('');
      const interval = setInterval(() => {
        setInsight(health.insight.substring(0, i + 1));
        i++;
        if (i >= health.insight.length) {
          clearInterval(interval);
          setIsTyping(false);
          setIsRegenerating(false);
        }
      }, 15);
      return () => clearInterval(interval);
    }
  }, [isTyping, health?.insight]);

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    await calculateOrgHealth();
    setIsTyping(true);
    setInsightTime(new Date());
  };

  // Framer Motion Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white p-6 md:p-10 font-sans overflow-x-hidden">
      
      <div className="mb-8">
        <h1 className="text-[32px] font-serif tracking-wide leading-tight flex items-center gap-3">
          <Activity className="text-[#6366F1]" size={32} />
          Organizational Health
        </h1>
        <p className="text-gray-400 text-sm mt-1">Holistic AI-driven metrics and pulse checks across the company.</p>
      </div>

      <motion.div 
        variants={containerVariants} 
        initial="hidden" 
        animate="show"
        className="flex flex-col gap-8"
      >
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl mb-4">
            Failed to load organizational health data.
          </div>
        )}

        {loading && !health?.score ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-[#111118] h-96 rounded-2xl animate-pulse border border-[#1E1E2E]"></div>
            <div className="bg-[#111118] h-96 rounded-2xl animate-pulse border border-[#1E1E2E]"></div>
          </div>
        ) : health?.score ? (
        <>
        {/* TOP SECTION: GAUGE & SUB-SCORES */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          <div className="bg-[#111118] border border-[#1E1E2E] rounded-2xl p-8 shadow-2xl flex items-center justify-center">
            <CircularGauge value={health.score} />
          </div>

          <div className="bg-[#111118] border border-[#1E1E2E] rounded-2xl p-8 shadow-2xl flex flex-col justify-center gap-8">
            <h3 className="text-lg font-serif text-white tracking-wide border-b border-[#1E1E2E] pb-3">Core Pillars</h3>
            <div className="space-y-6">
              <SubScoreBar label="Attendance Health" value={health.subScores?.attendance || 0} />
              <SubScoreBar label="Performance Health" value={health.subScores?.performance || 0} />
              {/* Leave Rate is inverted: lower is greener */}
              <SubScoreBar label="Leave Rate" value={health.subScores?.leaveRate || 0} invertColorLogic={true} />
              <SubScoreBar label="Intern Conversion" value={health.subScores?.internConversion || 0} />
            </div>
          </div>
        </motion.div>

        {/* MIDDLE SECTION: AI INSIGHT & STATS */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* AI Insight Card */}
          <motion.div variants={itemVariants} className="xl:col-span-2 bg-[#111118] border-y border-r border-[#1E1E2E] border-l-4 border-l-[#6366F1] rounded-2xl p-6 shadow-xl flex flex-col relative overflow-hidden">
            {/* Subtle bg glow */}
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-[#6366F1]/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="flex items-center gap-2 text-[#6366F1]">
                <Sparkles size={20} />
                <h3 className="font-serif text-xl text-white">Executive AI Insight</h3>
              </div>
              <span className="bg-[#6366F1]/20 text-[#6366F1] border border-[#6366F1]/30 px-3 py-1 rounded-full text-[10px] font-sans font-bold uppercase tracking-widest flex items-center gap-1">
                <Sparkles size={10} /> AI Generated
              </span>
            </div>

            <div className="flex-1 mb-6 relative z-10">
              <p className="text-gray-300 leading-relaxed text-base">
                {insight}
                {isTyping && <span className="inline-block w-2 h-4 ml-1 bg-[#6366F1] animate-pulse" />}
              </p>
            </div>

            <div className="flex justify-between items-end mt-auto relative z-10 border-t border-[#1E1E2E] pt-4">
              <span className="text-xs text-gray-500 font-mono">
                Generated: {format(insightTime, 'dd MMM yyyy, HH:mm')}
              </span>
              <button 
                onClick={handleRegenerate}
                disabled={isRegenerating}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-[#6366F1] hover:text-white border border-[#6366F1]/50 hover:bg-[#6366F1] rounded transition-all disabled:opacity-50"
              >
                <RotateCcw size={14} className={isRegenerating ? "animate-spin" : ""} />
                Regenerate
              </button>
            </div>
          </motion.div>

          {/* Mini Stat Cards */}
          <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
            <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-5 shadow-lg flex flex-col justify-between">
              <Users size={20} className="text-gray-500 mb-2" />
              <p className="text-3xl font-serif text-white mb-1"><CountUp end={health.stats?.headcount || 0} /></p>
              <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">Total Headcount</p>
            </div>
            
            <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-5 shadow-lg flex flex-col justify-between">
              <Clock size={20} className="text-gray-500 mb-2" />
              <p className="text-3xl font-serif text-white mb-1"><CountUp end={health.stats?.avgTenure || 0} /> <span className="text-sm font-sans text-gray-500 font-normal">mo</span></p>
              <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">Avg Tenure</p>
            </div>

            <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-5 shadow-lg flex flex-col justify-between">
              <UserMinus size={20} className="text-[#EF4444] mb-2" />
              <p className="text-3xl font-serif text-white mb-1"><CountUp end={health.stats?.turnover || 0} suffix="%" /></p>
              <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">Turnover Rate</p>
            </div>

            <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-5 shadow-lg flex flex-col justify-between">
              <Briefcase size={20} className="text-[#10B981] mb-2" />
              <p className="text-3xl font-serif text-white mb-1"><CountUp end={health.stats?.openPositions || 0} /></p>
              <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">Open Positions</p>
            </div>
          </motion.div>

        </div>

        {/* BOTTOM SECTION: CHARTS */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          
          {/* Trend Chart */}
          <div className="bg-[#111118] border border-[#1E1E2E] rounded-2xl p-6 shadow-xl h-96 flex flex-col">
            <h3 className="text-lg font-serif text-white tracking-wide mb-6">12-Month Health Trend</h3>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={health.history || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E1E2E" vertical={false} />
                  <XAxis dataKey="month" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis domain={[50, 100]} stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0A0A0F', border: '1px solid #1E1E2E', borderRadius: '8px' }}
                    itemStyle={{ color: '#10B981', fontWeight: 'bold' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#6366F1" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorScore)" 
                    activeDot={{ r: 6, fill: '#6366F1', stroke: '#0A0A0F', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Department Chart */}
          <div className="bg-[#111118] border border-[#1E1E2E] rounded-2xl p-6 shadow-xl h-96 flex flex-col">
            <h3 className="text-lg font-serif text-white tracking-wide mb-6 flex justify-between items-center">
              <span>Department Attendance</span>
              <button className="text-[#6366F1] text-sm font-sans flex items-center hover:underline">
                View All <ChevronRight size={14} />
              </button>
            </h3>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={health.deptAttendance || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E1E2E" vertical={false} />
                  <XAxis dataKey="dept" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 100]} stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{fill: '#1E1E2E', opacity: 0.4}}
                    contentStyle={{ backgroundColor: '#0A0A0F', border: '1px solid #1E1E2E', borderRadius: '8px' }}
                  />
                  <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
                    {(health.deptAttendance || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.rate > 90 ? '#6366F1' : (entry.rate > 85 ? '#818CF8' : '#A5B4FC')} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </motion.div>
        </>
        ) : null}
      </motion.div>
    </div>
  );
}
