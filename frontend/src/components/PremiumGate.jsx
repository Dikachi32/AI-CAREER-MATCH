import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Crown, Lock, ArrowRight, X } from 'lucide-react';
import { useSubscription } from '../context/SubscriptionContext';

export default function PremiumGate({ feature, children, onClose }) {
  const { isPremium, enableDemoPremium } = useSubscription();

  if (isPremium) return children;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
      >
        {/* Decorative gradient */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400" />
        
        <button
          onClick={onClose}
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
          {feature} is available exclusively for Demo Premium users. Upgrade to unlock AI-powered career tools.
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
            onClick={onClose}
            className="flex-1 py-3 rounded-xl font-medium text-[#64748B] bg-[#F1F5F9] hover:bg-[#E2E8F0] transition-colors"
          >
            Maybe Later
          </button>
          <button
            onClick={() => {
              enableDemoPremium();
              onClose();
            }}
            className="flex-1 py-3 rounded-xl font-medium text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2"
          >
            <Crown size={16} />
            Go Premium
          </button>
        </div>

        <p className="text-xs text-[#94A3B8] text-center mt-4">
          This is a demo environment. No real payment is processed.
        </p>
      </motion.div>
    </motion.div>
  );
}