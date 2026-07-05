import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import CVOptimizerModal from '../components/CVOptimizerModal';
import {
  ArrowLeft, Building2, MapPin, DollarSign, Briefcase, Globe,
  ExternalLink, Sparkles, Target, TrendingUp, AlertTriangle,
  CheckCircle2, XCircle, Zap, BookOpen, Award, Clock,
  Shield, BarChart3, Loader2, Lock, X, Crown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCV } from '../context/CVContext';
import { useSubscription } from '../context/SubscriptionContext';
import { getCVMatch, getJobIntelligence } from '../services/api';
import SkeletonLoader from '../components/SkeletonLoader';


// Match Score Ring
function MatchRing({ score, size = 120 }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? '#22C55E' : score >= 60 ? '#F59E0B' : '#EF4444';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#E2E8F0" strokeWidth={8} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth={8} strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold" style={{ color }}>{score}%</span>
        <span className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Match</span>
      </div>
    </div>
  );
}

// Skill Comparison Bar
function SkillBar({ label, userHas, required }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-[#0F172A] w-28 truncate">{label}</span>
      <div className="flex-1 h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${userHas ? 'bg-emerald-500' : 'bg-red-400'}`} style={{ width: userHas ? '100%' : '40%' }} />
      </div>
      {userHas ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> : <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
    </div>
  );
}

// Intelligence Card
function IntelCard({ icon: Icon, title, children, color = 'blue' }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    purple: 'bg-purple-50 text-purple-700 border-purple-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    rose: 'bg-rose-50 text-rose-700 border-rose-100',
  };
  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
        <h4 className="font-semibold text-[#0F172A] text-sm">{title}</h4>
      </div>
      <div className="text-sm text-[#64748B]">{children}</div>
    </div>
  );
}

