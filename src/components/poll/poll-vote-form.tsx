"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { votePoll, votePollRanking } from "@/actions/polls";
import { formatAudiobookHours } from "@/lib/books";
import { GenreChips, GenreLegend } from "@/components/poll/genre-legend";
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
    genres: string[];
  } | null;
  voteCount: number;
  starTotal: number;
  topPicks: number;
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

function StarRank({
  max,
  maxSelectable = max,
  value,
  disabled,
  onChange,
}: {
  max: number;
  maxSelectable?: number;
  value: number;
  disabled: boolean;
  onChange: (stars: number) => void;
}) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  return (
    <div className="flex flex-wrap gap-1" role="group" aria-label="Interest">
      {Array.from({ length: max }, (_, index) => {
        const star = index + 1;
        const filled = star <= shown;
        const unaffordable = star > maxSelectable;
        return (
          <button
            key={star}
            type="button"
            disabled={disabled || unaffordable}
            aria-label={`${star} star${star === 1 ? "" : "s"}`}
            aria-pressed={value === star}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            onFocus={() => setHover(star)}
            onBlur={() => setHover(0)}
            onClick={(event) => {
              event.stopPropagation();
              onChange(value === star ? 0 : star);
            }}
            className="rounded-full p-0.5 touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default"
          >
            <Star
              className={cn(
                "h-6 w-6",
                filled ? "fill-gold text-gold" : "fill-transparent text-muted-foreground/35"
              )}
              strokeWidth={1.75}
            />
          </button>
        );
      })}
    </div>
  );
}

