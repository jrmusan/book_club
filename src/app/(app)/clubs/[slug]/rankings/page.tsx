import { BookRankingList } from "@/components/book/book-ranking-list";
import { MemberRankings } from "@/components/book/member-rankings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireClubMemberBySlug, requireUser } from "@/lib/club-access";
import { db } from "@/lib/db";

const bookSelect = {
  id: true,
  title: true,
  authors: true,
  coverUrl: true,
} as const;

export default async function RankingsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireUser();

  const [, ratedBooks, userRankings, allRankings, memberCount] = await Promise.all([
    requireClubMemberBySlug(slug, user.id),
    db.bookRating.findMany({
      where: { club: { slug }, userId: user.id },
      orderBy: { rating: "desc" },
      select: {
        rating: true,
        book: { select: bookSelect },
      },
    }),
    db.bookRanking.findMany({
      where: { club: { slug }, userId: user.id },
      orderBy: { rank: "asc" },
      select: { bookId: true },
    }),
    db.bookRanking.findMany({
      where: { club: { slug } },
      orderBy: { rank: "asc" },
      select: {
        bookId: true,
        rank: true,
        userId: true,
        book: { select: bookSelect },
        user: { select: { id: true, username: true, name: true } },
      },
    }),
    db.clubMembership.count({
      where: { club: { slug }, status: "ACTIVE" },
    }),
  ]);

  const books = ratedBooks.map((r) => ({
    id: r.book.id,
    title: r.book.title,
    authors: r.book.authors,
    coverUrl: r.book.coverUrl,
    rating: r.rating,
  }));

  const initialOrder = userRankings.map((r) => r.bookId);

  const aggregateScores = new Map<
    string,
    { book: (typeof allRankings)[0]["book"]; score: number; voters: number }
  >();
  for (const ranking of allRankings) {
    const points = memberCount - ranking.rank + 1;
    const existing = aggregateScores.get(ranking.bookId);
    if (existing) {
      existing.score += points;
      existing.voters += 1;
    } else {
      aggregateScores.set(ranking.bookId, { book: ranking.book, score: points, voters: 1 });
    }
  }

  const clubFavorites = [...aggregateScores.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  const rankingsByUser = new Map<
    string,
    {
      userId: string;
      displayName: string;
      username: string;
      books: {
        id: string;
        title: string;
        authors: string[];
        coverUrl: string | null;
        rank: number;
      }[];
    }
  >();

  for (const ranking of allRankings) {
    const existing = rankingsByUser.get(ranking.userId);
    const entry = {
      id: ranking.book.id,
      title: ranking.book.title,
      authors: ranking.book.authors,
      coverUrl: ranking.book.coverUrl,
      rank: ranking.rank,
    };
    if (existing) {
      existing.books.push(entry);
    } else {
      rankingsByUser.set(ranking.userId, {
        userId: ranking.user.id,
        displayName: ranking.user.name ?? ranking.user.username,
        username: ranking.user.username,
        books: [entry],
      });
    }
  }

  const memberRankings = [...rankingsByUser.values()].map((m) => ({
    ...m,
    books: [...m.books].sort((a, b) => a.rank - b.rank),
  }));

  return (
    <>
      <h1 className="mb-5 text-2xl font-bold sm:mb-6 sm:text-3xl">Rankings</h1>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-4 text-lg font-semibold">Your stack rank</h2>
          <BookRankingList clubSlug={slug} books={books} initialOrder={initialOrder} />
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold">Club favorites</h2>
          {clubFavorites.length === 0 ? (
            <p className="text-muted-foreground">
              No rankings yet. Members need to stack-rank their reads.
            </p>
          ) : (
            <div className="space-y-3">
              {clubFavorites.map((item, index) => (
                <Card key={item.book.id}>
                  <CardHeader className="flex flex-row items-center gap-3 py-4">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                      {index + 1}
                    </span>
                    {item.book.coverUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.book.coverUrl}
                        alt=""
                        className="h-14 w-10 rounded object-cover"
                      />
                    )}
                    <div>
                      <CardTitle className="text-base">{item.book.title}</CardTitle>
                      <CardContent className="p-0 text-sm text-muted-foreground">
                        {item.book.authors.join(", ")} · {item.voters} voter
                        {item.voters !== 1 ? "s" : ""}
                      </CardContent>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold">Members&apos; rankings</h2>
        <MemberRankings members={memberRankings} currentUserId={user.id} />
      </section>
    </>
  );
}
