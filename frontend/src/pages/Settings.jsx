import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import { User, Mail, MapPin, Building2, Briefcase, Camera, Save, Crown } from 'lucide-react';
import SkeletonLoader from '../components/SkeletonLoader';

export default function Settings() {
  const { user, loading, updateProfile } = useAuth();
  const { subscription, isPremium, enableDemoPremium, disableDemoPremium } = useSubscription();
  const [form, setForm] = useState({
    name: user?.name || '',
    location: user?.location || '',
    title: user?.title || '',
    company: user?.company || ''
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const res = await updateProfile(form);
    if (res.success) {
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } else {
      setMessage({ type: 'error', text: res.error });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="section-padding py-12 max-w-3xl mx-auto">
        <SkeletonLoader type="card" />
      </div>
    );
  }

  return (
    <div className="section-padding py-8 lg:py-12 max-w-3xl mx-auto animate-fade-in">
      <h1 className="text-2xl lg:text-3xl font-bold text-[#0F172A] mb-8">Settings</h1>

      <div className="space-y-6">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 lg:p-8">
          <h2 className="text-lg font-semibold text-[#0F172A] mb-6 flex items-center gap-2">
            <User className="w-5 h-5 text-[#2563EB]" />
            Profile Information
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-[#2563EB] to-[#7C3AED] rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div>
                <p className="font-semibold text-[#0F172A]">{user?.name || 'User'}</p>
                <p className="text-sm text-[#64748B]">{user?.email}</p>
              </div>
              <button type="button" className="ml-auto p-2.5 text-[#94A3B8] hover:text-[#2563EB] hover:bg-[#2563EB]/10 rounded-xl transition-colors">
                <Camera className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className="input-field pl-10"
                    placeholder="Your full name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="input-field pl-10 bg-[#F1F5F9] cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1.5">Current Role</label>
                <div className="relative">
                  <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                  <input
                    type="text"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    className="input-field pl-10"
                    placeholder="e.g. Senior Software Engineer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1.5">Company</label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                  <input
                    type="text"
                    name="company"
                    value={form.company}
                    onChange={handleChange}
                    className="input-field pl-10"
                    placeholder="e.g. Acme Inc."
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[#0F172A] mb-1.5">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                  <input
                    type="text"
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    className="input-field pl-10"
                    placeholder="e.g. Lagos, Nigeria or Remote"
                  />
                </div>
              </div>
            </div>

            {message && (
              <div className={`p-3 rounded-xl text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {message.text}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Demo Subscription Card */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 lg:p-8">
          <h2 className="text-lg font-semibold text-[#0F172A] mb-6 flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-500" />
            Demo Subscription
          </h2>

          {/* Plan Status */}
          <div className={`flex items-center justify-between p-4 rounded-xl border mb-6 ${
            isPremium 
              ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200' 
              : 'bg-[#F8FAFC] border-[#E2E8F0]'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isPremium ? 'bg-amber-100' : 'bg-[#F1F5F9]'
              }`}>
                <Crown className={`w-5 h-5 ${isPremium ? 'text-amber-600' : 'text-[#94A3B8]'}`} />
              </div>
              <div>
                <p className="font-medium text-[#0F172A]">Current Plan</p>
                <p className="text-sm text-[#64748B]">
                  {isPremium ? 'Demo Premium — All features unlocked' : 'Demo Free — Limited features'}
                </p>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              isPremium 
                ? 'bg-amber-100 text-amber-700' 
                : 'bg-[#F1F5F9] text-[#64748B]'
            }`}>
              {isPremium ? 'Premium' : 'Free'}
            </span>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {[
              { 
                label: 'CV Optimization', 
                enabled: subscription.features.canOptimizeCV,
                description: 'AI-powered resume tailoring'
              },
              { 
                label: 'PDF Download', 
                enabled: subscription.features.canDownloadPDF,
                description: 'Export optimized CV as PDF'
              },
              { 
                label: 'DOCX Download', 
                enabled: subscription.features.canDownloadDOCX,
                description: 'Export optimized CV as Word'
              },
              { 
                label: 'Advanced ATS', 
                enabled: subscription.features.canAccessAdvancedATS,
                description: 'ATS scoring & keyword analysis'
              },
              { 
                label: 'CV Uploads', 
                enabled: true, 
                value: `${subscription.features.maxCVUploads === 999 ? '∞' : subscription.features.maxCVUploads}`,
                description: 'Maximum CV uploads allowed'
              },
              { 
                label: 'Job Saves', 
                enabled: true, 
                value: `${subscription.features.maxJobSaves === 999 ? '∞' : subscription.features.maxJobSaves}`,
                description: 'Maximum saved jobs allowed'
              },
            ].map((feat) => (
              <div key={feat.label} className={`p-4 rounded-xl border ${
                feat.enabled ? 'bg-[#F8FAFC] border-[#E2E8F0]' : 'bg-slate-50 border-slate-100 opacity-60'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-[#0F172A]">{feat.label}</span>
                  {feat.value !== undefined ? (
                    <span className="text-sm font-bold text-[#2563EB]">{feat.value}</span>
                  ) : (
                    <span className={`text-xs font-bold ${feat.enabled ? 'text-emerald-600' : 'text-[#94A3B8]'}`}>
                      {feat.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#94A3B8]">{feat.description}</p>
              </div>
            ))}
          </div>

          {/* Toggle Button */}
          <button
            onClick={isPremium ? disableDemoPremium : enableDemoPremium}
            className={`w-full py-3.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
              isPremium
                ? 'bg-[#F1F5F9] text-[#0F172A] hover:bg-[#E2E8F0]'
                : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/25'
            }`}
          >
            <Crown size={18} />
            {isPremium ? 'Switch to Demo Free' : 'Enable Demo Premium'}
          </button>

          <p className="text-xs text-[#94A3B8] text-center mt-4">
            This is a demo environment. No real payment is processed. 
            Future billing integration will be isolated from this toggle.
          </p>
        </div>
      </div>
    </div>
  );
}