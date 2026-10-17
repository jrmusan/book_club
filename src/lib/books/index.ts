import type { BookExternalSource } from "@prisma/client";
import { db } from "@/lib/db";
import { normalizeGenres } from "@/lib/books/genres";

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
  genres?: string[];
};

type BookDetails = Partial<
  Pick<
    BookSearchResult,
    | "description"
    | "pageCount"
    | "averageRating"
    | "ratingsCount"
    | "coverUrl"
    | "publishedYear"
    | "genres"
  >
>;

export { formatAudiobookHours, estimateAudiobookHours } from "@/lib/books/length";
export { normalizeGenres, genreStyle, GENRE_COLORS } from "@/lib/books/genres";

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function normalizeDescription(raw: unknown): string | undefined {
  if (!raw) return undefined;
  if (typeof raw === "string") {
    const text = stripHtml(raw);
    return text || undefined;
  }
  if (typeof raw === "object" && raw !== null && "value" in raw) {
    const value = (raw as { value?: unknown }).value;
    if (typeof value === "string") {
      const text = stripHtml(value);
      return text || undefined;
    }
  }
  return undefined;
}

function needsDetails(book: {
  description?: string | null;
  pageCount?: number | null;
  averageRating?: number | null;
  genres?: string[] | null;
}) {
  return (
    !book.description ||
    book.pageCount == null ||
    book.averageRating == null ||
    !book.genres?.length
  );
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
  url.searchParams.set(
    "fields",
    "items(id,volumeInfo/title,volumeInfo/authors,volumeInfo/description,volumeInfo/publishedDate,volumeInfo/pageCount,volumeInfo/averageRating,volumeInfo/ratingsCount,volumeInfo/categories,volumeInfo/industryIdentifiers,volumeInfo/imageLinks)"
  );
  if (key) url.searchParams.set("key", key);

  try {
    const res = await fetch(url.toString(), {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
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
          categories?: string[];
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
        description: normalizeDescription(info.description),
        coverUrl: info.imageLinks?.thumbnail?.replace("http:", "https:"),
        isbn,
        publishedYear: Number.isFinite(year) ? year : undefined,
        pageCount: info.pageCount && info.pageCount > 0 ? info.pageCount : undefined,
        averageRating: info.averageRating,
        ratingsCount: info.ratingsCount,
        genres: normalizeGenres(info.categories),
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
    "key,title,author_name,first_publish_year,isbn,cover_i,number_of_pages_median,ratings_average,ratings_count,subject"
  );

  try {
    const res = await fetch(url.toString(), {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
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
        subject?: string[];
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
        genres: normalizeGenres(doc.subject),
      }));
  } catch {
    return [];
  }
}

async function fetchGoogleVolumeDetails(externalId: string): Promise<BookDetails> {
  const key = getGoogleBooksKey();
  const url = new URL(`https://www.googleapis.com/books/v1/volumes/${externalId}`);
  if (key) url.searchParams.set("key", key);

  const res = await fetch(url.toString(), {
    next: { revalidate: 86400 },
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) return {};
  const data = (await res.json()) as {
    volumeInfo?: {
      description?: string;
      pageCount?: number;
      averageRating?: number;
      ratingsCount?: number;
      categories?: string[];
      imageLinks?: { thumbnail?: string };
      publishedDate?: string;
    };
  };
  const info = data.volumeInfo ?? {};
  const year = info.publishedDate ? parseInt(info.publishedDate.slice(0, 4), 10) : undefined;
  return {
    description: normalizeDescription(info.description),
    pageCount: info.pageCount && info.pageCount > 0 ? info.pageCount : undefined,
    averageRating: info.averageRating,
    ratingsCount: info.ratingsCount,
    coverUrl: info.imageLinks?.thumbnail?.replace("http:", "https:"),
    publishedYear: Number.isFinite(year) ? year : undefined,
    genres: normalizeGenres(info.categories),
  };
}

async function fetchOpenLibraryWorkDetails(externalId: string): Promise<BookDetails> {
  const workId = externalId.startsWith("OL") ? externalId : externalId.replace(/^\/works\//, "");
  const res = await fetch(`https://openlibrary.org/works/${workId}.json`, {
    next: { revalidate: 86400 },
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) return {};
  const data = (await res.json()) as {
    description?: unknown;
    covers?: number[];
    first_publish_date?: string;
    subjects?: Array<string | { name?: string }>;
  };
  const year = data.first_publish_date
    ? parseInt(data.first_publish_date.slice(0, 4), 10)
    : undefined;
  const subjectNames = (data.subjects ?? [])
    .map((s) => (typeof s === "string" ? s : s.name))
    .filter((s): s is string => Boolean(s));
  return {
    description: normalizeDescription(data.description),
    coverUrl: data.covers?.[0]
      ? `https://covers.openlibrary.org/b/id/${data.covers[0]}-M.jpg`
      : undefined,
    publishedYear: Number.isFinite(year) ? year : undefined,
    genres: normalizeGenres(subjectNames),
  };
}

async function fetchOpenLibraryByIsbn(isbn: string): Promise<BookDetails> {
  const res = await fetch(`https://openlibrary.org/isbn/${isbn}.json`, {
    next: { revalidate: 86400 },
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) return {};
  const data = (await res.json()) as {
    number_of_pages?: number;
    works?: Array<{ key?: string }>;
  };
  const details: BookDetails = {
    pageCount: data.number_of_pages && data.number_of_pages > 0 ? data.number_of_pages : undefined,
  };
  const workKey = data.works?.[0]?.key;
  if (workKey) {
    const workId = workKey.replace("/works/", "");
    const work = await fetchOpenLibraryWorkDetails(workId);
    return { ...details, ...work, pageCount: details.pageCount ?? work.pageCount };
  }
  return details;
}

function mergeGenres(a?: string[], b?: string[]) {
  return normalizeGenres([...(a ?? []), ...(b ?? [])]);
}

/** Fill description / pages / rating / genres from the best available source. */
export async function fillBookDetails(result: BookSearchResult): Promise<BookSearchResult> {
  let next: BookSearchResult = { ...result };

  try {
    if (needsDetails(next) && next.externalSource === "GOOGLE") {
      const details = await fetchGoogleVolumeDetails(next.externalId);
      next = {
        ...next,
        description: next.description ?? details.description,
        pageCount: next.pageCount ?? details.pageCount,
        averageRating: next.averageRating ?? details.averageRating,
        ratingsCount: next.ratingsCount ?? details.ratingsCount,
        coverUrl: next.coverUrl ?? details.coverUrl,
        publishedYear: next.publishedYear ?? details.publishedYear,
        genres: next.genres?.length ? next.genres : details.genres,
      };
    }

    if (needsDetails(next) && next.externalSource === "OPEN_LIBRARY") {
      const details = await fetchOpenLibraryWorkDetails(next.externalId);
      next = {
        ...next,
        description: next.description ?? details.description,
        pageCount: next.pageCount ?? details.pageCount,
        averageRating: next.averageRating ?? details.averageRating,
        ratingsCount: next.ratingsCount ?? details.ratingsCount,
        coverUrl: next.coverUrl ?? details.coverUrl,
        publishedYear: next.publishedYear ?? details.publishedYear,
        genres: next.genres?.length ? next.genres : details.genres,
      };
    }

    if ((!next.description || !next.genres?.length) && next.isbn) {
      const details = await fetchOpenLibraryByIsbn(next.isbn);
      next = {
        ...next,
        description: next.description ?? details.description,
        pageCount: next.pageCount ?? details.pageCount,
        coverUrl: next.coverUrl ?? details.coverUrl,
        publishedYear: next.publishedYear ?? details.publishedYear,
        genres: next.genres?.length ? next.genres : details.genres,
      };
    }

    if (next.genres?.length) {
      next.genres = mergeGenres(next.genres);
    }
  } catch {
    // best-effort
  }

  return next;
}

export async function upsertBook(result: BookSearchResult) {
  const enriched = await fillBookDetails(result);

  return db.book.upsert({
    where: {
      externalSource_externalId: {
        externalSource: enriched.externalSource,
        externalId: enriched.externalId,
      },
    },
    create: {
      externalSource: enriched.externalSource,
      externalId: enriched.externalId,
      title: enriched.title,
      authors: enriched.authors,
      description: enriched.description,
      coverUrl: enriched.coverUrl,
      isbn: enriched.isbn,
      publishedYear: enriched.publishedYear,
      pageCount: enriched.pageCount,
      averageRating: enriched.averageRating,
      ratingsCount: enriched.ratingsCount,
      genres: enriched.genres ?? [],
    },
    update: {
      title: enriched.title,
      authors: enriched.authors,
      ...(enriched.description ? { description: enriched.description } : {}),
      ...(enriched.coverUrl ? { coverUrl: enriched.coverUrl } : {}),
      ...(enriched.isbn ? { isbn: enriched.isbn } : {}),
      ...(enriched.publishedYear != null ? { publishedYear: enriched.publishedYear } : {}),
      ...(enriched.pageCount != null ? { pageCount: enriched.pageCount } : {}),
      ...(enriched.averageRating != null ? { averageRating: enriched.averageRating } : {}),
      ...(enriched.ratingsCount != null ? { ratingsCount: enriched.ratingsCount } : {}),
      ...(enriched.genres?.length ? { genres: enriched.genres } : {}),
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
 * Fill in ratings / page count / description / genres for books missing them.
 * Best-effort; never throws.
 */
export async function enrichBooksMissingMetadata(
  books: Array<{
    id: string;
    externalSource: BookExternalSource;
    externalId: string;
    isbn?: string | null;
    pageCount: number | null;
    averageRating: number | null;
    description: string | null;
    genres?: string[] | null;
  }>
) {
  const needing = books.filter((b) => needsDetails(b));
  if (needing.length === 0) return;

  await Promise.all(
    needing.map(async (book) => {
      try {
        const filled = await fillBookDetails({
          externalSource: book.externalSource,
          externalId: book.externalId,
          title: "",
          authors: [],
          description: book.description ?? undefined,
          isbn: book.isbn ?? undefined,
          pageCount: book.pageCount ?? undefined,
          averageRating: book.averageRating ?? undefined,
          genres: book.genres?.length ? book.genres : undefined,
        });

        if (
          !filled.description &&
          filled.pageCount == null &&
          filled.averageRating == null &&
          !filled.genres?.length
        ) {
          return;
        }

        await db.book.update({
          where: { id: book.id },
          data: {
            ...(filled.description && !book.description
              ? { description: filled.description }
              : {}),
            ...(filled.pageCount != null && book.pageCount == null
              ? { pageCount: filled.pageCount }
              : {}),
            ...(filled.averageRating != null && book.averageRating == null
              ? { averageRating: filled.averageRating }
              : {}),
            ...(filled.ratingsCount != null ? { ratingsCount: filled.ratingsCount } : {}),
            ...(filled.genres?.length && !book.genres?.length ? { genres: filled.genres } : {}),
          },
        });
      } catch {
        // ignore enrichment failures
      }
    })
  );
}
