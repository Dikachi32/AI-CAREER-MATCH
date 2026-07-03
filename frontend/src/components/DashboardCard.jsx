export default function DashboardCard({ title, value, subtitle, progress, children }) {
  return (
    <div className="bg-white rounded-xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow">
      <h3 className="text-sm font-semibold text-dark font-heading">{title}</h3>
      {value ? (
        <div className="mt-2">
          <p className="text-3xl font-bold text-dark">{value}</p>
          {subtitle && <p className="text-xs text-muted mt-1">{subtitle}</p>}
          {progress !== undefined && (
            <div className="w-full bg-gray-100 rounded-full h-2 mt-3">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          )}
        </div>
      ) : (
        children
      )}
    </div>
  );
}