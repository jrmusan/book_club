import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireClubMemberBySlug, requireUser } from "@/lib/club-access";
import { db } from "@/lib/db";

export default async function MeetingsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireUser();

  const [, meetings] = await Promise.all([
    requireClubMemberBySlug(slug, user.id),
    db.meeting.findMany({
      where: { club: { slug } },
      orderBy: { scheduledAt: "desc" },
      select: {
        id: true,
        title: true,
        scheduledAt: true,
        location: true,
        notes: true,
      },
    }),
  ]);

  const now = new Date();
  const upcoming = meetings.filter((m) => m.scheduledAt >= now);
  const past = meetings.filter((m) => m.scheduledAt < now);

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold sm:text-3xl">Meetings</h1>
        <Button className="w-full sm:w-auto" asChild>
          <Link href={`/clubs/${slug}/meetings/new`}>New meeting poll</Link>
        </Button>
      </div>

      <div className="space-y-8">
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
                  {m.notes && (
                    <CardContent>
                      <p className="text-sm">{m.notes}</p>
                    </CardContent>
                  )}
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
    </>
  );
}
