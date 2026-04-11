export default function PrimaryButton({ children, ...props }) {
  return (
    <button
      className="inline-flex items-center gap-2 rounded-xl bg-blue-700 text-white px-4 py-2 text-sm font-medium hover:bg-blue-800 transition"
      {...props}
    >
      {children}
    </button>
  );
}
