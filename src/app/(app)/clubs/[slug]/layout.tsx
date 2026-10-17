import Link from "next/link";
import { Suspense } from "react";
import { ClubNav } from "@/components/layout/club-nav";
import { ClubPageSkeleton } from "@/components/layout/page-skeleton";
import { requireClubMemberBySlug, requireUser } from "@/lib/club-access";

async function ClubChrome({ slug }: { slug: string }) {
  const user = await requireUser();
  const { club, membership } = await requireClubMemberBySlug(slug, user.id);

  return (
    <>
      <Link
        href={`/clubs/${slug}`}
        className="font-display mb-3 inline-block text-base font-semibold tracking-tight text-foreground/90 drop-shadow-sm transition-colors hover:text-primary"
      >
        {club.name}
      </Link>
      <ClubNav slug={slug} isOwner={membership.role === "OWNER"} />
    </>
  );
}

function ClubChromeFallback() {
  return (
    <div aria-hidden>
      <div className="mb-3 h-4 w-32 animate-pulse rounded bg-muted" />
      <div className="flex flex-wrap gap-2 border-b border-border pb-4">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="h-9 w-24 animate-pulse rounded-md bg-muted" />
        ))}
      </div>
    </div>
  );
}

export default async function ClubLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Suspense fallback={<ClubChromeFallback />}>
        <ClubChrome slug={slug} />
      </Suspense>
      <div className="mt-8">
        <Suspense fallback={<ClubPageSkeleton />}>{children}</Suspense>
      </div>
    </div>
  );
}
