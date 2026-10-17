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

function starWord(count: number) {
  return count === 1 ? "star" : "stars";
}

const MAX_STAR_SCALE = 5;

function validScale(maxStars: number) {
  return Number.isInteger(maxStars) && maxStars >= 2 && maxStars <= MAX_STAR_SCALE ? maxStars : null;
}

function budgetSpendExample(budget: number, scale: number | null) {
  if (!Number.isInteger(budget) || budget < 1 || scale == null) return null;
  const spends: number[] = [];
  let left = budget;
  let next = scale;
  while (left > 0 && spends.length < 6) {
    const spend = Math.min(next, left);
    spends.push(spend);
    left -= spend;
    next = Math.max(1, next - 1);
  }
  const list = spends.join(", then ");
  if (left > 0) {
    return `A budget of ${budget} on a ${scale}-star scale can start as ${list}, and so on.`;
  }
  return `A budget of ${budget} on a ${scale}-star scale can be spent as ${list}.`;
}

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
  const [rankLimit, setRankLimit] = useState<RankLimit>("BOOKS");
  const [starBudget, setStarBudget] = useState(6);
  const [scoreMethod, setScoreMethod] = useState<ScoreMethod>("POINTS");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const scale = validScale(maxStars);

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
      if (maxStars < 2 || maxStars > MAX_STAR_SCALE) {
        setError(`Star scale must be between 2 and ${MAX_STAR_SCALE}`);
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
                    {scale
                      ? `People rate each book from 1 to ${scale} ${starWord(scale)}. ${scale} ${starWord(scale)} means most interested, and a blank book has not been ranked.`
                      : `Choose a scale from 2 to ${MAX_STAR_SCALE} stars.`}
                  </p>
                  <Input
                    id="maxStars"
                    type="number"
                    min={2}
                    max={MAX_STAR_SCALE}
                    value={maxStars}
                    onChange={(event) => setMaxStars(Number(event.target.value))}
                  />
                  <div className="flex flex-wrap gap-1 pt-1" aria-hidden>
                    {Array.from({ length: Math.min(Math.max(maxStars, 0), MAX_STAR_SCALE) }, (_, index) => (
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
                      title="Rate freely"
                      detail={
                        scale
                          ? `Rate every book however you want. Every book can get ${scale} ${starWord(scale)}.`
                          : "Rate every book however you want, including the top rating on all of them."
                      }
                    />
                    <ChoiceButton
                      pressed={rankLimit === "BUDGET"}
                      onClick={() => setRankLimit("BUDGET")}
                      title="Star budget"
                      detail={
                        scale
                          ? `Stars are spent from one pool. Using ${scale} on one book leaves fewer for the rest.`
                          : "Stars are spent from one pool. A high rating on one book leaves fewer for the rest."
                      }
                    />
                  </div>
                  {rankLimit === "BOOKS" ? (
                    <p className="pt-1 text-sm text-muted-foreground">
                      {scale
                        ? `There is no cap. Someone can give ${scale} ${starWord(scale)} to every book, or give each book a different rating.`
                        : "There is no cap. Someone can give the top rating to every book, or mix ratings."}
                    </p>
                  ) : (
                    <div className="space-y-2 pt-1">
                      <Label htmlFor="starBudget">Stars each person can spend</Label>
                      <p className="text-sm text-muted-foreground">
                        {budgetSpendExample(starBudget, scale) ??
                          "Set a star scale first, then choose how many stars each person can spend."}
                      </p>
                      <Input
                        id="starBudget"
                        type="number"
                        min={1}
                        max={Math.max((scale ?? 1) * Math.max(selected.length, 1), 1)}
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
                      detail={
                        scale
                          ? `Each star is 1 point. A 1-star rating is 1 point, and a ${scale}-star rating is ${scale} points. Every rating adds up, and the book with the most points wins.`
                          : "Each star is 1 point. Every rating adds up, and the book with the most points wins."
                      }
                    />
                    <ChoiceButton
                      pressed={scoreMethod === "TOP_STARS"}
                      onClick={() => setScoreMethod("TOP_STARS")}
                      title="Most top stars"
                      detail={
                        scale
                          ? `Each person's highest rating, up to ${scale} ${starWord(scale)}, is their strongest vote. The book with the most of those top ratings wins.`
                          : "Each person's highest rating is their strongest vote. The book with the most of those top ratings wins."
                      }
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
