export default function Loading() {
  return (
    <div className="min-h-screen text-slate-200">
      <div className="mx-auto flex max-w-xl flex-col items-center px-5 py-32 text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/15 border-t-cyan-400" />
        <p className="mt-4 text-sm text-slate-500">Loading the latest…</p>
      </div>
    </div>
  );
}