export function PollVoteForm({
  clubSlug,
  pollId,
  options,
  userVoteOptionId,
  userRatings = [],
  votingMode = "SINGLE",
  maxStars = 3,
  maxRankedBooks = null,
  rankLimit = "BOOKS",
  starBudget = 0,
  scoreMethod = "POINTS",
  isOpen,
}: {
  clubSlug: string;
  pollId: string;
  options: PollOption[];
  userVoteOptionId?: string;
  userRatings?: { optionId: string; stars: number }[];
  votingMode?: "SINGLE" | "RANKING";
  maxStars?: number;
  maxRankedBooks?: number | null;
  rankLimit?: "BOOKS" | "BUDGET";
  starBudget?: number;
  scoreMethod?: "POINTS" | "TOP_STARS";
  isOpen: boolean;
}) {
  const router = useRouter();
  const ranking = votingMode === "RANKING";
  const [selected, setSelected] = useState(userVoteOptionId ?? "");
  const [ratings, setRatings] = useState<Record<string, number>>(() =>
    Object.fromEntries(userRatings.filter((rating) => rating.stars > 0).map((rating) => [rating.optionId, rating.stars]))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rankedCount = Object.keys(ratings).length;
  const starsSpent = Object.values(ratings).reduce((sum, stars) => sum + stars, 0);
  const starsLeft = Math.max(0, starBudget - starsSpent);
  const budgetMode = rankLimit === "BUDGET";
  const bookCap = !budgetMode && maxRankedBooks != null && maxRankedBooks > 0 ? maxRankedBooks : null;

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

  function setStars(optionId: string, stars: number) {
    if (stars <= 0) {
      setError(null);
      setRatings((current) => {
        const next = { ...current };
        delete next[optionId];
        return next;
      });
      return;
    }
    if (budgetMode) {
      const spentElsewhere = starsSpent - (ratings[optionId] ?? 0);
      const remaining = starBudget - spentElsewhere;
      if (stars > remaining) {
        setError(
          remaining <= 0
            ? "You have no stars left. Lower another book to free some up."
            : `You have ${remaining} star${remaining === 1 ? "" : "s"} left.`
        );
        return;
      }
    } else if (bookCap != null && !(optionId in ratings) && rankedCount >= bookCap) {
      setError(
        `You can rank up to ${bookCap} book${bookCap === 1 ? "" : "s"}. Clear one to star another.`
      );
      return;
    }
    setError(null);
    setRatings((current) => ({ ...current, [optionId]: stars }));
  }

  async function handleRanking() {
    const payload = Object.entries(ratings).map(([optionId, stars]) => ({ optionId, stars }));
    if (payload.length === 0) {
      setError("Star at least one book");
      return;
    }
    setLoading(true);
    setError(null);
    const formData = new FormData();
    formData.set("pollId", pollId);
    formData.set("ratings", JSON.stringify(payload));
    const result = await votePollRanking(clubSlug, formData);
    if (!result.success) {
      setError(result.error);
      setLoading(false);
      return;
    }
    router.refresh();
    setLoading(false);
  }

  const totalVotes = ranking
    ? options.reduce(
        (sum, option) => sum + (scoreMethod === "TOP_STARS" ? option.topPicks : option.starTotal),
        0
      )
    : options.reduce((sum, option) => sum + option.voteCount, 0);
  const showResults = !isOpen || (ranking ? userRatings.length > 0 : !!userVoteOptionId);
  const legendGenres = [
    ...new Set(options.flatMap((o) => o.book?.genres ?? [])),
  ].sort((a, b) => a.localeCompare(b));

  return (
    <div className="space-y-3 sm:space-y-4">
      <GenreLegend genres={legendGenres} />
      {ranking && (
        <p className="text-sm text-muted-foreground">
          {budgetMode
            ? `You have ${starBudget} stars to spend. ${maxStars} stars on one book is ${maxStars} points and leaves the rest for other books.`
            : bookCap != null
              ? `Star up to ${bookCap} ${bookCap === 1 ? "book" : "books"}. ${maxStars} ${maxStars === 1 ? "star" : "stars"} means most interested.`
              : `Rate every book however you want, including ${maxStars} ${maxStars === 1 ? "star" : "stars"} on all of them. ${maxStars} ${maxStars === 1 ? "star" : "stars"} means most interested.`}
          {scoreMethod === "TOP_STARS"
            ? " Your highest stars are your strongest vote, and the book with the most of those wins."
            : " The book with the most points wins."}
        </p>
      )}
      {options.map((option) => {
        const score = ranking
          ? scoreMethod === "TOP_STARS"
            ? option.topPicks
            : option.starTotal
          : option.voteCount;
        const spentElsewhere = starsSpent - (ratings[option.id] ?? 0);
        const maxSelectable = budgetMode
          ? Math.min(maxStars, Math.max(0, starBudget - spentElsewhere))
          : maxStars;
        const pct = totalVotes > 0 ? Math.round((score / totalVotes) * 100) : 0;
        const listenHint = formatAudiobookHours(option.book?.pageCount);
        const meta: string[] = [];
        if (option.book?.pageCount) meta.push(`${option.book.pageCount} pages`);
        if (listenHint) meta.push(listenHint);

        return (
          <Card
            key={option.id}
            className={cn(
              "touch-manipulation transition-colors",
              !ranking && "cursor-pointer",
              !ranking && isOpen && !userVoteOptionId && selected === option.id && "ring-2 ring-primary",
              !ranking && userVoteOptionId === option.id && "ring-2 ring-primary",
              ranking && (ratings[option.id] ?? 0) > 0 && "ring-2 ring-primary"
            )}
            onClick={() => !ranking && isOpen && !userVoteOptionId && setSelected(option.id)}
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

                  {option.book && option.book.genres.length > 0 && (
                    <GenreChips genres={option.book.genres} className="mt-2" />
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

              {ranking && (
                <div className="mt-3">
                  <StarRank
                    max={maxStars}
                    maxSelectable={maxSelectable}
                    value={ratings[option.id] ?? 0}
                    disabled={!isOpen}
                    onChange={(stars) => isOpen && setStars(option.id, stars)}
                  />
                </div>
              )}

              {showResults && (
                <div className="mt-3">
                  <div className="h-2 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {ranking
                      ? scoreMethod === "TOP_STARS"
                        ? `${option.topPicks} top pick${option.topPicks === 1 ? "" : "s"} · ${option.starTotal} point${option.starTotal === 1 ? "" : "s"}`
                        : `${option.starTotal} point${option.starTotal === 1 ? "" : "s"} from ${option.voteCount} rating${option.voteCount === 1 ? "" : "s"} (${pct}%)`
                      : `${option.voteCount} vote${option.voteCount === 1 ? "" : "s"} (${pct}%)`}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {isOpen && (ranking || !userVoteOptionId) && (
        <div className="sticky bottom-0 z-10 -mx-4 border-t border-border/70 bg-[var(--header-bg)] px-4 py-3 backdrop-blur-md transition-colors duration-300 sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none">
          {error && <p className="mb-2 text-sm text-destructive">{error}</p>}
          {ranking && (budgetMode || bookCap != null) && (
            <p className="mb-2 text-xs text-muted-foreground">
              {budgetMode
                ? `${starsSpent} of ${starBudget} stars used · ${starsLeft} left`
                : `${rankedCount} of ${bookCap} books ranked`}
            </p>
          )}
          <Button
            className="w-full sm:w-auto"
            onClick={ranking ? handleRanking : handleVote}
            disabled={loading || (ranking ? rankedCount === 0 : !selected)}
          >
            {loading
              ? "Submitting…"
              : ranking
                ? userRatings.length > 0
                  ? "Update ranking"
                  : "Submit ranking"
                : "Submit vote"}
          </Button>
        </div>
      )}
    </div>
  );
}
