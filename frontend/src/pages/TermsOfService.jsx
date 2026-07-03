import { motion } from 'framer-motion';
import { Scale, FileText, AlertTriangle, CheckCircle2 } from 'lucide-react';

const sections = [
  {
    icon: FileText,
    title: 'Acceptance of Terms',
    content: `By accessing or using CareerMatch, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service. CareerMatch is a product of Prime Robotics and Artificial Intelligence Training and Research Institute.`
  },
  {
    icon: CheckCircle2,
    title: 'Use of Service',
    content: `You agree to use CareerMatch only for lawful purposes and in a way that does not infringe the rights of others. You are responsible for maintaining the confidentiality of your account credentials. You may not use automated systems to scrape job listings or user data from our platform.`
  },
  {
    icon: AlertTriangle,
    title: 'User Content & CV Data',
    content: `You retain ownership of your CV and personal data. By uploading your CV, you grant us a limited license to process the text for the purpose of generating recommendations and analytics. We do not claim ownership of your original documents. You represent that you have the right to share the information contained in your CV.`
  },
  {
    icon: Scale,
    title: 'Limitation of Liability',
    content: `CareerMatch provides recommendations based on AI analysis and is provided "as is" without warranties of any kind. While we strive for 95% matching accuracy, we do not guarantee employment outcomes. Job listings are sourced from third-party APIs and we are not responsible for the accuracy of external listings or hiring decisions made by employers.`
  },
];

export default function TermsOfService() {
  return (
    <div className="section-padding py-12 lg:py-20 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Scale className="text-primary" size={28} />
        </div>
        <h1 className="font-display font-bold text-3xl lg:text-4xl text-dark mb-3">Terms of Service</h1>
        <p className="text-secondary">Last updated: June 2026</p>
      </motion.div>

      <div className="prose prose-slate max-w-none">
        <p className="text-secondary leading-relaxed mb-10 text-lg">
          These Terms of Service govern your use of the CareerMatch platform operated by 
          Prime Robotics and Artificial Intelligence Training and Research Institute. 
          Please read them carefully before using our services.
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
          <h3 className="font-display font-semibold text-lg text-dark mb-3">Governing Law</h3>
          <p className="text-secondary mb-4">
            These terms shall be governed by the laws of the Federal Republic of Nigeria. 
            Any disputes arising from these terms shall be resolved through arbitration in Lagos State.
          </p>
          <p className="text-secondary">
            For questions about these terms, contact:{' '}
            <a href="mailto:francisonyedikachiagwu@gmail.com" className="text-primary hover:underline font-medium">
              francisonyedikachiagwu@gmail.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}