import { db } from "@/lib/db";

export const bookNoteSelect = {
  id: true,
  bookId: true,
  body: true,
  userId: true,
  updatedAt: true,
  user: { select: { id: true, username: true, name: true } },
} as const;

export type BookNoteRow = {
  id: string;
  bookId: string;
  body: string;
  userId: string;
  updatedAt: Date;
  user: { id: string; username: string; name: string | null };
};

export type SharedBookNote = {
  id: string;
  body: string;
  displayName: string;
  username: string;
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
      displayName: note.user.name ?? note.user.username,
      username: note.user.username,
      updatedAtLabel: formatNoteDate(note.updatedAt),
    }));

  return {
    initialBody: mine?.body ?? "",
    others,
  };
}
