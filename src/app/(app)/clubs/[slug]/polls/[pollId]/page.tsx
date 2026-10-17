import Link from "next/link";
import { PollVoteForm } from "@/components/poll/poll-vote-form";
import { PollActions } from "@/components/poll/poll-actions";
import { Badge } from "@/components/ui/badge";
import { enrichBooksMissingMetadata } from "@/lib/books";
import { requireClubMemberBySlug, requireUser } from "@/lib/club-access";
import { db } from "@/lib/db";

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

  return (
    <div className="mx-auto max-w-2xl">
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
  );
}
