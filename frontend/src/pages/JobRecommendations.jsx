import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search, MapPin, DollarSign, Briefcase, Filter, ArrowUpDown,
  CheckCircle2, XCircle, Building2, Wifi, Eye, Loader2, BookmarkPlus
} from 'lucide-react';
import { recommendJobs } from '../services/api';
import { useCV } from '../context/CVContext';
import SkeletonLoader from '../components/SkeletonLoader';

export default function JobRecommendations() {
  const { cvData, extractedInfo } = useCV();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    keyword: '',
    location: '',
    remote: false,
    experience: '',
    industry: '',
  });
  const [sortBy, setSortBy] = useState('match');
  const [summary, setSummary] = useState(null);

  const fetchRecommendations = useCallback(async () => {
    if (!cvData?.cleaned_text) return;
    setLoading(true);
    try {
      const res = await recommendJobs({
        cv_text: cvData.cleaned_text,
        location: filters.location,
        keyword: filters.keyword,
        filters: {
          remote: filters.remote,
          experience_level: filters.experience,
          industry: filters.industry,
        }
      });
      setJobs(res.data.recommendations || []);
      setSummary(res.data.summary || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [cvData, filters]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const handleViewJob = (job) => {
    // Store job data for the details page
    localStorage.setItem('careermatch_selected_job', JSON.stringify(job));
    navigate(`/job/${job.job_id}`);
  };

  const handleSaveJob = (job, e) => {
    e.stopPropagation();
    const saved = JSON.parse(localStorage.getItem('careermatch_saved_jobs') || '[]');
    if (!saved.find(j => j.job_id === job.job_id)) {
      saved.push(job);
      localStorage.setItem('careermatch_saved_jobs', JSON.stringify(saved));
    }
  };

  const filteredJobs = [...jobs].sort((a, b) => {
    if (sortBy === 'match') return b.match_score - a.match_score;
    if (sortBy === 'salary') {
      const getMin = (salary) => {
        if (!salary || salary === 'N/A') return 0;
        const match = salary.match(/\$?([\d,]+)/);
        return match ? parseInt(match[1].replace(/,/g, '')) : 0;
      };
      return getMin(b.salary_range) - getMin(a.salary_range);
    }
    if (sortBy === 'remote') return (b.remote === true ? 1 : 0) - (a.remote === true ? 1 : 0);
    return 0;
  });

  const getMatchColor = (score) => {
    if (score >= 80) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (score >= 60) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-slate-50 text-slate-600 border-slate-200';
  };

  return (
    <div className="section-padding py-8 lg:py-12 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-[#0F172A]">
          Job <span className="gradient-text">Recommendations</span>
        </h1>
        <p className="text-[#64748B] mt-1">AI-curated opportunities matched to your unique profile.</p>
      </motion.div>

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Career Match', value: `${summary.average_match}%`, color: 'text-[#2563EB]' },
            { label: 'Jobs Found', value: summary.total_jobs, color: 'text-purple-600' },
            { label: 'Top Career', value: summary.top_career, color: 'text-emerald-600' },
            { label: 'Highest Salary', value: summary.highest_salary, color: 'text-[#0F172A]' },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-sm"
            >
              <p className="text-xs text-[#64748B] uppercase tracking-wider font-medium mb-1">{stat.label}</p>
              <p className={`font-bold text-xl ${stat.color} truncate`}>{stat.value}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-[#E2E8F0] p-4 lg:p-6 mb-6 shadow-sm"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={16} />
            <input
              type="text"
              placeholder="Keyword"
              value={filters.keyword}
              onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
              className="input-field pl-10"
            />
          </div>
          <div className="relative">
            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={16} />
            <input
              type="text"
              placeholder="Location"
              value={filters.location}
              onChange={(e) => setFilters({ ...filters, location: e.target.value })}
              className="input-field pl-10"
            />
          </div>
          <select
            value={filters.experience}
            onChange={(e) => setFilters({ ...filters, experience: e.target.value })}
            className="input-field"
          >
            <option value="">Experience Level</option>
            <option value="Entry">Entry Level</option>
            <option value="Mid">Mid Level</option>
            <option value="Senior">Senior Level</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="input-field"
          >
            <option value="match">Highest Match</option>
            <option value="salary">Highest Salary</option>
            <option value="remote">Remote First</option>
          </select>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <div
              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors cursor-pointer
                ${filters.remote ? 'bg-[#2563EB] border-[#2563EB]' : 'border-[#CBD5E1]'}`}
              onClick={() => setFilters({ ...filters, remote: !filters.remote })}
            >
              {filters.remote && <CheckCircle2 size={14} className="text-white" />}
            </div>
            <span className="text-sm text-[#64748B]">Remote Only</span>
          </label>
          <button
            onClick={fetchRecommendations}
            className="ml-auto bg-[#2563EB] text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-[#1D4ED8] transition-all"
          >
            Apply Filters
          </button>
        </div>
      </motion.div>

      {/* Job Cards */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-12">
            <SkeletonLoader type="card" count={4} />
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-[#E2E8F0]">
            <Briefcase className="w-12 h-12 text-[#E2E8F0] mx-auto mb-4" />
            <p className="text-[#64748B] font-medium mb-2">No jobs found</p>
            <p className="text-sm text-[#94A3B8]">Try adjusting your filters or upload a CV.</p>
          </div>
        ) : (
          filteredJobs.map((job, i) => (
            <motion.div
              key={job.job_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl border border-[#E2E8F0] p-5 lg:p-6 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
              onClick={() => handleViewJob(job)}
            >
              <div className="flex flex-col lg:flex-row lg:items-start gap-5">
                {/* Company Icon */}
                <div className="w-12 h-12 bg-gradient-to-br from-[#2563EB]/10 to-purple-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Building2 className="text-[#2563EB]" size={22} />
                </div>

                <div className="flex-1 min-w-0">
                  {/* Title Row */}
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg text-[#0F172A]">{job.title}</h3>
                    {job.remote && (
                      <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg text-xs font-medium border border-emerald-100">
                        <Wifi size={12} /> Remote
                      </span>
                    )}
                    <span className={`ml-auto lg:ml-0 px-3 py-1 rounded-full text-sm font-bold border ${getMatchColor(job.match_score)}`}>
                      {job.match_score}% Match
                    </span>
                  </div>

                  {/* Meta Info */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-[#64748B] mb-3">
                    <span className="flex items-center gap-1"><Building2 size={14} /> {job.company}</span>
                    <span className="flex items-center gap-1"><MapPin size={14} /> {job.location}</span>
                    <span className="flex items-center gap-1"><DollarSign size={14} /> {job.salary_range}</span>
                    <span className="flex items-center gap-1"><Briefcase size={14} /> {job.experience_level}</span>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-[#64748B] leading-relaxed mb-4 line-clamp-2">{job.description}</p>

                  {/* Skills Match */}
                  {job.matched_skills?.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 size={12} /> Matched:
                      </span>
                      {job.matched_skills.map(s => (
                        <span key={s} className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md text-xs font-medium border border-emerald-100">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3">
                    {/* VIEW BUTTON — replaces Apply */}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleViewJob(job); }}
                      className="inline-flex items-center gap-2 bg-[#2563EB] text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-[#1D4ED8] transition-all shadow-sm hover:shadow-md"
                    >
                      <Eye size={16} />
                      View
                    </button>

                    {/* Save Job */}
                    <button
                      onClick={(e) => handleSaveJob(job, e)}
                      className="inline-flex items-center gap-2 bg-white text-[#64748B] border border-[#E2E8F0] px-4 py-2.5 rounded-xl text-sm font-medium hover:border-[#2563EB] hover:text-[#2563EB] transition-all"
                    >
                      <BookmarkPlus size={16} />
                      Save
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}