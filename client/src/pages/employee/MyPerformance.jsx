import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { 
  Award, TrendingUp, Info, ChevronDown, 
  ChevronUp, Medal, Star, Heart
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ReferenceLine 
} from 'recharts';

import { usePerformanceStore } from '../../store/performanceStore';
import { useRecognitionStore } from '../../store/recognitionStore';

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
        } else {
          setCount(start);
        }
      }, 16);

      return () => clearInterval(timer);
    }
  }, [end, isInView, durationMs]);

  return <span ref={ref}>{count.toFixed(0)}</span>;
}

// --- GAUGE COMPONENT ---
const CircularGauge = ({ value }) => {
  const size = 300;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  const [offset, setOffset] = useState(circumference);
  
  useEffect(() => {
    const progress = value / 100;
    const targetOffset = circumference - (progress * circumference);
    const timer = setTimeout(() => setOffset(targetOffset), 300);
    return () => clearTimeout(timer);
  }, [value, circumference]);

  let color = '#EF4444'; // Red
  if (value >= 75) color = '#10B981'; // Emerald
  else if (value >= 50) color = '#F59E0B'; // Amber

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90 drop-shadow-2xl">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="#1E1E2E" strokeWidth={strokeWidth} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={radius} stroke={color} strokeWidth={strokeWidth} fill="none"
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-1500 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-7xl font-serif text-white tracking-tight" style={{ color }}>
          <CountUp end={value} />
        </span>
        <span className="text-sm font-sans text-gray-400 mt-2 uppercase tracking-widest font-bold">Current Score</span>
      </div>
    </div>
  );
};

// --- PROGRESS BAR COMPONENT ---
const SubScoreBar = ({ label, value, max }) => {
  const percentage = (value / max) * 100;
  
  let color = 'bg-[#EF4444]';
  if (percentage >= 75) color = 'bg-[#10B981]';
  else if (percentage >= 50) color = 'bg-[#F59E0B]';

  return (
    <div className="flex items-center gap-4">
      <span className="w-48 text-sm text-gray-300 font-medium text-right">{label}</span>
      <div className="flex-1 bg-[#0A0A0F] rounded-full h-3 border border-[#1E1E2E] overflow-hidden relative">
        <motion.div 
          initial={{ width: 0 }} whileInView={{ width: `${percentage}%` }} viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
      <span className="w-16 text-sm font-mono text-gray-400 text-right">{value} / {max}</span>
    </div>
  );
};

