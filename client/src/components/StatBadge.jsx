export default function StatBadge({ label, value, icon }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 flex items-center gap-3">
      <div className="p-2 rounded-lg bg-blue-200 text-blue-700">
        {icon}
      </div>
      <div>
        <div className="text-xs text-neutral-500">{label}</div>
        <div className="text-xl font-semibold text-neutral-900">{value}</div>
      </div>
    </div>
  );
}
