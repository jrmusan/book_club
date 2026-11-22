import { ConfirmMeetingForm } from "@/components/meeting/confirm-meeting-form";
import { requireClubOwnerBySlug, requireUser } from "@/lib/club-access";
import { db } from "@/lib/db";
import { getPollWinner } from "@/lib/polls";

export default async function ConfirmMeetingPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ pollId?: string }>;
}) {
  const { slug } = await params;
  const { pollId } = await searchParams;
  const user = await requireUser();
  const { club } = await requireClubOwnerBySlug(slug, user.id);

  if (!pollId) {
    return <p>Missing poll ID</p>;
  }

  const poll = await db.poll.findFirst({
    where: { id: pollId, clubId: club.id, type: "MEETING" },
    select: { id: true },
  });
  const winner = poll ? await getPollWinner(poll.id) : null;

  return (
    <div className="mx-auto max-w-lg">
      <ConfirmMeetingForm
        clubSlug={slug}
        pollId={pollId}
        winningOption={
          winner ? { place: winner.label, startsAt: winner.startsAt?.toISOString() ?? null } : null
        }
      />
    </div>
  );
}
