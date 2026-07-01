"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { rateBook } from "@/actions/polls";
import { Button } from "@/components/ui/button";
import { Textarea, Label } from "@/components/ui/input";

export function BookRatingForm({
  clubSlug,
  bookId,
  initialRating,
  initialReview,
}: {
  clubSlug: string;
  bookId: string;
  initialRating?: number;
  initialReview?: string;
}) {
  const router = useRouter();
  const [rating, setRating] = useState(initialRating ?? 0);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    if (rating < 1) return;
    setLoading(true);
    formData.set("bookId", bookId);
    formData.set("rating", String(rating));
    await rateBook(clubSlug, formData);
    router.refresh();
    setLoading(false);
  }

  return (
    <form action={handleSubmit} className="space-y-3">
      <div>
        <Label>Your rating</Label>
        <div className="mt-1 flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className={`text-2xl ${star <= rating ? "text-amber-400" : "text-muted-foreground/30"}`}
            >
              ★
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor={`review-${bookId}`}>Review (optional)</Label>
        <Textarea
          id={`review-${bookId}`}
          name="review"
          defaultValue={initialReview}
          placeholder="What did you think?"
          rows={2}
        />
      </div>
      <Button type="submit" size="sm" disabled={rating < 1 || loading}>
        {loading ? "Saving…" : initialRating ? "Update rating" : "Save rating"}
      </Button>
    </form>
  );
}
