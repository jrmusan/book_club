import { cache } from "react";
import { db } from "@/lib/db";

export const getPollResults = cache(async (pollId: string) => {
  const options = await db.pollOption.findMany({
    where: { pollId },
    include: {
      book: true,
      _count: { select: { votes: true } },
    },
    orderBy: { sortOrder: "asc" },
  });

  return options.map((o) => ({
    id: o.id,
    label: o.label,
    book: o.book,
    voteCount: o._count.votes,
  }));
});

const winningBookSelect = {
  id: true,
  title: true,
  authors: true,
  coverUrl: true,
} as const;

export type PollWinningBook = {
  pollId: string;
  closesAt: Date | null;
  voteCount: number;
  book: {
    id: string;
    title: string;
    authors: string[];
    coverUrl: string | null;
  };
};

/** Books that won a closed book-selection poll, newest poll first. */
export async function listClosedBookPollWinners(
  club: { id: string } | { slug: string }
): Promise<PollWinningBook[]> {
  const polls = await db.poll.findMany({
    where: {
      status: "CLOSED",
      type: "BOOK_SELECTION",
      ...("id" in club ? { clubId: club.id } : { club: { slug: club.slug } }),
    },
    orderBy: [{ closesAt: "desc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      closesAt: true,
      options: {
        orderBy: { sortOrder: "asc" },
        select: {
          book: { select: winningBookSelect },
          _count: { select: { votes: true } },
        },
      },
    },
  });

  const winners: PollWinningBook[] = [];
  const seen = new Set<string>();

  for (const poll of polls) {
    const top = [...poll.options].sort((a, b) => b._count.votes - a._count.votes)[0];
    if (!top?.book || seen.has(top.book.id)) continue;
    seen.add(top.book.id);
    winners.push({
      pollId: poll.id,
      closesAt: poll.closesAt,
      voteCount: top._count.votes,
      book: top.book,
    });
  }

  return winners;
}

export async function getPollWinner(pollId: string) {
  const votes = await db.pollVote.groupBy({
    by: ["optionId"],
    where: { pollId },
    _count: { optionId: true },
    orderBy: { _count: { optionId: "desc" } },
    take: 1,
  });
  if (!votes.length) return null;
  return db.pollOption.findUnique({
    where: { id: votes[0].optionId },
    include: { book: true },
  });
}