// --- MAIN PAGE COMPONENT ---
export default function MyPerformance() {
  const [showFormula, setShowFormula] = useState(false);
  const { myPerformance, loading: perfLoading, error: perfError, fetchPerformance } = usePerformanceStore();
  const { myRecognitions, loading: recLoading, error: recError, fetchMyRecognitions } = useRecognitionStore();

  useEffect(() => {
    fetchPerformance();
    fetchMyRecognitions();
  }, [fetchPerformance, fetchMyRecognitions]);

  const loading = perfLoading || recLoading;
  const error = perfError || recError;

  // Framer Motion Variants
  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white p-6 md:p-10 font-sans overflow-x-hidden">
      
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-[32px] font-serif tracking-wide leading-tight flex items-center gap-3">
          <Award className="text-[#6366F1]" size={32} />
          My Performance
        </h1>
        <p className="text-gray-400 text-sm mt-1">Track your performance score, recent reviews, and peer recognitions.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl">
          Failed to load performance data.
        </div>
      )}

      {loading ? (
        <div className="flex flex-col gap-8">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <div className="bg-[#111118] h-96 rounded-2xl animate-pulse"></div>
            <div className="bg-[#111118] h-96 rounded-2xl animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <div className="bg-[#111118] h-96 rounded-2xl animate-pulse"></div>
            <div className="bg-[#111118] h-96 rounded-2xl animate-pulse"></div>
          </div>
        </div>
      ) : (
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex flex-col gap-8">
        
        {/* TOP SECTION: GAUGE & BREAKDOWN */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          
          <div className="bg-[#111118] border border-[#1E1E2E] rounded-2xl p-8 shadow-2xl flex items-center justify-center">
            <CircularGauge value={myPerformance?.currentScore || 0} />
          </div>

          <div className="bg-[#111118] border border-[#1E1E2E] rounded-2xl p-8 shadow-2xl flex flex-col gap-6">
            <h3 className="text-xl font-serif text-white tracking-wide border-b border-[#1E1E2E] pb-3">Score Breakdown</h3>
            
            <div className="space-y-6 mt-2">
              {(myPerformance?.subScores || []).map((score, idx) => (
                <SubScoreBar key={idx} label={score.label} value={score.value} max={score.max} />
              ))}
            </div>

            {/* Formula Accordion */}
            <div className="mt-auto pt-6">
              <button 
                onClick={() => setShowFormula(!showFormula)}
                className="w-full flex items-center justify-between text-sm text-[#6366F1] font-medium p-3 bg-[#6366F1]/5 hover:bg-[#6366F1]/10 border border-[#6366F1]/20 rounded-lg transition-colors"
              >
                <span className="flex items-center gap-2"><Info size={16} /> How is this calculated?</span>
                {showFormula ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              
              <AnimatePresence>
                {showFormula && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 mt-2 bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg text-sm text-gray-400 leading-relaxed">
                      Your final score is a composite metric out of 100 points:
                      <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li><strong className="text-white">Attendance (40pts):</strong> Based on your monthly attendance rate minus any unexcused absences.</li>
                        <li><strong className="text-white">Task Completion (40pts):</strong> Evaluated dynamically by your HR manager based on sprint deliveries.</li>
                        <li><strong className="text-white">Peer Recognition (20pts):</strong> Earn up to 20 points by receiving official badges from your colleagues.</li>
                      </ul>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* MIDDLE SECTION: TREND & REVIEW */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          
          {/* Trend Chart */}
          <div className="bg-[#111118] border border-[#1E1E2E] rounded-2xl p-6 shadow-xl h-96 flex flex-col">
            <h3 className="text-lg font-serif text-white tracking-wide mb-6 flex items-center gap-2">
              <TrendingUp size={18} className="text-[#10B981]" />
              6-Month Performance Trend
            </h3>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={myPerformance?.history || []} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="trendColor" x1="0" y1="0" x2="0" y2="1">
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
                    cursor={{ stroke: '#1E1E2E', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <ReferenceLine y={75} stroke="#F59E0B" strokeDasharray="3 3" label={{ position: 'top', value: 'Target (75)', fill: '#F59E0B', fontSize: 10 }} />
                  <Area 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#6366F1" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#trendColor)" 
                    activeDot={{ r: 6, fill: '#6366F1', stroke: '#0A0A0F', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Latest Review */}
          <div className="bg-[#111118] border-y border-r border-[#1E1E2E] border-l-4 border-l-[#6366F1] rounded-2xl p-8 shadow-xl flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#6366F1]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            
            {myPerformance?.latestReview ? (
              <div className="flex flex-col h-full relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 rounded-lg bg-[#6366F1]/10 text-[#6366F1]">
                    <Star size={20} />
                  </div>
                  <div>
                    <h3 className="font-serif text-xl text-white">Performance Review</h3>
                    <p className="text-sm font-mono text-[#6366F1]">{myPerformance.latestReview.monthYear}</p>
                  </div>
                </div>

                <div className="flex-1">
                  <p className="text-gray-300 leading-relaxed text-[15px] italic border-l-2 border-[#1E1E2E] pl-4 py-2">
                    "{myPerformance.latestReview.text}"
                  </p>
                </div>

                <div className="mt-8 flex justify-between items-end pt-4 border-t border-[#1E1E2E]">
                  <p className="text-sm text-gray-400">Reviewed by <span className="text-white font-medium">{myPerformance.latestReview.reviewer}</span></p>
                  <p className="text-xs text-gray-500 font-mono">{myPerformance.latestReview.date}</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center relative z-10">
                <Star size={40} className="text-gray-600 mb-4 opacity-50" />
                <h3 className="font-serif text-xl text-gray-400">No Review Published</h3>
                <p className="text-sm text-gray-600 mt-2">Your latest performance review has not been published yet.</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* BOTTOM SECTION: PEER RECOGNITIONS */}
        <motion.div variants={itemVariants} className="mt-4">
          <div className="flex items-center gap-3 mb-6">
            <Heart size={24} className="text-[#EF4444]" />
            <h2 className="text-2xl font-serif text-white tracking-wide">Peer Recognitions</h2>
          </div>

          {(!myRecognitions || myRecognitions.length === 0) ? (
            <div className="bg-[#111118] border border-[#1E1E2E] rounded-2xl p-12 text-center flex flex-col items-center">
              <Medal size={48} className="text-gray-600 mb-4 opacity-20" />
              <p className="text-gray-400">No peer recognitions received this month.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {myRecognitions.map(rec => (
                <motion.div 
                  key={rec.id}
                  whileHover={{ y: -5 }}
                  className="bg-[#111118] border border-[#1E1E2E] hover:border-[#10B981]/50 rounded-2xl p-6 shadow-lg transition-all flex flex-col"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-[#1E1E2E] flex items-center justify-center text-2xl shadow-inner border border-gray-800">
                      {rec.emoji}
                    </div>
                    <div>
                      <h4 className="font-serif text-lg text-white">{rec.name}</h4>
                      <p className="text-xs text-[#10B981] font-mono">From: {rec.from}</p>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-300 leading-relaxed flex-1 mb-4">
                    "{rec.message}"
                  </p>
                  
                  <div className="text-right border-t border-[#1E1E2E] pt-3">
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest">{rec.date}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

      </motion.div>
      )}
    </div>
  );
}
