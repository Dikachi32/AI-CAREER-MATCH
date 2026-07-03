import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Upload, Briefcase, BarChart3, 
  HelpCircle, ChevronDown, LogOut, User, Settings,
  Menu, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navLinks = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/upload', label: 'Upload CV', icon: Upload },
  { path: '/recommendations', label: 'Recommendations', icon: Briefcase },
  { path: '/skills', label: 'Skill Analytics', icon: BarChart3 },
  { path: '/how-it-works', label: 'How It Works', icon: HelpCircle },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitial = () => {
    if (user?.name) return user.name.charAt(0).toUpperCase();
    return 'U';
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-border">
      <div className="section-padding">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2 group">
            <div className="w-8 h-8 lg:w-10 lg:h-10 bg-primary rounded-xl flex items-center justify-center
                          shadow-glow group-hover:scale-105 transition-transform duration-300">
              <span className="text-white font-display font-bold text-lg lg:text-xl">AI</span>
            </div>
            <span className="font-display font-bold text-lg lg:text-xl text-dark hidden sm:block">
              Career<span className="text-primary">Match</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300
                    ${active 
                      ? 'bg-primary/10 text-primary' 
                      : 'text-secondary hover:text-dark hover:bg-muted'
                    }`}
                >
                  <Icon size={16} />
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Profile Section */}
          <div className="flex items-center gap-4">
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-full hover:bg-muted transition-colors duration-200"
              >
                <div className="w-9 h-9 bg-gradient-to-br from-primary to-primary-dark rounded-full 
                              flex items-center justify-center text-white font-display font-semibold text-sm
                              shadow-soft">
                  {getInitial()}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-dark leading-tight">{user?.name || 'User'}</p>
                  <p className="text-xs text-secondary leading-tight">{user?.email || ''}</p>
                </div>
                <ChevronDown size={14} className={`text-secondary transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-elevated border border-border overflow-hidden"
                  >
                    <div className="p-4 border-b border-border bg-gradient-to-br from-primary/5 to-transparent">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-dark rounded-full 
                                      flex items-center justify-center text-white font-display font-bold text-lg">
                          {getInitial()}
                        </div>
                        <div>
                          <p className="font-display font-semibold text-dark">{user?.name || 'User'}</p>
                          <p className="text-sm text-secondary">{user?.email || ''}</p>
                        </div>
                      </div>
                      {user?.date_joined && (
                        <p className="mt-2 text-xs text-secondary">
                          Joined {new Date(user.date_joined).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                    <div className="p-2">
                      <button 
                        onClick={() => { setDropdownOpen(false); navigate('/dashboard'); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-secondary 
                                 hover:bg-muted hover:text-dark transition-colors duration-200"
                      >
                        <User size={16} />
                        Profile
                      </button>
                      <button 
                        onClick={() => { setDropdownOpen(false); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-secondary 
                                 hover:bg-muted hover:text-dark transition-colors duration-200 opacity-50 cursor-not-allowed"
                      >
                        <Settings size={16} />
                        Edit Profile <span className="text-xs ml-auto">Soon</span>
                      </button>
                      <div className="h-px bg-border my-1" />
                      <button
                        onClick={() => { setDropdownOpen(false); logout(); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-600 
                                 hover:bg-red-50 transition-colors duration-200"
                      >
                        <LogOut size={16} />
                        Logout
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-xl hover:bg-muted transition-colors"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="lg:hidden overflow-hidden bg-white border-b border-border"
          >
            <div className="section-padding py-4 space-y-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.path);
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                      ${active ? 'bg-primary/10 text-primary' : 'text-secondary hover:bg-muted hover:text-dark'}`}
                  >
                    <Icon size={18} />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}