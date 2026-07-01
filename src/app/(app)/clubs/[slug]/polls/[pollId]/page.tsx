import Link from "next/link";
import { ClubNav } from "@/components/layout/club-nav";
import { PollVoteForm } from "@/components/poll/poll-vote-form";
import { PollActions } from "@/components/poll/poll-actions";
import { Badge } from "@/components/ui/badge";
import { requireClubMemberBySlug, requireUser } from "@/lib/club-access";
import { db } from "@/lib/db";
import { getPollResults } from "@/actions/polls";

export default async function PollDetailPage({
  params,
}: {
  params: Promise<{ slug: string; pollId: string }>;
}) {
  const { slug, pollId } = await params;
  const user = await requireUser();
  const { club, membership } = await requireClubMemberBySlug(slug, user.id);

  const poll = await db.poll.findFirst({
    where: { id: pollId, clubId: club.id },
  });
  if (!poll) {
    return <main className="p-8">Poll not found</main>;
  }

  const [results, userVote] = await Promise.all([
    getPollResults(pollId),
    db.pollVote.findUnique({
      where: { pollId_userId: { pollId, userId: user.id } },
    }),
  ]);

  const isOwner = membership.role === "OWNER";

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <ClubNav slug={slug} isOwner={isOwner} />
      <div className="mt-8">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{poll.title}</h1>
            <p className="text-sm text-muted-foreground">{poll.type.replace("_", " ")}</p>
          </div>
          <Badge>{poll.status}</Badge>
        </div>

        {isOwner && (
          <PollActions clubSlug={slug} pollId={pollId} status={poll.status} pollType={poll.type} />
        )}

        <div className="mt-6">
          <PollVoteForm
            clubSlug={slug}
            pollId={pollId}
            options={results}
            userVoteOptionId={userVote?.optionId}
            isOpen={poll.status === "OPEN"}
          />
        </div>

        {poll.status === "CLOSED" && poll.type === "MEETING" && isOwner && (
          <div className="mt-6">
            <Link
              href={`/clubs/${slug}/meetings/confirm?pollId=${pollId}`}
              className="text-primary hover:underline"
            >
              Confirm meeting from results →
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
