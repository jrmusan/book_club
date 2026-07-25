import { BookRatingForm } from "@/components/book/book-rating-form";
import { MemberReviews } from "@/components/book/member-reviews";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireClubMemberBySlug, requireUser } from "@/lib/club-access";
import { db } from "@/lib/db";
import { truncate } from "@/lib/utils";

export default async function BooksPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireUser();
  const { club } = await requireClubMemberBySlug(slug, user.id);

  const clubBooks = await db.clubBook.findMany({
    where: { clubId: club.id },
    include: {
      book: {
        include: {
          bookRatings: {
            where: { clubId: club.id },
            include: {
              user: { select: { id: true, username: true, name: true } },
            },
            orderBy: { updatedAt: "desc" },
          },
        },
      },
    },
    orderBy: { addedAt: "desc" },
  });

  return (
    <>
      <h1 className="mb-6 text-3xl font-bold">Books</h1>

      <div className="space-y-6">
        {clubBooks.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No books in this club yet. Books are added when you create polls or close a winning
              vote.
            </CardContent>
          </Card>
        ) : (
          clubBooks.map(({ book }) => {
            const userRating = book.bookRatings.find((r) => r.userId === user.id);
            const memberReviews = book.bookRatings.map((r) => ({
              id: r.id,
              rating: r.rating,
              review: r.review,
              userId: r.user.id,
              displayName: r.user.name ?? r.user.username,
              username: r.user.username,
            }));

            return (
              <Card key={book.id}>
                <CardHeader>
                  <div className="flex gap-4">
                    {book.coverUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={book.coverUrl} alt="" className="h-28 w-20 rounded object-cover" />
                    )}
                    <div>
                      <CardTitle>{book.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">{book.authors.join(", ")}</p>
                      {book.description && (
                        <p className="mt-2 text-sm text-muted-foreground">
                          {truncate(book.description, 200)}
                        </p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <BookRatingForm
                    clubSlug={slug}
                    bookId={book.id}
                    initialRating={userRating?.rating}
                    initialReview={userRating?.review ?? undefined}
                  />
                  <div className="border-t border-border pt-6">
                    <MemberReviews reviews={memberReviews} currentUserId={user.id} />
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </>
  );
}
