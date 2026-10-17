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
  pageCount?: number;
  averageRating?: number;
  ratingsCount?: number;
};

/** Rough audiobook length from print pages (~30–35 pages/hour is a common rule of thumb). */
export function estimateAudiobookHours(pageCount: number | null | undefined): number | null {
  if (!pageCount || pageCount <= 0) return null;
  const hours = pageCount / 32;
  return Math.round(hours * 10) / 10;
}

export function formatAudiobookHours(pageCount: number | null | undefined): string | null {
  const hours = estimateAudiobookHours(pageCount);
  if (hours == null) return null;
  if (hours < 1) return `~${Math.round(hours * 60)} min listen`;
  const whole = Math.floor(hours);
  const mins = Math.round((hours - whole) * 60);
  if (mins === 0) return `~${whole} hr listen`;
  return `~${whole} hr ${mins} min listen`;
}

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

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
    const res = await fetch(url.toString(), {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as {
      items?: Array<{
        id: string;
        volumeInfo?: {
          title?: string;
          authors?: string[];
          description?: string;
          publishedDate?: string;
          pageCount?: number;
          averageRating?: number;
          ratingsCount?: number;
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
        description: info.description ? stripHtml(info.description) : undefined,
        coverUrl: info.imageLinks?.thumbnail?.replace("http:", "https:"),
        isbn,
        publishedYear: Number.isFinite(year) ? year : undefined,
        pageCount: info.pageCount && info.pageCount > 0 ? info.pageCount : undefined,
        averageRating: info.averageRating,
        ratingsCount: info.ratingsCount,
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
  url.searchParams.set(
    "fields",
    "key,title,author_name,first_publish_year,isbn,cover_i,number_of_pages_median,ratings_average,ratings_count"
  );

  try {
    const res = await fetch(url.toString(), {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as {
      docs?: Array<{
        key?: string;
        title?: string;
        author_name?: string[];
        first_publish_year?: number;
        isbn?: string[];
        cover_i?: number;
        number_of_pages_median?: number;
        ratings_average?: number;
        ratings_count?: number;
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
        pageCount:
          doc.number_of_pages_median && doc.number_of_pages_median > 0
            ? doc.number_of_pages_median
            : undefined,
        averageRating: doc.ratings_average,
        ratingsCount: doc.ratings_count,
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
      pageCount: result.pageCount,
      averageRating: result.averageRating,
      ratingsCount: result.ratingsCount,
    },
    update: {
      title: result.title,
      authors: result.authors,
      description: result.description,
      coverUrl: result.coverUrl,
      isbn: result.isbn,
      publishedYear: result.publishedYear,
      pageCount: result.pageCount,
      averageRating: result.averageRating,
      ratingsCount: result.ratingsCount,
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

/**
 * Fill in ratings / page count for books saved before those fields existed.
 * Best-effort; never throws.
 */
export async function enrichBooksMissingMetadata(
  books: Array<{
    id: string;
    externalSource: BookExternalSource;
    externalId: string;
    pageCount: number | null;
    averageRating: number | null;
    description: string | null;
  }>
) {
  const needing = books.filter(
    (b) => b.pageCount == null || b.averageRating == null || !b.description
  );
  if (needing.length === 0) return;

  await Promise.all(
    needing.map(async (book) => {
      try {
        if (book.externalSource === "GOOGLE") {
          const key = getGoogleBooksKey();
          const url = new URL(`https://www.googleapis.com/books/v1/volumes/${book.externalId}`);
          if (key) url.searchParams.set("key", key);
          const res = await fetch(url.toString(), {
            next: { revalidate: 86400 },
            signal: AbortSignal.timeout(4000),
          });
          if (!res.ok) return;
          const data = (await res.json()) as {
            volumeInfo?: {
              description?: string;
              pageCount?: number;
              averageRating?: number;
              ratingsCount?: number;
            };
          };
          const info = data.volumeInfo ?? {};
          await db.book.update({
            where: { id: book.id },
            data: {
              description:
                book.description ??
                (info.description ? stripHtml(info.description) : undefined),
              pageCount:
                book.pageCount ??
                (info.pageCount && info.pageCount > 0 ? info.pageCount : undefined),
              averageRating: book.averageRating ?? info.averageRating,
              ratingsCount: info.ratingsCount,
            },
          });
        }
      } catch {
        // ignore enrichment failures
      }
    })
  );
}
