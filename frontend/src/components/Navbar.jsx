import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import {
  LayoutDashboard,
  Briefcase,
  BarChart3,
  Bookmark,
  Settings,
  Bell,
  ChevronDown,
  LogOut,
  User,
  Crown,
  Zap,
  Upload
} from 'lucide-react';

const mainNavItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/recommendations', label: 'Recommendations', icon: Briefcase },
  { to: '/skills', label: 'Skill Analytics', icon: BarChart3 },
  { to: '/saved-jobs', label: 'Saved Jobs', icon: Bookmark },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { subscription, isPremium, enableDemoPremium, disableDemoPremium } = useSubscription();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-[#E2E8F0]">
      <div className="section-padding">
        <div className="flex items-center justify-between h-16 lg:h-[72px]">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 bg-gradient-to-br from-[#2563EB] to-[#7C3AED] rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" fill="white" />
            </div>
            <span className="text-lg font-bold text-[#0F172A] hidden sm:block">
              AI <span className="text-[#2563EB]">Career</span>Match
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    active
                      ? 'bg-[#2563EB]/10 text-[#2563EB]'
                      : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2 lg:gap-4">
            {/* Demo Subscription Badge */}
            {isAuthenticated && (
              <button
                onClick={isPremium ? disableDemoPremium : enableDemoPremium}
                className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  isPremium
                    ? 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 border border-amber-200'
                    : 'bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0] hover:border-[#2563EB] hover:text-[#2563EB]'
                }`}
                title={isPremium ? 'Click to switch to Demo Free' : 'Click to switch to Demo Premium'}
              >
                <Crown className="w-3.5 h-3.5" />
                {isPremium ? 'Demo Premium' : 'Demo Free'}
              </button>
            )}

            {/* Upload CV Quick Action (Desktop) */}
            {isAuthenticated && (
              <Link
                to="/upload"
                className="hidden md:flex items-center gap-2 bg-[#2563EB] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#1D4ED8] transition-all shadow-sm hover:shadow-md"
              >
                <Upload className="w-4 h-4" />
                Upload CV
              </Link>
            )}

            {/* Notifications */}
            {isAuthenticated && (
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setNotifOpen(!notifOpen)}
                  className="relative p-2.5 rounded-xl text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-colors"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                </button>

                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-[#E2E8F0] py-3 z-50">
                    <div className="px-4 pb-2 border-b border-[#E2E8F0]">
                      <h3 className="font-semibold text-[#0F172A] text-sm">Notifications</h3>
                    </div>
                    <div className="px-4 py-6 text-center">
                      <p className="text-sm text-[#94A3B8]">No new notifications</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* User Avatar / Auth */}
            {isAuthenticated ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl hover:bg-[#F1F5F9] transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-[#2563EB] to-[#7C3AED] rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-semibold text-[#0F172A] leading-tight">{user?.name || 'User'}</p>
                    <p className="text-xs text-[#94A3B8] leading-tight truncate max-w-[120px]">{user?.email}</p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-[#94A3B8] hidden md:block transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-[#E2E8F0] py-2 z-50">
                    <div className="px-4 py-3 border-b border-[#E2E8F0]">
                      <p className="font-semibold text-[#0F172A] text-sm">{user?.name || 'User'}</p>
                      <p className="text-xs text-[#94A3B8]">{user?.email}</p>
                      <p className="text-xs text-[#64748B] mt-1">
                        Joined {user?.date_joined ? new Date(user.date_joined).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Recently'}
                      </p>
                    </div>

                    <Link
                      to="/settings"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#0F172A] hover:bg-[#F1F5F9] transition-colors"
                    >
                      <User className="w-4 h-4 text-[#64748B]" />
                      Profile & Settings
                    </Link>

                    <div className="sm:hidden px-4 py-2">
                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          isPremium ? disableDemoPremium() : enableDemoPremium();
                        }}
                        className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-semibold ${
                          isPremium
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-[#F1F5F9] text-[#64748B]'
                        }`}
                      >
                        <Crown className="w-3.5 h-3.5" />
                        {isPremium ? 'Switch to Demo Free' : 'Enable Demo Premium'}
                      </button>
                    </div>

                    <hr className="border-[#E2E8F0] my-1" />

                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        logout();
                      }}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/auth"
                className="bg-[#2563EB] text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-[#1D4ED8] transition-all"
              >
                Get Started
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}