export default function JobCard({ job }) {
  return (
    <div className="bg-white rounded-xl border border-border p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-dark font-heading">{job.title}</h3>
          <p className="text-sm text-muted">{job.company} · {job.location}</p>
        </div>
        <span className="bg-blue-50 text-primary text-sm px-3 py-1 rounded-full font-medium">
          {Math.round(job.similarity_score * 100)}% match
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {job.skills?.map((skill, i) => (
          <span key={i} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
            {skill}
          </span>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm text-muted">{job.salary_range || 'Salary N/A'}</span>
        <a
          href={job.apply_link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-blue-700 transition"
        >
          Apply Now
        </a>
      </div>
    </div>
  );
}