export default function JobDetails() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cvData, aiProfile, extractedInfo, hasCV } = useCV();
  const { isPremium } = useSubscription();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [matchData, setMatchData] = useState(null);
  const [intelligence, setIntelligence] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showOptimizer, setShowOptimizer] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Load job from localStorage or fetch
  useEffect(() => {
    const loadJob = async () => {
      const stored = localStorage.getItem('careermatch_selected_job');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.job_id === jobId) {
          setJob(parsed);
        }
      }

      // If no stored job or mismatch, we'd fetch from API
      // For now, use stored data since recommendations carry full job objects

      setLoading(false);
    };
    loadJob();
  }, [jobId]);

  // Load CV Match Analysis
  useEffect(() => {
    if (!job || !hasCV) return;
    const loadMatch = async () => {
      try {
        const res = await getCVMatch({
          job_id: job.job_id,
          job_title: job.title,
          job_description: job.description,
          cv_text: cvData?.cleaned_text || ''
        });
        setMatchData(res.data);
      } catch (err) {
        console.error('CV Match error:', err);
      }
    };
    loadMatch();
  }, [job, hasCV, cvData]);

  // Load AI Job Intelligence
  useEffect(() => {
    if (!job) return;
    const loadIntel = async () => {
      try {
        const res = await getJobIntelligence({
          job_title: job.title,
          job_description: job.description,
          company: job.company,
          industry: job.industry
        });
        setIntelligence(res.data);
      } catch (err) {
        console.error('Intelligence error:', err);
      }
    };
    loadIntel();
  }, [job]);

  const handleApply = () => {
    if (job?.apply_link && job.apply_link !== '#') {
      window.open(job.apply_link, '_blank', 'noopener,noreferrer');
    }
  };

  const handleUpgradeCV = () => {
    if (!isPremium) {
      setShowUpgradeModal(true);
      return;
    }
    setShowOptimizer(true);
  };

  if (loading) {
    return (
      <div className="section-padding py-12 max-w-5xl mx-auto">
        <SkeletonLoader type="text" lines={2} className="mb-8" />
        <SkeletonLoader type="card" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="section-padding py-20 text-center max-w-2xl mx-auto">
        <AlertTriangle className="w-16 h-16 text-[#E2E8F0] mx-auto mb-4" />
        <h2 className="text-xl font-bold text-[#0F172A] mb-2">Job Not Found</h2>
        <p className="text-[#64748B] mb-6">We couldn't find the job details you're looking for.</p>
        <Link to="/recommendations" className="btn-primary inline-flex items-center gap-2">
          <ArrowLeft size={16} /> Back to Recommendations
        </Link>
      </div>
    );
  }

  const userSkills = extractedInfo?.technical_skills || aiProfile?.extracted_skills?.technical || [];
  const matchScore = matchData?.match_percentage || job.match_score || 0;

  return (
    <div className="section-padding py-8 lg:py-12 max-w-5xl mx-auto animate-fade-in">
      {/* Back Navigation */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
        <button
          onClick={() => navigate('/recommendations')}
          className="inline-flex items-center gap-2 text-sm text-[#64748B] hover:text-[#2563EB] transition-colors"
        >
          <ArrowLeft size={16} /> Back to Recommendations
        </button>
      </motion.div>

      {/* Job Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-[#E2E8F0] p-6 lg:p-8 shadow-sm mb-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-start gap-6">
          {/* Company & Title */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-14 h-14 bg-gradient-to-br from-[#2563EB]/10 to-purple-500/10 rounded-2xl flex items-center justify-center">
                <Building2 className="text-[#2563EB]" size={28} />
              </div>
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-[#0F172A]">{job.title}</h1>
                <p className="text-[#64748B]">{job.company}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-[#64748B] mt-4">
              <span className="flex items-center gap-1.5"><MapPin size={14} /> {job.location}</span>
              <span className="flex items-center gap-1.5"><DollarSign size={14} /> {job.salary_range}</span>
              <span className="flex items-center gap-1.5"><Briefcase size={14} /> {job.experience_level}</span>
              {job.remote && (
                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg text-xs font-medium border border-emerald-100">
                  <Globe size={12} /> Remote
                </span>
              )}
            </div>

            {/* Job Source Tags */}
            <div className="flex flex-wrap gap-2 mt-4">
              {job.apply_link && job.apply_link !== '#' && (
                <span className="inline-flex items-center gap-1 text-xs text-[#94A3B8] bg-[#F1F5F9] px-2.5 py-1 rounded-lg">
                  <Globe size={12} /> External Posting
                </span>
              )}
              <span className="inline-flex items-center gap-1 text-xs text-[#94A3B8] bg-[#F1F5F9] px-2.5 py-1 rounded-lg">
                <Building2 size={12} /> {job.industry || 'Technology'}
              </span>
            </div>
          </div>

          {/* Match Score */}
          <div className="flex flex-col items-center gap-3 shrink-0">
            <MatchRing score={matchScore} size={100} />
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${matchScore >= 80 ? 'bg-emerald-50 text-emerald-700' : matchScore >= 60 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
              {matchScore >= 80 ? 'Strong Fit' : matchScore >= 60 ? 'Good Fit' : 'Needs Work'}
            </span>
          </div>
        </div>

        {/* Primary Actions */}
        <div className="flex flex-wrap items-center gap-3 mt-6 pt-6 border-t border-[#F1F5F9]">
          <button
            onClick={handleApply}
            disabled={!job.apply_link || job.apply_link === '#'}
            className="btn-primary inline-flex items-center gap-2"
          >
            <ExternalLink size={16} />
            Apply Now
          </button>
          <button
            onClick={handleUpgradeCV}
            className="btn-secondary inline-flex items-center gap-2"
          >
            <Sparkles size={16} />
            Optimize CV for This Role
          </button>
          <Link
            to="/recommendations"
            className="text-sm text-[#64748B] hover:text-[#0F172A] transition-colors ml-auto"
          >
            View Similar Roles
          </Link>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white rounded-xl border border-[#E2E8F0] p-1 mb-6 shadow-sm overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview', icon: BookOpen },
          { id: 'match', label: 'CV Match', icon: Target },
          { id: 'intelligence', label: 'AI Intelligence', icon: BarChart3 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-[#0F172A] text-white shadow-sm' : 'text-[#64748B] hover:bg-[#F1F5F9]'}`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Main Description */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
                  <h3 className="font-semibold text-[#0F172A] mb-4 flex items-center gap-2">
                    <BookOpen size={18} className="text-[#2563EB]" />
                    Job Description
                  </h3>
                  <div className="prose prose-slate max-w-none text-sm text-[#334155] leading-relaxed whitespace-pre-line">
                    {job.description}
                  </div>
                </div>

                {job.requirements && (
                  <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
                    <h3 className="font-semibold text-[#0F172A] mb-4 flex items-center gap-2">
                      <Shield size={18} className="text-[#2563EB]" />
                      Requirements
                    </h3>
                    <ul className="space-y-2">
                      {job.requirements.map((req, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-[#334155]">
                          <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {job.responsibilities && (
                  <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
                    <h3 className="font-semibold text-[#0F172A] mb-4 flex items-center gap-2">
                      <Briefcase size={18} className="text-[#2563EB]" />
                      Responsibilities
                    </h3>
                    <ul className="space-y-2">
                      {job.responsibilities.map((resp, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-[#334155]">
                          <Zap size={16} className="text-amber-500 shrink-0 mt-0.5" />
                          {resp}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
                  <h3 className="font-semibold text-[#0F172A] mb-4">Job Details</h3>
                  <div className="space-y-4 text-sm">
                    <div className="flex items-center gap-3">
                      <Clock size={16} className="text-[#94A3B8]" />
                      <div>
                        <p className="text-[#94A3B8] text-xs">Posted</p>
                        <p className="text-[#0F172A] font-medium">{job.posted_date || 'Recently'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin size={16} className="text-[#94A3B8]" />
                      <div>
                        <p className="text-[#94A3B8] text-xs">Location</p>
                        <p className="text-[#0F172A] font-medium">{job.location}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <DollarSign size={16} className="text-[#94A3B8]" />
                      <div>
                        <p className="text-[#94A3B8] text-xs">Salary</p>
                        <p className="text-[#0F172A] font-medium">{job.salary_range || 'Not disclosed'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Briefcase size={16} className="text-[#94A3B8]" />
                      <div>
                        <p className="text-[#94A3B8] text-xs">Experience</p>
                        <p className="text-[#0F172A] font-medium">{job.experience_level || 'Not specified'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Building2 size={16} className="text-[#94A3B8]" />
                      <div>
                        <p className="text-[#94A3B8] text-xs">Industry</p>
                        <p className="text-[#0F172A] font-medium">{job.industry || 'Technology'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Skills Tags */}
                {job.skills && job.skills.length > 0 && (
                  <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
                    <h3 className="font-semibold text-[#0F172A] mb-4">Required Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {job.skills.map((skill, i) => (
                        <span
                          key={i}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${userSkills.includes(skill.toLowerCase()) ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]'}`}
                        >
                          {skill}
                          {userSkills.includes(skill.toLowerCase()) && <CheckCircle2 size={12} className="inline ml-1" />}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* MATCH TAB */}
        {activeTab === 'match' && (
          <motion.div
            key="match"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {!hasCV ? (
              <div className="bg-white rounded-2xl border border-[#E2E8F0] p-12 text-center shadow-sm">
                <AlertTriangle className="w-12 h-12 text-[#E2E8F0] mx-auto mb-4" />
                <h3 className="font-semibold text-[#0F172A] mb-2">No CV Uploaded</h3>
                <p className="text-sm text-[#64748B] mb-6 max-w-md mx-auto">
                  Upload your CV to see a detailed match analysis, skill gap breakdown, and personalized recommendations.
                </p>
                <Link to="/upload" className="btn-primary inline-flex items-center gap-2">
                  <ArrowLeft size={16} className="rotate-180" /> Upload CV
                </Link>
              </div>
            ) : (
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
                    <h3 className="font-semibold text-[#0F172A] mb-6 flex items-center gap-2">
                      <Target size={18} className="text-[#2563EB]" />
                      Match Analysis
                    </h3>

                    <div className="flex flex-col sm:flex-row items-center gap-8 mb-8">
                      <MatchRing score={matchScore} />
                      <div className="flex-1 space-y-3">
                        <h4 className="font-medium text-[#0F172A]">
                          {matchScore >= 80 ? 'Excellent Match' : matchScore >= 60 ? 'Good Match' : 'Partial Match'}
                        </h4>
                        <p className="text-sm text-[#64748B]">
                          {matchData?.analysis || 'Your profile aligns with this role based on skills, experience level, and industry fit.'}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {matchData?.key_strengths?.map((s, i) => (
                            <span key={i} className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium border border-emerald-100">
                              <CheckCircle2 size={12} className="inline mr-1" /> {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-[#F1F5F9] pt-6">
                      <h4 className="font-medium text-[#0F172A] mb-4">Skill Gap Analysis</h4>
                      <div className="space-y-3">
                        {job.skills?.map((skill, i) => (
                          <SkillBar
                            key={i}
                            label={skill}
                            userHas={userSkills.includes(skill.toLowerCase())}
                            required={true}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {matchData?.recommendations && (
                    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
                      <h3 className="font-semibold text-[#0F172A] mb-4 flex items-center gap-2">
                        <Sparkles size={18} className="text-[#2563EB]" />
                        Recommendations
                      </h3>
                      <ul className="space-y-3">
                        {matchData.recommendations.map((rec, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm text-[#334155] bg-[#F8FAFC] rounded-xl p-4">
                            <div className="w-6 h-6 rounded-full bg-[#2563EB]/10 flex items-center justify-center shrink-0">
                              <span className="text-xs font-bold text-[#2563EB]">{i + 1}</span>
                            </div>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
                    <h3 className="font-semibold text-[#0F172A] mb-4">Your Profile</h3>
                    <div className="space-y-4 text-sm">
                      <div>
                        <p className="text-[#94A3B8] text-xs mb-1">Skills Match</p>
                        <div className="h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                          <div className="h-full bg-[#2563EB] rounded-full" style={{ width: `${matchScore}%` }} />
                        </div>
                        <p className="text-right text-xs text-[#64748B] mt-1">{matchScore}%</p>
                      </div>
                      <div>
                        <p className="text-[#94A3B8] text-xs mb-1">Experience Fit</p>
                        <div className="h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${matchData?.experience_fit || 70}%` }} />
                        </div>
                        <p className="text-right text-xs text-[#64748B] mt-1">{matchData?.experience_fit || 70}%</p>
                      </div>
                      <div>
                        <p className="text-[#94A3B8] text-xs mb-1">Salary Alignment</p>
                        <div className="h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500 rounded-full" style={{ width: `${matchData?.salary_alignment || 60}%` }} />
                        </div>
                        <p className="text-right text-xs text-[#64748B] mt-1">{matchData?.salary_alignment || 60}%</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleUpgradeCV}
                    className="w-full bg-gradient-to-r from-[#2563EB] to-purple-600 text-white rounded-xl p-4 font-medium shadow-lg shadow-[#2563EB]/20 hover:shadow-xl hover:shadow-[#2563EB]/30 transition-all text-sm"
                  >
                    <Sparkles size={16} className="inline mr-2" />
                    Optimize CV for This Role
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* INTELLIGENCE TAB */}
        {activeTab === 'intelligence' && (
          <motion.div
            key="intelligence"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {!isPremium ? (
              <div className="bg-white rounded-2xl border border-[#E2E8F0] p-12 text-center shadow-sm">
                <Lock className="w-12 h-12 text-[#E2E8F0] mx-auto mb-4" />
                <h3 className="font-semibold text-[#0F172A] mb-2">Premium Feature</h3>
                <p className="text-sm text-[#64748B] mb-6 max-w-md mx-auto">
                  AI Job Intelligence is available exclusively for Demo Premium users. Upgrade to unlock advanced insights.
                </p>
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <Sparkles size={16} /> Unlock Intelligence
                </button>
              </div>
            ) : !intelligence ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-[#2563EB] animate-spin" />
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                <IntelCard icon={TrendingUp} title="Market Demand" color="blue">
                  {intelligence.market_demand || 'Demand data not available for this role.'}
                </IntelCard>
                <IntelCard icon={DollarSign} title="Salary Benchmark" color="emerald">
                  {intelligence.salary_benchmark || 'Benchmark data not available.'}
                </IntelCard>
                <IntelCard icon={Shield} title="Competition Level" color="amber">
                  {intelligence.competition_level || 'Competition analysis not available.'}
                </IntelCard>
                <IntelCard icon={Clock} title="Time to Fill" color="purple">
                  {intelligence.time_to_fill || 'Hiring timeline data not available.'}
                </IntelCard>
                <IntelCard icon={Zap} title="Growth Trajectory" color="rose">
                  {intelligence.growth_trajectory || 'Growth data not available.'}
                </IntelCard>
                <IntelCard icon={Award} title="Top Skills Trending" color="blue">
                  {intelligence.trending_skills?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {intelligence.trending_skills.map((s, i) => (
                        <span key={i} className="px-2 py-1 bg-[#F1F5F9] rounded-lg text-xs">{s}</span>
                      ))}
                    </div>
                  ) : 'Trending skills data not available.'}
                </IntelCard>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upgrade Modal */}
      <AnimatePresence>
        {showUpgradeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowUpgradeModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl relative"
            >
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="absolute top-4 right-4 p-2 text-[#94A3B8] hover:text-[#0F172A] rounded-lg hover:bg-[#F1F5F9] transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>

              <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <Crown className="w-8 h-8 text-amber-600" />
              </div>

              <h3 className="text-xl font-bold text-[#0F172A] text-center mb-2">
                Premium Feature
              </h3>
              <p className="text-sm text-[#64748B] text-center mb-6">
                CV Optimization is available exclusively for Demo Premium users. Upgrade to unlock AI-powered resume tailoring for this role.
              </p>

              <div className="space-y-3 mb-6">
                {[
                  'AI CV Optimization',
                  'ATS-Ready Resume Generation',
                  'PDF & DOCX Download',
                  'Advanced Job Intelligence',
                  'Unlimited CV Uploads',
                  'Unlimited Job Saves'
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-[#0F172A]">
                    <div className="w-5 h-5 rounded-full bg-amber-50 flex items-center justify-center">
                      <Lock size={12} className="text-amber-600" />
                    </div>
                    {item}
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="flex-1 py-3 rounded-xl font-medium text-[#64748B] bg-[#F1F5F9] hover:bg-[#E2E8F0] transition-colors"
                >
                  Maybe Later
                </button>
                <Link
                  to="/settings"
                  onClick={() => setShowUpgradeModal(false)}
                  className="flex-1 py-3 rounded-xl font-medium text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2"
                >
                  <Crown size={16} />
                  Go Premium
                </Link>
              </div>

              <p className="text-xs text-[#94A3B8] text-center mt-4">
                This is a demo environment. No real payment is processed.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CV Optimizer Modal */}
      <AnimatePresence>
        {showOptimizer && (
          <CVOptimizerModal
            job={job}
            onClose={() => setShowOptimizer(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}