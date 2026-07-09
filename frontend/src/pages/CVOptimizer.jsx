import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  FileText, 
  Target, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight, 
  Loader2,
  Shield,
  Zap,
  Award,
  Briefcase,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Copy,
  Check
} from 'lucide-react';
import { optimizeCV, quickATSCheck } from '../services/api';

// Reuse existing IntelCard component pattern
const IntelCard = ({ icon: Icon, title, color = 'blue', children, className = '' }) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-100',
    emerald: 'bg-emerald-50 border-emerald-100',
    amber: 'bg-amber-50 border-amber-100',
    rose: 'bg-rose-50 border-rose-100',
    purple: 'bg-purple-50 border-purple-100',
    slate: 'bg-slate-50 border-slate-100'
  };

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

// ATS Score Ring Component
const ATSScoreRing = ({ score, label, size = 80 }) => {
  const circumference = 2 * Math.PI * ((size - 8) / 2);
  const strokeDashoffset = circumference - (score / 100) * circumference;
  
  const getColor = (s) => {
    if (s >= 80) return '#10B981';
    if (s >= 60) return '#F59E0B';
    if (s >= 40) return '#F97316';
    return '#EF4444';
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={(size - 8) / 2}
            stroke="#E2E8F0"
            strokeWidth="6"
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={(size - 8) / 2}
            stroke={getColor(score)}
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-[#0F172A]">{score}</span>
        </div>
      </div>
      <span className="text-xs text-[#64748B] mt-1 font-medium">{label}</span>
    </div>
  );
};

// Copy Button Component
const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button 
      onClick={handleCopy}
      className="p-1.5 hover:bg-[#F1F5F9] rounded-lg transition-colors"
      title="Copy to clipboard"
    >
      {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} className="text-[#94A3B8]" />}
    </button>
  );
};

