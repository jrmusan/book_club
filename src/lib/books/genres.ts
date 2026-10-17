/**
 * Normalize messy Google/Open Library category strings into short display genres.
 */
const GENRE_RULES: Array<{ label: string; match: RegExp }> = [
  { label: "Fantasy", match: /\bfantasy\b/i },
  { label: "Science Fiction", match: /\bscience fiction\b|\bsci-?fi\b/i },
  { label: "Mystery", match: /\bmystery\b|\bdetective\b|\bcrime\b/i },
  { label: "Thriller", match: /\bthriller\b|\bsuspense\b/i },
  { label: "Romance", match: /\bromance\b/i },
  { label: "Horror", match: /\bhorror\b/i },
  { label: "Historical", match: /\bhistorical\b/i },
  { label: "Biography", match: /\bbiograph|\bmemoir\b|\bautobiograph/i },
  { label: "History", match: /\bhistory\b|\bhistori/i },
  { label: "Self-Help", match: /\bself-?help\b|\bpersonal growth\b/i },
  { label: "Business", match: /\bbusiness\b|\beconomics?\b|\bmanagement\b/i },
  { label: "Poetry", match: /\bpoetry\b|\bpoems?\b/i },
  { label: "Comics", match: /\bcomics?\b|\bgraphic novels?\b|\bmanga\b/i },
  { label: "Young Adult", match: /\byoung adult\b|\bjuvenile fiction\b|\bteen\b/i },
  { label: "Children", match: /\bchildren|juvenile non/i },
  { label: "Literary Fiction", match: /\bliterary\b|\bgeneral fiction\b/i },
  { label: "Fiction", match: /\bfiction\b/i },
  { label: "Nonfiction", match: /\bnon-?fiction\b/i },
  { label: "Adventure", match: /\badventure\b/i },
  { label: "Classics", match: /\bclassics?\b/i },
];

/** Soft cottagecore swatches for genre chips / legend. */
export const GENRE_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  Fantasy: { bg: "bg-lavender/25", text: "text-foreground", dot: "bg-lavender" },
  "Science Fiction": { bg: "bg-primary/20", text: "text-foreground", dot: "bg-primary" },
  Mystery: { bg: "bg-secondary", text: "text-secondary-foreground", dot: "bg-muted-foreground" },
  Thriller: { bg: "bg-rose/20", text: "text-foreground", dot: "bg-rose" },
  Romance: { bg: "bg-rose/25", text: "text-foreground", dot: "bg-rose" },
  Horror: { bg: "bg-destructive/15", text: "text-foreground", dot: "bg-destructive" },
  Historical: { bg: "bg-gold/25", text: "text-foreground", dot: "bg-gold" },
  Biography: { bg: "bg-accent", text: "text-accent-foreground", dot: "bg-muted-foreground" },
  History: { bg: "bg-gold/20", text: "text-foreground", dot: "bg-gold" },
  "Self-Help": { bg: "bg-primary/15", text: "text-foreground", dot: "bg-primary" },
  Business: { bg: "bg-secondary", text: "text-secondary-foreground", dot: "bg-muted-foreground" },
  Poetry: { bg: "bg-lavender/30", text: "text-foreground", dot: "bg-lavender" },
  Comics: { bg: "bg-primary/15", text: "text-foreground", dot: "bg-primary" },
  "Young Adult": { bg: "bg-rose/15", text: "text-foreground", dot: "bg-rose" },
  Children: { bg: "bg-gold/20", text: "text-foreground", dot: "bg-gold" },
  "Literary Fiction": { bg: "bg-accent", text: "text-accent-foreground", dot: "bg-muted-foreground" },
  Fiction: { bg: "bg-primary/15", text: "text-foreground", dot: "bg-primary" },
  Nonfiction: { bg: "bg-secondary", text: "text-secondary-foreground", dot: "bg-muted-foreground" },
  Adventure: { bg: "bg-primary/20", text: "text-foreground", dot: "bg-primary" },
  Classics: { bg: "bg-gold/25", text: "text-foreground", dot: "bg-gold" },
};

export function genreStyle(genre: string) {
  return (
    GENRE_COLORS[genre] ?? {
      bg: "bg-muted",
      text: "text-foreground",
      dot: "bg-muted-foreground",
    }
  );
}

export function normalizeGenres(raw: string[] | undefined | null, max = 3): string[] {
  if (!raw?.length) return [];
  const found: string[] = [];
  for (const entry of raw) {
    const cleaned = entry.replace(/^[\d.\s]+/, "").trim();
    if (!cleaned) continue;
    for (const rule of GENRE_RULES) {
      if (rule.match.test(cleaned) && !found.includes(rule.label)) {
        found.push(rule.label);
        break;
      }
    }
    if (found.length >= max) break;
  }
  // Prefer specific over broad Fiction/Nonfiction when both matched.
  if (found.length > 1) {
    const specific = found.filter((g) => g !== "Fiction" && g !== "Nonfiction");
    if (specific.length > 0) return specific.slice(0, max);
  }
  return found.slice(0, max);
}
