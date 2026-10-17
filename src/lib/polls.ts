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

  const starTotals = await starTotalsByOption(pollId);

  return options.map((o) => ({
    id: o.id,
    label: o.label,
    book: o.book,
    voteCount: o._count.votes,
    starTotal: starTotals.get(o.id) ?? 0,
  }));
});

async function starTotalsByOption(pollId: string) {
  const grouped = await db.pollVote.groupBy({
    by: ["optionId"],
    where: { pollId },
    _sum: { stars: true },
  });
  return new Map(grouped.map((row) => [row.optionId, row._sum.stars ?? 0]));
}

const winningBookSelect = {
  id: true,
  title: true,
  authors: true,
  coverUrl: true,
} as const;

export type PollScoreMethod = "POINTS" | "TOP_STARS";

export type RankingVote = {
  optionId: string;
  userId: string;
  stars: number | null;
};

/** Points are the stars themselves. Top picks are each person's highest star rating. */
export function rankingScores(votes: RankingVote[], method: PollScoreMethod) {
  const points = new Map<string, number>();
  const byUser = new Map<string, { optionId: string; stars: number }[]>();

  for (const vote of votes) {
    const stars = vote.stars ?? 0;
    if (stars <= 0) continue;
    points.set(vote.optionId, (points.get(vote.optionId) ?? 0) + stars);
    const list = byUser.get(vote.userId) ?? [];
    list.push({ optionId: vote.optionId, stars });
    byUser.set(vote.userId, list);
  }

  const topPicks = new Map<string, number>();
  for (const list of byUser.values()) {
    const max = Math.max(...list.map((vote) => vote.stars));
    for (const vote of list) {
      if (vote.stars !== max) continue;
      topPicks.set(vote.optionId, (topPicks.get(vote.optionId) ?? 0) + 1);
    }
  }

  return { points, topPicks, score: method === "TOP_STARS" ? topPicks : points };
}

export type PollWinningBook = {
  pollId: string;
  closesAt: Date | null;
  voteCount: number;
  scoreKind: "votes" | "points" | "top picks";
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
      votingMode: true,
      scoreMethod: true,
      options: {
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          book: { select: winningBookSelect },
          votes: { select: { stars: true, userId: true, optionId: true } },
        },
      },
    },
  });

  const winners: PollWinningBook[] = [];
  const seen = new Set<string>();

  for (const poll of polls) {
    const ranked = poll.votingMode === "RANKING";
    const method: PollScoreMethod = poll.scoreMethod === "TOP_STARS" ? "TOP_STARS" : "POINTS";
    const scores = rankingScores(
      poll.options.flatMap((option) => option.votes),
      method
    );
    const top = [...poll.options].sort(
      (a, b) => (scores.score.get(b.id) ?? 0) - (scores.score.get(a.id) ?? 0)
    )[0];
    if (!top?.book || seen.has(top.book.id)) continue;
    const score = ranked ? (scores.score.get(top.id) ?? 0) : top.votes.length;
    if (score <= 0) continue;
    seen.add(top.book.id);
    winners.push({
      pollId: poll.id,
      closesAt: poll.closesAt,
      voteCount: score,
      scoreKind: !ranked ? "votes" : method === "TOP_STARS" ? "top picks" : "points",
      book: top.book,
    });
  }

  return winners;
}

export async function getPollWinner(pollId: string) {
  const poll = await db.poll.findUnique({
    where: { id: pollId },
    select: { votingMode: true, scoreMethod: true },
  });
  if (!poll) return null;

  if (poll.votingMode === "RANKING") {
    const votes = await db.pollVote.findMany({
      where: { pollId },
      select: { optionId: true, userId: true, stars: true },
    });
    const method: PollScoreMethod = poll.scoreMethod === "TOP_STARS" ? "TOP_STARS" : "POINTS";
    const scores = rankingScores(votes, method);
    const top = [...scores.score.entries()].sort((a, b) => b[1] - a[1])[0];
    if (!top || top[1] <= 0) return null;
    return db.pollOption.findUnique({
      where: { id: top[0] },
      include: { book: true },
    });
  }

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
