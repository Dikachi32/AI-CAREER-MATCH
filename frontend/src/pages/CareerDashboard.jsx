import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Target,
  Shield,
  TrendingUp,
  Award,
  BookOpen,
  Briefcase,
  Zap,
  CheckCircle2,
  AlertCircle,
  Clock,
  Lightbulb,
  ArrowRight,
  Loader2,
  BarChart3,
  GraduationCap,
  FolderGit2,
  Route,
  Calendar,
  ListTodo,
  MessageSquareQuote
} from 'lucide-react';
import { useCV } from '../context/CVContext';
import { useAuth } from '../context/AuthContext';
import { getCareerDashboard } from '../services/api';
import {
  ScoreRing,
  ProgressBar,
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
} from '../components/CareerCard';

const dashboardTabs = [
  { id: 'overview', label: 'Overview', icon: Target },
  { id: 'skills', label: 'Skills', icon: Zap },
  { id: 'learning', label: 'Learning', icon: BookOpen },
  { id: 'career-path', label: 'Career Path', icon: Route },
  { id: 'goals', label: 'Goals', icon: ListTodo },
  { id: 'insights', label: 'AI Insights', icon: MessageSquareQuote },
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

export default function CareerDashboard() {
  const { cvData } = useCV();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [weeklyGoals, setWeeklyGoals] = useState([]);
  const [monthlyGoals, setMonthlyGoals] = useState([]);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const payload = {
        cv_text: cvData?.cleaned_text || cvData?.raw_text || '',
        job_match_score: 0,
        top_matched_role: '',
        skills_gap: '',
        market_demand: '',
        analytics_summary: ''
      };

      const res = await getCareerDashboard(payload);

      if (res.data.success) {
        const data = res.data.career_dashboard;
        setDashboard(data);
        setWeeklyGoals(data.weeklyGoals || []);
        setMonthlyGoals(data.monthlyGoals || []);
      } else {
        setError(res.data.error || 'Failed to load career dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load career dashboard');
    } finally {
      setLoading(false);
    }
  }, [cvData]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const toggleWeeklyGoal = useCallback((index) => {
    setWeeklyGoals(prev => {
      const next = [...prev];
      next[index] = { ...next[index], completed: !next[index].completed };
      return next;
    });
  }, []);

  const toggleMonthlyGoal = useCallback((index) => {
    setMonthlyGoals(prev => {
      const next = [...prev];
      next[index] = { ...next[index], completed: !next[index].completed };
      return next;
    });
  }, []);

  const weeklyCompleted = weeklyGoals.filter(g => g.completed).length;
  const monthlyCompleted = monthlyGoals.filter(g => g.completed).length;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <div className="bg-white border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-[#2563EB] to-[#7C3AED] rounded-xl flex items-center justify-center">
              <BarChart3 className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#0F172A]">AI Career Coach</h1>
              <p className="text-sm text-[#64748B]">Your personalized career intelligence dashboard</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading && !dashboard && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 size={40} className="animate-spin text-[#2563EB] mb-4" />
            <p className="text-[#64748B]">Analyzing your career profile...</p>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-4 rounded-xl mb-6">
            <AlertCircle size={16} />
            {error}
            <button onClick={loadDashboard} className="ml-auto underline font-medium">Retry</button>
          </div>
        )}

        {dashboard && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Navigation Tabs */}
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-2 shadow-sm sticky top-0 z-10">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {dashboardTabs.map((tab) => (
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

            {/* ═══════════════════════════════════════════════════════════════════
                OVERVIEW TAB
                ═══════════════════════════════════════════════════════════════════ */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Score Cards */}
                <div className="grid md:grid-cols-3 gap-6">
                  <IntelCard icon={Shield} title="Career Health" color="emerald">
                    <div className="flex items-center justify-center py-4">
                      <ScoreRing
                        score={dashboard.careerHealthScore || 0}
                        label={dashboard.careerHealthLabel}
                        color={dashboard.careerHealthColor}
                        size={110}
                      />
                    </div>
                  </IntelCard>

                  <IntelCard icon={Target} title="Career Readiness" color="blue">
                    <div className="flex items-center justify-center py-4">
                      <ScoreRing
                        score={dashboard.careerReadinessScore || 0}
                        label={dashboard.careerReadinessLabel}
                        color={dashboard.careerReadinessColor}
                        size={110}
                      />
                    </div>
                  </IntelCard>

                  <IntelCard icon={TrendingUp} title="ATS Progress" color="amber">
                    <div className="py-2">
                      <ProgressBar
                        label="Current Score"
                        percent={dashboard.atsImprovementProgress?.currentScore || 0}
                        color="amber"
                      />
                      <div className="mt-3 flex items-center justify-between text-xs text-[#64748B]">
                        <span>Target: {dashboard.atsImprovementProgress?.targetScore || 85}</span>
                        <span>{Math.max(0, (dashboard.atsImprovementProgress?.targetScore || 85) - (dashboard.atsImprovementProgress?.currentScore || 0))} pts to go</span>
                      </div>
                      {dashboard.atsImprovementProgress?.improvementsMade?.length > 0 && (
                        <div className="mt-3 space-y-1">
                          {dashboard.atsImprovementProgress.improvementsMade.slice(0, 2).map((imp, i) => (
                            <div key={i} className="flex items-center gap-1.5 text-xs text-emerald-700">
                              <CheckCircle2 size={12} />
                              {imp}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </IntelCard>
                </div>

                {/* Skills Progress */}
                {dashboard.skillsProgress?.length > 0 && (
                  <IntelCard icon={Zap} title="Skills Progress" color="purple">
                    <div className="space-y-3">
                      {dashboard.skillsProgress.map((skill, i) => (
                        <div key={i} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-[#0F172A]">{skill.skill}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F1F5F9] text-[#64748B] font-medium uppercase">
                                {skill.category}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-[#64748B]">{skill.currentLevel} → {skill.targetLevel}</span>
                            </div>
                          </div>
                          <ProgressBar label="" percent={skill.progressPercent} color={skill.progressPercent >= 80 ? 'emerald' : skill.progressPercent >= 50 ? 'blue' : 'amber'} />
                        </div>
                      ))}
                    </div>
                  </IntelCard>
                )}

                {/* Quick Actions */}
                <div className="grid md:grid-cols-3 gap-4">
                  <button
                    onClick={() => navigate('/upload')}
                    className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-sm hover:shadow-md transition-all text-left group"
                  >
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors">
                      <Briefcase size={18} className="text-blue-600" />
                    </div>
                    <h4 className="text-sm font-semibold text-[#0F172A] mb-1">Update CV</h4>
                    <p className="text-xs text-[#64748B]">Refresh your profile for better insights</p>
                  </button>

                  <button
                    onClick={() => navigate('/recommendations')}
                    className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-sm hover:shadow-md transition-all text-left group"
                  >
                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mb-3 group-hover:bg-emerald-100 transition-colors">
                      <Target size={18} className="text-emerald-600" />
                    </div>
                    <h4 className="text-sm font-semibold text-[#0F172A] mb-1">Find Jobs</h4>
                    <p className="text-xs text-[#64748B]">Discover roles matching your profile</p>
                  </button>

                  <button
                    onClick={() => navigate('/interview-copilot')}
                    className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-sm hover:shadow-md transition-all text-left group"
                  >
                    <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center mb-3 group-hover:bg-purple-100 transition-colors">
                      <Sparkles size={18} className="text-purple-600" />
                    </div>
                    <h4 className="text-sm font-semibold text-[#0F172A] mb-1">Interview Prep</h4>
                    <p className="text-xs text-[#64748B]">Practice with AI-generated questions</p>
                  </button>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════
                SKILLS TAB
                ═══════════════════════════════════════════════════════════════════ */}
            {activeTab === 'skills' && (
              <div className="space-y-6">
                {/* Missing High-Demand Skills */}
                {dashboard.highDemandSkillsMissing?.length > 0 && (
                  <IntelCard icon={Lightbulb} title="High-Demand Skills You're Missing" color="amber">
                    <div className="grid md:grid-cols-2 gap-4">
                      {dashboard.highDemandSkillsMissing.map((skill, i) => (
                        <MissingSkillCard key={i} skill={skill} index={i} />
                      ))}
                    </div>
                  </IntelCard>
                )}

                {/* Strengths */}
                {dashboard.careerStrengths?.length > 0 && (
                  <IntelCard icon={Zap} title="Your Career Strengths" color="emerald">
                    <div className="grid md:grid-cols-2 gap-4">
                      {dashboard.careerStrengths.map((s, i) => (
                        <StrengthCard key={i} strength={s} index={i} />
                      ))}
                    </div>
                  </IntelCard>
                )}

                {/* Weaknesses */}
                {dashboard.careerWeaknesses?.length > 0 && (
                  <IntelCard icon={AlertCircle} title="Areas to Improve" color="rose">
                    <div className="grid md:grid-cols-2 gap-4">
                      {dashboard.careerWeaknesses.map((w, i) => (
                        <WeaknessCard key={i} weakness={w} index={i} />
                      ))}
                    </div>
                  </IntelCard>
                )}
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════
                LEARNING TAB
                ═══════════════════════════════════════════════════════════════════ */}
            {activeTab === 'learning' && (
              <div className="space-y-6">
                {/* Learning Path */}
                {dashboard.recommendedLearningPath?.length > 0 && (
                  <IntelCard icon={Route} title="Recommended Learning Path" color="blue">
                    <div className="pl-2">
                      {dashboard.recommendedLearningPath.map((step, i) => (
                        <LearningPathStep key={i} step={step} index={i} />
                      ))}
                    </div>
                  </IntelCard>
                )}

                {/* Certifications */}
                {dashboard.recommendedCertifications?.length > 0 && (
                  <IntelCard icon={GraduationCap} title="Recommended Certifications" color="purple">
                    <div className="grid md:grid-cols-2 gap-4">
                      {dashboard.recommendedCertifications.map((cert, i) => (
                        <CertificationCard key={i} cert={cert} index={i} />
                      ))}
                    </div>
                  </IntelCard>
                )}

                {/* Portfolio Projects */}
                {dashboard.suggestedPortfolioProjects?.length > 0 && (
                  <IntelCard icon={FolderGit2} title="Suggested Portfolio Projects" color="emerald">
                    <div className="grid md:grid-cols-2 gap-4">
                      {dashboard.suggestedPortfolioProjects.map((project, i) => (
                        <ProjectCard key={i} project={project} index={i} />
                      ))}
                    </div>
                  </IntelCard>
                )}
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════
                CAREER PATH TAB
                ═══════════════════════════════════════════════════════════════════ */}
            {activeTab === 'career-path' && (
              <div className="space-y-6">
                {/* Next Roles */}
                {dashboard.recommendedNextRoles?.length > 0 && (
                  <IntelCard icon={Briefcase} title="Recommended Next Roles" color="blue">
                    <div className="grid md:grid-cols-2 gap-4">
                      {dashboard.recommendedNextRoles.map((role, i) => (
                        <NextRoleCard key={i} role={role} index={i} />
                      ))}
                    </div>
                  </IntelCard>
                )}

                {/* Salary Projection */}
                {dashboard.salaryGrowthProjection?.length > 0 && (
                  <IntelCard icon={TrendingUp} title="Salary Growth Projection" color="emerald">
                    <SalaryProjectionChart projections={dashboard.salaryGrowthProjection} />
                  </IntelCard>
                )}

                {/* Career Milestones */}
                {dashboard.careerMilestones?.length > 0 && (
                  <IntelCard icon={Calendar} title="Career Milestones" color="purple">
                    <div className="pl-2">
                      {dashboard.careerMilestones.map((m, i) => (
                        <TimelineItem key={i} milestone={m} index={i} />
                      ))}
                    </div>
                  </IntelCard>
                )}
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════
                GOALS TAB
                ═══════════════════════════════════════════════════════════════════ */}
            {activeTab === 'goals' && (
              <div className="space-y-6">
                {/* Weekly Goals */}
                <IntelCard icon={ListTodo} title="Weekly Goals" color="blue">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm text-[#64748B]">{weeklyCompleted} / {weeklyGoals.length} completed</span>
                    <div className="w-24 h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-[#2563EB] rounded-full"
                        animate={{ width: `${weeklyGoals.length > 0 ? (weeklyCompleted / weeklyGoals.length) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    {weeklyGoals.map((goal, i) => (
                      <GoalItem key={i} goal={goal} onToggle={toggleWeeklyGoal} index={i} />
                    ))}
                  </div>
                </IntelCard>

                {/* Monthly Goals */}
                <IntelCard icon={Calendar} title="Monthly Goals" color="purple">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm text-[#64748B]">{monthlyCompleted} / {monthlyGoals.length} completed</span>
                    <div className="w-24 h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-[#7C3AED] rounded-full"
                        animate={{ width: `${monthlyGoals.length > 0 ? (monthlyCompleted / monthlyGoals.length) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    {monthlyGoals.map((goal, i) => (
                      <GoalItem key={i} goal={goal} onToggle={toggleMonthlyGoal} index={i} />
                    ))}
                  </div>
                </IntelCard>

                {/* Action Plan */}
                {dashboard.personalizedActionPlan?.length > 0 && (
                  <IntelCard icon={Zap} title="Personalized Action Plan" color="amber">
                    <div className="grid md:grid-cols-2 gap-3">
                      {dashboard.personalizedActionPlan.map((action, i) => (
                        <ActionPlanCard key={i} action={action} index={i} />
                      ))}
                    </div>
                  </IntelCard>
                )}
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════
                AI INSIGHTS TAB
                ═══════════════════════════════════════════════════════════════════ */}
            {activeTab === 'insights' && (
              <div className="space-y-6">
                <IntelCard icon={MessageSquareQuote} title="AI Career Summary" color="purple">
                  <div className="space-y-4">
                    <div className="bg-purple-50 rounded-lg p-4">
                      <p className="text-xs text-purple-700 font-medium uppercase tracking-wide mb-1">Current Standing</p>
                      <p className="text-sm text-[#334155] leading-relaxed">{dashboard.aiCareerSummary?.currentStanding}</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-emerald-50 rounded-lg p-4">
                        <p className="text-xs text-emerald-700 font-medium uppercase tracking-wide mb-1">Biggest Opportunity</p>
                        <p className="text-sm text-[#334155]">{dashboard.aiCareerSummary?.biggestOpportunity}</p>
                      </div>
                      <div className="bg-rose-50 rounded-lg p-4">
                        <p className="text-xs text-rose-700 font-medium uppercase tracking-wide mb-1">Biggest Risk</p>
                        <p className="text-sm text-[#334155]">{dashboard.aiCareerSummary?.biggestRisk}</p>
                      </div>
                    </div>

                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-xs text-blue-700 font-medium uppercase tracking-wide mb-1">One Year Vision</p>
                      <p className="text-sm text-[#334155]">{dashboard.aiCareerSummary?.oneYearVision}</p>
                    </div>

                    <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
                      <div className="flex items-center gap-2 mb-2">
                        <Target size={16} className="text-amber-600" />
                        <p className="text-xs text-amber-700 font-medium uppercase tracking-wide">Recommended Focus Right Now</p>
                      </div>
                      <p className="text-sm font-semibold text-[#0F172A]">{dashboard.aiCareerSummary?.recommendedFocus}</p>
                    </div>

                    <div className="bg-gradient-to-r from-[#2563EB]/10 to-[#7C3AED]/10 rounded-lg p-4 border border-[#2563EB]/20">
                      <p className="text-sm text-[#334155] italic leading-relaxed">"{dashboard.aiCareerSummary?.motivationalMessage}"</p>
                    </div>
                  </div>
                </IntelCard>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}