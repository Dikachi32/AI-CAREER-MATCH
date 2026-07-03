import { Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Upload, Play, TrendingUp, Users, Target, Award,
  Brain, Briefcase, LineChart, Shield, Zap, Rocket,
  Star, Quote
} from 'lucide-react';
import { getStats } from '../services/api';

const features = [
  { icon: Brain, title: 'AI CV Analysis', desc: 'Deep semantic understanding of your experience and skills.' },
  { icon: Briefcase, title: 'Career Recommendations', desc: 'Personalized job matches based on your unique profile.' },
  { icon: Target, title: 'Job Matching', desc: 'Precision matching using advanced embedding models.' },
  { icon: LineChart, title: 'Skill Gap Detection', desc: 'Identify exactly what skills you need to level up.' },
  { icon: Shield, title: 'Resume Optimization', desc: 'AI-powered suggestions to make your CV stand out.' },
  { icon: Rocket, title: 'Career Growth Insights', desc: 'Data-driven paths to accelerate your career trajectory.' },
];

const testimonials = [
  {
    name: 'Maluchukwu Agu',
    role: 'Senior Backend Engineer at Paystack',
    content: 'I was stuck in mid-level roles for 3 years. CareerMatch identified that my Docker and Kubernetes experience was outdated. After following the learning path, I landed a senior role at Paystack within 6 weeks. The skill gap analysis was brutally honest and exactly what I needed.',
    rating: 5,
  },
  {
    name: 'Philip Okafor',
    role: 'Data Science Lead at Terragon Group',
    content: 'The AI matching here is on another level. I uploaded my CV at 2 AM and by morning I had 12 highly relevant roles. Not random listings — actual positions where my PyTorch and MLOps background was genuinely valued. Interviewed at 4, got 2 offers.',
    rating: 5,
  },
  {
    name: 'Amina Abubakar',
    role: 'Product Manager at Flutterwave',
    content: 'Switching from engineering to product management, I had no idea how to position my technical background. This platform mapped my SQL and API design skills to PM roles that value technical fluency. The career trajectory insights alone are worth it.',
    rating: 5,
  },
];

const companies = ['Google', 'Microsoft', 'Amazon', 'IBM', 'Oracle', 'Meta', 'Accenture', 'Netflix'];

