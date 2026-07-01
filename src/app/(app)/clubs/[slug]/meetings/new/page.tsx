import { ClubNav } from "@/components/layout/club-nav";
import { NewMeetingPollForm } from "@/components/poll/new-meeting-poll-form";
import { requireClubOwnerBySlug, requireUser } from "@/lib/club-access";

export default async function NewMeetingPollPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireUser();
  await requireClubOwnerBySlug(slug, user.id);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <ClubNav slug={slug} isOwner />
      <div className="mt-8">
        <NewMeetingPollForm clubSlug={slug} />
      </div>
    </main>
  );
}
