import Link from "next/link";
import { PollVoteForm } from "@/components/poll/poll-vote-form";
import { PollActions } from "@/components/poll/poll-actions";
import { Badge } from "@/components/ui/badge";
import { enrichBooksMissingMetadata } from "@/lib/books";
import { requireClubMemberBySlug, requireUser } from "@/lib/club-access";
import { db } from "@/lib/db";
import { closeExpiredPoll } from "@/actions/polls";

export default async function PollDetailPage({
  params,
}: {
  params: Promise<{ slug: string; pollId: string }>;
}) {
  const { slug, pollId } = await params;
  const user = await requireUser();

  const [{ membership }, poll] = await Promise.all([
    requireClubMemberBySlug(slug, user.id),
    db.poll.findFirst({
      where: { id: pollId, club: { slug } },
      select: {
        id: true,
        title: true,
        type: true,
        status: true,
        closesAt: true,
        createdById: true,
        options: {
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            label: true,
            book: {
              select: {
                id: true,
                externalSource: true,
                externalId: true,
                title: true,
                authors: true,
                coverUrl: true,
                description: true,
                pageCount: true,
                averageRating: true,
                ratingsCount: true,
              },
            },
            _count: { select: { votes: true } },
          },
        },
        votes: {
          where: { userId: user.id },
          take: 1,
          select: { optionId: true },
        },
      },
    }),
  ]);

  if (!poll) {
    return <p>Poll not found</p>;
  }

  let status = poll.status;
  if (
    status === "OPEN" &&
    poll.closesAt &&
    poll.closesAt.getTime() <= Date.now()
  ) {
    await closeExpiredPoll(slug, pollId);
    status = "CLOSED";
  }

  const books = poll.options.map((o) => o.book).filter(Boolean) as NonNullable<
    (typeof poll.options)[number]["book"]
  >[];
  const needsEnrich = books.some(
    (b) => b.pageCount == null || b.averageRating == null || !b.description
  );
  if (needsEnrich) {
    await enrichBooksMissingMetadata(books);
  }

  const freshPoll = needsEnrich
    ? await db.poll.findFirst({
        where: { id: pollId },
        select: {
          options: {
            orderBy: { sortOrder: "asc" },
            select: {
              id: true,
              label: true,
              book: {
                select: {
                  id: true,
                  title: true,
                  authors: true,
                  coverUrl: true,
                  description: true,
                  pageCount: true,
                  averageRating: true,
                  ratingsCount: true,
                },
              },
              _count: { select: { votes: true } },
            },
          },
        },
      })
    : null;

  const options = freshPoll?.options ?? poll.options;

  const results = options.map((o) => ({
    id: o.id,
    label: o.label,
    book: o.book
      ? {
          id: o.book.id,
          title: o.book.title,
          authors: o.book.authors,
          coverUrl: o.book.coverUrl,
          description: o.book.description,
          pageCount: o.book.pageCount,
          averageRating: o.book.averageRating,
          ratingsCount: o.book.ratingsCount,
        }
      : null,
    voteCount: o._count.votes,
  }));
  const userVote = poll.votes[0];
  const isOwner = membership.role === "OWNER";
  const canManage = isOwner || poll.createdById === user.id;
  const isOpen = status === "OPEN";

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{poll.title}</h1>
          <p className="text-sm text-muted-foreground">{poll.type.replace("_", " ")}</p>
          {poll.closesAt && (
            <p className="mt-2 text-sm text-muted-foreground">
              {isOpen ? "Voting closes" : "Closed"}{" "}
              {poll.closesAt.toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          )}
        </div>
        <Badge>{status}</Badge>
      </div>

      {canManage && (
        <PollActions clubSlug={slug} pollId={pollId} status={status} pollType={poll.type} />
      )}

      <div className="mt-6">
        <PollVoteForm
          clubSlug={slug}
          pollId={pollId}
          options={results}
          userVoteOptionId={userVote?.optionId}
          isOpen={isOpen}
        />
      </div>

      {status === "CLOSED" && poll.type === "MEETING" && isOwner && (
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
  );
}
