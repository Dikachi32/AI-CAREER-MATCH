import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload, Play, Sparkles } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-white pt-20 pb-24">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] via-transparent to-purple-500/[0.03]" />
      <div className="section-padding max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Sparkles size={14} />
              AI-Powered Career Intelligence
            </div>
            <h1 className="font-display font-bold text-4xl lg:text-6xl text-dark leading-[1.1] mb-6">
              Find Your Perfect <br />
              <span className="gradient-text">Career With AI</span>
            </h1>
            <p className="text-secondary text-lg leading-relaxed mb-8 max-w-lg">
              Upload your CV and instantly discover jobs, career paths, and skill improvement opportunities powered by AI.
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
        </div>
      </div>
    </section>
  );
}