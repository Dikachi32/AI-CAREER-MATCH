import { motion } from 'framer-motion';
import { Shield, Lock, Eye, Trash2, Server } from 'lucide-react';

const sections = [
  {
    icon: Eye,
    title: 'Information We Collect',
    content: `We collect information you provide directly to us, including your name, email address, CV/resume data, and job preferences. When you upload your CV, our AI processes the text to extract skills, experience, and education details. We also collect usage data such as pages visited, features used, and job recommendations clicked to improve our matching algorithms.`
  },
  {
    icon: Lock,
    title: 'How We Use Your Data',
    content: `Your data is used solely to provide career recommendations, skill analytics, and job matching services. We use semantic embeddings to match your profile against job listings. Your CV text is processed in real-time and is never sold to third parties. Aggregated, anonymized data may be used for research purposes to improve our AI models.`
  },
  {
    icon: Server,
    title: 'Data Storage & Security',
    content: `All data is stored on secure servers with encryption at rest and in transit. We use industry-standard JWT authentication and bcrypt password hashing. CV files are stored temporarily for processing and are automatically purged after analysis. Our database is hosted on secure infrastructure with regular security audits.`
  },
  {
    icon: Trash2,
    title: 'Your Rights & Data Deletion',
    content: `You have the right to access, modify, or delete your personal data at any time. Upon account deletion, all associated CV data, job history, and personal identifiers are permanently removed from our systems within 30 days. You can request a full data export by contacting us directly.`
  },
];

export default function PrivacyPolicy() {
  return (
    <div className="section-padding py-12 lg:py-20 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Shield className="text-primary" size={28} />
        </div>
        <h1 className="font-display font-bold text-3xl lg:text-4xl text-dark mb-3">Privacy Policy</h1>
        <p className="text-secondary">Last updated: June 2026</p>
      </motion.div>

      <div className="prose prose-slate max-w-none">
        <p className="text-secondary leading-relaxed mb-10 text-lg">
          Prime Robotics and Artificial Intelligence Training and Research Institute ("we", "us", or "our") 
          operates the CareerMatch platform. This Privacy Policy explains how we collect, use, disclose, 
          and safeguard your information when you use our service.
        </p>

        <div className="space-y-8">
          {sections.map((section, i) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-2xl border border-border p-6 lg:p-8 shadow-soft"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <section.icon className="text-primary" size={20} />
                </div>
                <h2 className="font-display font-semibold text-xl text-dark">{section.title}</h2>
              </div>
              <p className="text-secondary leading-relaxed">{section.content}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-10 bg-muted rounded-2xl p-6 lg:p-8">
          <h3 className="font-display font-semibold text-lg text-dark mb-3">Contact Us</h3>
          <p className="text-secondary mb-2">
            If you have any questions about this Privacy Policy, please contact us at:
          </p>
          <a href="mailto:francisonyedikachiagwu@gmail.com" className="text-primary hover:underline font-medium">
            francisonyedikachiagwu@gmail.com
          </a>
        </div>
      </div>
    </div>
  );
}