import { ClubPageSkeleton } from "@/components/layout/page-skeleton";

export default function ClubLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-3 h-4 w-32 animate-pulse rounded bg-muted" />
      <div className="mb-8 flex flex-wrap gap-2">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="h-9 w-24 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
      <ClubPageSkeleton rows={3} />
    </div>
  );
}
