import { BookNotes } from "@/components/book/book-notes";
import { BookRatingForm } from "@/components/book/book-rating-form";
import { MemberReviews } from "@/components/book/member-reviews";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listClubBookNotes, notesForBook } from "@/lib/book-notes";
import { requireClubMemberBySlug, requireUser } from "@/lib/club-access";
import { db } from "@/lib/db";
import { listClosedBookPollWinners } from "@/lib/polls";
import { truncate } from "@/lib/utils";

export default async function BooksPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireUser();

  const [, winners, notes, clubBooks] = await Promise.all([
    requireClubMemberBySlug(slug, user.id),
    listClosedBookPollWinners({ slug }),
    listClubBookNotes(slug),
    db.clubBook.findMany({
      where: { club: { slug } },
      orderBy: { addedAt: "desc" },
      select: {
        book: {
          select: {
            id: true,
            title: true,
            authors: true,
            coverUrl: true,
            description: true,
            bookRatings: {
              where: { club: { slug } },
              orderBy: { updatedAt: "desc" },
              select: {
                id: true,
                rating: true,
                review: true,
                userId: true,
                user: { select: { id: true, username: true, name: true } },
              },
            },
          },
        },
      },
    }),
  ]);

  return (
    <>
      <h1 className="mb-5 text-2xl font-bold sm:mb-6 sm:text-3xl">Books</h1>

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
            const wonPoll = winners.some((winner) => winner.book.id === book.id);
            const bookNotes = wonPoll ? notesForBook(notes, book.id, user.id) : null;
            const memberReviews = book.bookRatings.map((r) => ({
              id: r.id,
              rating: r.rating,
              review: r.review,
              userId: r.user.id,
              displayName: r.user.name ?? r.user.username,
              username: r.user.username,
            }));

            return (
              <Card key={book.id} id={`book-${book.id}`} className="scroll-mt-24">
                <CardHeader className="p-4 sm:p-6">
                  <div className="flex gap-3 sm:gap-4">
                    {book.coverUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={book.coverUrl}
                        alt=""
                        className="h-24 w-16 shrink-0 rounded object-cover sm:h-28 sm:w-20"
                      />
                    )}
                    <div className="min-w-0">
                      <CardTitle className="text-lg sm:text-2xl">{book.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">{book.authors.join(", ")}</p>
                      {book.description && (
                        <p className="mt-2 line-clamp-3 text-sm text-muted-foreground sm:line-clamp-none">
                          {truncate(book.description, 200)}
                        </p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {bookNotes && (
                    <div className="border-b border-border pb-6">
                      <BookNotes
                        clubSlug={slug}
                        bookId={book.id}
                        initialBody={bookNotes.initialBody}
                        others={bookNotes.others}
                      />
                    </div>
                  )}
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
