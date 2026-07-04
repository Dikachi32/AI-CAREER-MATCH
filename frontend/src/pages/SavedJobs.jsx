import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import { Bookmark, ArrowRight, Trash2, Briefcase, MapPin, DollarSign } from 'lucide-react';
import SkeletonLoader from '../components/SkeletonLoader';

export default function SavedJobs() {
  const { isAuthenticated } = useAuth();
  const { subscription } = useSubscription();
  const [savedJobs, setSavedJobs] = useState(() => {
    const saved = localStorage.getItem('careermatch_saved_jobs');
    return saved ? JSON.parse(saved) : [];
  });
  const [loading] = useState(false);

  const removeJob = (jobId) => {
    const updated = savedJobs.filter((j) => j.job_id !== jobId);
    setSavedJobs(updated);
    localStorage.setItem('careermatch_saved_jobs', JSON.stringify(updated));
  };

  const maxSaves = subscription.features.maxJobSaves;
  const canSaveMore = savedJobs.length < maxSaves;

  if (!isAuthenticated) {
    return (
      <div className="section-padding py-20 text-center">
        <h2 className="text-2xl font-bold text-[#0F172A] mb-2">Access Required</h2>
        <p className="text-[#64748B] mb-6">Please log in to view your saved jobs.</p>
        <Link to="/auth" className="btn-primary inline-flex items-center gap-2">
          Log In <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="section-padding py-8 lg:py-12 max-w-6xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-[#0F172A]">Saved Jobs</h1>
          <p className="text-[#64748B] mt-1">
            {savedJobs.length} of {maxSaves} saved jobs
            {!canSaveMore && ' (limit reached)'}
          </p>
        </div>
        <Link to="/recommendations" className="btn-secondary inline-flex items-center gap-2">
          Browse Jobs <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {loading ? (
        <SkeletonLoader type="card" count={3} />
      ) : savedJobs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-12 text-center">
          <div className="w-16 h-16 bg-[#F1F5F9] rounded-full flex items-center justify-center mx-auto mb-4">
            <Bookmark className="w-8 h-8 text-[#94A3B8]" />
          </div>
          <h3 className="text-lg font-semibold text-[#0F172A] mb-2">No saved jobs yet</h3>
          <p className="text-[#64748B] mb-6 max-w-md mx-auto">
            When you find jobs you love, save them here for quick access.
          </p>
          <Link to="/recommendations" className="btn-primary inline-flex items-center gap-2">
            Find Jobs <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {savedJobs.map((job) => (
            <div
              key={job.job_id}
              className="bg-white rounded-2xl border border-[#E2E8F0] p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-[#0F172A] truncate">{job.title}</h3>
                    <span className="shrink-0 px-2.5 py-0.5 bg-green-50 text-green-700 text-xs font-medium rounded-full">
                      {job.match_score}% Match
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-[#64748B] mb-3">
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-4 h-4" /> {job.company}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" /> {job.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4" /> {job.salary_range || 'N/A'}
                    </span>
                  </div>
                  <p className="text-sm text-[#64748B] line-clamp-2">{job.description}</p>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    onClick={() => removeJob(job.job_id)}
                    className="p-2 text-[#94A3B8] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    aria-label="Remove saved job"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <a
                  href={job.apply_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary text-sm py-2.5"
                >
                  Apply Now
                </a>
                <button className="btn-secondary text-sm py-2.5">
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}