import { db } from "@/lib/db";
import { personName } from "@/lib/utils";

export const bookNoteSelect = {
  id: true,
  bookId: true,
  body: true,
  userId: true,
  updatedAt: true,
  user: { select: { id: true, name: true, email: true } },
} as const;

export type BookNoteRow = {
  id: string;
  bookId: string;
  body: string;
  userId: string;
  updatedAt: Date;
  user: { id: string; name: string | null; email: string };
};

export type SharedBookNote = {
  id: string;
  body: string;
  displayName: string;
  updatedAtLabel: string;
};

export async function listClubBookNotes(slug: string) {
  return db.bookNote.findMany({
    where: { club: { slug } },
    orderBy: { updatedAt: "desc" },
    select: bookNoteSelect,
  });
}

function formatNoteDate(date: Date) {
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function notesForBook(notes: BookNoteRow[], bookId: string, currentUserId: string) {
  const forBook = notes.filter((note) => note.bookId === bookId);
  const mine = forBook.find((note) => note.userId === currentUserId);
  const others: SharedBookNote[] = forBook
    .filter((note) => note.userId !== currentUserId)
    .map((note) => ({
      id: note.id,
      body: note.body,
      displayName: personName(note.user),
      updatedAtLabel: formatNoteDate(note.updatedAt),
    }));

  return {
    initialBody: mine?.body ?? "",
    others,
  };
}
