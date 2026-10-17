"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { votePoll } from "@/actions/polls";
import { formatAudiobookHours } from "@/lib/books";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn, truncate } from "@/lib/utils";

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
    <div className="space-y-4">
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
              "cursor-pointer transition-colors",
              isOpen && !userVoteOptionId && selected === option.id && "ring-2 ring-primary",
              userVoteOptionId === option.id && "ring-2 ring-primary"
            )}
            onClick={() => isOpen && !userVoteOptionId && setSelected(option.id)}
          >
            <CardContent className="flex gap-4 py-4">
              {option.book?.coverUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={option.book.coverUrl}
                  alt=""
                  className="h-32 w-20 shrink-0 rounded object-cover sm:h-36 sm:w-24"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-semibold leading-snug">
                  {option.book?.title ?? option.label}
                </p>
                {option.book && (
                  <p className="text-sm text-muted-foreground">
                    {option.book.authors.join(", ")}
                  </p>
                )}

                {option.book && (option.book.averageRating != null || meta.length > 0) && (
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
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

                {option.book?.description && (
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {truncate(option.book.description, 280)}
                  </p>
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
                      {option.voteCount} vote{option.voteCount !== 1 ? "s" : ""} ({pct}%)
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {isOpen && !userVoteOptionId && (
        <div>
          {error && <p className="mb-2 text-sm text-destructive">{error}</p>}
          <Button onClick={handleVote} disabled={!selected || loading}>
            {loading ? "Submitting…" : "Submit vote"}
          </Button>
        </div>
      )}
    </div>
  );
}
