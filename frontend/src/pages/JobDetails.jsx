import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import CVOptimizerModal from '../components/CVOptimizerModal';
import {
  ArrowLeft, Building2, MapPin, DollarSign, Briefcase, Globe,
  ExternalLink, Sparkles, Target, TrendingUp, AlertTriangle,
  CheckCircle2, XCircle, Zap, BookOpen, Award, Clock,
  Shield, BarChart3, Loader2, Lock, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCV } from '../context/CVContext';
import { useSubscription } from '../context/SubscriptionContext';
import { getCVMatch, getJobIntelligence } from '../services/api';
import SkeletonLoader from '../components/SkeletonLoader';
import { useState } from 'react';


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
        <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-[#E2E8F0]">
          <button
            onClick={handleApply}
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
            {isPremium ? 'Upgrade My CV' : 'Upgrade My CV (Premium)'}
          </button>
        </div>
      </motion.div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { id: 'overview', label: 'Overview', icon: BookOpen },
          { id: 'match', label: 'CV Match', icon: Target },
          { id: 'intelligence', label: 'AI Intelligence', icon: Sparkles },
        ].map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                active ? 'bg-[#2563EB] text-white shadow-md' : 'bg-white text-[#64748B] border border-[#E2E8F0] hover:border-[#2563EB] hover:text-[#2563EB]'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Description */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
              <h3 className="font-semibold text-[#0F172A] mb-4 flex items-center gap-2">
                <BookOpen size={18} className="text-[#2563EB]" />
                Job Description
              </h3>
              <p className="text-sm text-[#64748B] leading-relaxed whitespace-pre-line">
                {job.description || 'No detailed description available.'}
              </p>
            </div>

            {/* Technology Stack */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
              <h3 className="font-semibold text-[#0F172A] mb-4 flex items-center gap-2">
                <Zap size={18} className="text-[#2563EB]" />
                Technology Stack
              </h3>
              <div className="flex flex-wrap gap-2">
                {job.matched_skills?.map((skill, i) => (
                  <span key={i} className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-sm font-medium border border-emerald-100">
                    {skill}
                  </span>
                ))}
                {(!job.matched_skills || job.matched_skills.length === 0) && (
                  <span className="text-sm text-[#94A3B8]">Skills information not available for this posting.</span>
                )}
              </div>
            </div>

            {/* Requirements & Responsibilities */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
                <h3 className="font-semibold text-[#0F172A] mb-4 flex items-center gap-2">
                  <Shield size={18} className="text-[#2563EB]" />
                  Requirements
                </h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-sm text-[#64748B]">
                    <CheckCircle2 size={14} className="text-[#2563EB] shrink-0 mt-0.5" />
                    Relevant experience in {job.title?.toLowerCase().replace(/[^a-z\\s]/g, '') || 'this field'}
                  </li>
                  <li className="flex items-start gap-2 text-sm text-[#64748B]">
                    <CheckCircle2 size={14} className="text-[#2563EB] shrink-0 mt-0.5" />
                    Strong technical background with modern tools and frameworks
                  </li>
                  <li className="flex items-start gap-2 text-sm text-[#64748B]">
                    <CheckCircle2 size={14} className="text-[#2563EB] shrink-0 mt-0.5" />
                    {job.experience_level || 'Relevant'} level experience required
                  </li>
                </ul>
              </div>

              <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
                <h3 className="font-semibold text-[#0F172A] mb-4 flex items-center gap-2">
                  <Target size={18} className="text-[#2563EB]" />
                  Responsibilities
                </h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-sm text-[#64748B]">
                    <CheckCircle2 size={14} className="text-[#2563EB] shrink-0 mt-0.5" />
                    Design, develop, and maintain scalable software solutions
                  </li>
                  <li className="flex items-start gap-2 text-sm text-[#64748B]">
                    <CheckCircle2 size={14} className="text-[#2563EB] shrink-0 mt-0.5" />
                    Collaborate with cross-functional teams to deliver features
                  </li>
                  <li className="flex items-start gap-2 text-sm text-[#64748B]">
                    <CheckCircle2 size={14} className="text-[#2563EB] shrink-0 mt-0.5" />
                    Ensure code quality through testing and code reviews
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* CV MATCH TAB */}
        {activeTab === 'match' && (
          <div className="space-y-6">
            {!hasCV ? (
              <div className="bg-white rounded-2xl border border-[#E2E8F0] p-12 text-center shadow-sm">
                <Target className="w-12 h-12 text-[#E2E8F0] mx-auto mb-4" />
                <h3 className="font-semibold text-[#0F172A] mb-2">Upload Your CV First</h3>
                <p className="text-sm text-[#64748B] mb-4">To see how well you match this role, upload your CV.</p>
                <Link to="/upload" className="btn-primary inline-flex items-center gap-2">
                  <ArrowLeft size={16} /> Upload CV
                </Link>
              </div>
            ) : matchData ? (
              <>
                {/* Match Score Header */}
                <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
                  <div className="flex flex-col lg:flex-row items-center gap-6">
                    <MatchRing score={matchData.match_percentage || 0} size={140} />
                    <div className="flex-1 text-center lg:text-left">
                      <h3 className="text-lg font-bold text-[#0F172A] mb-1">
                        {matchData.recommendation || 'Analysis Complete'}
                      </h3>
                      <p className="text-sm text-[#64748B] mb-3">{matchData.explanation || 'Your CV has been analyzed against this role.'}</p>
                      <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                        <span className="inline-flex items-center gap-1 text-xs bg-[#F1F5F9] text-[#64748B] px-3 py-1 rounded-full">
                          <BarChart3 size={12} /> ATS Score: {matchData.ats_score || 'N/A'}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs bg-[#F1F5F9] text-[#64748B] px-3 py-1 rounded-full">
                          <Clock size={12} /> Experience: {matchData.experience_match || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Skills Comparison */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Matched Skills */}
                  <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
                    <h4 className="font-semibold text-[#0F172A] mb-4 flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-500" />
                      Matched Skills ({matchData.matched_skills?.length || 0})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {(matchData.matched_skills || []).map((skill, i) => (
                        <span key={i} className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-sm font-medium border border-emerald-100">
                          {skill}
                        </span>
                      ))}
                      {(!matchData.matched_skills || matchData.matched_skills.length === 0) && (
                        <span className="text-sm text-[#94A3B8]">No direct skill matches found.</span>
                      )}
                    </div>
                  </div>

                  {/* Missing Skills */}
                  <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
                    <h4 className="font-semibold text-[#0F172A] mb-4 flex items-center gap-2">
                      <XCircle size={16} className="text-red-400" />
                      Missing Skills ({matchData.missing_skills?.length || 0})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {(matchData.missing_skills || []).map((skill, i) => (
                        <span key={i} className="bg-red-50 text-red-700 px-3 py-1.5 rounded-lg text-sm font-medium border border-red-100">
                          {skill}
                        </span>
                      ))}
                      {(!matchData.missing_skills || matchData.missing_skills.length === 0) && (
                        <span className="text-sm text-[#94A3B8]">Great! No critical missing skills.</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Detailed Analysis */}
                <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
                  <h4 className="font-semibold text-[#0F172A] mb-4 flex items-center gap-2">
                    <BarChart3 size={16} className="text-[#2563EB]" />
                    Detailed Analysis
                  </h4>
                  <div className="space-y-4">
                    <SkillBar label="Skills Match" userHas={matchData.skills_match} required />
                    <SkillBar label="Education" userHas={matchData.education_match} required />
                    <SkillBar label="Experience" userHas={matchData.experience_match === 'Strong'} required />
                    <SkillBar label="ATS Readiness" userHas={(matchData.ats_score || 0) >= 70} required />
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-[#2563EB] animate-spin" />
              </div>
            )}
          </div>
        )}

        {/* AI INTELLIGENCE TAB */}
        {activeTab === 'intelligence' && (
          <div className="space-y-6">
            {intelligence ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <IntelCard icon={TrendingUp} title="Hiring Expectations" color="blue">
                  {intelligence.hiring_expectations || 'Analysis not available for this role.'}
                </IntelCard>
                <IntelCard icon={Target} title="Critical Success Factors" color="purple">
                  {intelligence.critical_success_factors || 'Focus on demonstrating relevant technical skills and cultural fit.'}
                </IntelCard>
                <IntelCard icon={BarChart3} title="Competitiveness Analysis" color="amber">
                  {intelligence.competitiveness || 'This role attracts strong candidates. Differentiate with project experience.'}
                </IntelCard>
                <IntelCard icon={TrendingUp} title="Career Growth Opportunities" color="emerald">
                  {intelligence.career_growth || 'Strong growth trajectory in this field with clear advancement paths.'}
                </IntelCard>
                <IntelCard icon={Globe} title="Industry Insights" color="blue">
                  {intelligence.industry_insights || 'The technology sector continues to show strong demand for this role.'}
                </IntelCard>
                <IntelCard icon={Shield} title="Strength Requirements" color="purple">
                  {intelligence.strength_requirements || 'Technical depth, problem-solving ability, and communication skills are key.'}
                </IntelCard>
                <IntelCard icon={AlertTriangle} title="Role Difficulty" color="amber">
                  {intelligence.role_difficulty || 'Moderate difficulty. Preparation with relevant projects is recommended.'}
                </IntelCard>
                <IntelCard icon={Award} title="Career Progression Advice" color="emerald">
                  {intelligence.career_progression || 'Build expertise in adjacent technologies and seek mentorship opportunities.'}
                </IntelCard>
              </div>
            ) : (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-[#2563EB] animate-spin" />
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Premium Upgrade Modal */}
      <AnimatePresence>
        {showUpgradeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setShowUpgradeModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
            >
              {/* Decorative gradient */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400" />
              
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