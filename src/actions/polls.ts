"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { addBookToClub, searchBooks, upsertBook, type BookSearchResult } from "@/lib/books";
import { requireClubMemberBySlug, requireClubOwnerBySlug, requireUser } from "@/lib/club-access";
import { createNotificationsForClubMembers } from "@/lib/notifications";
import {
  bookRankingSchema,
  bookRatingSchema,
  confirmMeetingSchema,
  createBookPollSchema,
  createMeetingPollSchema,
  votePollSchema,
} from "@/lib/validations/auth";
import type { ActionResult } from "@/actions/auth";

export async function searchBooksAction(query: string) {
  if (!query.trim()) return [];
  return searchBooks(query.trim());
}

export async function createBookPoll(
  clubSlug: string,
  formData: FormData
): Promise<ActionResult<{ pollId: string }>> {
  let user;
  try {
    user = await requireUser();
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  let club;
  try {
    ({ club } = await requireClubOwnerBySlug(clubSlug, user.id));
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Forbidden" };
  }

  const bookIdsRaw = formData.get("bookIds");
  const bookIds = typeof bookIdsRaw === "string" ? JSON.parse(bookIdsRaw) : [];

  const parsed = createBookPollSchema.safeParse({
    title: formData.get("title"),
    bookIds,
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const poll = await db.poll.create({
    data: {
      clubId: club.id,
      type: "BOOK_SELECTION",
      title: parsed.data.title,
      status: "DRAFT",
      createdById: user.id,
      options: {
        create: parsed.data.bookIds.map((bookId, index) => ({
          bookId,
          sortOrder: index,
        })),
      },
    },
  });

  for (const bookId of parsed.data.bookIds) {
    await addBookToClub(club.id, bookId);
  }

  revalidatePath(`/clubs/${clubSlug}/polls`);
  return { success: true, data: { pollId: poll.id } };
}

export async function createMeetingPoll(
  clubSlug: string,
  formData: FormData
): Promise<ActionResult<{ pollId: string }>> {
  let user;
  try {
    user = await requireUser();
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  let club;
  try {
    ({ club } = await requireClubOwnerBySlug(clubSlug, user.id));
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Forbidden" };
  }

  const optionsRaw = formData.get("options");
  const options = typeof optionsRaw === "string" ? JSON.parse(optionsRaw) : [];

  const parsed = createMeetingPollSchema.safeParse({
    title: formData.get("title"),
    options,
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const poll = await db.poll.create({
    data: {
      clubId: club.id,
      type: "MEETING",
      title: parsed.data.title,
      status: "DRAFT",
      createdById: user.id,
      options: {
        create: parsed.data.options.map((label, index) => ({
          label,
          sortOrder: index,
        })),
      },
    },
  });

  revalidatePath(`/clubs/${clubSlug}/meetings`);
  return { success: true, data: { pollId: poll.id } };
}

export async function publishPoll(clubSlug: string, pollId: string): Promise<ActionResult> {
  let user;
  try {
    user = await requireUser();
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  let club;
  try {
    ({ club } = await requireClubOwnerBySlug(clubSlug, user.id));
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Forbidden" };
  }

  const poll = await db.poll.findFirst({
    where: { id: pollId, clubId: club.id },
  });
  if (!poll) return { success: false, error: "Poll not found" };
  if (poll.status !== "DRAFT") return { success: false, error: "Poll is not a draft" };

  await db.poll.update({
    where: { id: pollId },
    data: { status: "OPEN", publishedAt: new Date() },
  });

  await createNotificationsForClubMembers(
    club.id,
    user.id,
    "POLL_OPENED",
    { message: `New poll: ${poll.title}`, clubSlug, pollTitle: poll.title },
    pollId
  );

  revalidatePath(`/clubs/${clubSlug}`);
  revalidatePath(`/clubs/${clubSlug}/polls`);
  revalidatePath(`/clubs/${clubSlug}/polls/${pollId}`);
  return { success: true };
}

export async function closePoll(clubSlug: string, pollId: string): Promise<ActionResult> {
  let user;
  try {
    user = await requireUser();
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  let club;
  try {
    ({ club } = await requireClubOwnerBySlug(clubSlug, user.id));
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Forbidden" };
  }

  const poll = await db.poll.findFirst({
    where: { id: pollId, clubId: club.id },
    include: { options: { include: { book: true } } },
  });
  if (!poll) return { success: false, error: "Poll not found" };

  await db.poll.update({
    where: { id: pollId },
    data: { status: "CLOSED", closesAt: new Date() },
  });

  if (poll.type === "BOOK_SELECTION") {
    const winner = await getPollWinner(pollId);
    if (winner?.bookId) {
      await addBookToClub(club.id, winner.bookId);
    }
  }

  revalidatePath(`/clubs/${clubSlug}`);
  revalidatePath(`/clubs/${clubSlug}/polls/${pollId}`);
  return { success: true };
}

export async function votePoll(
  clubSlug: string,
  formData: FormData
): Promise<ActionResult> {
  let user;
  try {
    user = await requireUser();
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  let club;
  try {
    ({ club } = await requireClubMemberBySlug(clubSlug, user.id));
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Forbidden" };
  }

  const parsed = votePollSchema.safeParse({
    pollId: formData.get("pollId"),
    optionId: formData.get("optionId"),
  });
  if (!parsed.success) {
    return { success: false, error: "Invalid vote" };
  }

  const poll = await db.poll.findFirst({
    where: { id: parsed.data.pollId, clubId: club.id, status: "OPEN" },
  });
  if (!poll) return { success: false, error: "Poll is not open for voting" };

  const option = await db.pollOption.findFirst({
    where: { id: parsed.data.optionId, pollId: poll.id },
  });
  if (!option) return { success: false, error: "Invalid option" };

  await db.pollVote.upsert({
    where: { pollId_userId: { pollId: poll.id, userId: user.id } },
    create: {
      pollId: poll.id,
      optionId: option.id,
      userId: user.id,
    },
    update: { optionId: option.id },
  });

  revalidatePath(`/clubs/${clubSlug}/polls/${poll.id}`);
  return { success: true };
}

export async function confirmMeetingFromPoll(
  clubSlug: string,
  formData: FormData
): Promise<ActionResult<{ meetingId: string }>> {
  let user;
  try {
    user = await requireUser();
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  let club;
  try {
    ({ club } = await requireClubOwnerBySlug(clubSlug, user.id));
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Forbidden" };
  }

  const parsed = confirmMeetingSchema.safeParse({
    pollId: formData.get("pollId"),
    scheduledAt: formData.get("scheduledAt"),
    timezone: formData.get("timezone") || "America/New_York",
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const poll = await db.poll.findFirst({
    where: { id: parsed.data.pollId, clubId: club.id, type: "MEETING", status: "CLOSED" },
    include: { options: true },
  });
  if (!poll) return { success: false, error: "Closed meeting poll not found" };

  const winner = await getPollWinner(poll.id);
  if (!winner) return { success: false, error: "No winning option found" };

  const meeting = await db.meeting.create({
    data: {
      clubId: club.id,
      pollId: poll.id,
      title: poll.title,
      location: winner.label ?? undefined,
      scheduledAt: new Date(parsed.data.scheduledAt),
      timezone: parsed.data.timezone,
      notes: parsed.data.notes,
    },
  });

  await createNotificationsForClubMembers(
    club.id,
    user.id,
    "MEETING_SCHEDULED",
    {
      message: `Meeting scheduled: ${poll.title}`,
      clubSlug,
      meetingTitle: poll.title,
    }
  );

  revalidatePath(`/clubs/${clubSlug}/meetings`);
  return { success: true, data: { meetingId: meeting.id } };
}

export async function rateBook(
  clubSlug: string,
  formData: FormData
): Promise<ActionResult> {
  let user;
  try {
    user = await requireUser();
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  let club;
  try {
    ({ club } = await requireClubMemberBySlug(clubSlug, user.id));
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Forbidden" };
  }

  const parsed = bookRatingSchema.safeParse({
    bookId: formData.get("bookId"),
    rating: Number(formData.get("rating")),
    review: formData.get("review") || undefined,
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid rating" };
  }

  await db.bookRating.upsert({
    where: {
      clubId_userId_bookId: {
        clubId: club.id,
        userId: user.id,
        bookId: parsed.data.bookId,
      },
    },
    create: {
      clubId: club.id,
      userId: user.id,
      bookId: parsed.data.bookId,
      rating: parsed.data.rating,
      review: parsed.data.review,
      finishedAt: new Date(),
    },
    update: {
      rating: parsed.data.rating,
      review: parsed.data.review,
      finishedAt: new Date(),
    },
  });

  revalidatePath(`/clubs/${clubSlug}/books`);
  revalidatePath(`/clubs/${clubSlug}/rankings`);
  return { success: true };
}

export async function saveBookRankings(
  clubSlug: string,
  rankings: { bookId: string; rank: number }[]
): Promise<ActionResult> {
  let user;
  try {
    user = await requireUser();
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  let club;
  try {
    ({ club } = await requireClubMemberBySlug(clubSlug, user.id));
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Forbidden" };
  }

  const parsed = bookRankingSchema.safeParse({ rankings });
  if (!parsed.success) {
    return { success: false, error: "Invalid rankings" };
  }

  await db.$transaction([
    db.bookRanking.deleteMany({
      where: { clubId: club.id, userId: user.id },
    }),
    db.bookRanking.createMany({
      data: parsed.data.rankings.map((r) => ({
        clubId: club.id,
        userId: user.id,
        bookId: r.bookId,
        rank: r.rank,
      })),
    }),
  ]);

  revalidatePath(`/clubs/${clubSlug}/rankings`);
  return { success: true };
}

export async function upsertBookFromSearch(
  bookData: string
): Promise<ActionResult<{ bookId: string; book: BookSearchResult }>> {
  try {
    const result = JSON.parse(bookData) as BookSearchResult;
    const book = await upsertBook(result);
    return { success: true, data: { bookId: book.id, book: result } };
  } catch {
    return { success: false, error: "Failed to save book" };
  }
}

export async function addBookFromSearch(
  clubSlug: string,
  bookData: string
): Promise<ActionResult<{ bookId: string }>> {
  let user;
  try {
    user = await requireUser();
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  let club;
  try {
    ({ club } = await requireClubOwnerBySlug(clubSlug, user.id));
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Forbidden" };
  }

  try {
    const result = JSON.parse(bookData);
    const book = await upsertBook(result);
    await addBookToClub(club.id, book.id);
    revalidatePath(`/clubs/${clubSlug}/books`);
    return { success: true, data: { bookId: book.id } };
  } catch {
    return { success: false, error: "Failed to add book" };
  }
}

async function getPollWinner(pollId: string) {
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

export async function getPollResults(pollId: string) {
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
}
