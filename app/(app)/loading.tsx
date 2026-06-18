// Instant route shell. Next.js renders this immediately on navigation while the
// target page's chunk loads and mounts, so switching pages feels instant instead
// of showing a blank gap. Mirrors the common page layout (header + cards + table).
export default function Loading() {
  return (
    <div className="p-4 md:p-6 space-y-6 animate-in fade-in-50 duration-150">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-48 rounded-lg animate-shimmer" />
          <div className="h-4 w-72 rounded animate-shimmer" />
        </div>
        <div className="h-9 w-32 rounded-lg animate-shimmer" />
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl animate-shimmer" />
        ))}
      </div>

      {/* Content block */}
      <div className="h-[420px] rounded-2xl animate-shimmer" />
    </div>
  );
}
