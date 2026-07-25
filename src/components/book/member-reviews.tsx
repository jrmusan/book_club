function StarRating({ rating }: { rating: number }) {
  return (
    <span className="inline-flex gap-0.5 text-sm" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={star <= rating ? "text-amber-400" : "text-muted-foreground/30"}
        >
          ★
        </span>
      ))}
    </span>
  );
}

export type MemberReview = {
  id: string;
  rating: number;
  review: string | null;
  userId: string;
  displayName: string;
  username: string;
};

export function MemberReviews({
  reviews,
  currentUserId,
}: {
  reviews: MemberReview[];
  currentUserId: string;
}) {
  if (reviews.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No ratings from club members yet.</p>
    );
  }

  const average =
    reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Club ratings</h3>
        <p className="text-sm text-muted-foreground">
          Avg {average.toFixed(1)}/5 · {reviews.length} rating
          {reviews.length !== 1 ? "s" : ""}
        </p>
      </div>
      <ul className="space-y-3">
        {reviews.map((r) => {
          const isYou = r.userId === currentUserId;
          return (
            <li
              key={r.id}
              className="rounded-lg border border-border px-3 py-2.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium">
                  {isYou ? "You" : r.displayName}
                  {!isYou && (
                    <span className="ml-1.5 font-normal text-muted-foreground">
                      @{r.username}
                    </span>
                  )}
                </p>
                <StarRating rating={r.rating} />
              </div>
              {r.review && (
                <p className="mt-1.5 text-sm text-muted-foreground whitespace-pre-wrap">
                  {r.review}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
