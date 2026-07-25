import { BookRankingList } from "@/components/book/book-ranking-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireClubMemberBySlug, requireUser } from "@/lib/club-access";
import { db } from "@/lib/db";

export default async function RankingsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireUser();
  const { club } = await requireClubMemberBySlug(slug, user.id);

  const [ratedBooks, userRankings, allRankings, memberCount] = await Promise.all([
    db.bookRating.findMany({
      where: { clubId: club.id, userId: user.id },
      include: { book: true },
      orderBy: { rating: "desc" },
    }),
    db.bookRanking.findMany({
      where: { clubId: club.id, userId: user.id },
      orderBy: { rank: "asc" },
      select: { bookId: true },
    }),
    db.bookRanking.findMany({
      where: { clubId: club.id },
      include: { book: true },
    }),
    db.clubMembership.count({
      where: { clubId: club.id, status: "ACTIVE" },
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

  return (
    <>
      <h1 className="mb-6 text-3xl font-bold">Rankings</h1>

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
    </>
  );
}
