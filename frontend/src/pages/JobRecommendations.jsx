import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, MapPin, DollarSign, Briefcase, Filter, ArrowUpDown,
  ExternalLink, CheckCircle2, XCircle, Building2, Wifi
} from 'lucide-react';
import { recommendJobs } from '../services/api';
import { useCV } from '../context/CVContext';

export default function JobRecommendations() {
  const { cvData, extractedInfo } = useCV();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    keyword: '',
    location: '',
    minSalary: '',
    remote: false,
    experience: '',
    industry: '',
  });
  const [sortBy, setSortBy] = useState('match');
  const [summary, setSummary] = useState(null);

  const fetchRecommendations = async () => {
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
      setJobs(res.data.recommendations);
      setSummary(res.data.summary);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [cvData]);

  const filteredJobs = [...jobs].sort((a, b) => {
    if (sortBy === 'match') return b.match_score - a.match_score;
    if (sortBy === 'salary') return 0; // Would need salary parsing
    if (sortBy === 'newest') return 0;
    if (sortBy === 'remote') return (b.remote === true ? 1 : 0) - (a.remote === true ? 1 : 0);
    return 0;
  });

  return (
    <div className="section-padding py-8 lg:py-12 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="font-display font-bold text-3xl lg:text-4xl text-dark mb-2">
          Job <span className="gradient-text">Recommendations</span>
        </h1>
        <p className="text-secondary">AI-curated opportunities matched to your unique profile.</p>
      </motion.div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Career Match', value: `${summary.average_match}%`, color: 'primary' },
            { label: 'Jobs Found', value: summary.total_jobs, color: 'purple' },
            { label: 'Top Career', value: summary.top_career, color: 'success' },
            { label: 'Highest Salary', value: summary.highest_salary, color: 'dark' },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl p-5 border border-border shadow-soft"
            >
              <p className="text-xs text-secondary uppercase tracking-wider font-medium mb-1">{stat.label}</p>
              <p className={`font-display font-bold text-xl ${stat.color === 'primary' ? 'text-primary' : stat.color === 'purple' ? 'text-purple-600' : stat.color === 'success' ? 'text-success' : 'text-dark'}`}>
                {stat.value}
              </p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-border p-4 lg:p-6 mb-6 shadow-soft"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" size={16} />
            <input
              type="text"
              placeholder="Keyword"
              value={filters.keyword}
              onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
              className="input-field pl-10"
            />
          </div>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" size={16} />
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
          <label className="flex items-center gap-2 cursor-pointer">
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors
              ${filters.remote ? 'bg-primary border-primary' : 'border-secondary/30'}`}
              onClick={() => setFilters({ ...filters, remote: !filters.remote })}
            >
              {filters.remote && <CheckCircle2 size={14} className="text-white" />}
            </div>
            <span className="text-sm text-secondary">Remote Only</span>
          </label>
          <button 
            onClick={fetchRecommendations}
            className="ml-auto bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </motion.div>

      {/* Job Cards */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-20">
            <Briefcase className="w-12 h-12 text-secondary/30 mx-auto mb-4" />
            <p className="text-secondary">No jobs found. Try adjusting your filters or upload a CV.</p>
          </div>
        ) : (
          filteredJobs.map((job, i) => (
            <motion.div
              key={job.job_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl border border-border p-5 lg:p-6 shadow-soft hover:shadow-card transition-shadow duration-300"
            >
              <div className="flex flex-col lg:flex-row lg:items-start gap-5">
                <div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Building2 className="text-primary" size={22} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h3 className="font-display font-semibold text-lg text-dark">{job.title}</h3>
                    {job.remote && (
                      <span className="inline-flex items-center gap-1 bg-success/10 text-success px-2.5 py-1 rounded-lg text-xs font-medium">
                        <Wifi size={12} /> Remote
                      </span>
                    )}
                    <span className={`ml-auto lg:ml-0 px-3 py-1 rounded-full text-sm font-bold
                      ${job.match_score >= 80 ? 'bg-success/10 text-success' : 
                        job.match_score >= 60 ? 'bg-amber-500/10 text-amber-600' : 'bg-secondary/10 text-secondary'}`}>
                      {job.match_score}% Match
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-secondary mb-3">
                    <span className="flex items-center gap-1"><Building2 size={14} /> {job.company}</span>
                    <span className="flex items-center gap-1"><MapPin size={14} /> {job.location}</span>
                    <span className="flex items-center gap-1"><DollarSign size={14} /> {job.salary_range}</span>
                    <span className="flex items-center gap-1"><Briefcase size={14} /> {job.experience_level}</span>
                  </div>

                  <p className="text-secondary text-sm leading-relaxed mb-4 line-clamp-2">{job.description}</p>

                  {/* Skills Match */}
                  <div className="space-y-3">
                    {job.matched_skills?.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-medium text-success flex items-center gap-1">
                          <CheckCircle2 size={12} /> Matched:
                        </span>
                        {job.matched_skills.map(s => (
                          <span key={s} className="bg-success/10 text-success px-2 py-1 rounded-md text-xs font-medium">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                    {job.missing_skills?.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-medium text-red-500 flex items-center gap-1">
                          <XCircle size={12} /> Missing:
                        </span>
                        {job.missing_skills.map(s => (
                          <span key={s} className="bg-red-50 text-red-600 px-2 py-1 rounded-md text-xs font-medium">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <a
                  href={job.apply_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary whitespace-nowrap flex items-center gap-2 self-start"
                >
                  Apply
                  <ExternalLink size={14} />
                </a>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}