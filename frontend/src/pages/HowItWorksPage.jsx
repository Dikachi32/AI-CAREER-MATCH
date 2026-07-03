import { motion } from 'framer-motion';
import { 
  Upload, Brain, Briefcase, LineChart, ExternalLink, TrendingUp,
  ArrowRight, CheckCircle2
} from 'lucide-react';
import { Link } from 'react-router-dom';

const steps = [
  {
    num: '01',
    icon: Upload,
    title: 'Upload CV',
    desc: 'Upload your resume in PDF or DOCX format. Our system accepts all standard formats up to 16MB.',
    color: 'from-blue-500 to-blue-600',
  },
  {
    num: '02',
    icon: Brain,
    title: 'AI Extracts Skills',
    desc: 'Natural language processing engines parse your experience, education, certifications, and technical skills.',
    color: 'from-purple-500 to-purple-600',
  },
  {
    num: '03',
    icon: Briefcase,
    title: 'Career Matching',
    desc: 'Semantic embeddings match your profile against 50,000+ job listings with 95% accuracy.',
    color: 'from-indigo-500 to-indigo-600',
  },
  {
    num: '04',
    icon: LineChart,
    title: 'Skill Gap Analysis',
    desc: 'Identify exactly which skills you have, which are in demand, and what you need to learn next.',
    color: 'from-emerald-500 to-emerald-600',
  },
  {
    num: '05',
    icon: ExternalLink,
    title: 'Apply For Jobs',
    desc: 'One-click applications to matched opportunities with AI-generated cover letter suggestions.',
    color: 'from-amber-500 to-amber-600',
  },
  {
    num: '06',
    icon: TrendingUp,
    title: 'Improve Career Readiness',
    desc: 'Follow personalized learning paths and track your career growth with ongoing AI insights.',
    color: 'from-rose-500 to-rose-600',
  },
];

export default function HowItWorksPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-white pt-12 lg:pt-20 pb-16 lg:pb-24">
        <div className="section-padding max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <CheckCircle2 size={14} />
              Simple Process
            </div>
            <h1 className="font-display font-bold text-4xl lg:text-5xl text-dark mb-6">
              How <span className="gradient-text">CareerMatch</span> Works
            </h1>
            <p className="text-secondary text-lg max-w-2xl mx-auto leading-relaxed">
              From CV upload to career acceleration in six simple steps. Our AI handles the complexity 
              so you can focus on what matters — your growth.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-16 lg:py-24 bg-background">
        <div className="section-padding max-w-5xl mx-auto">
          <div className="space-y-12 lg:space-y-0">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`relative flex flex-col lg:flex-row items-center gap-8 lg:gap-12
                  ${i !== steps.length - 1 ? 'lg:pb-16' : ''}`}
              >
                {/* Connector Line */}
                {i !== steps.length - 1 && (
                  <div className="hidden lg:block absolute left-[2.25rem] top-20 w-0.5 h-full bg-gradient-to-b from-border to-border" />
                )}

                {/* Number / Icon */}
                <div className="relative z-10 flex-shrink-0">
                  <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${step.color} shadow-lg flex items-center justify-center`}>
                    <step.icon className="text-white" size={28} />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full shadow-soft 
                                flex items-center justify-center font-display font-bold text-sm text-dark">
                    {step.num}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 text-center lg:text-left">
                  <h3 className="font-display font-bold text-2xl text-dark mb-3">{step.title}</h3>
                  <p className="text-secondary leading-relaxed max-w-lg">{step.desc}</p>
                </div>

                {/* Visual Decoration */}
                <div className="hidden lg:block w-32 h-32 rounded-3xl bg-gradient-to-br from-muted to-white border border-border/50" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-dark">
        <div className="section-padding max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display font-bold text-3xl lg:text-4xl text-white mb-6">
              Ready to Accelerate Your Career?
            </h2>
            <p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto">
              Join thousands of professionals who found their perfect role through AI-powered matching.
            </p>
            <Link to="/upload" className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-8 py-4 rounded-xl font-medium text-lg transition-all duration-300 hover:shadow-glow">
              Get Started Now
              <ArrowRight size={20} />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}