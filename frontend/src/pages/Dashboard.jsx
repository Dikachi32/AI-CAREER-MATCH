import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Briefcase, BarChart3, MapPin, Award, BookOpen, Globe,
  Zap, TrendingUp, User, Building2, GraduationCap, FileText,
  Clock, Target, Sparkles, ChevronRight, Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCV } from '../context/CVContext';
import SkeletonLoader from '../components/SkeletonLoader';

// AI-Generated Dashboard Card Component
function AICard({ icon: Icon, label, value, subvalue, color = 'blue', delay = 0 }) {
  const colorMap = {
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    green: 'from-emerald-500 to-emerald-600',
    amber: 'from-amber-500 to-amber-600',
    rose: 'from-rose-500 to-rose-600',
    cyan: 'from-cyan-500 to-cyan-600',
  };
  const bgMap = {
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    green: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
    cyan: 'bg-cyan-50 text-cyan-600',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl ${bgMap[color]} flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-lg font-bold text-[#0F172A] truncate">{value || 'Not detected'}</p>
      {subvalue && <p className="text-xs text-[#94A3B8] mt-1">{subvalue}</p>}
    </motion.div>
  );
}

// Skill Tag with AI confidence
function SkillTag({ skill, type = 'technical' }) {
  const colors = type === 'technical'
    ? 'bg-blue-50 text-blue-700 border-blue-100'
    : 'bg-purple-50 text-purple-700 border-purple-100';
  return (
    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border ${colors}`}>
      {skill}
    </span>
  );
}

// Quick Action Card
function QuickActionCard({ to, icon: Icon, title, description, color }) {
  const gradients = {
    blue: 'from-blue-500/10 to-blue-600/5',
    purple: 'from-purple-500/10 to-purple-600/5',
    green: 'from-emerald-500/10 to-emerald-600/5',
  };
  return (
    <Link
      to={to}
      className={`group block bg-gradient-to-br ${gradients[color]} rounded-2xl p-6 border border-[#E2E8F0] hover:border-[#2563EB]/30 hover:shadow-lg transition-all duration-300`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
          <Icon className="w-6 h-6 text-[#2563EB]" />
        </div>
        <ChevronRight className="w-5 h-5 text-[#94A3B8] group-hover:text-[#2563EB] group-hover:translate-x-1 transition-all" />
      </div>
      <h3 className="font-semibold text-[#0F172A] mb-1">{title}</h3>
      <p className="text-sm text-[#64748B]">{description}</p>
    </Link>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { cvData, aiProfile, extractedInfo, hasCV, isUploading } = useCV();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);

  // Build profile data from AI analysis or fallbacks
  useEffect(() => {
    if (aiProfile) {
      setProfileData({
        full_name: aiProfile.full_name || user?.name,
        professional_summary: aiProfile.professional_summary,
        current_role: aiProfile.current_role || user?.title,
        years_experience: aiProfile.years_experience,
        education: aiProfile.education,
        certifications: aiProfile.certifications || [],
        projects: aiProfile.projects || [],
        languages: aiProfile.languages || [],
        achievements: aiProfile.achievements || [],
        location: aiProfile.location || user?.location,
        structured_skills: aiProfile.structured_skills || {},
        extracted_skills: aiProfile.extracted_skills || extractedInfo,
        profile_activity: aiProfile.profile_activity || {},
        email: aiProfile.email || user?.email,
        phone: aiProfile.phone,
        current_company: aiProfile.current_company || user?.company,
      });
    } else if (extractedInfo) {
      // Fallback to basic extracted info
      setProfileData({
        full_name: extractedInfo.full_name || user?.name,
        professional_summary: null,
        current_role: extractedInfo.latest_job_title || user?.title,
        years_experience: extractedInfo.years_experience,
        education: extractedInfo.education,
        certifications: extractedInfo.certifications || [],
        projects: [],
        languages: [],
        achievements: [],
        location: extractedInfo.location || user?.location,
        structured_skills: {},
        extracted_skills: {
          technical: extractedInfo.technical_skills || [],
          soft: extractedInfo.soft_skills || []
        },
        profile_activity: {},
        email: extractedInfo.email || user?.email,
        phone: extractedInfo.phone,
        current_company: extractedInfo.current_company || user?.company,
      });
    }
    setLoading(false);
  }, [aiProfile, extractedInfo, user]);

  if (loading || isUploading) {
    return (
      <div className="section-padding py-8 lg:py-12 max-w-6xl mx-auto">
        <SkeletonLoader type="text" lines={2} className="mb-8 max-w-md" />
        <SkeletonLoader type="stats" count={4} />
        <div className="mt-8">
          <SkeletonLoader type="card" />
        </div>
      </div>
    );
  }

  // No CV uploaded state
  if (!hasCV) {
    return (
      <div className="section-padding py-12 lg:py-20 max-w-3xl mx-auto text-center animate-fade-in">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-20 h-20 bg-gradient-to-br from-[#2563EB]/10 to-[#7C3AED]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <FileText className="w-10 h-10 text-[#2563EB]" />
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-[#0F172A] mb-3">
            Upload Your CV to Get Started
          </h1>
          <p className="text-[#64748B] mb-8 max-w-md mx-auto">
            Our AI will analyze your experience, extract your skills, and generate personalized career recommendations.
          </p>
          <Link to="/upload" className="btn-primary inline-flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Upload CV Now
          </Link>
        </motion.div>
      </div>
    );
  }

  const info = profileData || {};
  const techSkills = info.extracted_skills?.technical || [];
  const softSkills = info.extracted_skills?.soft || [];
  const allSkills = [...techSkills, ...softSkills];
  const activity = info.profile_activity || {};
  const structured = info.structured_skills || {};

  return (
    <div className="section-padding py-8 lg:py-12 max-w-6xl mx-auto animate-fade-in">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl lg:text-3xl font-bold text-[#0F172A]">
          Welcome back, <span className="gradient-text">{user?.name?.split(' ')[0] || 'User'}</span>
        </h1>
        <p className="text-[#64748B] mt-1">Here's your career intelligence overview.</p>
      </motion.div>

      {/* AI Profile Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-[#E2E8F0] p-6 lg:p-8 mb-8 shadow-sm"
      >
        <div className="flex flex-col lg:flex-row lg:items-start gap-6">
          {/* Avatar & Name */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-[#2563EB] to-[#7C3AED] rounded-2xl flex items-center justify-center text-white text-2xl font-bold shrink-0">
              {info.full_name?.charAt(0)?.toUpperCase() || user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-[#0F172A] truncate">
                {info.full_name || user?.name || 'User'}
              </h2>
              <p className="text-sm text-[#64748B] truncate">
                {info.professional_summary || info.current_role || 'Professional'}
                {info.current_company && ` @ ${info.current_company}`}
              </p>
              {activity.completeness_score !== undefined && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 h-2 bg-[#F1F5F9] rounded-full max-w-[120px]">
                    <div
                      className="h-2 bg-gradient-to-r from-[#2563EB] to-[#7C3AED] rounded-full transition-all duration-1000"
                      style={{ width: `${activity.completeness_score}%` }}
                    />
                  </div>
                  <span className="text-xs text-[#64748B]">{activity.completeness_score}% Complete</span>
                </div>
              )}
            </div>
          </div>

          {/* Profile Active Badge */}
          <div className="lg:ml-auto shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium border border-emerald-100">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Profile Active
            </span>
          </div>
        </div>

        {/* Profile Meta Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-[#F1F5F9]">
          {[
            { icon: MapPin, label: 'Location', value: info.location },
            { icon: Building2, label: 'Company', value: info.current_company },
            { icon: GraduationCap, label: 'Education', value: info.education },
            { icon: Clock, label: 'Experience', value: info.years_experience },
          ].map((item, i) => (
            <div key={i} className="text-center lg:text-left">
              <p className="text-xs text-[#94A3B8] mb-1">{item.label}</p>
              <p className="text-sm font-medium text-[#0F172A] truncate">{item.value || 'Not set'}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* AI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <AICard icon={Target} label="Match Score" value={`${activity.match_score || 0}%`} subvalue="Avg. job match" color="blue" delay={0.1} />
        <AICard icon={Briefcase} label="Jobs Viewed" value={activity.jobs_viewed || 0} subvalue="This week" color="purple" delay={0.2} />
        <AICard icon={Award} label="Skills" value={allSkills.length} subvalue={`${techSkills.length} technical`} color="green" delay={0.3} />
        <AICard icon={TrendingUp} label="Profile Views" value={activity.profile_views || 0} subvalue="By recruiters" color="amber" delay={0.4} />
      </div>

      {/* Skills Section */}
      {allSkills.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl border border-[#E2E8F0] p-6 mb-8 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[#0F172A] flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#2563EB]" />
              Extracted Skills
            </h3>
            <span className="text-xs text-[#94A3B8]">{allSkills.length} total</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {techSkills.map((skill, i) => (
              <SkillTag key={`t-${i}`} skill={skill} type="technical" />
            ))}
            {softSkills.map((skill, i) => (
              <SkillTag key={`s-${i}`} skill={skill} type="soft" />
            ))}
          </div>
        </motion.div>
      )}

      {/* Structured Skills (if available) */}
      {Object.keys(structured).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl border border-[#E2E8F0] p-6 mb-8 shadow-sm"
        >
          <h3 className="font-semibold text-[#0F172A] mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#2563EB]" />
            Skill Categories
          </h3>
          <div className="space-y-4">
            {Object.entries(structured).map(([category, skills], i) => (
              <div key={i}>
                <p className="text-sm font-medium text-[#64748B] mb-2 capitalize">{category}</p>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, j) => (
                    <span key={j} className="px-2.5 py-1 bg-[#F1F5F9] text-[#0F172A] rounded-lg text-xs font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h3 className="font-semibold text-[#0F172A] mb-4">Quick Actions</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <QuickActionCard
            to="/recommendations"
            icon={Briefcase}
            title="Job Recommendations"
            description="Discover roles matched to your profile"
            color="blue"
          />
          <QuickActionCard
            to="/analytics"
            icon={BarChart3}
            title="Skill Analytics"
            description="Deep-dive into your skill gaps"
            color="purple"
          />
          <QuickActionCard
            to="/upload"
            icon={FileText}
            title="Update CV"
            description="Refresh your profile with new experience"
            color="green"
          />
        </div>
      </motion.div>

      {/* Recent Activity / Certifications */}
      {(info.certifications?.length > 0 || info.projects?.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 grid md:grid-cols-2 gap-6"
        >
          {info.certifications?.length > 0 && (
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
              <h3 className="font-semibold text-[#0F172A] mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-[#2563EB]" />
                Certifications
              </h3>
              <ul className="space-y-2">
                {info.certifications.map((cert, i) => (
                  <li key={i} className="text-sm text-[#334155] flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#2563EB] mt-1.5 shrink-0" />
                    {cert}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {info.projects?.length > 0 && (
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
              <h3 className="font-semibold text-[#0F172A] mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-[#2563EB]" />
                Projects
              </h3>
              <ul className="space-y-2">
                {info.projects.map((proj, i) => (
                  <li key={i} className="text-sm text-[#334155] flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#7C3AED] mt-1.5 shrink-0" />
                    {proj}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}