import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Circle,
  TrendingUp,
  Award,
  BookOpen,
  Briefcase,
  Zap,
  Target,
  AlertTriangle,
  Clock,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Lightbulb
} from 'lucide-react';

// ── Score Ring ─────────────────────────────────────────────────────────────────

export function ScoreRing({ score, label, sublabel, size = 120, color }) {
  const circumference = 2 * Math.PI * ((size - 12) / 2);
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const colors = {
    red: '#EF4444',
    orange: '#F97316',
    amber: '#F59E0B',
    emerald: '#10B981',
    green: '#22C55E'
  };

  const ringColor = colors[color] || colors.amber;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={(size - 12) / 2}
            stroke="#E2E8F0"
            strokeWidth="8"
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={(size - 12) / 2}
            stroke={ringColor}
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-[#0F172A]">{score}</span>
        </div>
      </div>
      <span className="text-sm font-semibold text-[#0F172A] mt-2">{label}</span>
      {sublabel && <span className="text-xs text-[#64748B] mt-0.5">{sublabel}</span>}
    </div>
  );
}

// ── Progress Bar ───────────────────────────────────────────────────────────────

export function ProgressBar({ label, percent, color = 'blue' }) {
  const colorMap = {
    blue: 'bg-[#2563EB]',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
    purple: 'bg-purple-500'
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[#0F172A]">{label}</span>
        <span className="text-sm text-[#64748B]">{percent}%</span>
      </div>
      <div className="w-full h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${colorMap[color] || colorMap.blue}`}
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.8, delay: 0.2 }}
        />
      </div>
    </div>
  );
}

// ── Skill Level Badge ──────────────────────────────────────────────────────────

export function SkillLevelBadge({ level }) {
  const colors = {
    'Beginner': 'bg-slate-100 text-slate-600',
    'Intermediate': 'bg-blue-100 text-blue-700',
    'Advanced': 'bg-emerald-100 text-emerald-700',
    'Expert': 'bg-purple-100 text-purple-700'
  };

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[level] || colors.Beginner}`}>
      {level}
    </span>
  );
}

// ── Timeline Item ──────────────────────────────────────────────────────────────

export function TimelineItem({ milestone, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="flex items-start gap-4"
    >
      <div className="flex flex-col items-center">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${milestone.isAchieved ? 'bg-emerald-500' : 'bg-[#E2E8F0]'}`}>
          {milestone.isAchieved ? (
            <CheckCircle2 size={16} className="text-white" />
          ) : (
            <Circle size={16} className="text-[#94A3B8]" />
          )}
        </div>
        {index < 4 && <div className="w-0.5 h-10 bg-[#E2E8F0] mt-1" />}
      </div>
      <div className="flex-1 pb-6">
        <div className="flex items-center gap-2 mb-1">
          <h4 className={`text-sm font-semibold ${milestone.isAchieved ? 'text-emerald-700' : 'text-[#0F172A]'}`}>
            {milestone.milestone}
          </h4>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F1F5F9] text-[#64748B] font-medium uppercase">
            {milestone.category}
          </span>
        </div>
        <p className="text-xs text-[#64748B] flex items-center gap-1">
          <Clock size={12} />
          {milestone.targetDate}
        </p>
      </div>
    </motion.div>
  );
}

// ── Goal Item ──────────────────────────────────────────────────────────────────

