import Link from "next/link";
import { ClubNav } from "@/components/layout/club-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireClubMemberBySlug, requireUser } from "@/lib/club-access";
import { db } from "@/lib/db";

export default async function MeetingsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireUser();
  const { club, membership } = await requireClubMemberBySlug(slug, user.id);
  const isOwner = membership.role === "OWNER";

  const meetings = await db.meeting.findMany({
    where: { clubId: club.id },
    orderBy: { scheduledAt: "desc" },
  });

  const now = new Date();
  const upcoming = meetings.filter((m) => m.scheduledAt >= now);
  const past = meetings.filter((m) => m.scheduledAt < now);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Meetings</h1>
        {isOwner && (
          <Button asChild>
            <Link href={`/clubs/${slug}/meetings/new`}>New meeting poll</Link>
          </Button>
        )}
      </div>
      <ClubNav slug={slug} isOwner={isOwner} />

      <div className="mt-8 space-y-8">
        <section>
          <h2 className="mb-4 text-lg font-semibold">Upcoming</h2>
          {upcoming.length === 0 ? (
            <p className="text-muted-foreground">No upcoming meetings.</p>
          ) : (
            <div className="space-y-3">
              {upcoming.map((m) => (
                <Card key={m.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{m.title}</CardTitle>
                    <CardDescription>
                      {new Date(m.scheduledAt).toLocaleString(undefined, {
                        dateStyle: "full",
                        timeStyle: "short",
                      })}
                      {m.location && ` · ${m.location}`}
                    </CardDescription>
                  </CardHeader>
                  {m.notes && <CardContent><p className="text-sm">{m.notes}</p></CardContent>}
                </Card>
              ))}
            </div>
          )}
        </section>

        {past.length > 0 && (
          <section>
            <h2 className="mb-4 text-lg font-semibold">Past</h2>
            <div className="space-y-3">
              {past.map((m) => (
                <Card key={m.id} className="opacity-75">
                  <CardHeader>
                    <CardTitle className="text-lg">{m.title}</CardTitle>
                    <CardDescription>
                      {new Date(m.scheduledAt).toLocaleString()}
                      {m.location && ` · ${m.location}`}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
