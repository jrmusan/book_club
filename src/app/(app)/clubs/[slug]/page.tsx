import Link from "next/link";
import { BookNotes } from "@/components/book/book-notes";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { listClubBookNotes, notesForBook } from "@/lib/book-notes";
import { requireClubMemberBySlug, requireUser } from "@/lib/club-access";
import { db } from "@/lib/db";
import { listClosedBookPollWinners } from "@/lib/polls";

export default async function ClubPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireUser();

  // Membership + page data in one round-trip wave (queries filter by slug).
  const [{ club, membership }, openPolls, upcomingMeetings, winners, notes] = await Promise.all([
    requireClubMemberBySlug(slug, user.id),
    db.poll.findMany({
      where: { club: { slug }, status: "OPEN" },
      orderBy: { publishedAt: "desc" },
      take: 3,
      select: { id: true, title: true, type: true },
    }),
    db.meeting.findMany({
      where: { club: { slug }, scheduledAt: { gte: new Date() } },
      orderBy: { scheduledAt: "asc" },
      take: 3,
      select: { id: true, title: true, scheduledAt: true, location: true },
    }),
    listClosedBookPollWinners({ slug }),
    listClubBookNotes(slug),
  ]);

  const isOwner = membership.role === "OWNER";
  const winner = winners[0] ?? null;
  const pickNotes = winner ? notesForBook(notes, winner.book.id, user.id) : null;

  return (
    <>
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold sm:text-3xl">{club.name}</h1>
          {isOwner && <Badge>Owner</Badge>}
        </div>
        {club.description && (
          <p className="mt-2 text-muted-foreground">{club.description}</p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Open polls</CardTitle>
            <CardDescription>Cast your vote before polls close</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {openPolls.length === 0 ? (
              <p className="text-sm text-muted-foreground">No open polls right now.</p>
            ) : (
              openPolls.map((poll) => (
                <Link
                  key={poll.id}
                  href={`/clubs/${slug}/polls/${poll.id}`}
                  className="block rounded-lg border border-border p-3 hover:bg-accent"
                >
                  <p className="font-medium">{poll.title}</p>
                  <p className="text-xs text-muted-foreground">{poll.type.replace("_", " ")}</p>
                </Link>
              ))
            )}
            <Button variant="outline" size="sm" asChild>
              <Link href={`/clubs/${slug}/polls`}>View all polls</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming meetings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingMeetings.length === 0 ? (
              <p className="text-sm text-muted-foreground">No meetings scheduled.</p>
            ) : (
              upcomingMeetings.map((m) => (
                <div key={m.id} className="rounded-lg border border-border p-3">
                  <p className="font-medium">{m.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(m.scheduledAt).toLocaleString()} {m.location && `· ${m.location}`}
                  </p>
                </div>
              ))
            )}
            <Button variant="outline" size="sm" asChild>
              <Link href={`/clubs/${slug}/meetings`}>View meetings</Link>
            </Button>
          </CardContent>
        </Card>

        {winner && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Latest book pick</CardTitle>
              <CardDescription>From the most recent closed poll</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-4">
                {winner.book.coverUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={winner.book.coverUrl}
                    alt={winner.book.title}
                    className="h-32 w-24 rounded object-cover"
                  />
                )}
                <div>
                  <p className="text-lg font-semibold">{winner.book.title}</p>
                  <p className="text-sm text-muted-foreground">{winner.book.authors.join(", ")}</p>
                  <p className="mt-2 text-sm">
                    {winner.scoreKind === "points"
                      ? `${winner.voteCount} point${winner.voteCount === 1 ? "" : "s"}`
                      : winner.scoreKind === "top picks"
                        ? `${winner.voteCount} top pick${winner.voteCount === 1 ? "" : "s"}`
                        : `${winner.voteCount} vote${winner.voteCount === 1 ? "" : "s"}`}
                  </p>
                </div>
              </div>
              <div className="border-t border-border pt-6">
                {pickNotes && (
                  <BookNotes
                    clubSlug={slug}
                    bookId={winner.book.id}
                    initialBody={pickNotes.initialBody}
                    others={pickNotes.others}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
