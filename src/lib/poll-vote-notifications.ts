import type { PollType, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { personName } from "@/lib/utils";

export type PollVoteChoice = { label: string | null; startsAt: string | null };

export type PollVoter = {
  id: string;
  name: string;
  /** Null for star rankings, which spread a vote over several books. */
  choice: PollVoteChoice | null;
  changed: boolean;
};

export type PollVotePayload = {
  clubSlug: string;
  pollTitle: string;
  pollType: PollType;
  voters: PollVoter[];
  /** Plain-text fallback; it cannot show meeting times in the reader's timezone. */
  message: string;
};

export function isPollVotePayload(payload: unknown): payload is PollVotePayload {
  return (
    !!payload &&
    typeof payload === "object" &&
    Array.isArray((payload as PollVotePayload).voters) &&
    typeof (payload as PollVotePayload).pollTitle === "string"
  );
}

/** "Alice", "Alice and Bob", "Alice, Bob and 3 others". Most recent voter first. */
export function describeVoters(voters: { name: string }[]) {
  const names = voters.map((voter) => voter.name).reverse();
  if (names.length <= 2) return names.join(" and ");
  const others = names.length - 2;
  return `${names[0]}, ${names[1]} and ${others} other${others === 1 ? "" : "s"}`;
}

function fallbackMessage(pollTitle: string, voters: PollVoter[]) {
  if (voters.length > 1) return `${describeVoters(voters)} voted in ${pollTitle}`;
  const [voter] = voters;
  if (!voter.choice) {
    return `${voter.name} ${voter.changed ? "updated their ranking" : "ranked the books"} in ${pollTitle}`;
  }
  const verb = voter.changed ? "changed their vote to" : "voted for";
  return `${voter.name} ${verb} ${voter.choice.label ?? "an option"} in ${pollTitle}`;
}

/**
 * Tells the other active club members that someone voted. A member with an unread vote
 * notification for the same poll gets that one updated instead of a new one.
 */
export async function notifyPollVote({
  clubId,
  clubSlug,
  poll,
  voter,
  choice,
  changed = false,
}: {
  clubId: string;
  clubSlug: string;
  poll: { id: string; title: string; type: PollType };
  voter: { id: string; name?: string | null; email?: string | null };
  choice: PollVoteChoice | null;
  changed?: boolean;
}) {
  const members = await db.clubMembership.findMany({
    where: { clubId, status: "ACTIVE", userId: { not: voter.id } },
    select: { userId: true },
  });
  if (members.length === 0) return;

  const unread = await db.notification.findMany({
    where: {
      type: "POLL_VOTE",
      pollId: poll.id,
      readAt: null,
      userId: { in: members.map((member) => member.userId) },
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, userId: true, payload: true },
  });
  const unreadByUser = new Map<string, (typeof unread)[number]>();
  for (const notification of unread) {
    if (!unreadByUser.has(notification.userId)) unreadByUser.set(notification.userId, notification);
  }

  const thisVoter: PollVoter = { id: voter.id, name: personName(voter), choice, changed };
  const payloadFor = (previous: PollVoter[]): Prisma.InputJsonValue => {
    const voters = [...previous.filter((v) => v.id !== voter.id), thisVoter];
    const payload: PollVotePayload = {
      clubSlug,
      pollTitle: poll.title,
      pollType: poll.type,
      voters,
      message: fallbackMessage(poll.title, voters),
    };
    return payload as unknown as Prisma.InputJsonValue;
  };

  const now = new Date();
  await db.$transaction([
    ...[...unreadByUser.values()].map((notification) =>
      db.notification.update({
        where: { id: notification.id },
        data: {
          payload: payloadFor(
            isPollVotePayload(notification.payload) ? notification.payload.voters : []
          ),
          createdAt: now,
        },
      })
    ),
    db.notification.createMany({
      data: members
        .filter((member) => !unreadByUser.has(member.userId))
        .map((member) => ({
          userId: member.userId,
          type: "POLL_VOTE" as const,
          payload: payloadFor([]),
          clubId,
          pollId: poll.id,
        })),
    }),
  ]);
}
