"use client";

import { useState, useTransition } from "react";
import { Search, X } from "lucide-react";
import { searchBooksAction, upsertBookFromSearch } from "@/actions/polls";
import { formatAudiobookHours, type BookSearchResult } from "@/lib/books";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { truncate } from "@/lib/utils";

type SelectedBook = BookSearchResult & { id?: string };

export function BookSearchPicker({
  selected,
  onChange,
}: {
  selected: SelectedBook[];
  onChange: (books: SelectedBook[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BookSearchResult[]>([]);
  const [isPending, startTransition] = useTransition();

  function handleSearch() {
    if (!query.trim()) return;
    startTransition(async () => {
      const books = await searchBooksAction(query);
      setResults(books);
    });
  }

  async function addBook(book: BookSearchResult) {
    if (selected.some((b) => b.externalId === book.externalId && b.externalSource === book.externalSource)) {
      return;
    }
    const result = await upsertBookFromSearch(JSON.stringify(book));
    if (!result.success || !result.data) return;
    onChange([...selected, { ...book, id: result.data.bookId }]);
    setResults([]);
    setQuery("");
  }

  function removeBook(index: number) {
    onChange(selected.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title or author…"
          className="min-w-0"
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearch())}
        />
        <Button
          type="button"
          size="icon"
          className="shrink-0"
          onClick={handleSearch}
          disabled={isPending}
          aria-label="Search books"
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {results.length > 0 && (
        <div className="max-h-72 space-y-1 overflow-y-auto overscroll-contain rounded-2xl border border-border p-1.5 sm:max-h-none sm:space-y-2 sm:p-2">
          {results.map((book) => (
            <button
              key={`${book.externalSource}-${book.externalId}`}
              type="button"
              onClick={() => addBook(book)}
              className="flex w-full touch-manipulation gap-3 rounded-xl p-2.5 text-left hover:bg-accent active:bg-accent"
            >
              {book.coverUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={book.coverUrl}
                  alt=""
                  className="h-16 w-12 shrink-0 rounded object-cover"
                />
              )}
              <div className="min-w-0">
                <p className="font-medium leading-snug">{book.title}</p>
                <p className="text-sm text-muted-foreground">{book.authors.join(", ")}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {selected.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Selected books ({selected.length})</p>
          {selected.map((book, index) => (
            <Card key={book.id ?? `${book.externalSource}-${book.externalId}`}>
              <CardContent className="flex items-start gap-3 p-3 sm:py-4">
                {book.coverUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={book.coverUrl}
                    alt=""
                    className="h-16 w-12 shrink-0 rounded object-cover sm:h-20 sm:w-14"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium leading-snug">{book.title}</p>
                  <p className="text-sm text-muted-foreground">{book.authors.join(", ")}</p>
                  {(book.averageRating != null || book.pageCount) && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {[
                        book.averageRating != null
                          ? `★ ${book.averageRating.toFixed(1)}${
                              book.ratingsCount ? ` (${book.ratingsCount})` : ""
                            }`
                          : null,
                        book.pageCount ? `${book.pageCount} pages` : null,
                        formatAudiobookHours(book.pageCount),
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  )}
                  {book.description && (
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground sm:line-clamp-none">
                      {truncate(book.description, 120)}
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  onClick={() => removeBook(index)}
                  aria-label={`Remove ${book.title}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
