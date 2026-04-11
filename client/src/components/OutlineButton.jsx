export default function OutlineButton({ children, ...props }) {
  return (
    <button
      className="inline-flex items-center gap-2 rounded-xl border border-blue-700 text-blue-700 px-4 py-2 text-sm font-medium hover:bg-blue-50 transition"
      {...props}
    >
      {children}
    </button>
  );
}
