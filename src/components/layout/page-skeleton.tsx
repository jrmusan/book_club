export function PageSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="mx-auto max-w-6xl animate-pulse px-4 py-8" aria-hidden>
      <div className="mb-6 h-9 w-48 rounded-md bg-muted" />
      <div className="space-y-4">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="h-24 rounded-lg bg-muted" />
        ))}
      </div>
    </div>
  );
}

export function ClubPageSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-4" aria-hidden>
      <div className="h-8 w-40 rounded-md bg-muted" />
      <div className="space-y-3">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="h-20 rounded-lg bg-muted" />
        ))}
      </div>
    </div>
  );
}
