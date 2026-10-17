"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/actions/auth";
import { requireClubMemberBySlug, requireUser } from "@/lib/club-access";
import { db } from "@/lib/db";
import { listClosedBookPollWinners } from "@/lib/polls";
import { bookNoteSchema } from "@/lib/validations/auth";

export async function saveBookNote(
  clubSlug: string,
  bookId: string,
  body: string
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

  const parsed = bookNoteSchema.safeParse({ bookId, body });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid notes" };
  }

  const winners = await listClosedBookPollWinners({ id: club.id });
  if (!winners.some((winner) => winner.book.id === parsed.data.bookId)) {
    return { success: false, error: "Notes are only for the book that won a poll" };
  }

  const note = parsed.data.body.trim();
  const where = {
    clubId_userId_bookId: {
      clubId: club.id,
      userId: user.id,
      bookId: parsed.data.bookId,
    },
  };

  if (!note) {
    await db.bookNote.deleteMany({
      where: { clubId: club.id, userId: user.id, bookId: parsed.data.bookId },
    });
  } else {
    await db.bookNote.upsert({
      where,
      create: {
        clubId: club.id,
        userId: user.id,
        bookId: parsed.data.bookId,
        body: note,
      },
      update: { body: note },
    });
  }

  revalidatePath(`/clubs/${clubSlug}`);
  revalidatePath(`/clubs/${clubSlug}/books`);
  return { success: true };
}
