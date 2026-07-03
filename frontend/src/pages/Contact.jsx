import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, MapPin, Phone, Send, CheckCircle2, Github, Linkedin, Facebook, Twitter } from 'lucide-react';

// USER_INFO: These are your real contact details
const CONTACT_EMAIL = 'francisonyedikachiagwu@gmail.com';
const SOCIALS = {
  github: 'https://github.com/Dikachi32',
  linkedin: 'https://linkedin.com/in/dikachi-baron-a4a380356',
  facebook: 'https://www.facebook.com/share/18H6wLY1fW/',
  twitter: 'https://x.com/Baron_dikachi',
};

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // In production, connect this to your backend email API
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <div className="section-padding py-12 lg:py-20 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="font-display font-bold text-3xl lg:text-4xl text-dark mb-3">
          Get In <span className="gradient-text">Touch</span>
        </h1>
        <p className="text-secondary max-w-lg mx-auto">
          Have questions about CareerMatch or Prime Robotics AI? We respond within 24 hours.
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-5 gap-8 lg:gap-12">
        {/* Contact Info */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 space-y-6"
        >
          <div className="bg-white rounded-2xl border border-border p-6 shadow-soft">
            <h3 className="font-display font-semibold text-lg text-dark mb-6">Contact Information</h3>
            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Mail className="text-primary" size={18} />
                </div>
                <div>
                  <p className="text-sm font-medium text-dark">Email</p>
                  <a href={`mailto:${CONTACT_EMAIL}`} className="text-sm text-secondary hover:text-primary transition-colors">
                    {CONTACT_EMAIL}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MapPin className="text-primary" size={18} />
                </div>
                <div>
                  <p className="text-sm font-medium text-dark">Location</p>
                  <p className="text-sm text-secondary">Enugu, Nigeria</p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-border">
              <p className="text-sm font-medium text-dark mb-4">Follow Us</p>
              <div className="flex items-center gap-3">
                <a href={SOCIALS.github} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center hover:bg-primary hover:text-white transition-all">
                  <Github size={18} />
                </a>
                <a href={SOCIALS.linkedin} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center hover:bg-primary hover:text-white transition-all">
                  <Linkedin size={18} />
                </a>
                <a href={SOCIALS.twitter} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center hover:bg-primary hover:text-white transition-all">
                  <Twitter size={18} />
                </a>
                <a href={SOCIALS.facebook} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center hover:bg-primary hover:text-white transition-all">
                  <Facebook size={18} />
                </a>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-3"
        >
          <div className="bg-white rounded-2xl border border-border p-6 lg:p-8 shadow-soft">
            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="text-success" size={32} />
                </div>
                <h3 className="font-display font-bold text-xl text-dark mb-2">Message Sent!</h3>
                <p className="text-secondary">We will get back to you within 24 hours.</p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-dark mb-1.5">Full Name</label>
                    <input
                      required
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="input-field"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark mb-1.5">Email</label>
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="input-field"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark mb-1.5">Subject</label>
                  <input
                    required
                    type="text"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="input-field"
                    placeholder="How can I integrate your API?"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark mb-1.5">Message</label>
                  <textarea
                    required
                    rows={5}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="input-field resize-none"
                    placeholder="Tell us more about your inquiry..."
                  />
                </div>
                <button type="submit" className="w-full btn-primary flex items-center justify-center gap-2">
                  <Send size={18} />
                  Send Message
                </button>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}