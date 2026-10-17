"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { votePoll } from "@/actions/polls";
import { formatAudiobookHours } from "@/lib/books";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type PollOption = {
  id: string;
  label: string | null;
  book: {
    id: string;
    title: string;
    authors: string[];
    description: string | null;
    coverUrl: string | null;
    pageCount: number | null;
    averageRating: number | null;
    ratingsCount: number | null;
  } | null;
  voteCount: number;
};

function BookDescription({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const long = text.length > 160;

  return (
    <div className="mt-2">
      <p
        className={cn(
          "text-sm leading-relaxed text-foreground/80",
          !expanded && long && "line-clamp-3 sm:line-clamp-4"
        )}
      >
        {text}
      </p>
      {long && (
        <button
          type="button"
          className="mt-1 text-xs font-medium text-primary touch-manipulation"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded((v) => !v);
          }}
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}

export function PollVoteForm({
  clubSlug,
  pollId,
  options,
  userVoteOptionId,
  isOpen,
}: {
  clubSlug: string;
  pollId: string;
  options: PollOption[];
  userVoteOptionId?: string;
  isOpen: boolean;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState(userVoteOptionId ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleVote() {
    if (!selected) return;
    setLoading(true);
    setError(null);
    const formData = new FormData();
    formData.set("pollId", pollId);
    formData.set("optionId", selected);
    const result = await votePoll(clubSlug, formData);
    if (!result.success) {
      setError(result.error);
      setLoading(false);
      return;
    }
    router.refresh();
    setLoading(false);
  }

  const totalVotes = options.reduce((sum, o) => sum + o.voteCount, 0);
  const showResults = !isOpen || !!userVoteOptionId;

  return (
    <div className="space-y-3 sm:space-y-4">
      {options.map((option) => {
        const pct = totalVotes > 0 ? Math.round((option.voteCount / totalVotes) * 100) : 0;
        const listenHint = formatAudiobookHours(option.book?.pageCount);
        const meta: string[] = [];
        if (option.book?.pageCount) meta.push(`${option.book.pageCount} pages`);
        if (listenHint) meta.push(listenHint);

        return (
          <Card
            key={option.id}
            className={cn(
              "cursor-pointer touch-manipulation transition-colors",
              isOpen && !userVoteOptionId && selected === option.id && "ring-2 ring-primary",
              userVoteOptionId === option.id && "ring-2 ring-primary"
            )}
            onClick={() => isOpen && !userVoteOptionId && setSelected(option.id)}
          >
            <CardContent className="p-3 sm:p-6 sm:py-4">
              <div className="flex gap-3 sm:gap-4">
                {option.book?.coverUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={option.book.coverUrl}
                    alt=""
                    className="h-28 w-[4.5rem] shrink-0 rounded object-cover sm:h-36 sm:w-24"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold leading-snug text-base sm:text-[1.05rem]">
                    {option.book?.title ?? option.label}
                  </p>
                  {option.book && (
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {option.book.authors.join(", ")}
                    </p>
                  )}

                  {option.book && (option.book.averageRating != null || meta.length > 0) && (
                    <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted-foreground">
                      {option.book.averageRating != null && (
                        <span className="inline-flex items-center gap-1 font-medium text-foreground/80">
                          <Star className="h-3.5 w-3.5 fill-gold text-gold" aria-hidden />
                          {option.book.averageRating.toFixed(1)}
                          {option.book.ratingsCount != null && option.book.ratingsCount > 0 && (
                            <span className="font-normal text-muted-foreground">
                              ({option.book.ratingsCount.toLocaleString()})
                            </span>
                          )}
                        </span>
                      )}
                      {meta.map((item) => (
                        <span key={item}>{item}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {option.book?.description ? (
                <BookDescription text={option.book.description} />
              ) : option.book ? (
                <p className="mt-2 text-sm italic text-muted-foreground">
                  No description available for this edition.
                </p>
              ) : null}

              {showResults && (
                <div className="mt-3">
                  <div className="h-2 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {option.voteCount} vote{option.voteCount !== 1 ? "s" : ""} ({pct}%)
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {isOpen && !userVoteOptionId && (
        <div className="sticky bottom-0 z-10 -mx-4 border-t border-border/70 bg-[var(--header-bg)] px-4 py-3 pr-16 backdrop-blur-md transition-colors duration-300 sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:pr-0 sm:py-0 sm:backdrop-blur-none">
          {error && <p className="mb-2 text-sm text-destructive">{error}</p>}
          <Button
            className="w-full sm:w-auto"
            onClick={handleVote}
            disabled={!selected || loading}
          >
            {loading ? "Submitting…" : "Submit vote"}
          </Button>
        </div>
      )}
    </div>
  );
}
