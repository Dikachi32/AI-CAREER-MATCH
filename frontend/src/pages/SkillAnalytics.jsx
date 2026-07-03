import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell
} from 'recharts';
import { TrendingUp, BookOpen, Award, Target, Zap } from 'lucide-react';
import { getAnalytics } from '../services/api';
import { useCV } from '../context/CVContext';

const COLORS = ['#2563EB', '#7C3AED', '#22C55E', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4', '#8B5CF6'];

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
  }, [cvData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="section-padding py-20 text-center max-w-2xl mx-auto">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <TrendingUp className="text-primary" size={28} />
        </div>
        <h2 className="font-display font-bold text-2xl text-dark mb-3">No Analytics Available</h2>
        <p className="text-secondary mb-8">Upload your CV first to generate your skill analytics dashboard.</p>
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

  return (
    <div className="section-padding py-8 lg:py-12 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <h1 className="font-display font-bold text-3xl lg:text-4xl text-dark mb-2">
          Skill <span className="gradient-text">Analytics</span>
        </h1>
        <p className="text-secondary">Complete talent analysis and market positioning.</p>
      </motion.div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl p-5 border border-border shadow-soft"
        >
          <div className="flex items-center gap-2 text-secondary mb-2">
            <Target size={16} />
            <span className="text-xs font-medium uppercase tracking-wider">Match Score</span>
          </div>
          <p className="font-display font-bold text-3xl text-primary">{analytics.skill_match_score}%</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-5 border border-border shadow-soft"
        >
          <div className="flex items-center gap-2 text-secondary mb-2">
            <Zap size={16} />
            <span className="text-xs font-medium uppercase tracking-wider">Skills</span>
          </div>
          <p className="font-display font-bold text-3xl text-dark">{analytics.technical_skills.length}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-5 border border-border shadow-soft"
        >
          <div className="flex items-center gap-2 text-secondary mb-2">
            <Award size={16} />
            <span className="text-xs font-medium uppercase tracking-wider">Soft Skills</span>
          </div>
          <p className="font-display font-bold text-3xl text-purple-600">{analytics.soft_skills.length}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-5 border border-border shadow-soft"
        >
          <div className="flex items-center gap-2 text-secondary mb-2">
            <BookOpen size={16} />
            <span className="text-xs font-medium uppercase tracking-wider">To Learn</span>
          </div>
          <p className="font-display font-bold text-3xl text-success">{analytics.learning_path.length}</p>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Radar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-border p-6 shadow-soft"
        >
          <h3 className="font-display font-semibold text-lg text-dark mb-6">Skill Confidence vs Market Demand</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#E2E8F0" />
                <PolarAngleAxis dataKey="skill" tick={{ fill: '#64748B', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#94A3B8', fontSize: 10 }} />
                <Radar name="Confidence" dataKey="confidence" stroke="#2563EB" fill="#2563EB" fillOpacity={0.2} />
                <Radar name="Market Demand" dataKey="demand" stroke="#7C3AED" fill="#7C3AED" fillOpacity={0.1} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 32px rgba(15,23,42,0.12)' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl border border-border p-6 shadow-soft"
        >
          <h3 className="font-display font-semibold text-lg text-dark mb-6">Skill Distribution</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis type="number" domain={[0, 100]} tick={{ fill: '#94A3B8', fontSize: 12 }} />
                <YAxis dataKey="name" type="category" tick={{ fill: '#64748B', fontSize: 12 }} width={100} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 32px rgba(15,23,42,0.12)' }}
                />
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

      {/* Detailed Skill Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl border border-border p-6 lg:p-8 shadow-soft mb-8"
      >
        <h3 className="font-display font-semibold text-lg text-dark mb-6">Detailed Skill Analysis</h3>
        <div className="space-y-4">
          {analytics.technical_skills.map((skill, i) => (
            <div key={skill.name} className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                   style={{ backgroundColor: COLORS[i % COLORS.length] }}>
                {skill.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-dark">{skill.name}</p>
                  <span className={`text-xs font-bold px-2 py-1 rounded-md
                    ${skill.level === 'Advanced' ? 'bg-success/10 text-success' : 'bg-amber-500/10 text-amber-600'}`}>
                    {skill.level}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-secondary">
                  <span>Confidence: {skill.confidence}%</span>
                  <span>Market Demand: {skill.market_demand}%</span>
                  <span>Mentions: {skill.mentions}</span>
                </div>
                <div className="mt-2 h-1.5 bg-white rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-1000"
                    style={{ 
                      width: `${skill.confidence}%`,
                      backgroundColor: COLORS[i % COLORS.length]
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Learning Path */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-gradient-to-br from-primary/5 to-purple-500/5 rounded-2xl border border-primary/10 p-6 lg:p-8"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <BookOpen className="text-primary" size={20} />
          </div>
          <div>
            <h3 className="font-display font-semibold text-lg text-dark">Recommended Learning Path</h3>
            <p className="text-secondary text-sm">Skills to acquire based on market demand and your profile gaps</p>
          </div>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {analytics.learning_path.map((item, i) => (
            <motion.div
              key={item.skill}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + i * 0.1 }}
              className="bg-white rounded-xl p-5 border border-border shadow-soft"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-display font-semibold text-dark">{item.skill}</span>
                <span className={`text-xs font-bold px-2 py-1 rounded-full
                  ${item.priority === 'High' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                  {item.priority}
                </span>
              </div>
              <p className="text-secondary text-sm">{item.reason}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}