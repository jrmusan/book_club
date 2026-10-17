import Link from "next/link";
import { PollVoteForm } from "@/components/poll/poll-vote-form";
import { PollActions } from "@/components/poll/poll-actions";
import { Badge } from "@/components/ui/badge";
import { enrichBooksMissingMetadata } from "@/lib/books";
import { requireClubMemberBySlug, requireUser } from "@/lib/club-access";
import { db } from "@/lib/db";
import { closeExpiredPoll } from "@/actions/polls";
import { rankingScores, type PollScoreMethod } from "@/lib/polls";

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
        votingMode: true,
        maxStars: true,
        maxRankedBooks: true,
        rankLimit: true,
        starBudget: true,
        scoreMethod: true,
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
                isbn: true,
                title: true,
                authors: true,
                coverUrl: true,
                description: true,
                pageCount: true,
                averageRating: true,
                ratingsCount: true,
                genres: true,
              },
            },
            votes: { select: { stars: true, userId: true } },
          },
        },
        votes: {
          where: { userId: user.id },
          select: { optionId: true, stars: true },
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
    (b) =>
      b.pageCount == null ||
      b.averageRating == null ||
      !b.description ||
      !b.genres?.length
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
                  genres: true,
                },
              },
              votes: { select: { stars: true, userId: true } },
            },
          },
        },
      })
    : null;

  const options = freshPoll?.options ?? poll.options;
  const ranking = poll.votingMode === "RANKING";
  const scoreMethod: PollScoreMethod = poll.scoreMethod === "TOP_STARS" ? "TOP_STARS" : "POINTS";
  const rankLimit = poll.rankLimit === "BUDGET" ? "BUDGET" : "BOOKS";
  const scores = rankingScores(
    options.flatMap((option) =>
      option.votes.map((vote) => ({
        optionId: option.id,
        userId: vote.userId,
        stars: vote.stars,
      }))
    ),
    scoreMethod
  );

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
          genres: o.book.genres ?? [],
        }
      : null,
    voteCount: o.votes.length,
    starTotal: scores.points.get(o.id) ?? 0,
    topPicks: scores.topPicks.get(o.id) ?? 0,
  }));
  const userVote = poll.votes[0];
  const scoreOf = (option: (typeof results)[number]) =>
    ranking ? (scoreMethod === "TOP_STARS" ? option.topPicks : option.starTotal) : option.voteCount;
  const isOwner = membership.role === "OWNER";
  const canManage = isOwner || poll.createdById === user.id;
  const isOpen = status === "OPEN";
  const leading =
    status === "CLOSED" && poll.type === "BOOK_SELECTION"
      ? [...results].filter((option) => option.book).sort((a, b) => scoreOf(b) - scoreOf(a))[0]
      : null;
  const winningBook = leading && scoreOf(leading) > 0 ? leading.book : null;

  return (
    <div className="mx-auto max-w-2xl pb-20 sm:pb-0">
      <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold leading-tight sm:text-2xl">{poll.title}</h1>
            <Badge className="shrink-0">{status}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {poll.type.replace("_", " ")}
            {ranking
              ? ` · Star ranking · ${
                  rankLimit === "BUDGET"
                    ? `${poll.starBudget} stars to spend`
                    : `up to ${poll.maxRankedBooks} book${poll.maxRankedBooks === 1 ? "" : "s"}`
                } · ${poll.maxStars}-star scale · ${scoreMethod === "TOP_STARS" ? "most top stars" : "most points"}`
              : poll.type === "BOOK_SELECTION"
                ? " · Single vote"
                : ""}
          </p>
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
      </div>

      {canManage && (
        <PollActions clubSlug={slug} pollId={pollId} status={status} pollType={poll.type} />
      )}

      <div className="mt-6">
        <PollVoteForm
          clubSlug={slug}
          pollId={pollId}
          options={results}
          userVoteOptionId={ranking ? undefined : userVote?.optionId}
          userRatings={poll.votes.flatMap((vote) =>
            vote.stars ? [{ optionId: vote.optionId, stars: vote.stars }] : []
          )}
          votingMode={poll.votingMode}
          maxStars={poll.maxStars ?? 3}
          maxRankedBooks={poll.maxRankedBooks ?? 1}
          rankLimit={rankLimit}
          starBudget={poll.starBudget ?? 0}
          scoreMethod={scoreMethod}
          isOpen={isOpen}
        />
      </div>

      {winningBook && (
        <div className="mt-6">
          <Link
            href={`/clubs/${slug}/books#book-${winningBook.id}`}
            className="text-primary hover:underline"
          >
            Reading notes for {winningBook.title} →
          </Link>
        </div>
      )}

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
