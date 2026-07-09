import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Briefcase,
  FileText,
  Loader2,
  AlertCircle,
  Target,
  Shield,
  MessageSquare,
  Code,
  HelpCircle,
  Zap,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  Award,
  TrendingUp,
  Clock
} from 'lucide-react';
import { useCV } from '../context/CVContext';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import { getInterviewCopilot } from '../services/api';
import {
  QuestionCard,
  ReadinessScoreRing,
  ChecklistItem,
  SkillHighlightCard,
  MistakeCard,
  ConfidenceTip
} from '../components/InterviewCard';

const tabs = [
  { id: 'overview', label: 'Overview', icon: Target },
  { id: 'technical', label: 'Technical', icon: Code },
  { id: 'behavioral', label: 'Behavioral', icon: MessageSquare },
  { id: 'role-specific', label: 'Role-Specific', icon: Briefcase },
  { id: 'follow-up', label: 'Follow-Up', icon: HelpCircle },
  { id: 'skills', label: 'Skills', icon: Zap },
  { id: 'checklist', label: 'Checklist', icon: CheckCircle2 },
  { id: 'tips', label: 'Tips & Mistakes', icon: BookOpen },
];

const IntelCard = ({ icon: Icon, title, color = 'blue', children, className = '' }) => {
  const iconColors = {
    blue: 'text-blue-600',
    emerald: 'text-emerald-600',
    amber: 'text-amber-600',
    rose: 'text-rose-600',
    purple: 'text-purple-600',
    slate: 'text-slate-600'
  };

  return (
    <div className={`bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-sm ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon size={18} className={iconColors[color]} />
        <h4 className="font-semibold text-[#0F172A] text-sm">{title}</h4>
      </div>
      <div className="text-sm text-[#334155]">{children}</div>
    </div>
  );
};

export default function InterviewCopilot() {
  const { cvData } = useCV();
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const navigate = useNavigate();

  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [jobCompany, setJobCompany] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [prep, setPrep] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [checklist, setChecklist] = useState([]);

  const handleGenerate = useCallback(async () => {
    if (!jobTitle.trim() || !jobDescription.trim()) {
      setError('Please enter both job title and description');
      return;
    }

    setLoading(true);
    setError('');
    setPrep(null);

    try {
      const payload = {
        job_title: jobTitle,
        job_description: jobDescription,
        job_company: jobCompany,
        experience_level: experienceLevel,
        cv_text: cvData?.cleaned_text || cvData?.raw_text || ''
      };

      const res = await getInterviewCopilot(payload);

      if (res.data.success) {
        const data = res.data.interview_prep;
        setPrep(data);
        setChecklist(data.preparationChecklist || []);
      } else {
        setError(res.data.error || 'Failed to generate interview preparation');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to generate interview preparation');
    } finally {
      setLoading(false);
    }
  }, [jobTitle, jobDescription, jobCompany, experienceLevel, cvData]);

  const toggleChecklistItem = useCallback((index) => {
    setChecklist(prev => {
      const next = [...prev];
      next[index] = { ...next[index], completed: !next[index].completed };
      return next;
    });
  }, []);

  const completedCount = checklist.filter(c => c.completed).length;
  const progress = checklist.length > 0 ? Math.round((completedCount / checklist.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <div className="bg-white border-b border-[#E2E8F0]">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-[#2563EB] to-[#7C3AED] rounded-xl flex items-center justify-center">
              <Sparkles className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#0F172A]">AI Interview Copilot</h1>
              <p className="text-sm text-[#64748B]">Personalized interview preparation powered by Gemini AI</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Input Section */}
        {!prep && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-[#E2E8F0] p-8 shadow-sm mb-8"
          >
            <div className="space-y-6">
              {/* Job Title */}
              <div>
                <label className="block text-sm font-semibold text-[#0F172A] mb-2 flex items-center gap-2">
                  <Briefcase size={16} className="text-[#64748B]" />
                  Target Job Title
                </label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g., Senior Software Engineer"
                  className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-none transition-all"
                />
              </div>

              {/* Company */}
              <div>
                <label className="block text-sm font-semibold text-[#0F172A] mb-2">
                  Company Name (Optional)
                </label>
                <input
                  type="text"
                  value={jobCompany}
                  onChange={(e) => setJobCompany(e.target.value)}
                  placeholder="e.g., Google, Microsoft, Stripe"
                  className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-none transition-all"
                />
              </div>

              {/* Experience Level */}
              <div>
                <label className="block text-sm font-semibold text-[#0F172A] mb-2">
                  Experience Level (Optional)
                </label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-none transition-all bg-white"
                >
                  <option value="">Select level...</option>
                  <option value="Junior">Junior (0-2 years)</option>
                  <option value="Mid-level">Mid-level (3-5 years)</option>
                  <option value="Senior">Senior (5+ years)</option>
                  <option value="Staff/Principal">Staff/Principal (8+ years)</option>
                </select>
              </div>

              {/* Job Description */}
              <div>
                <label className="block text-sm font-semibold text-[#0F172A] mb-2 flex items-center gap-2">
                  <FileText size={16} className="text-[#64748B]" />
                  Job Description
                </label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the full job description here... The more detail you provide, the more personalized your interview prep will be."
                  rows={10}
                  className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-none transition-all resize-none"
                />
              </div>

              {/* CV Data Notice */}
              {cvData && (
                <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 p-3 rounded-lg">
                  <CheckCircle2 size={16} />
                  Your uploaded CV will be used to personalize interview questions.
                </div>
              )}
              {!cvData && (
                <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 p-3 rounded-lg">
                  <AlertCircle size={16} />
                  No CV detected. Interview prep will be generic.{' '}
                  <button onClick={() => navigate('/upload')} className="underline font-medium">
                    Upload your CV
                  </button>
                  {' '}for personalized questions.
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full btn-primary py-4 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Generating personalized interview prep...
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    Generate Interview Preparation
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* Results Section */}
        {prep && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Navigation Tabs */}
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-2 shadow-sm sticky top-0 z-10">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                      activeTab === tab.id
                        ? 'bg-[#2563EB] text-white'
                        : 'text-[#64748B] hover:bg-[#F1F5F9]'
                    }`}
                  >
                    <tab.icon size={14} />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── OVERVIEW TAB ── */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <IntelCard icon={Shield} title="Interview Readiness Score" color="blue">
                    <div className="flex items-center justify-center py-4">
                      <ReadinessScoreRing
                        score={prep.readinessScore || 0}
                        label={prep.readinessLabel}
                        size={140}
                      />
                    </div>
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg text-center">
                      <p className="text-sm text-blue-700 font-medium">
                        {prep.readinessScore >= 80
                          ? 'You are well-prepared! Focus on polishing your answers.'
                          : prep.readinessScore >= 60
                          ? 'Good foundation. Work through the action items below.'
                          : 'Significant preparation needed. Start with the checklist.'}
                      </p>
                    </div>
                  </IntelCard>

                  <IntelCard icon={Award} title="Preparation Summary" color="purple">
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-[#64748B] uppercase tracking-wide font-medium mb-1">Overall Assessment</p>
                        <p className="text-sm text-[#334155] leading-relaxed">{prep.summary?.overallAssessment}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-emerald-50 rounded-lg p-3">
                          <p className="text-xs text-emerald-700 font-medium mb-1">Strongest Area</p>
                          <p className="text-sm text-[#0F172A] font-semibold">{prep.summary?.strongestArea}</p>
                        </div>
                        <div className="bg-rose-50 rounded-lg p-3">
                          <p className="text-xs text-rose-700 font-medium mb-1">Needs Most Work</p>
                          <p className="text-sm text-[#0F172A] font-semibold">{prep.summary?.weakestArea}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bg-amber-50 rounded-lg p-3">
                        <Clock size={16} className="text-amber-600" />
                        <div>
                          <p className="text-xs text-amber-700 font-medium">Estimated Prep Time</p>
                          <p className="text-sm text-[#0F172A] font-semibold">{prep.summary?.timeToPrepare}</p>
                        </div>
                      </div>
                    </div>
                  </IntelCard>
                </div>

                <IntelCard icon={BookOpen} title="Final Personalized Advice" color="amber">
                  <p className="text-sm text-[#334155] leading-relaxed">{prep.summary?.finalAdvice}</p>
                </IntelCard>

                {prep.skillsToHighlight?.length > 0 && (
                  <IntelCard icon={TrendingUp} title="Skills to Highlight in the Interview" color="emerald">
                    <div className="grid md:grid-cols-2 gap-4">
                      {prep.skillsToHighlight.map((skill, i) => (
                        <SkillHighlightCard key={i} skill={skill} />
                      ))}
                    </div>
                  </IntelCard>
                )}
              </div>
            )}

            {/* ── TECHNICAL TAB ── */}
            {activeTab === 'technical' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-[#0F172A]">Technical Interview Questions</h3>
                  <span className="text-sm text-[#64748B]">{prep.technicalQuestions?.length || 0} questions</span>
                </div>
                {prep.technicalQuestions?.map((q) => (
                  <QuestionCard key={q.id} question={q} type="technical" />
                ))}
              </div>
            )}

            {/* ── BEHAVIORAL TAB ── */}
            {activeTab === 'behavioral' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-[#0F172A]">Behavioral Interview Questions</h3>
                  <span className="text-sm text-[#64748B]">{prep.behavioralQuestions?.length || 0} questions</span>
                </div>
                {prep.behavioralQuestions?.map((q) => (
                  <QuestionCard key={q.id} question={q} type="behavioral" />
                ))}
              </div>
            )}

            {/* ── ROLE-SPECIFIC TAB ── */}
            {activeTab === 'role-specific' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-[#0F172A]">Role-Specific Questions</h3>
                  <span className="text-sm text-[#64748B]">{prep.roleSpecificQuestions?.length || 0} questions</span>
                </div>
                {prep.roleSpecificQuestions?.map((q) => (
                  <QuestionCard key={q.id} question={q} type="role-specific" />
                ))}
              </div>
            )}

            {/* ── FOLLOW-UP TAB ── */}
            {activeTab === 'follow-up' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-[#0F172A]">Likely Follow-Up Questions</h3>
                  <span className="text-sm text-[#64748B]">{prep.followUpQuestions?.length || 0} questions</span>
                </div>
                <p className="text-sm text-[#64748B]">
                  These are questions the interviewer might ask based on your answers. Prepare for them to stay ahead.
                </p>
                {prep.followUpQuestions?.map((q) => (
                  <QuestionCard key={q.id} question={q} type="follow-up" />
                ))}
              </div>
            )}

            {/* ── SKILLS TAB ── */}
            {activeTab === 'skills' && (
              <div className="space-y-6">
                <IntelCard icon={Target} title="Skills the Interviewer Will Likely Evaluate" color="blue">
                  <div className="space-y-3">
                    {prep.skillsLikelyEvaluated?.map((skill, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                          <Target size={14} className="text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h5 className="text-sm font-semibold text-[#0F172A]">{skill.skill}</h5>
                          <p className="text-xs text-[#64748B] mt-0.5">
                            <span className="font-medium text-blue-700">How evaluated: </span>
                            {skill.evaluationMethod}
                          </p>
                          <p className="text-xs text-[#64748B] mt-1">
                            <span className="font-medium text-emerald-700">Prep tip: </span>
                            {skill.preparationTip}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </IntelCard>

                <IntelCard icon={TrendingUp} title="Skills to Highlight" color="emerald">
                  <div className="grid md:grid-cols-2 gap-4">
                    {prep.skillsToHighlight?.map((skill, i) => (
                      <SkillHighlightCard key={i} skill={skill} />
                    ))}
                  </div>
                </IntelCard>
              </div>
            )}

            {/* ── CHECKLIST TAB ── */}
            {activeTab === 'checklist' && (
              <div className="space-y-6">
                <IntelCard icon={CheckCircle2} title="Interview Preparation Checklist" color="blue">
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-[#0F172A]">Progress</span>
                      <span className="text-sm text-[#64748B]">{completedCount} / {checklist.length}</span>
                    </div>
                    <div className="w-full h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-[#2563EB] rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                    <p className="text-xs text-[#64748B] mt-1">{progress}% complete</p>
                  </div>

                  <div className="space-y-2">
                    {checklist.map((item, i) => (
                      <ChecklistItem
                        key={i}
                        item={item}
                        index={i}
                        onToggle={toggleChecklistItem}
                      />
                    ))}
                  </div>
                </IntelCard>
              </div>
            )}

            {/* ── TIPS & MISTAKES TAB ── */}
            {activeTab === 'tips' && (
              <div className="space-y-6">
                <IntelCard icon={Zap} title="Confidence-Building Recommendations" color="purple">
                  <div className="space-y-3">
                    {prep.confidenceBuilders?.map((tip, i) => (
                      <ConfidenceTip key={i} tip={tip} index={i} />
                    ))}
                  </div>
                </IntelCard>

                <IntelCard icon={AlertCircle} title="Common Mistakes to Avoid" color="rose">
                  <div className="space-y-3">
                    {prep.commonMistakesToAvoid?.map((mistake, i) => (
                      <MistakeCard key={i} mistake={mistake} index={i} />
                    ))}
                  </div>
                </IntelCard>
              </div>
            )}

            {/* Reset Button */}
            <div className="flex justify-center pt-4">
              <button
                onClick={() => {
                  setPrep(null);
                  setJobTitle('');
                  setJobDescription('');
                  setJobCompany('');
                  setExperienceLevel('');
                  setActiveTab('overview');
                  setChecklist([]);
                }}
                className="btn-secondary flex items-center gap-2"
              >
                <ArrowRight size={16} />
                Prepare for Another Interview
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}