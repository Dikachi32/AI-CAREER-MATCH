import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronUp,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  MessageSquare,
  Code,
  Briefcase,
  HelpCircle
} from 'lucide-react';

const categoryIcons = {
  'Algorithms': Code,
  'System Design': Code,
  'Data Structures': Code,
  'Language-Specific': Code,
  'Framework': Code,
  'DevOps': Code,
  'ML/AI': Code,
  'Databases': Code,
  'default': Code
};

const difficultyColors = {
  'Easy': 'bg-emerald-100 text-emerald-700',
  'Medium': 'bg-amber-100 text-amber-700',
  'Hard': 'bg-rose-100 text-rose-700'
};

const frameworkColors = {
  'STAR': 'bg-blue-100 text-blue-700',
  'SOAR': 'bg-purple-100 text-purple-700',
  'CAR': 'bg-emerald-100 text-emerald-700'
};

export function QuestionCard({ question, type = 'technical' }) {
  const [expanded, setExpanded] = useState(false);

  const Icon = type === 'technical'
    ? (categoryIcons[question.category] || categoryIcons.default)
    : type === 'behavioral'
    ? MessageSquare
    : type === 'role-specific'
    ? Briefcase
    : HelpCircle;

  return (
    <motion.div
      layout
      className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-[#F8FAFC] transition-colors"
      >
        <div className="w-8 h-8 rounded-lg bg-[#2563EB]/10 flex items-center justify-center shrink-0 mt-0.5">
          <Icon size={16} className="text-[#2563EB]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#0F172A] leading-relaxed">
            {question.question}
          </p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {question.difficulty && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${difficultyColors[question.difficulty] || difficultyColors.Medium}`}>
                {question.difficulty}
              </span>
            )}
            {question.category && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#F1F5F9] text-[#64748B] font-medium">
                {question.category}
              </span>
            )}
            {question.framework && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${frameworkColors[question.framework] || frameworkColors.STAR}`}>
                {question.framework}
              </span>
            )}
          </div>
        </div>
        <div className="shrink-0 mt-1">
          {expanded ? (
            <ChevronUp size={16} className="text-[#94A3B8]" />
          ) : (
            <ChevronDown size={16} className="text-[#94A3B8]" />
          )}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-0 space-y-4">
              {/* Suggested Answer */}
              <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb size={14} className="text-emerald-600" />
                  <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Suggested Answer</span>
                </div>
                <p className="text-sm text-[#334155] leading-relaxed whitespace-pre-wrap">
                  {question.suggestedAnswer}
                </p>
              </div>

              {/* Key Points */}
              {question.keyPoints && question.keyPoints.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 size={14} className="text-blue-600" />
                    <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Key Points to Mention</span>
                  </div>
                  <ul className="space-y-1.5">
                    {question.keyPoints.map((point, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[#334155]">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Common Mistakes */}
              {question.commonMistakes && question.commonMistakes.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle size={14} className="text-rose-600" />
                    <span className="text-xs font-semibold text-rose-700 uppercase tracking-wide">Common Mistakes to Avoid</span>
                  </div>
                  <ul className="space-y-1.5">
                    {question.commonMistakes.map((mistake, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[#64748B]">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                        {mistake}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Context (for role-specific questions) */}
              {question.context && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <BookOpen size={14} className="text-blue-600" />
                    <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Why This Matters</span>
                  </div>
                  <p className="text-sm text-[#334155]">{question.context}</p>
                </div>
              )}

              {/* Trigger (for follow-up questions) */}
              {question.trigger && (
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <HelpCircle size={14} className="text-amber-600" />
                    <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">When This Follow-Up Happens</span>
                  </div>
                  <p className="text-sm text-[#334155]">{question.trigger}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function ReadinessScoreRing({ score, label, size = 120 }) {
  const circumference = 2 * Math.PI * ((size - 12) / 2);
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getColor = (s) => {
    if (s >= 80) return '#10B981';
    if (s >= 60) return '#F59E0B';
    if (s >= 40) return '#F97316';
    return '#EF4444';
  };

  const getLabel = (s) => {
    if (s >= 80) return 'Interview Ready';
    if (s >= 60) return 'Well Prepared';
    if (s >= 40) return 'Getting There';
    if (s >= 20) return 'Needs Work';
    return 'Not Ready';
  };

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
            stroke={getColor(score)}
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
          <span className="text-xs text-[#64748B]">/100</span>
        </div>
      </div>
      <span className="text-sm font-semibold text-[#0F172A] mt-2">{label || getLabel(score)}</span>
    </div>
  );
}

export function ChecklistItem({ item, onToggle, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
        item.completed
          ? 'bg-emerald-50 border-emerald-100'
          : 'bg-white border-[#E2E8F0] hover:border-[#2563EB]/30'
      }`}
      onClick={() => onToggle && onToggle(index)}
    >
      <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 border-2 transition-all ${
        item.completed
          ? 'bg-emerald-500 border-emerald-500'
          : 'border-[#CBD5E1] hover:border-[#2563EB]'
      }`}>
        {item.completed && <CheckCircle2 size={12} className="text-white" />}
      </div>
      <div className="flex-1">
        <p className={`text-sm ${item.completed ? 'text-emerald-700 line-through' : 'text-[#334155]'}`}>
          {item.item}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F1F5F9] text-[#64748B] font-medium uppercase tracking-wide">
            {item.category}
          </span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wide ${
            item.priority === 'Critical' ? 'bg-red-100 text-red-700' :
            item.priority === 'High' ? 'bg-amber-100 text-amber-700' :
            item.priority === 'Medium' ? 'bg-blue-100 text-blue-700' :
            'bg-slate-100 text-slate-600'
          }`}>
            {item.priority}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export function SkillHighlightCard({ skill }) {
  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-lg bg-[#2563EB]/10 flex items-center justify-center">
          <Lightbulb size={14} className="text-[#2563EB]" />
        </div>
        <h4 className="font-semibold text-[#0F172A] text-sm">{skill.skill}</h4>
      </div>
      <p className="text-xs text-[#64748B] mb-2">
        <span className="font-medium text-[#334155]">Why relevant: </span>
        {skill.whyRelevant}
      </p>
      <p className="text-xs text-[#64748B]">
        <span className="font-medium text-[#334155]">How to demonstrate: </span>
        {skill.howToDemonstrate}
      </p>
    </div>
  );
}

export function MistakeCard({ mistake, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-rose-50 border border-rose-100 rounded-xl p-4"
    >
      <div className="flex items-start gap-3">
        <div className="w-7 h-7 rounded-lg bg-rose-100 flex items-center justify-center shrink-0">
          <AlertTriangle size={14} className="text-rose-600" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-rose-800 text-sm mb-1">{mistake.mistake}</h4>
          <p className="text-xs text-rose-700 mb-2">
            <span className="font-medium">Impact: </span>
            {mistake.whyItHurts}
          </p>
          <p className="text-xs text-[#64748B]">
            <span className="font-medium text-emerald-700">How to avoid: </span>
            {mistake.howToAvoid}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export function ConfidenceTip({ tip, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="flex items-start gap-3 p-3 bg-purple-50 border border-purple-100 rounded-lg"
    >
      <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-xs font-bold text-purple-700">{index + 1}</span>
      </div>
      <p className="text-sm text-[#334155]">{tip}</p>
    </motion.div>
  );
}

export default {
  QuestionCard,
  ReadinessScoreRing,
  ChecklistItem,
  SkillHighlightCard,
  MistakeCard,
  ConfidenceTip
};