export default function Home() {
  const [stats, setStats] = useState({ jobs_analyzed: 50000, cvs_processed: 10000, matching_accuracy: 95, partner_companies: 500 });

  useEffect(() => {
    getStats().then(res => setStats(res.data)).catch(() => {});
  }, []);

  return (
    <div className="space-y-0">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white pt-12 lg:pt-20 pb-20 lg:pb-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] via-transparent to-purple-500/[0.03]" />
        <div className="absolute top-20 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-purple-500/5 rounded-full blur-3xl" />
        
        <div className="relative section-padding">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
            >
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Sparkles size={14} />
                AI-Powered Career Intelligence
              </div>
              <h1 className="font-display font-bold text-4xl lg:text-6xl text-dark leading-[1.1] mb-6">
                Find Your Perfect <br />
                <span className="gradient-text">Career With AI</span>
              </h1>
              <p className="text-secondary text-lg leading-relaxed mb-8 max-w-lg">
                Upload your CV and instantly discover jobs, career paths, and skill improvement 
                opportunities powered by advanced artificial intelligence.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/upload" className="btn-primary inline-flex items-center gap-2">
                  <Upload size={18} />
                  Upload CV
                </Link>
                <Link to="/how-it-works" className="btn-secondary inline-flex items-center gap-2">
                  <Play size={18} />
                  See How It Works
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative"
            >
              <div className="relative bg-white rounded-3xl shadow-elevated border border-border p-6 lg:p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-display font-semibold text-dark">AI Analytics</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                    <span className="text-xs text-success font-medium">Live</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted rounded-2xl p-4">
                    <p className="text-2xl lg:text-3xl font-display font-bold text-dark">
                      {stats.jobs_analyzed.toLocaleString()}+
                    </p>
                    <p className="text-sm text-secondary mt-1">Jobs Analyzed</p>
                  </div>
                  <div className="bg-muted rounded-2xl p-4">
                    <p className="text-2xl lg:text-3xl font-display font-bold text-dark">
                      {stats.cvs_processed.toLocaleString()}+
                    </p>
                    <p className="text-sm text-secondary mt-1">CVs Processed</p>
                  </div>
                  <div className="bg-muted rounded-2xl p-4">
                    <p className="text-2xl lg:text-3xl font-display font-bold text-primary">
                      {stats.matching_accuracy}%
                    </p>
                    <p className="text-sm text-secondary mt-1">Avg Match Score</p>
                  </div>
                  <div className="bg-muted rounded-2xl p-4">
                    <p className="text-2xl lg:text-3xl font-display font-bold text-dark">
                      Data Scientist
                    </p>
                    <p className="text-sm text-secondary mt-1">Top Career</p>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-border">
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      {[1,2,3,4].map(i => (
                        <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 
                                              border-2 border-white flex items-center justify-center text-xs font-medium text-primary">
                          {String.fromCharCode(64 + i)}
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-secondary">
                      <span className="text-dark font-medium">2,500+</span> professionals trust CareerMatch
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Statistics Band */}
      <section className="bg-dark py-12 lg:py-16">
        <div className="section-padding">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {[
              { value: '50,000+', label: 'Jobs Analyzed', icon: Briefcase },
              { value: '10,000+', label: 'CVs Processed', icon: Users },
              { value: '95%', label: 'Matching Accuracy', icon: Target },
              { value: '500+', label: 'Partner Companies', icon: Award },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <stat.icon className="w-6 h-6 text-primary mx-auto mb-3" />
                <p className="font-display font-bold text-2xl lg:text-3xl text-white mb-1">{stat.value}</p>
                <p className="text-slate-400 text-sm">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 lg:py-28 bg-background">
        <div className="section-padding max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display font-bold text-3xl lg:text-4xl text-dark mb-4">
              Why Choose <span className="gradient-text">CareerMatch</span>
            </h2>
            <p className="text-secondary max-w-2xl mx-auto">
              We combine cutting-edge AI with deep industry knowledge to deliver career insights that actually matter.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl p-6 lg:p-8 border border-border card-hover shadow-soft"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-5">
                  <feature.icon className="text-primary" size={22} />
                </div>
                <h3 className="font-display font-semibold text-lg text-dark mb-2">{feature.title}</h3>
                <p className="text-secondary text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="section-padding max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display font-bold text-3xl lg:text-4xl text-dark mb-4">
              Success <span className="gradient-text">Stories</span>
            </h2>
            <p className="text-secondary max-w-2xl mx-auto">
              Real professionals who transformed their careers with AI-powered insights.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="bg-background rounded-2xl p-6 lg:p-8 border border-border relative"
              >
                <Quote className="absolute top-6 right-6 text-primary/10" size={32} />
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(t.rating)].map((_, j) => (
                    <Star key={j} className="text-amber-400 fill-amber-400" size={16} />
                  ))}
                </div>
                <p className="text-dark text-sm leading-relaxed mb-6">{t.content}</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-500 
                                flex items-center justify-center text-white font-display font-bold text-sm">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-dark text-sm">{t.name}</p>
                    <p className="text-secondary text-xs">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Companies */}
      <section className="py-16 bg-background border-y border-border">
        <div className="section-padding max-w-7xl mx-auto">
          <p className="text-center text-secondary text-sm font-medium uppercase tracking-wider mb-8">
            Trusted by professionals at leading companies
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 lg:gap-16 opacity-40">
            {companies.map((company) => (
              <span key={company} className="font-display font-bold text-xl lg:text-2xl text-dark hover:opacity-100 transition-opacity cursor-default">
                {company}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}