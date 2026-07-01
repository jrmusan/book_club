import type { BookExternalSource } from "@prisma/client";
import { db } from "@/lib/db";

export type BookSearchResult = {
  externalSource: BookExternalSource;
  externalId: string;
  title: string;
  authors: string[];
  description?: string;
  coverUrl?: string;
  isbn?: string;
  publishedYear?: number;
};

function getGoogleBooksKey() {
  return process.env.GOOGLE_BOOKS_API_KEY;
}

export async function searchBooks(query: string): Promise<BookSearchResult[]> {
  const googleResults = await searchGoogleBooks(query);
  if (googleResults.length > 0) return googleResults;
  return searchOpenLibrary(query);
}

async function searchGoogleBooks(query: string): Promise<BookSearchResult[]> {
  const key = getGoogleBooksKey();
  const url = new URL("https://www.googleapis.com/books/v1/volumes");
  url.searchParams.set("q", query);
  url.searchParams.set("maxResults", "10");
  if (key) url.searchParams.set("key", key);

  try {
    const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = (await res.json()) as {
      items?: Array<{
        id: string;
        volumeInfo?: {
          title?: string;
          authors?: string[];
          description?: string;
          publishedDate?: string;
          industryIdentifiers?: Array<{ type: string; identifier: string }>;
          imageLinks?: { thumbnail?: string; smallThumbnail?: string };
        };
      }>;
    };

    return (data.items ?? []).map((item) => {
      const info = item.volumeInfo ?? {};
      const isbn =
        info.industryIdentifiers?.find((i) => i.type === "ISBN_13")?.identifier ??
        info.industryIdentifiers?.find((i) => i.type === "ISBN_10")?.identifier;
      const year = info.publishedDate ? parseInt(info.publishedDate.slice(0, 4), 10) : undefined;

      return {
        externalSource: "GOOGLE" as const,
        externalId: item.id,
        title: info.title ?? "Unknown title",
        authors: info.authors ?? ["Unknown author"],
        description: info.description,
        coverUrl: info.imageLinks?.thumbnail?.replace("http:", "https:"),
        isbn,
        publishedYear: Number.isFinite(year) ? year : undefined,
      };
    });
  } catch {
    return [];
  }
}

async function searchOpenLibrary(query: string): Promise<BookSearchResult[]> {
  const url = new URL("https://openlibrary.org/search.json");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "10");

  try {
    const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = (await res.json()) as {
      docs?: Array<{
        key?: string;
        title?: string;
        author_name?: string[];
        first_publish_year?: number;
        isbn?: string[];
        cover_i?: number;
      }>;
    };

    return (data.docs ?? [])
      .filter((doc) => doc.key)
      .map((doc) => ({
        externalSource: "OPEN_LIBRARY" as const,
        externalId: doc.key!.replace("/works/", ""),
        title: doc.title ?? "Unknown title",
        authors: doc.author_name ?? ["Unknown author"],
        coverUrl: doc.cover_i
          ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
          : undefined,
        isbn: doc.isbn?.[0],
        publishedYear: doc.first_publish_year,
      }));
  } catch {
    return [];
  }
}

export async function upsertBook(result: BookSearchResult) {
  return db.book.upsert({
    where: {
      externalSource_externalId: {
        externalSource: result.externalSource,
        externalId: result.externalId,
      },
    },
    create: {
      externalSource: result.externalSource,
      externalId: result.externalId,
      title: result.title,
      authors: result.authors,
      description: result.description,
      coverUrl: result.coverUrl,
      isbn: result.isbn,
      publishedYear: result.publishedYear,
    },
    update: {
      title: result.title,
      authors: result.authors,
      description: result.description,
      coverUrl: result.coverUrl,
      isbn: result.isbn,
      publishedYear: result.publishedYear,
    },
  });
}

export async function addBookToClub(clubId: string, bookId: string) {
  return db.clubBook.upsert({
    where: { clubId_bookId: { clubId, bookId } },
    create: { clubId, bookId },
    update: {},
  });
}
