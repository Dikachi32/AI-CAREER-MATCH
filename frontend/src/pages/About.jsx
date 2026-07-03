import { motion } from 'framer-motion';
import { Target, Users, Zap, Globe, Award, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const values = [
  { icon: Target, title: 'Precision Matching', desc: 'We use semantic embeddings and NLP to match candidates with roles that truly fit their skills, not just keyword overlaps.' },
  { icon: Users, title: 'Human-Centered AI', desc: 'Technology should amplify human potential. Every feature we build starts with the question: does this help someone advance their career?' },
  { icon: Zap, title: 'Continuous Learning', desc: 'The job market evolves daily. Our models retrain continuously to reflect real-time skill demands and salary trends.' },
  { icon: Globe, title: 'Global Reach, Local Context', desc: 'Whether you are job hunting in Lagos, London, or remotely, our location-aware matching respects regional markets and opportunities.' },
  { icon: Award, title: 'Research-Driven', desc: 'As a research institute, we publish our methodology and benchmark our models against industry standards.' },
];

const stats = [
  { value: '50,000+', label: 'Jobs Analyzed Daily' },
  { value: '10,000+', label: 'CVs Processed' },
  { value: '95%', label: 'Matching Accuracy' },
  { value: '500+', label: 'Partner Companies' },
];

export default function About() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-white pt-12 lg:pt-20 pb-16 lg:pb-24">
        <div className="section-padding max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Award size={14} />
              About Us
            </div>
            <h1 className="font-display font-bold text-4xl lg:text-5xl text-dark mb-6">
              Built by Engineers, <br />
              <span className="gradient-text">For Engineers</span>
            </h1>
            <p className="text-secondary text-lg max-w-2xl mx-auto leading-relaxed">
              CareerMatch is the flagship product of <strong>Prime Robotics and Artificial Intelligence Training and Research Institute</strong>. 
              We are a research-driven organization building intelligent systems that bridge the gap between talent and opportunity across Africa and beyond.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-dark py-12 lg:py-16">
        <div className="section-padding max-w-6xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <p className="font-display font-bold text-3xl text-white mb-1">{stat.value}</p>
                <p className="text-slate-400 text-sm">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 lg:py-28 bg-background">
        <div className="section-padding max-w-4xl mx-auto text-center mb-16">
          <h2 className="font-display font-bold text-3xl lg:text-4xl text-dark mb-4">Our Mission</h2>
          <p className="text-secondary text-lg leading-relaxed">
            To democratize career intelligence. We believe every professional deserves access to the same 
            data-driven insights that Fortune 500 companies use to hire talent. By open-sourcing our methodology 
            and building transparent AI, we are making career growth predictable, measurable, and accessible.
          </p>
        </div>

        <div className="section-padding max-w-7xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {values.map((v, i) => (
            <motion.div
              key={v.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-2xl p-6 lg:p-8 border border-border shadow-soft card-hover"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-5">
                <v.icon className="text-primary" size={22} />
              </div>
              <h3 className="font-display font-semibold text-lg text-dark mb-2">{v.title}</h3>
              <p className="text-secondary text-sm leading-relaxed">{v.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-white border-t border-border">
        <div className="section-padding max-w-4xl mx-auto text-center">
          <h2 className="font-display font-bold text-3xl text-dark mb-4">Ready to Experience It?</h2>
          <p className="text-secondary mb-8">Join thousands of professionals already using CareerMatch to navigate their careers.</p>
          <Link to="/upload" className="inline-flex items-center gap-2 btn-primary">
            Upload Your CV
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}