export function GoalItem({ goal, onToggle, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer ${goal.completed ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-[#E2E8F0] hover:border-[#2563EB]/30'}`}
      onClick={() => onToggle && onToggle(index)}
    >
      <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 border-2 transition-all ${goal.completed ? 'bg-emerald-500 border-emerald-500' : 'border-[#CBD5E1]'}`}>
        {goal.completed && <CheckCircle2 size={12} className="text-white" />}
      </div>
      <div className="flex-1">
        <p className={`text-sm ${goal.completed ? 'text-emerald-700 line-through' : 'text-[#334155]'}`}>
          {goal.goal}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F1F5F9] text-[#64748B] font-medium uppercase">
            {goal.category}
          </span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium uppercase ${goal.priority === 'Critical' ? 'bg-red-100 text-red-700' : goal.priority === 'High' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
            {goal.priority}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ── Action Plan Card ───────────────────────────────────────────────────────────

export function ActionPlanCard({ action, index }) {
  const categoryIcons = {
    'Skill': BookOpen,
    'Role': Briefcase,
    'Network': Zap,
    'Interview': Target,
    'Compensation': TrendingUp
  };

  const Icon = categoryIcons[action.category] || Zap;
  const priorityColors = {
    'Critical': 'bg-red-100 text-red-700 border-red-200',
    'High': 'bg-amber-100 text-amber-700 border-amber-200',
    'Medium': 'bg-blue-100 text-blue-700 border-blue-200',
    'Low': 'bg-slate-100 text-slate-600 border-slate-200'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className={`p-4 rounded-xl border ${priorityColors[action.priority] || priorityColors.Medium}`}
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-white/80 flex items-center justify-center shrink-0">
          <Icon size={16} />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold mb-1">{action.action}</h4>
          <p className="text-xs opacity-80 mb-2">{action.impact}</p>
          <div className="flex items-center gap-2">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/60 font-medium uppercase">
              {action.deadline}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/60 font-medium uppercase">
              {action.category}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Learning Path Step ─────────────────────────────────────────────────────────

export function LearningPathStep({ step, index }) {
  const [expanded, setExpanded] = useState(false);

  const priorityColors = {
    'Critical': 'bg-red-500',
    'High': 'bg-amber-500',
    'Medium': 'bg-blue-500',
    'Low': 'bg-slate-400'
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="relative"
    >
      <div className="flex items-start gap-4">
        <div className="flex flex-col items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${priorityColors[step.priority] || priorityColors.Medium}`}>
            {step.step}
          </div>
          {index < 4 && <div className="w-0.5 h-full min-h-[40px] bg-[#E2E8F0] mt-1" />}
        </div>
        <div className="flex-1 pb-4">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full text-left group"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-[#0F172A] group-hover:text-[#2563EB] transition-colors">
                {step.title}
              </h4>
              {expanded ? <ChevronUp size={14} className="text-[#94A3B8]" /> : <ChevronDown size={14} className="text-[#94A3B8]" />}
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">{step.duration} • {step.priority} priority</p>
          </button>

          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="mt-2 space-y-2"
            >
              <p className="text-sm text-[#334155]">{step.description}</p>
              {step.resources && step.resources.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {step.resources.map((r, i) => (
                    <span key={i} className="text-[10px] px-2 py-1 rounded bg-[#F1F5F9] text-[#64748B] font-medium">
                      {r}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── Certification Card ─────────────────────────────────────────────────────────

export function CertificationCard({ cert, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#2563EB]/10 flex items-center justify-center">
            <Award size={16} className="text-[#2563EB]" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-[#0F172A]">{cert.name}</h4>
            <p className="text-xs text-[#64748B]">{cert.provider}</p>
          </div>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">
          {cert.relevanceScore}/100
        </span>
      </div>
      <p className="text-xs text-[#64748B] mb-3">{cert.whyRecommended}</p>
      <div className="flex items-center gap-3 text-xs text-[#64748B]">
        <span className="flex items-center gap-1">
          <Clock size={12} />
          {cert.timeToComplete}
        </span>
        <span className="flex items-center gap-1">
          <TrendingUp size={12} />
          {cert.estimatedCost}
        </span>
      </div>
      <p className="text-xs text-[#2563EB] mt-2 font-medium">{cert.careerImpact}</p>
    </motion.div>
  );
}

// ── Project Card ───────────────────────────────────────────────────────────────

export function ProjectCard({ project, index }) {
  const difficultyColors = {
    'Beginner': 'bg-emerald-100 text-emerald-700',
    'Intermediate': 'bg-amber-100 text-amber-700',
    'Advanced': 'bg-rose-100 text-rose-700'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-sm"
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-[#0F172A]">{project.title}</h4>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${difficultyColors[project.difficulty] || difficultyColors.Intermediate}`}>
          {project.difficulty}
        </span>
      </div>
      <p className="text-xs text-[#64748B] mb-2">{project.description}</p>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {project.skillsDemonstrated.map((skill, i) => (
          <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-[#F1F5F9] text-[#64748B] font-medium">
            {skill}
          </span>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-[#64748B] flex items-center gap-1">
          <Clock size={12} />
          {project.timeEstimate}
        </span>
      </div>
      <p className="text-xs text-[#2563EB] mt-2 font-medium">{project.whyRelevant}</p>
    </motion.div>
  );
}

// ── Next Role Card ───────────────────────────────────────────────────────────────

export function NextRoleCard({ role, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-sm"
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-[#0F172A]">{role.role}</h4>
        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
          {role.timeline}
        </span>
      </div>
      <p className="text-xs text-[#64748B] mb-2">{role.whyRecommended}</p>
      <p className="text-sm font-semibold text-emerald-700 mb-2">{role.salaryRange}</p>
      <div className="flex flex-wrap gap-1.5">
        {role.gapToClose.map((gap, i) => (
          <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
            {gap}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

// ── Salary Projection Chart ────────────────────────────────────────────────────

export function SalaryProjectionChart({ projections }) {
  const maxSalary = Math.max(...projections.map(p => {
    const num = parseInt(p.projectedSalary.replace(/[^0-9]/g, ''));
    return num || 0;
  }));

  return (
    <div className="space-y-4">
      {projections.map((proj, i) => {
        const salaryNum = parseInt(proj.projectedSalary.replace(/[^0-9]/g, '')) || 0;
        const barWidth = maxSalary > 0 ? (salaryNum / maxSalary) * 100 : 20;

        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.15 }}
            className="space-y-1"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#0F172A] w-12">Year {proj.year}</span>
                <span className="text-xs text-[#64748B]">{proj.role}</span>
              </div>
              <span className="text-sm font-semibold text-[#2563EB]">{proj.projectedSalary}</span>
            </div>
            <div className="w-full h-3 bg-[#E2E8F0] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[#2563EB] to-[#7C3AED] rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${barWidth}%` }}
                transition={{ duration: 1, delay: i * 0.2 }}
              />
            </div>
            <p className="text-[10px] text-[#64748B]">{proj.keyDriver}</p>
          </motion.div>
        );
      })}
    </div>
  );
}

// ── Strength Card ────────────────────────────────────────────────────────────────

export function StrengthCard({ strength, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="bg-emerald-50 border border-emerald-100 rounded-xl p-4"
    >
      <div className="flex items-start gap-3">
        <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
          <Zap size={14} className="text-emerald-600" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-emerald-800 mb-1">{strength.strength}</h4>
          <p className="text-xs text-emerald-700 mb-1">
            <span className="font-medium">Evidence: </span>
            {strength.evidence}
          </p>
          <p className="text-xs text-[#64748B]">
            <span className="font-medium text-emerald-700">Leverage: </span>
            {strength.howToLeverage}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ── Weakness Card ────────────────────────────────────────────────────────────────

export function WeaknessCard({ weakness, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="bg-rose-50 border border-rose-100 rounded-xl p-4"
    >
      <div className="flex items-start gap-3">
        <div className="w-7 h-7 rounded-lg bg-rose-100 flex items-center justify-center shrink-0">
          <AlertTriangle size={14} className="text-rose-600" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-rose-800 mb-1">{weakness.weakness}</h4>
          <p className="text-xs text-rose-700 mb-1">
            <span className="font-medium">Impact: </span>
            {weakness.impact}
          </p>
          <p className="text-xs text-[#64748B]">
            <span className="font-medium text-emerald-700">Fix: </span>
            {weakness.actionToFix}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ── Missing Skill Card ───────────────────────────────────────────────────────────

export function MissingSkillCard({ skill, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="bg-amber-50 border border-amber-100 rounded-xl p-4"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
            <Lightbulb size={14} className="text-amber-600" />
          </div>
          <h4 className="text-sm font-semibold text-[#0F172A]">{skill.skill}</h4>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-200 text-amber-800 font-medium">
          Demand: {skill.demandScore}/100
        </span>
      </div>
      <p className="text-xs text-[#64748B] mb-2">{skill.whyImportant}</p>
      <div className="flex items-center gap-2 mb-2">
        <Clock size={12} className="text-[#94A3B8]" />
        <span className="text-xs text-[#64748B]">{skill.timeToLearn}</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {skill.resources.map((r, i) => (
          <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-white text-[#64748B] font-medium border border-amber-200">
            {r}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

export default {
  ScoreRing,
  ProgressBar,
  SkillLevelBadge,
  TimelineItem,
  GoalItem,
  ActionPlanCard,
  LearningPathStep,
  CertificationCard,
  ProjectCard,
  NextRoleCard,
  SalaryProjectionChart,
  StrengthCard,
  WeaknessCard,
  MissingSkillCard
};