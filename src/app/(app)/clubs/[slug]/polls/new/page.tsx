import { ClubNav } from "@/components/layout/club-nav";
import { NewBookPollForm } from "@/components/poll/new-book-poll-form";
import { requireClubOwnerBySlug, requireUser } from "@/lib/club-access";

export default async function NewPollPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireUser();
  await requireClubOwnerBySlug(slug, user.id);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <ClubNav slug={slug} isOwner />
      <div className="mt-8">
        <NewBookPollForm clubSlug={slug} />
      </div>
    </main>
  );
}
