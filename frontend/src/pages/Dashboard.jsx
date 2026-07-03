import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Upload, Briefcase, BarChart3, MapPin, Building2, GraduationCap, 
  Clock, Award, ArrowRight, Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCV } from '../context/CVContext';

export default function Dashboard() {
  const { user } = useAuth();
  const { extractedInfo } = useCV();

  const info = extractedInfo || {};
  const hasCV = !!extractedInfo;

  return (
    <div className="section-padding py-8 lg:py-12 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="font-display font-bold text-3xl lg:text-4xl text-dark mb-2">
          Welcome back, <span className="gradient-text">{user?.name?.split(' ')[0] || 'User'}</span>
        </h1>
        <p className="text-secondary">Here's your career intelligence overview.</p>
      </motion.div>

      {!hasCV ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-primary/5 to-purple-500/5 rounded-3xl border border-primary/10 p-8 lg:p-12 text-center"
        >
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Upload className="text-primary" size={28} />
          </div>
          <h2 className="font-display font-bold text-2xl text-dark mb-3">Upload Your CV to Get Started</h2>
          <p className="text-secondary max-w-md mx-auto mb-8">
            Our AI will analyze your experience, extract your skills, and generate personalized career recommendations.
          </p>
          <Link to="/upload" className="btn-primary inline-flex items-center gap-2">
            Upload CV Now
            <ArrowRight size={18} />
          </Link>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {/* Profile Summary Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-card border border-border p-6 lg:p-8"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-dark rounded-2xl 
                              flex items-center justify-center text-white font-display font-bold text-2xl shadow-glow">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <div>
                  <h2 className="font-display font-bold text-xl text-dark">{info.full_name || user?.name}</h2>
                  <p className="text-secondary text-sm">
                    {info.latest_job_title || user?.title || 'Professional'} 
                    {info.current_company && ` @ ${info.current_company}`}
                  </p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2 bg-success/10 text-success px-3 py-1.5 rounded-full text-sm font-medium">
                <Sparkles size={14} />
                Profile Active
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-muted rounded-xl p-4">
                <div className="flex items-center gap-2 text-secondary mb-1">
                  <Clock size={14} />
                  <span className="text-xs font-medium uppercase tracking-wider">Experience</span>
                </div>
                <p className="font-display font-bold text-lg text-dark">
                  {info.years_experience ? `${info.years_experience} Years` : 'Not detected'}
                </p>
              </div>
              <div className="bg-muted rounded-xl p-4">
                <div className="flex items-center gap-2 text-secondary mb-1">
                  <GraduationCap size={14} />
                  <span className="text-xs font-medium uppercase tracking-wider">Education</span>
                </div>
                <p className="font-display font-bold text-lg text-dark truncate">
                  {info.education || 'Not detected'}
                </p>
              </div>
              <div className="bg-muted rounded-xl p-4">
                <div className="flex items-center gap-2 text-secondary mb-1">
                  <Briefcase size={14} />
                  <span className="text-xs font-medium uppercase tracking-wider">Current Role</span>
                </div>
                <p className="font-display font-bold text-lg text-dark truncate">
                  {info.latest_job_title || 'Not detected'}
                </p>
              </div>
              <div className="bg-muted rounded-xl p-4">
                <div className="flex items-center gap-2 text-secondary mb-1">
                  <MapPin size={14} />
                  <span className="text-xs font-medium uppercase tracking-wider">Location</span>
                </div>
                <p className="font-display font-bold text-lg text-dark truncate">
                  {info.location || user?.location || 'Not detected'}
                </p>
              </div>
            </div>

            {info.technical_skills && (
              <div className="mt-6 pt-6 border-t border-border">
                <h3 className="font-display font-semibold text-sm text-dark mb-3">Extracted Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {info.technical_skills?.map((skill) => (
                    <span key={skill} className="bg-primary/10 text-primary px-3 py-1.5 rounded-lg text-sm font-medium">
                      {skill}
                    </span>
                  ))}
                  {info.soft_skills?.map((skill) => (
                    <span key={skill} className="bg-purple-500/10 text-purple-600 px-3 py-1.5 rounded-lg text-sm font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-2 gap-6">
            <Link to="/recommendations" className="group bg-white rounded-2xl p-6 border border-border card-hover shadow-soft">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Briefcase className="text-primary" size={22} />
                </div>
                <ArrowRight className="text-secondary group-hover:text-primary group-hover:translate-x-1 transition-all" size={20} />
              </div>
              <h3 className="font-display font-semibold text-lg text-dark mb-1">Job Recommendations</h3>
              <p className="text-secondary text-sm">View AI-matched opportunities tailored to your profile.</p>
            </Link>
            <Link to="/skills" className="group bg-white rounded-2xl p-6 border border-border card-hover shadow-soft">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
                  <BarChart3 className="text-purple-600" size={22} />
                </div>
                <ArrowRight className="text-secondary group-hover:text-purple-600 group-hover:translate-x-1 transition-all" size={20} />
              </div>
              <h3 className="font-display font-semibold text-lg text-dark mb-1">Skill Analytics</h3>
              <p className="text-secondary text-sm">Deep-dive into your skills and discover growth paths.</p>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}