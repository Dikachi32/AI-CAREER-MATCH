import { Link } from 'react-router-dom';
import { Github, Linkedin, Mail, ArrowUpRight, Facebook, Twitter } from 'lucide-react';

// REAL SOCIAL LINKS - DO NOT CHANGE
const SOCIAL_LINKS = {
  github: 'https://github.com/Dikachi32',
  linkedin: 'https://linkedin.com/in/dikachi-baron-a4a380356',
  facebook: 'https://www.facebook.com/share/18H6wLY1fW/',
  twitter: 'https://x.com/Baron_dikachi',
  email: 'francisonyedikachiagwu@gmail.com',
};

const footerLinks = {
  product: [
    { label: 'How It Works', path: '/how-it-works' },
    { label: 'Upload CV', path: '/upload' },
    { label: 'Recommendations', path: '/recommendations' },
    { label: 'Skill Analytics', path: '/skills' },
  ],
  company: [
    { label: 'About', path: '/about' },
    { label: 'Contact', path: '/contact' },
    { label: 'Privacy Policy', path: '/privacy' },
    { label: 'Terms of Service', path: '/terms' },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-dark text-white border-t border-white/10">
      <div className="section-padding py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-display font-bold">AI</span>
              </div>
              <span className="font-display font-bold text-xl">
                Career<span className="text-primary">Match</span>
              </span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed mb-6 max-w-xs">
              AI-powered career recommendations that help you find your perfect job, 
              close skill gaps, and accelerate your professional growth. A product of 
              Prime Robotics and Artificial Intelligence Training and Research Institute.
            </p>
            <div className="flex items-center gap-3">
              <a 
                href={SOCIAL_LINKS.github}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-primary hover:scale-110 transition-all duration-300"
              >
                <Github size={18} />
              </a>
              <a 
                href={SOCIAL_LINKS.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-primary hover:scale-110 transition-all duration-300"
              >
                <Linkedin size={18} />
              </a>
              <a 
                href={SOCIAL_LINKS.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-primary hover:scale-110 transition-all duration-300"
              >
                <Twitter size={18} />
              </a>
              <a 
                href={SOCIAL_LINKS.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-primary hover:scale-110 transition-all duration-300"
              >
                <Facebook size={18} />
              </a>
              <a 
                href={`mailto:${SOCIAL_LINKS.email}`}
                className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-primary hover:scale-110 transition-all duration-300"
              >
                <Mail size={18} />
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="font-display font-semibold text-sm uppercase tracking-wider text-slate-400 mb-4">
              Product
            </h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <Link 
                    to={link.path}
                    className="text-slate-300 hover:text-white text-sm transition-colors duration-200 flex items-center gap-1 group"
                  >
                    {link.label}
                    <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-display font-semibold text-sm uppercase tracking-wider text-slate-400 mb-4">
              Company
            </h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link 
                    to={link.path}
                    className="text-slate-300 hover:text-white text-sm transition-colors duration-200 flex items-center gap-1 group"
                  >
                    {link.label}
                    <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-display font-semibold text-sm uppercase tracking-wider text-slate-400 mb-4">
              Stay Updated
            </h4>
            <p className="text-slate-400 text-sm mb-4">
              Get the latest AI career insights and job market trends delivered to your inbox.
            </p>
            <div className="flex gap-2">
              <input 
                type="email" 
                placeholder="Enter your email"
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm
                         text-white placeholder-slate-500 focus:outline-none focus:border-primary/50
                         transition-colors"
              />
              <button className="bg-primary hover:bg-primary-dark px-4 py-2.5 rounded-xl text-sm font-medium
                               transition-colors duration-200">
                Join
              </button>
            </div>
            <p className="text-slate-600 text-xs mt-3">
              Contact: {SOCIAL_LINKS.email}
            </p>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-sm">
            {new Date().getFullYear()} Prime Robotics and Artificial Intelligence Training and Research Institute. All rights reserved.
          </p>
          <p className="text-slate-600 text-xs font-bold">
            Built by Dikachi Baron
          </p>
        </div>
      </div>
    </footer>
  );
}