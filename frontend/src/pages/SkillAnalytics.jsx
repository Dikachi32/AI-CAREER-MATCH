import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell
} from 'recharts';
import {
  TrendingUp, BookOpen, Award, Target, Zap, AlertTriangle,
  Clock, GraduationCap, BarChart3, ChevronRight, Star,
  CheckCircle2, XCircle, ArrowUp, Lightbulb, MapPin,
  Briefcase, Loader2
} from 'lucide-react';
import { getAnalytics } from '../services/api';
import { useCV } from '../context/CVContext';
import SkeletonLoader from '../components/SkeletonLoader';

const COLORS = ['#2563EB', '#7C3AED', '#22C55E', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4', '#8B5CF6'];

// Priority Badge
function PriorityBadge({ priority }) {
  const colors = {
    High: 'bg-red-50 text-red-700 border-red-200',
    Medium: 'bg-amber-50 text-amber-700 border-amber-200',
    Low: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  };
  return (
    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${colors[priority] || colors.Medium}`}>
      {priority}
    </span>
  );
}

// Section Header
function SectionHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 bg-[#2563EB]/10 rounded-xl flex items-center justify-center">
        <Icon className="text-[#2563EB]" size={20} />
      </div>
      <div>
        <h3 className="font-semibold text-lg text-[#0F172A]">{title}</h3>
        {subtitle && <p className="text-sm text-[#64748B]">{subtitle}</p>}
      </div>
    </div>
  );
}

// Skill Level Badge
function LevelBadge({ level }) {
  const colors = {
    'Beginner': 'bg-slate-50 text-slate-600 border-slate-200',
    'Intermediate': 'bg-blue-50 text-blue-700 border-blue-200',
    'Advanced': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Expert': 'bg-purple-50 text-purple-700 border-purple-200'
  };
  return (
    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${colors[level] || colors.Intermediate}`}>
      {level}
    </span>
  );
}

