import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Briefcase,
  BarChart3,
  Bookmark,
  Settings,
  Menu,
  X
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/recommendations', label: 'Jobs', icon: Briefcase },
  { to: '/skills', label: 'Skills', icon: BarChart3 },
  { to: '/saved-jobs', label: 'Saved', icon: Bookmark },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function MobileNav() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  if (!isAuthenticated) return null;

  return (
    <>
      {/* Mobile Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E2E8F0] z-40 lg:hidden safe-area-pb">
        <div className="flex items-center justify-around px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center py-2 px-3 min-w-[64px] transition-colors ${
                  isActive ? 'text-[#2563EB]' : 'text-[#64748B]'
                }`}
              >
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-medium mt-1">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile Top Hamburger (for secondary actions) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 right-4 z-50 p-2 bg-white rounded-xl shadow-lg border border-[#E2E8F0] lg:hidden"
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/20 lg:hidden" onClick={() => setIsOpen(false)}>
          <div
            className="absolute top-16 right-4 w-64 bg-white rounded-2xl shadow-xl border border-[#E2E8F0] p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-1">
              <Link
                to="/upload"
                onClick={() => setIsOpen(false)}
                className="block w-full text-left px-4 py-3 rounded-xl text-[#0F172A] font-medium hover:bg-[#F1F5F9] transition-colors"
              >
                Upload CV
              </Link>
              <Link
                to="/how-it-works"
                onClick={() => setIsOpen(false)}
                className="block w-full text-left px-4 py-3 rounded-xl text-[#0F172A] font-medium hover:bg-[#F1F5F9] transition-colors"
              >
                How It Works
              </Link>
              <hr className="border-[#E2E8F0] my-2" />
              <button
                onClick={() => {
                  setIsOpen(false);
                  localStorage.removeItem('token');
                  window.location.href = '/auth';
                }}
                className="block w-full text-left px-4 py-3 rounded-xl text-red-600 font-medium hover:bg-red-50 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}