// Comparison View Component
const ComparisonView = ({ original, improved, title, type = 'text' }) => {
  const [showImproved, setShowImproved] = useState(true);

  if (type === 'list') {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h5 className="text-sm font-semibold text-[#0F172A]">{title}</h5>
          <button
            onClick={() => setShowImproved(!showImproved)}
            className="text-xs text-[#2563EB] hover:underline flex items-center gap-1"
          >
            {showImproved ? 'Show Original' : 'Show Improved'}
            {showImproved ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>
        
        <AnimatePresence mode="wait">
          {showImproved ? (
            <motion.div
              key="improved"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="bg-emerald-50 border border-emerald-100 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">AI Improved</span>
                <CopyButton text={improved.join('\n')} />
              </div>
              <ul className="space-y-2">
                {improved.map((item, i) => (
                  <li key={i} className="text-sm text-[#334155] flex items-start gap-2">
                    <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ) : (
            <motion.div
              key="original"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="bg-slate-50 border border-slate-100 rounded-lg p-4"
            >
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Original</span>
              <ul className="space-y-2 mt-2">
                {original.map((item, i) => (
                  <li key={i} className="text-sm text-[#64748B]">{item}</li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h5 className="text-sm font-semibold text-[#0F172A]">{title}</h5>
        <button
          onClick={() => setShowImproved(!showImproved)}
          className="text-xs text-[#2563EB] hover:underline flex items-center gap-1"
        >
          {showImproved ? 'Show Original' : 'Show Improved'}
          {showImproved ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>
      
      <AnimatePresence mode="wait">
        {showImproved ? (
          <motion.div
            key="improved"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="bg-emerald-50 border border-emerald-100 rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">AI Improved</span>
              <CopyButton text={improved} />
            </div>
            <p className="text-sm text-[#334155] leading-relaxed">{improved}</p>
          </motion.div>
        ) : (
          <motion.div
            key="original"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="bg-slate-50 border border-slate-100 rounded-lg p-4"
          >
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Original</span>
            <p className="text-sm text-[#64748B] leading-relaxed mt-2">{original}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const CVOptimizer = () => {
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [optimization, setOptimization] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState('overview');

  const handleOptimize = async () => {
    if (!jobTitle.trim() || !jobDescription.trim()) {
      setError('Please enter both job title and description');
      return;
    }

    setLoading(true);
    setError('');
    setOptimization(null);

    try {
      const res = await optimizeCV({
        job_title: jobTitle,
        job_description: jobDescription
      });

      if (res.data.success) {
        setOptimization(res.data.optimization);
      } else {
        setError(res.data.error || 'Optimization failed');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to optimize CV');
    } finally {
      setLoading(false);
    }
  };

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
              <h1 className="text-2xl font-bold text-[#0F172A]">AI CV Optimizer</h1>
              <p className="text-sm text-[#64748B]">ATS-optimized resume enhancement powered by Gemini AI</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Input Section */}
        {!optimization && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-[#E2E8F0] p-8 shadow-sm mb-8"
          >
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-[#0F172A] mb-2">
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

              <div>
                <label className="block text-sm font-semibold text-[#0F172A] mb-2">
                  Job Description
                </label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the full job description here..."
                  rows={8}
                  className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-none transition-all resize-none"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              <button
                onClick={handleOptimize}
                disabled={loading}
                className="w-full btn-primary py-4 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Analyzing your CV with AI...
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    Optimize My CV for This Job
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* Results Section */}
        {optimization && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Navigation Tabs */}
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-2 shadow-sm">
              <div className="flex gap-2 overflow-x-auto">
                {[
                  { id: 'overview', label: 'Overview', icon: Target },
                  { id: 'scores', label: 'ATS Scores', icon: Shield },
                  { id: 'keywords', label: 'Keywords', icon: FileText },
                  { id: 'rewritten', label: 'AI Rewritten', icon: Sparkles },
                  { id: 'feedback', label: 'Feedback', icon: Award },
                  { id: 'actionplan', label: 'Action Plan', icon: Zap },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSection(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                      activeSection === tab.id
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

            {/* Overview Tab */}
            {activeSection === 'overview' && (
              <div className="space-y-6">
                {/* Main Score Cards */}
                <div className="grid md:grid-cols-2 gap-6">
                  <IntelCard icon={Shield} title="ATS Compatibility Score" color="blue">
                    <div className="flex items-center justify-center py-4">
                      <ATSScoreRing 
                        score={optimization.atsScore?.overall || 0} 
                        label="Overall" 
                        size={120}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <ATSScoreRing score={optimization.atsScore?.formatting || 0} label="Formatting" size={70} />
                      <ATSScoreRing score={optimization.atsScore?.keywordMatch || 0} label="Keywords" size={70} />
                      <ATSScoreRing score={optimization.atsScore?.readability || 0} label="Readability" size={70} />
                      <ATSScoreRing score={optimization.atsScore?.completeness || 0} label="Complete" size={70} />
                    </div>
                  </IntelCard>

                  <IntelCard icon={Target} title="Resume Match Score" color="emerald">
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <div className="text-6xl font-bold text-[#0F172A] mb-2">
                          {optimization.resumeMatchScore || 0}%
                        </div>
                        <p className="text-sm text-[#64748B]">Match for {jobTitle}</p>
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-emerald-50 rounded-lg">
                      <p className="text-xs text-emerald-700 font-medium">
                        {optimization.resumeMatchScore >= 80 ? 'Excellent match! Your resume is well-aligned.' :
                         optimization.resumeMatchScore >= 60 ? 'Good match with room for improvement.' :
                         'Significant gaps detected. Follow the action plan below.'}
                      </p>
                    </div>
                  </IntelCard>
                </div>

                {/* Strengths & Weaknesses */}
                <div className="grid md:grid-cols-2 gap-6">
                  <IntelCard icon={CheckCircle2} title="Resume Strengths" color="emerald">
                    {optimization.strengths?.length > 0 ? (
                      <ul className="space-y-2">
                        {optimization.strengths.map((s, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-[#64748B]">No strengths detected</p>
                    )}
                  </IntelCard>

                  <IntelCard icon={AlertCircle} title="Areas to Improve" color="rose">
                    {optimization.weaknesses?.length > 0 ? (
                      <ul className="space-y-2">
                        {optimization.weaknesses.map((w, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <AlertCircle size={14} className="text-rose-500 shrink-0 mt-0.5" />
                            <span>{w}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-[#64748B]">No weaknesses detected</p>
                    )}
                  </IntelCard>
                </div>
              </div>
            )}

            {/* Keywords Tab */}
            {activeSection === 'keywords' && (
              <div className="space-y-6">
                <IntelCard icon={FileText} title="Keyword Analysis" color="blue">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h5 className="text-sm font-semibold text-emerald-700 mb-3 flex items-center gap-2">
                        <CheckCircle2 size={14} />
                        Matched Keywords ({optimization.keywordAnalysis?.matchedKeywords?.length || 0})
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {optimization.keywordAnalysis?.matchedKeywords?.map((kw, i) => (
                          <span key={i} className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h5 className="text-sm font-semibold text-rose-700 mb-3 flex items-center gap-2">
                        <AlertCircle size={14} />
                        Missing Keywords ({optimization.keywordAnalysis?.missingKeywords?.length || 0})
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {optimization.keywordAnalysis?.missingKeywords?.map((kw, i) => (
                          <span key={i} className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-medium">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </IntelCard>

                {optimization.missingSkills?.length > 0 && (
                  <IntelCard icon={Target} title="Missing Skills" color="amber">
                    <div className="space-y-3">
                      {optimization.missingSkills.map((skill, i) => (
                        <div key={i} className="flex items-start justify-between p-3 bg-amber-50 rounded-lg">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-[#0F172A]">{skill.skill}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                skill.importance === 'Critical' ? 'bg-red-100 text-red-700' :
                                skill.importance === 'High' ? 'bg-amber-100 text-amber-700' :
                                'bg-blue-100 text-blue-700'
                              }`}>
                                {skill.importance}
                              </span>
                            </div>
                            <p className="text-xs text-[#64748B] mt-1">{skill.context}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </IntelCard>
                )}
              </div>
            )}

            {/* Rewritten Content Tab */}
            {activeSection === 'rewritten' && (
              <div className="space-y-6">
                {optimization.improvedProfessionalSummary && (
                  <IntelCard icon={Sparkles} title="Professional Summary" color="purple">
                    <ComparisonView
                      original={optimization.improvedProfessionalSummary.original}
                      improved={optimization.improvedProfessionalSummary.improved}
                      title="Professional Summary"
                    />
                    {optimization.improvedProfessionalSummary.whyBetter && (
                      <p className="text-xs text-[#64748B] mt-3 bg-purple-50 p-3 rounded-lg">
                        <span className="font-semibold text-purple-700">Why it's better: </span>
                        {optimization.improvedProfessionalSummary.whyBetter}
                      </p>
                    )}
                  </IntelCard>
                )}

                {optimization.improvedExperience?.length > 0 && (
                  <IntelCard icon={Briefcase} title="Experience" color="blue">
                    <div className="space-y-6">
                      {optimization.improvedExperience.map((exp, i) => (
                        <div key={i} className="border-l-2 border-blue-200 pl-4">
                          <h5 className="text-sm font-semibold text-[#0F172A] mb-1">
                            {exp.role} at {exp.company}
                          </h5>
                          <ComparisonView
                            original={exp.originalBullets}
                            improved={exp.improvedBullets}
                            title=""
                            type="list"
                          />
                        </div>
                      ))}
                    </div>
                  </IntelCard>
                )}

                {optimization.improvedSkillsSection && (
                  <IntelCard icon={Zap} title="Skills Section" color="emerald">
                    <ComparisonView
                      original={optimization.improvedSkillsSection.original}
                      improved={optimization.improvedSkillsSection.improved}
                      title="Skills"
                      type="list"
                    />
                    {optimization.improvedSkillsSection.rationale && (
                      <p className="text-xs text-[#64748B] mt-3 bg-emerald-50 p-3 rounded-lg">
                        <span className="font-semibold text-emerald-700">Rationale: </span>
                        {optimization.improvedSkillsSection.rationale}
                      </p>
                    )}
                  </IntelCard>
                )}
              </div>
            )}

            {/* Feedback Tab */}
            {activeSection === 'feedback' && (
              <div className="space-y-6">
                {optimization.recruiterFeedback && (
                  <IntelCard icon={Award} title="Recruiter Feedback" color="purple">
                    <div className="space-y-4">
                      <div className="p-4 bg-purple-50 rounded-lg">
                        <p className="text-sm font-semibold text-purple-700 mb-1">First Impression</p>
                        <p className="text-sm text-[#334155]">{optimization.recruiterFeedback.firstImpression}</p>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-lg">
                        <p className="text-sm font-semibold text-purple-700 mb-1">Overall Verdict</p>
                        <p className="text-sm text-[#334155]">{optimization.recruiterFeedback.overallVerdict}</p>
                      </div>
                      {optimization.recruiterFeedback.standoutElements?.length > 0 && (
                        <div>
                          <p className="text-sm font-semibold text-emerald-700 mb-2">Standout Elements</p>
                          <ul className="space-y-1">
                            {optimization.recruiterFeedback.standoutElements.map((el, i) => (
                              <li key={i} className="text-sm text-[#334155] flex items-center gap-2">
                                <CheckCircle2 size={14} className="text-emerald-500" />
                                {el}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {optimization.recruiterFeedback.redFlags?.length > 0 && (
                        <div>
                          <p className="text-sm font-semibold text-rose-700 mb-2">Red Flags</p>
                          <ul className="space-y-1">
                            {optimization.recruiterFeedback.redFlags.map((flag, i) => (
                              <li key={i} className="text-sm text-[#334155] flex items-center gap-2">
                                <AlertCircle size={14} className="text-rose-500" />
                                {flag}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </IntelCard>
                )}

                {optimization.formattingSuggestions?.length > 0 && (
                  <IntelCard icon={FileText} title="Formatting Suggestions" color="amber">
                    <div className="space-y-3">
                      {optimization.formattingSuggestions.map((suggestion, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
                          <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                            suggestion.severity === 'Critical' ? 'bg-red-500' :
                            suggestion.severity === 'High' ? 'bg-amber-500' :
                            'bg-blue-500'
                          }`} />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-[#0F172A]">{suggestion.issue}</p>
                            <p className="text-xs text-[#64748B] mt-1">{suggestion.fix}</p>
                            {suggestion.example && (
                              <p className="text-xs text-[#94A3B8] mt-1 italic">Example: {suggestion.example}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </IntelCard>
                )}

                {optimization.grammarWriting?.length > 0 && (
                  <IntelCard icon={BookOpen} title="Grammar & Writing" color="blue">
                    <div className="space-y-3">
                      {optimization.grammarWriting.map((item, i) => (
                        <div key={i} className="p-3 bg-blue-50 rounded-lg">
                          <p className="text-xs text-red-600 line-through">{item.original}</p>
                          <p className="text-xs text-emerald-600 font-medium mt-1">{item.correction}</p>
                          <p className="text-xs text-[#64748B] mt-1">{item.explanation}</p>
                        </div>
                      ))}
                    </div>
                  </IntelCard>
                )}
              </div>
            )}

            {/* Action Plan Tab */}
            {activeSection === 'actionplan' && (
              <div className="space-y-6">
                <IntelCard icon={Zap} title="Recommended Action Plan" color="amber">
                  <div className="space-y-4">
                    {optimization.actionPlan?.map((step, i) => (
                      <div key={i} className="flex items-start gap-4 p-4 bg-white border border-[#E2E8F0] rounded-xl">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                          step.priority === 'Critical' ? 'bg-red-100 text-red-700' :
                          step.priority === 'High' ? 'bg-amber-100 text-amber-700' :
                          step.priority === 'Medium' ? 'bg-blue-100 text-blue-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {step.step}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h5 className="text-sm font-semibold text-[#0F172A]">{step.action}</h5>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              step.priority === 'Critical' ? 'bg-red-100 text-red-700' :
                              step.priority === 'High' ? 'bg-amber-100 text-amber-700' :
                              step.priority === 'Medium' ? 'bg-blue-100 text-blue-700' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {step.priority}
                            </span>
                          </div>
                          <p className="text-xs text-[#64748B] mb-1">{step.impact}</p>
                          <p className="text-xs text-[#94A3B8]">⏱ {step.timeEstimate}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </IntelCard>

                <div className="flex justify-center">
                  <button
                    onClick={() => {
                      setOptimization(null);
                      setJobTitle('');
                      setJobDescription('');
                      setActiveSection('overview');
                    }}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <ArrowRight size={16} />
                    Optimize for Another Job
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default CVOptimizer;