export default function SkillAnalytics() {
  const { cvData, extractedInfo } = useCV();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (cvData?.cleaned_text) {
      getAnalytics({
        cv_text: cvData.cleaned_text,
        experience_years: extractedInfo?.years_experience
      })
        .then(res => setAnalytics(res.data))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [cvData, extractedInfo]);

  if (loading) {
    return (
      <div className="section-padding py-12 max-w-7xl mx-auto">
        <SkeletonLoader type="text" lines={2} className="mb-8 max-w-md" />
        <SkeletonLoader type="stats" count={4} />
        <div className="mt-8 grid lg:grid-cols-2 gap-6">
          <SkeletonLoader type="card" />
          <SkeletonLoader type="card" />
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="section-padding py-20 text-center max-w-2xl mx-auto">
        <div className="w-16 h-16 bg-[#2563EB]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <TrendingUp className="text-[#2563EB]" size={28} />
        </div>
        <h2 className="font-bold text-2xl text-[#0F172A] mb-3">No Analytics Available</h2>
        <p className="text-[#64748B] mb-8">Upload your CV first to generate your skill analytics dashboard.</p>
      </div>
    );
  }

  const radarData = analytics.technical_skills.map(s => ({
    skill: s.name,
    confidence: s.confidence,
    demand: s.market_demand,
  }));

  const barData = analytics.technical_skills.map(s => ({
    name: s.name,
    confidence: s.confidence,
    demand: s.market_demand,
  }));

  const ai = analytics.ai_analysis || {};

  return (
    <div className="section-padding py-8 lg:py-12 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <h1 className="text-2xl lg:text-3xl font-bold text-[#0F172A]">
          Skill <span className="gradient-text">Analytics</span>
        </h1>
        <p className="text-[#64748B] mt-1">Complete talent analysis and market positioning.</p>
      </motion.div>

      {/* Top Stats — PRESERVED */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-sm"
        >
          <div className="flex items-center gap-2 text-[#64748B] mb-2">
            <Target size={16} />
            <span className="text-xs font-medium uppercase tracking-wider">Match Score</span>
          </div>
          <p className="font-bold text-3xl text-[#2563EB]">{analytics.skill_match_score}%</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-sm"
        >
          <div className="flex items-center gap-2 text-[#64748B] mb-2">
            <Zap size={16} />
            <span className="text-xs font-medium uppercase tracking-wider">Skills</span>
          </div>
          <p className="font-bold text-3xl text-[#0F172A]">{analytics.technical_skills.length}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-sm"
        >
          <div className="flex items-center gap-2 text-[#64748B] mb-2">
            <Award size={16} />
            <span className="text-xs font-medium uppercase tracking-wider">Soft Skills</span>
          </div>
          <p className="font-bold text-3xl text-purple-600">{analytics.soft_skills.length}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-sm"
        >
          <div className="flex items-center gap-2 text-[#64748B] mb-2">
            <BookOpen size={16} />
            <span className="text-xs font-medium uppercase tracking-wider">To Learn</span>
          </div>
          <p className="font-bold text-3xl text-emerald-600">{analytics.learning_path.length}</p>
        </motion.div>
      </div>

      {/* Charts Row — PRESERVED */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm"
        >
          <h3 className="font-semibold text-lg text-[#0F172A] mb-6">Skill Confidence vs Market Demand</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#E2E8F0" />
                <PolarAngleAxis dataKey="skill" tick={{ fill: '#64748B', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#94A3B8', fontSize: 10 }} />
                <Radar name="Confidence" dataKey="confidence" stroke="#2563EB" fill="#2563EB" fillOpacity={0.2} />
                <Radar name="Market Demand" dataKey="demand" stroke="#7C3AED" fill="#7C3AED" fillOpacity={0.1} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 32px rgba(15,23,42,0.12)' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm"
        >
          <h3 className="font-semibold text-lg text-[#0F172A] mb-6">Skill Distribution</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis type="number" domain={[0, 100]} tick={{ fill: '#94A3B8', fontSize: 12 }} />
                <YAxis dataKey="name" type="category" tick={{ fill: '#64748B', fontSize: 12 }} width={100} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 32px rgba(15,23,42,0.12)' }} />
                <Bar dataKey="confidence" radius={[0, 6, 6, 0]} barSize={20}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Detailed Skill Analysis — PRESERVED */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl border border-[#E2E8F0] p-6 lg:p-8 shadow-sm mb-8"
      >
        <SectionHeader icon={BarChart3} title="Detailed Skill Analysis" />
        <div className="space-y-4">
          {analytics.technical_skills.map((skill, i) => (
            <div key={skill.name} className="flex items-center gap-4 p-4 rounded-xl bg-[#F8FAFC] hover:bg-[#F1F5F9] transition-colors">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                   style={{ backgroundColor: COLORS[i % COLORS.length] }}>
                {skill.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-[#0F172A]">{skill.name}</p>
                  <LevelBadge level={skill.level} />
                </div>
                <div className="flex items-center gap-4 text-xs text-[#64748B]">
                  <span>Confidence: {skill.confidence}%</span>
                  <span>Market Demand: {skill.market_demand}%</span>
                  <span>Mentions: {skill.mentions}</span>
                </div>
                <div className="mt-2 h-1.5 bg-white rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${skill.confidence}%`, backgroundColor: COLORS[i % COLORS.length] }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Recommended Learning Path — PRESERVED */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-2xl border border-[#E2E8F0] p-6 lg:p-8 shadow-sm mb-8"
      >
        <SectionHeader
          icon={BookOpen}
          title="Recommended Learning Path"
          subtitle="Skills to acquire based on market demand and your profile gaps"
        />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {analytics.learning_path.map((item, i) => (
            <motion.div
              key={item.skill}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + i * 0.1 }}
              className="bg-[#F8FAFC] rounded-xl p-5 border border-[#E2E8F0] hover:border-[#2563EB]/30 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-[#0F172A]">{item.skill}</span>
                <PriorityBadge priority={item.priority} />
              </div>
              <p className="text-sm text-[#64748B]">{item.reason}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ============================================================
          NEW SECTION 1: MISSING SKILLS ANALYSIS
          ============================================================ */}
      {ai.missing_skills?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl border border-[#E2E8F0] p-6 lg:p-8 shadow-sm mb-8"
        >
          <SectionHeader
            icon={AlertTriangle}
            title="Missing Skills Analysis"
            subtitle="Skills not in your CV but critical for your career path"
          />
          <div className="space-y-4">
            {ai.missing_skills.map((skill, i) => (
              <motion.div
                key={skill.skill}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + i * 0.08 }}
                className="p-5 rounded-xl border border-[#E2E8F0] hover:border-red-200 hover:bg-red-50/30 transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                      <h4 className="font-semibold text-[#0F172A]">{skill.skill}</h4>
                      <PriorityBadge priority={skill.priority} />
                      <span className="inline-flex items-center gap-1 text-xs text-[#64748B] bg-[#F1F5F9] px-2.5 py-1 rounded-full">
                        <Clock size={12} /> {skill.estimated_weeks} {skill.estimated_weeks === 1 ? 'week' : 'weeks'}
                      </span>
                    </div>
                    <p className="text-sm text-[#64748B] mb-2">{skill.why_it_matters}</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
                        {skill.employability_impact}
                      </span>
                      <span className="text-xs bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full">
                        {skill.career_opportunity_boost}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ============================================================
          NEW SECTION 2: SKILLS REQUIRING IMPROVEMENT
          ============================================================ */}
      {ai.skills_requiring_improvement?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-2xl border border-[#E2E8F0] p-6 lg:p-8 shadow-sm mb-8"
        >
          <SectionHeader
            icon={ArrowUp}
            title="Skills Requiring Improvement"
            subtitle="Current level vs industry expectations with gap analysis"
          />
          <div className="space-y-4">
            {ai.skills_requiring_improvement.map((skill, i) => (
              <motion.div
                key={skill.skill}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + i * 0.08 }}
                className="p-5 rounded-xl border border-[#E2E8F0] hover:border-amber-200 hover:bg-amber-50/30 transition-all"
              >
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                      <h4 className="font-semibold text-[#0F172A]">{skill.skill}</h4>
                      <PriorityBadge priority={skill.improvement_priority} />
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div className="text-center p-3 bg-[#F8FAFC] rounded-lg">
                        <p className="text-xs text-[#94A3B8] mb-1">Current</p>
                        <LevelBadge level={skill.current_level} />
                      </div>
                      <div className="text-center p-3 bg-[#F8FAFC] rounded-lg">
                        <p className="text-xs text-[#94A3B8] mb-1">Expected</p>
                        <LevelBadge level={skill.industry_expectation} />
                      </div>
                      <div className="text-center p-3 bg-[#F8FAFC] rounded-lg">
                        <p className="text-xs text-[#94A3B8] mb-1">Impact</p>
                        <p className="text-xs font-medium text-[#0F172A]">{skill.impact}</p>
                      </div>
                    </div>

                    <p className="text-sm text-[#64748B] mb-2">Gap Areas:</p>
                    <div className="flex flex-wrap gap-2">
                      {skill.gap_areas.map((area, j) => (
                        <span key={j} className="text-xs bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full border border-amber-100">
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ============================================================
          NEW SECTION 3: CAREER DEVELOPMENT ROADMAP
          ============================================================ */}
      {ai.career_roadmap?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white rounded-2xl border border-[#E2E8F0] p-6 lg:p-8 shadow-sm mb-8"
        >
          <SectionHeader
            icon={MapPin}
            title="Career Development Roadmap"
            subtitle="AI-generated structured weekly learning plan"
          />
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#2563EB] to-[#7C3AED]" />
            <div className="space-y-6">
              {ai.career_roadmap.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 + i * 0.1 }}
                  className="relative pl-14"
                >
                  {/* Timeline dot */}
                  <div className="absolute left-3 top-1 w-5 h-5 bg-white border-2 border-[#2563EB] rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-[#2563EB] rounded-full" />
                  </div>
                  <div className="bg-[#F8FAFC] rounded-xl p-5 border border-[#E2E8F0] hover:border-[#2563EB]/30 transition-colors">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-bold text-[#2563EB] bg-[#2563EB]/10 px-2.5 py-1 rounded-full">
                        Week {item.week}
                      </span>
                      <h4 className="font-semibold text-[#0F172A]">{item.focus}</h4>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {item.skills.map((s, j) => (
                        <span key={j} className="text-xs bg-white text-[#64748B] px-2.5 py-1 rounded-full border border-[#E2E8F0]">
                          {s}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[#64748B]">
                      <Star size={14} className="text-amber-500" />
                      <span className="font-medium">Milestone:</span> {item.milestone}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {item.resources.map((r, j) => (
                        <span key={j} className="text-xs bg-[#2563EB]/5 text-[#2563EB] px-2.5 py-1 rounded-full">
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* ============================================================
          NEW SECTION 4: ESTIMATED LEARNING TIME
          ============================================================ */}
      {ai.missing_skills?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-white rounded-2xl border border-[#E2E8F0] p-6 lg:p-8 shadow-sm mb-8"
        >
          <SectionHeader
            icon={Clock}
            title="Estimated Learning Time"
            subtitle="Intelligent time estimates based on skill complexity and your experience"
          />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {ai.missing_skills.map((skill, i) => (
              <motion.div
                key={skill.skill}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.0 + i * 0.05 }}
                className="text-center p-5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] hover:border-[#2563EB]/30 transition-colors"
              >
                <p className="font-semibold text-[#0F172A] mb-2">{skill.skill}</p>
                <div className="w-full h-2 bg-[#E2E8F0] rounded-full mb-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#2563EB] to-[#7C3AED] rounded-full"
                    style={{ width: `${Math.min(100, (skill.estimated_weeks / 6) * 100)}%` }}
                  />
                </div>
                <p className="text-sm font-bold text-[#2563EB]">
                  {skill.estimated_weeks} {skill.estimated_weeks === 1 ? 'week' : 'weeks'}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ============================================================
          NEW SECTION 5: RECOMMENDED COURSES
          ============================================================ */}
      {ai.recommended_courses?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="bg-white rounded-2xl border border-[#E2E8F0] p-6 lg:p-8 shadow-sm mb-8"
        >
          <SectionHeader
            icon={GraduationCap}
            title="Recommended Courses"
            subtitle="AI-recommended certifications, courses, and learning platforms"
          />
          <div className="grid md:grid-cols-2 gap-4">
            {ai.recommended_courses.map((course, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1 + i * 0.05 }}
                className="flex items-start gap-4 p-5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] hover:border-[#2563EB]/30 transition-all"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-[#2563EB]/10 to-[#7C3AED]/10 rounded-xl flex items-center justify-center shrink-0">
                  <GraduationCap className="w-5 h-5 text-[#2563EB]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-[#0F172A] text-sm truncate">{course.name}</h4>
                    {course.certification && (
                      <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-100 font-medium">
                        Cert
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#64748B] mb-2">{course.provider} · {course.level}</p>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[#64748B] flex items-center gap-1">
                      <Clock size={12} /> {course.estimated_weeks}w
                    </span>
                    <span className="text-xs text-[#64748B] flex items-center gap-1">
                      <Star size={12} className="text-amber-500" /> {course.relevance_score}% relevance
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ============================================================
          NEW SECTION 6: CAREER READINESS ASSESSMENT
          ============================================================ */}
      {ai.career_readiness?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="bg-white rounded-2xl border border-[#E2E8F0] p-6 lg:p-8 shadow-sm"
        >
          <SectionHeader
            icon={Briefcase}
            title="Career Readiness Assessment"
            subtitle="Role-specific readiness scores with actionable improvement plans"
          />
          <div className="space-y-4">
            {ai.career_readiness.map((role, i) => (
              <motion.div
                key={role.role}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.2 + i * 0.08 }}
                className="p-5 rounded-xl border border-[#E2E8F0] hover:border-[#2563EB]/30 transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-[#0F172A]">{role.role}</h4>
                      <div className="flex items-center gap-3">
                        <div className="w-32 h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-1000 ${
                              role.readiness_score >= 80 ? 'bg-emerald-500' :
                              role.readiness_score >= 60 ? 'bg-amber-500' : 'bg-red-400'
                            }`}
                            style={{ width: `${role.readiness_score}%` }}
                          />
                        </div>
                        <span className={`text-sm font-bold ${
                          role.readiness_score >= 80 ? 'text-emerald-600' :
                          role.readiness_score >= 60 ? 'text-amber-600' : 'text-red-500'
                        }`}>
                          {role.readiness_score}%
                        </span>
                      </div>
                    </div>

                    {role.missing_skills.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs text-[#94A3B8] mb-2">Missing:</p>
                        <div className="flex flex-wrap gap-2">
                          {role.missing_skills.map((s, j) => (
                            <span key={j} className="text-xs bg-red-50 text-red-700 px-2.5 py-1 rounded-full border border-red-100">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-2 text-sm text-[#64748B]">
                      <Lightbulb size={14} className="text-[#2563EB] shrink-0 mt-0.5" />
                      <span>{role.how_to_improve}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#94A3B8] mt-2">
                      <Clock size={12} />
                      <span>Estimated: {role.estimated_timeline}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Domain Insights Footer */}
      {ai.domain_insights && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
          className="mt-8 p-6 bg-gradient-to-r from-[#2563EB]/5 to-[#7C3AED]/5 rounded-2xl border border-[#2563EB]/10"
        >
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-5 h-5 text-[#2563EB]" />
            <span className="font-semibold text-[#0F172A]">AI Domain Insight</span>
          </div>
          <p className="text-sm text-[#64748B]">{ai.domain_insights}</p>
        </motion.div>
      )}
    </div>
  );
}