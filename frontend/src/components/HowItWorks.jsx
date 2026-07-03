const steps = [
  { step: "1", title: "Upload CV", desc: "Drag & drop your resume in PDF or DOCX." },
  { step: "2", title: "AI Analyzes Skills", desc: "We extract and structure your capabilities." },
  { step: "3", title: "Match with Jobs", desc: "Compare against thousands of live listings." },
  { step: "4", title: "Apply Directly", desc: "One click to the original job application." },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-dark font-heading">
          How It Works
        </h2>
        <div className="mt-12 flex flex-col md:flex-row items-center justify-center gap-6">
          {steps.map((s, i) => (
            <div key={i} className="flex flex-col items-center md:w-48">
              <div className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center text-xl font-bold shadow-md">
                {s.step}
              </div>
              <h3 className="mt-4 font-semibold text-dark">{s.title}</h3>
              <p className="mt-1 text-sm text-muted">{s.desc}</p>
              {i < steps.length - 1 && (
                <div className="hidden md:block h-0.5 w-full bg-border mt-6 relative">
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 text-muted">→</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}