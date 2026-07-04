import { useNavigate } from 'react-router-dom';
import { Building2, MapPin, DollarSign, Eye } from 'lucide-react';

export default function JobCard({ job }) {
  const navigate = useNavigate();

  const handleView = () => {
    localStorage.setItem('careermatch_selected_job', JSON.stringify(job));
    navigate(`/job/${job.job_id}`);
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-[#0F172A] truncate">{job.title}</h3>
          <p className="text-sm text-[#64748B]">{job.company} · {job.location}</p>
        </div>
        <span className="bg-blue-50 text-[#2563EB] text-sm px-3 py-1 rounded-full font-medium border border-blue-100 shrink-0">
          {Math.round(job.similarity_score * 100)}% match
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {job.skills?.map((skill, i) => (
          <span key={i} className="bg-[#F1F5F9] text-[#64748B] text-xs px-2.5 py-1 rounded-full font-medium">
            {skill}
          </span>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm text-[#64748B] flex items-center gap-1">
          <DollarSign size={14} />
          {job.salary_range || 'Salary N/A'}
        </span>
        {/* VIEW BUTTON — replaces Apply Now */}
        <button
          onClick={handleView}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#2563EB] text-white text-sm rounded-xl hover:bg-[#1D4ED8] transition-all font-medium"
        >
          <Eye size={14} />
          View
        </button>
      </div>
    </div>
  );
}