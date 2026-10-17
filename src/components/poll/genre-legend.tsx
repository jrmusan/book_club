import { genreStyle } from "@/lib/books/genres";
import { cn } from "@/lib/utils";

export function GenreChips({
  genres,
  className,
  size = "sm",
}: {
  genres: string[];
  className?: string;
  size?: "sm" | "md";
}) {
  if (!genres.length) return null;

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {genres.map((genre) => {
        const style = genreStyle(genre);
        return (
          <span
            key={genre}
            className={cn(
              "inline-flex items-center gap-1 rounded-full font-medium",
              style.bg,
              style.text,
              size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"
            )}
          >
            <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", style.dot)} aria-hidden />
            {genre}
          </span>
        );
      })}
    </div>
  );
}

export function GenreLegend({ genres }: { genres: string[] }) {
  if (genres.length === 0) return null;

  return (
    <div className="cozy-panel mb-4 rounded-2xl px-3 py-3 sm:px-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Genres in this poll
      </p>
      <GenreChips genres={genres} size="md" />
    </div>
  );
}
