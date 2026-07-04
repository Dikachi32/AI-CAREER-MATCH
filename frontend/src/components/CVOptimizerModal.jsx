import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Sparkles, Download, FileText, Copy, CheckCircle2,
  Loader2, ArrowRight, FileDown, FileType
} from 'lucide-react';
import { useSubscription } from '../context/SubscriptionContext';
import { optimizeCV } from '../services/api';
import PremiumGate from './PremiumGate';

const steps = [
  { id: 'analyze', label: 'Analyzing Job Requirements', icon: Sparkles },
  { id: 'compare', label: 'Comparing CV & Job', icon: FileText },
  { id: 'identify', label: 'Identifying Missing Skills', icon: ArrowRight },
  { id: 'ats', label: 'ATS Optimization', icon: CheckCircle2 },
  { id: 'rewrite', label: 'Professional Rewriting', icon: Sparkles },
  { id: 'keywords', label: 'Keyword Enhancement', icon: Sparkles },
  { id: 'structure', label: 'Resume Restructuring', icon: FileText },
  { id: 'complete', label: 'Optimization Complete', icon: CheckCircle2 },
];

export default function CVOptimizerModal({ job, onClose }) {
  const { isPremium } = useSubscription();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showPremiumGate, setShowPremiumGate] = useState(false);

  useEffect(() => {
    if (!isPremium) {
      setShowPremiumGate(true);
      setLoading(false);
      return;
    }

    const runOptimization = async () => {
      // Simulate step progression
      let step = 0;
      const interval = setInterval(() => {
        step++;
        setCurrentStep(step);
        if (step >= steps.length - 1) {
          clearInterval(interval);
        }
      }, 600);

      try {
        const res = await optimizeCV({
          job_title: job.title,
          job_description: job.description,
          job_id: job.job_id
        });
        setResult(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        clearInterval(interval);
        setCurrentStep(steps.length - 1);
        setLoading(false);
      }
    };

    runOptimization();
  }, [isPremium, job]);

  const handleCopy = () => {
    if (result?.optimized_summary) {
      navigator.clipboard.writeText(result.optimized_summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadPDF = () => {
    // Phase 5 stub — full implementation would call backend
    alert('PDF generation will be available in the next update. Copy the optimized content for now.');
  };

  const handleDownloadDOCX = () => {
    // Phase 5 stub — full implementation would call backend
    alert('DOCX generation will be available in the next update. Copy the optimized content for now.');
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 30 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-[#E2E8F0] p-6 rounded-t-3xl z-10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-[#0F172A] flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#2563EB]" />
                  AI CV Optimizer
                </h2>
                <p className="text-sm text-[#64748B] mt-1">
                  Optimizing for: <span className="font-medium text-[#0F172A]">{job.title}</span>
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-xl transition-colors"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              /* Processing State */
              <div className="py-8">
                <div className="max-w-sm mx-auto">
                  <div className="space-y-3">
                    {steps.map((step, i) => {
                      const Icon = step.icon;
                      const isActive = i === currentStep;
                      const isDone = i < currentStep;
                      return (
                        <div
                          key={step.id}
                          className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${
                            isActive ? 'bg-[#2563EB]/10 border border-[#2563EB]/20' :
                            isDone ? 'bg-emerald-50/50' : 'bg-[#F8FAFC] opacity-50'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            isActive ? 'bg-[#2563EB] text-white' :
                            isDone ? 'bg-emerald-500 text-white' : 'bg-[#E2E8F0] text-[#94A3B8]'
                          }`}>
                            {isActive ? <Loader2 size={16} className="animate-spin" /> : <Icon size={16} />}
                          </div>
                          <span className={`text-sm font-medium ${
                            isActive ? 'text-[#2563EB]' : isDone ? 'text-emerald-700' : 'text-[#94A3B8]'
                          }`}>
                            {step.label}
                          </span>
                          {isDone && <CheckCircle2 size={16} className="text-emerald-500 ml-auto" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : result ? (
              /* Results State */
              <div className="space-y-6">
                {/* Optimized Summary */}
                <div className="bg-gradient-to-r from-[#2563EB]/5 to-[#7C3AED]/5 rounded-2xl p-6 border border-[#2563EB]/10">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-[#2563EB]" />
                    <span className="text-sm font-semibold text-[#2563EB]">AI-Optimized Professional Summary</span>
                  </div>
                  <p className="text-sm text-[#0F172A] leading-relaxed mb-4">{result.optimized_summary}</p>
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center gap-2 text-sm text-[#2563EB] font-medium hover:underline"
                  >
                    {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                    {copied ? 'Copied!' : 'Copy Content'}
                  </button>
                </div>

                {/* Suggestions */}
                <div>
                  <h4 className="font-semibold text-[#0F172A] mb-3 flex items-center gap-2">
                    <ArrowRight size={16} className="text-[#2563EB]" />
                    AI Suggestions
                  </h4>
                  <ul className="space-y-2">
                    {result.suggestions.map((suggestion, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[#64748B]">
                        <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Download Actions */}
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[#E2E8F0]">
                  <button
                    onClick={handleDownloadPDF}
                    className="flex items-center justify-center gap-2 py-3 bg-red-50 text-red-700 rounded-xl font-medium hover:bg-red-100 transition-colors border border-red-100"
                  >
                    <FileDown size={18} />
                    Download PDF
                  </button>
                  <button
                    onClick={handleDownloadDOCX}
                    className="flex items-center justify-center gap-2 py-3 bg-blue-50 text-blue-700 rounded-xl font-medium hover:bg-blue-100 transition-colors border border-blue-100"
                  >
                    <FileType size={18} />
                    Download DOCX
                  </button>
                </div>
                <p className="text-xs text-[#94A3B8] text-center">
                  PDF/DOCX generation is a preview feature. Full document generation coming in the next release.
                </p>
              </div>
            ) : (
              /* Error State */
              <div className="text-center py-12">
                <p className="text-[#64748B]">Something went wrong. Please try again.</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* Premium Gate */}
      <AnimatePresence>
        {showPremiumGate && (
          <PremiumGate
            feature="AI CV Optimization"
            onClose={() => { setShowPremiumGate(false); onClose(); }}
          >
            {null}
          </PremiumGate>
        )}
      </AnimatePresence>
    </>
  );
}