"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Star } from "lucide-react";
import { BookSearchPicker } from "@/components/book/book-search-picker";
import { PollDeadlineField, defaultPollDeadline } from "@/components/poll/poll-deadline-field";
import { createBookPoll } from "@/actions/polls";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { BookSearchResult } from "@/lib/books";

type VotingMode = "SINGLE" | "RANKING";
type RankLimit = "BOOKS" | "BUDGET";
type ScoreMethod = "POINTS" | "TOP_STARS";

function ChoiceButton({
  pressed,
  title,
  detail,
  onClick,
}: {
  pressed: boolean;
  title: string;
  detail: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "rounded-2xl border px-4 py-3 text-left transition-colors",
        pressed ? "border-primary bg-primary/10" : "border-border bg-card hover:bg-accent/40"
      )}
    >
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
    </button>
  );
}

export function NewBookPollForm({ clubSlug }: { clubSlug: string }) {
  const router = useRouter();
  const [selected, setSelected] = useState<(BookSearchResult & { id?: string })[]>([]);
  const [closesAt, setClosesAt] = useState(() => defaultPollDeadline(72));
  const [votingMode, setVotingMode] = useState<VotingMode>("SINGLE");
  const [maxStars, setMaxStars] = useState(3);
  const [maxRankedBooks, setMaxRankedBooks] = useState(3);
  const [rankLimit, setRankLimit] = useState<RankLimit>("BOOKS");
  const [starBudget, setStarBudget] = useState(6);
  const [scoreMethod, setScoreMethod] = useState<ScoreMethod>("POINTS");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    const bookIds = selected.map((b) => b.id).filter(Boolean) as string[];
    if (bookIds.length < 2) {
      setError("Add at least 2 books");
      return;
    }
    if (!closesAt) {
      setError("Set a voting deadline");
      return;
    }
    if (votingMode === "RANKING") {
      if (maxStars < 2 || maxStars > 10) {
        setError("Star scale must be between 2 and 10");
        return;
      }
      if (rankLimit === "BOOKS" && (maxRankedBooks < 1 || maxRankedBooks > bookIds.length)) {
        setError(`Each person can rank between 1 and ${bookIds.length} books`);
        return;
      }
      const ceiling = maxStars * bookIds.length;
      if (rankLimit === "BUDGET" && (starBudget < 1 || starBudget > ceiling)) {
        setError(`The star budget must be between 1 and ${ceiling}`);
        return;
      }
    }
    setLoading(true);
    setError(null);
    formData.set("bookIds", JSON.stringify(bookIds));
    formData.set("closesAt", closesAt);
    formData.set("votingMode", votingMode);
    formData.set("maxStars", String(maxStars));
    formData.set("maxRankedBooks", String(maxRankedBooks));
    formData.set("rankLimit", rankLimit);
    formData.set("starBudget", String(starBudget));
    formData.set("scoreMethod", scoreMethod);
    const result = await createBookPoll(clubSlug, formData);
    if (!result.success) {
      setError(result.error);
      setLoading(false);
      return;
    }
    router.push(`/clubs/${clubSlug}/polls/${result.data!.pollId}`);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>New book poll</CardTitle>
        <CardDescription>Search for books and add them as poll options.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Poll title</Label>
            <Input id="title" name="title" required placeholder="What should we read in March?" />
          </div>
          <PollDeadlineField value={closesAt} onChange={setClosesAt} />
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium">How should people vote?</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              <ChoiceButton
                pressed={votingMode === "SINGLE"}
                onClick={() => setVotingMode("SINGLE")}
                title="Single vote"
                detail="Everyone picks one book, one time."
              />
              <ChoiceButton
                pressed={votingMode === "RANKING"}
                onClick={() => setVotingMode("RANKING")}
                title="Star ranking"
                detail="Everyone stars the books they are most interested in."
              />
            </div>
            {votingMode === "RANKING" && (
              <div className="space-y-4 rounded-2xl border border-border bg-muted/40 p-4">
                <div className="space-y-2">
                  <Label htmlFor="maxStars">Star scale</Label>
                  <p className="text-sm text-muted-foreground">
                    {`${maxStars} ${maxStars === 1 ? "star" : "stars"} means most interested. Empty stars mean they have not ranked that book.`}
                  </p>
                  <Input
                    id="maxStars"
                    type="number"
                    min={2}
                    max={10}
                    value={maxStars}
                    onChange={(event) => setMaxStars(Number(event.target.value))}
                  />
                  <div className="flex flex-wrap gap-1 pt-1" aria-hidden>
                    {Array.from({ length: Math.min(Math.max(maxStars, 0), 10) }, (_, index) => (
                      <Star key={index} className="h-5 w-5 fill-gold text-gold" />
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">How are the stars limited?</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <ChoiceButton
                      pressed={rankLimit === "BOOKS"}
                      onClick={() => setRankLimit("BOOKS")}
                      title="Limit by books"
                      detail="Each person can star only a set number of books."
                    />
                    <ChoiceButton
                      pressed={rankLimit === "BUDGET"}
                      onClick={() => setRankLimit("BUDGET")}
                      title="Star budget"
                      detail="Stars are spent. Using 3 on one book leaves fewer for the rest."
                    />
                  </div>
                  {rankLimit === "BOOKS" ? (
                    <div className="space-y-2 pt-1">
                      <Label htmlFor="maxRankedBooks">Books each person can rank</Label>
                      <Input
                        id="maxRankedBooks"
                        type="number"
                        min={1}
                        max={Math.max(selected.length, 1)}
                        value={maxRankedBooks}
                        onChange={(event) => setMaxRankedBooks(Number(event.target.value))}
                      />
                    </div>
                  ) : (
                    <div className="space-y-2 pt-1">
                      <Label htmlFor="starBudget">Stars each person can spend</Label>
                      <p className="text-sm text-muted-foreground">
                        A budget of 6 with a 3-star scale can be spent as 3, then 2, then 1.
                      </p>
                      <Input
                        id="starBudget"
                        type="number"
                        min={1}
                        max={Math.max(maxStars * Math.max(selected.length, 1), 1)}
                        value={starBudget}
                        onChange={(event) => setStarBudget(Number(event.target.value))}
                      />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">How does a book win?</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <ChoiceButton
                      pressed={scoreMethod === "POINTS"}
                      onClick={() => setScoreMethod("POINTS")}
                      title="Total points"
                      detail="3 stars is 3 points. 5 stars is 5 points. Most points wins."
                    />
                    <ChoiceButton
                      pressed={scoreMethod === "TOP_STARS"}
                      onClick={() => setScoreMethod("TOP_STARS")}
                      title="Most top stars"
                      detail="Each person's highest stars are their strongest vote. Most of those wins."
                    />
                  </div>
                </div>
              </div>
            )}
          </fieldset>
          <BookSearchPicker selected={selected} onChange={setSelected} />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button variant="outline" className="w-full sm:w-auto" asChild>
              <Link href={`/clubs/${clubSlug}/polls`}>Cancel</Link>
            </Button>
            <Button type="submit" className="w-full sm:w-auto" disabled={loading}>
              {loading ? "Creating…" : "Create poll"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
