export function PageSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="mx-auto max-w-6xl animate-pulse px-4 py-8" aria-hidden>
      <div className="lofi-panel mb-6 h-9 w-48 rounded-xl" />
      <div className="space-y-4">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="lofi-panel h-24 rounded-2xl opacity-80" />
        ))}
      </div>
    </div>
  );
}

export function ClubPageSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-4" aria-hidden>
      <div className="lofi-panel h-8 w-40 rounded-xl" />
      <div className="space-y-3">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="lofi-panel h-20 rounded-2xl opacity-80" />
        ))}
      </div>
    </div>
  );
}
