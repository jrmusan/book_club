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
