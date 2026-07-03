const features = [
  { icon: "🧠", title: "Smart CV Analysis", desc: "Our NLP engine instantly extracts skills, experience, and education from your resume." },
  { icon: "🎯", title: "AI Career Recommendations", desc: "Get personalized career paths based on your unique profile and market demand." },
  { icon: "🔍", title: "Live Job Matching", desc: "Compare your CV against real‑time job openings and see exact match percentages." },
  { icon: "📊", title: "Skill Gap Insights", desc: "Identify missing skills and get actionable suggestions to become a top candidate." },
];

export default function Features() {
  return (
    <section className="py-20 bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-dark font-heading">
          Everything You Need to Land the Perfect Job
        </h2>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <div key={i} className="bg-white p-6 rounded-xl border border-border hover:shadow-lg transition-shadow group">
              <div className="text-4xl mb-4">{f.icon}</div>
              <h3 className="text-lg font-semibold text-dark">{f.title}</h3>
              <p className="mt-2 text-sm text-muted">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}