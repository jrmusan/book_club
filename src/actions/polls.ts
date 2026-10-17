"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { addBookToClub, searchBooks, upsertBook, type BookSearchResult } from "@/lib/books";
import { requireClubMemberBySlug, requireClubOwnerBySlug, requireUser } from "@/lib/club-access";
import { createNotificationsForClubMembers } from "@/lib/notifications";
import { getPollWinner } from "@/lib/polls";
import {
  bookRankingSchema,
  bookRatingSchema,
  confirmMeetingSchema,
  createBookPollSchema,
  createMeetingPollSchema,
  rankPollSchema,
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
    ({ club } = await requireClubMemberBySlug(clubSlug, user.id));
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Forbidden" };
  }

  const bookIdsRaw = formData.get("bookIds");
  const bookIds = typeof bookIdsRaw === "string" ? JSON.parse(bookIdsRaw) : [];
  const closesAtRaw = formData.get("closesAt");
  const closesAtIso =
    typeof closesAtRaw === "string" && closesAtRaw
      ? new Date(closesAtRaw).toISOString()
      : "";

  const votingMode = formData.get("votingMode") === "RANKING" ? "RANKING" : "SINGLE";
  const rankLimit = formData.get("rankLimit") === "BUDGET" ? "BUDGET" : "BOOKS";
  const scoreMethod = formData.get("scoreMethod") === "TOP_STARS" ? "TOP_STARS" : "POINTS";
  const maxStarsRaw = Number(formData.get("maxStars"));
  const maxRankedField = formData.get("maxRankedBooks");
  const maxRankedRaw =
    typeof maxRankedField === "string" && maxRankedField !== "" ? Number(maxRankedField) : Number.NaN;
  const starBudgetRaw = Number(formData.get("starBudget"));

  const parsed = createBookPollSchema.safeParse({
    title: formData.get("title"),
    bookIds,
    closesAt: closesAtIso,
    votingMode,
    rankLimit: votingMode === "RANKING" ? rankLimit : undefined,
    scoreMethod: votingMode === "RANKING" ? scoreMethod : undefined,
    maxStars: votingMode === "RANKING" && Number.isFinite(maxStarsRaw) ? maxStarsRaw : undefined,
    maxRankedBooks:
      votingMode === "RANKING" && rankLimit === "BOOKS" && Number.isFinite(maxRankedRaw)
        ? maxRankedRaw
        : undefined,
    starBudget:
      votingMode === "RANKING" && rankLimit === "BUDGET" && Number.isFinite(starBudgetRaw)
        ? starBudgetRaw
        : undefined,
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const poll = await db.poll.create({
    data: {
      clubId: club.id,
      type: "BOOK_SELECTION",
      title: parsed.data.title,
      status: "OPEN",
      votingMode: parsed.data.votingMode,
      maxStars: parsed.data.votingMode === "RANKING" ? parsed.data.maxStars : null,
      maxRankedBooks:
        parsed.data.votingMode === "RANKING" && parsed.data.rankLimit !== "BUDGET"
          ? parsed.data.maxRankedBooks
          : null,
      rankLimit: parsed.data.votingMode === "RANKING" ? parsed.data.rankLimit ?? "BOOKS" : null,
      starBudget:
        parsed.data.votingMode === "RANKING" && parsed.data.rankLimit === "BUDGET"
          ? parsed.data.starBudget
          : null,
      scoreMethod: parsed.data.votingMode === "RANKING" ? parsed.data.scoreMethod ?? "POINTS" : null,
      publishedAt: new Date(),
      closesAt: new Date(parsed.data.closesAt),
      createdById: user.id,
      options: {
        create: parsed.data.bookIds.map((bookId, index) => ({
          bookId,
          sortOrder: index,
        })),
      },
    },
  });

  await Promise.all(parsed.data.bookIds.map((bookId) => addBookToClub(club.id, bookId)));

  await createNotificationsForClubMembers(
    club.id,
    user.id,
    "POLL_OPENED",
    { message: `New poll: ${poll.title}`, clubSlug, pollTitle: poll.title },
    poll.id
  );

  revalidatePath(`/clubs/${clubSlug}`);
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
    ({ club } = await requireClubMemberBySlug(clubSlug, user.id));
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Forbidden" };
  }

  const optionsRaw = formData.get("options");
  const options = typeof optionsRaw === "string" ? JSON.parse(optionsRaw) : [];
  const closesAtRaw = formData.get("closesAt");
  const closesAtIso =
    typeof closesAtRaw === "string" && closesAtRaw
      ? new Date(closesAtRaw).toISOString()
      : "";

  const parsed = createMeetingPollSchema.safeParse({
    title: formData.get("title"),
    options,
    closesAt: closesAtIso,
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const poll = await db.poll.create({
    data: {
      clubId: club.id,
      type: "MEETING",
      title: parsed.data.title,
      status: "OPEN",
      publishedAt: new Date(),
      closesAt: new Date(parsed.data.closesAt),
      createdById: user.id,
      options: {
        create: parsed.data.options.map((label, index) => ({
          label,
          sortOrder: index,
        })),
      },
    },
  });

  await createNotificationsForClubMembers(
    club.id,
    user.id,
    "POLL_OPENED",
    { message: `New poll: ${poll.title}`, clubSlug, pollTitle: poll.title },
    poll.id
  );

  revalidatePath(`/clubs/${clubSlug}`);
  revalidatePath(`/clubs/${clubSlug}/meetings`);
  revalidatePath(`/clubs/${clubSlug}/polls`);
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

async function finalizeClosedPoll(clubId: string, pollId: string, pollType: "BOOK_SELECTION" | "MEETING") {
  await db.poll.update({
    where: { id: pollId },
    data: { status: "CLOSED" },
  });

  if (pollType === "BOOK_SELECTION") {
    const winner = await getPollWinner(pollId);
    if (winner?.bookId) {
      await addBookToClub(clubId, winner.bookId);
    }
  }
}

/** Close a poll when its deadline has passed — any member viewing can trigger this. */
export async function closeExpiredPoll(
  clubSlug: string,
  pollId: string
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

  const poll = await db.poll.findFirst({
    where: { id: pollId, clubId: club.id, status: "OPEN" },
  });
  if (!poll) return { success: true };
  if (!poll.closesAt || poll.closesAt.getTime() > Date.now()) {
    return { success: true };
  }

  await finalizeClosedPoll(club.id, pollId, poll.type);
  revalidatePath(`/clubs/${clubSlug}`);
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
  let membership;
  try {
    ({ club, membership } = await requireClubMemberBySlug(clubSlug, user.id));
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Forbidden" };
  }

  const poll = await db.poll.findFirst({
    where: { id: pollId, clubId: club.id },
  });
  if (!poll) return { success: false, error: "Poll not found" };
  if (poll.status !== "OPEN") return { success: false, error: "Poll is not open" };

  const canClose = membership.role === "OWNER" || poll.createdById === user.id;
  if (!canClose) {
    return { success: false, error: "Only the poll creator or club owner can close this poll" };
  }

  await finalizeClosedPoll(club.id, pollId, poll.type);

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

  if (poll.closesAt && poll.closesAt.getTime() <= Date.now()) {
    await finalizeClosedPoll(club.id, poll.id, poll.type);
    revalidatePath(`/clubs/${clubSlug}`);
    revalidatePath(`/clubs/${clubSlug}/polls/${poll.id}`);
    return { success: false, error: "This poll has closed" };
  }

  const option = await db.pollOption.findFirst({
    where: { id: parsed.data.optionId, pollId: poll.id },
  });
  if (!option) return { success: false, error: "Invalid option" };
  if (poll.votingMode === "RANKING") {
    return { success: false, error: "This poll uses star ranking" };
  }

  const existing = await db.pollVote.findFirst({
    where: { pollId: poll.id, userId: user.id },
    select: { id: true },
  });
  if (existing) return { success: false, error: "You already voted in this poll" };

  await db.pollVote.create({
    data: {
      pollId: poll.id,
      optionId: option.id,
      userId: user.id,
    },
  });

  revalidatePath(`/clubs/${clubSlug}/polls/${poll.id}`);
  return { success: true };
}

export async function votePollRanking(
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

  let ratings: unknown = [];
  try {
    const raw = formData.get("ratings");
    ratings = typeof raw === "string" ? JSON.parse(raw) : [];
  } catch {
    return { success: false, error: "Invalid ranking" };
  }

  const parsed = rankPollSchema.safeParse({
    pollId: formData.get("pollId"),
    ratings,
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid ranking" };
  }

  const poll = await db.poll.findFirst({
    where: { id: parsed.data.pollId, clubId: club.id, status: "OPEN", votingMode: "RANKING" },
  });
  if (!poll) return { success: false, error: "Poll is not open for ranking" };
  const rankLimit = poll.rankLimit ?? "BOOKS";
  if (!poll.maxStars) {
    return { success: false, error: "This ranking poll is missing its settings" };
  }
  if (rankLimit === "BUDGET" && !poll.starBudget) {
    return { success: false, error: "This ranking poll is missing its star budget" };
  }

  if (poll.closesAt && poll.closesAt.getTime() <= Date.now()) {
    await finalizeClosedPoll(club.id, poll.id, poll.type);
    revalidatePath(`/clubs/${clubSlug}`);
    revalidatePath(`/clubs/${clubSlug}/polls/${poll.id}`);
    return { success: false, error: "This poll has closed" };
  }

  const uniqueIds = new Set(parsed.data.ratings.map((rating) => rating.optionId));
  if (uniqueIds.size !== parsed.data.ratings.length) {
    return { success: false, error: "Each book can only be ranked once" };
  }
  if (
    rankLimit === "BOOKS" &&
    poll.maxRankedBooks != null &&
    parsed.data.ratings.length > poll.maxRankedBooks
  ) {
    return {
      success: false,
      error: `You can rank up to ${poll.maxRankedBooks} book${poll.maxRankedBooks === 1 ? "" : "s"}`,
    };
  }
  const starsSpent = parsed.data.ratings.reduce((sum, rating) => sum + rating.stars, 0);
  if (rankLimit === "BUDGET" && starsSpent > poll.starBudget!) {
    return {
      success: false,
      error: `You can spend up to ${poll.starBudget} star${poll.starBudget === 1 ? "" : "s"}`,
    };
  }
  if (parsed.data.ratings.some((rating) => rating.stars > poll.maxStars!)) {
    return { success: false, error: `Ratings only go up to ${poll.maxStars} stars` };
  }

  const options = await db.pollOption.findMany({
    where: { pollId: poll.id, id: { in: [...uniqueIds] } },
    select: { id: true },
  });
  if (options.length !== uniqueIds.size) {
    return { success: false, error: "One of those books is not in this poll" };
  }

  await db.$transaction([
    db.pollVote.deleteMany({ where: { pollId: poll.id, userId: user.id } }),
    db.pollVote.createMany({
      data: parsed.data.ratings.map((rating) => ({
        pollId: poll.id,
        optionId: rating.optionId,
        userId: user.id,
        stars: rating.stars,
      })),
    }),
  ]);

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

