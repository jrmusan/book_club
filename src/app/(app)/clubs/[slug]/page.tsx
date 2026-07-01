import Link from "next/link";
import { ClubNav } from "@/components/layout/club-nav";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireClubMemberBySlug } from "@/lib/club-access";
import { requireUser } from "@/lib/club-access";
import { db } from "@/lib/db";
import { getPollResults } from "@/actions/polls";

export default async function ClubPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireUser();
  const { club, membership } = await requireClubMemberBySlug(slug, user.id);
  const isOwner = membership.role === "OWNER";

  const [openPolls, upcomingMeetings, recentClosedPoll] = await Promise.all([
    db.poll.findMany({
      where: { clubId: club.id, status: "OPEN" },
      orderBy: { publishedAt: "desc" },
      take: 3,
    }),
    db.meeting.findMany({
      where: { clubId: club.id, scheduledAt: { gte: new Date() } },
      orderBy: { scheduledAt: "asc" },
      take: 3,
    }),
    db.poll.findFirst({
      where: { clubId: club.id, status: "CLOSED", type: "BOOK_SELECTION" },
      orderBy: { closesAt: "desc" },
    }),
  ]);

  let winner = null;
  if (recentClosedPoll) {
    const results = await getPollResults(recentClosedPoll.id);
    winner = results.sort((a, b) => b.voteCount - a.voteCount)[0];
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{club.name}</h1>
            {isOwner && <Badge>Owner</Badge>}
          </div>
          {club.description && (
            <p className="mt-2 text-muted-foreground">{club.description}</p>
          )}
        </div>

        <ClubNav slug={slug} isOwner={isOwner} />

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
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

          {winner?.book && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Latest book pick</CardTitle>
                <CardDescription>From the most recent closed poll</CardDescription>
              </CardHeader>
              <CardContent className="flex gap-4">
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
                  <p className="mt-2 text-sm">{winner.voteCount} votes</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
    </main>
  );
}
