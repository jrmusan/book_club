import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireUser } from "@/lib/club-access";
import { db } from "@/lib/db";
import { getRecentUnreadNotifications } from "@/lib/notifications";

export default async function DashboardPage() {
  const user = await requireUser();

  const [memberships, pendingInvites, unread] = await Promise.all([
    db.clubMembership.findMany({
      where: { userId: user.id, status: "ACTIVE" },
      include: {
        club: {
          include: {
            _count: { select: { memberships: true, polls: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.clubInvite.findMany({
      where: {
        email: user.email!.toLowerCase(),
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { club: { select: { id: true, name: true, slug: true } } },
    }),
    getRecentUnreadNotifications(user.id, 5),
  ]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Your book clubs and recent activity</p>
        </div>
        <Button asChild>
          <Link href="/clubs/new">
            <Plus className="mr-2 h-4 w-4" />
            New club
          </Link>
        </Button>
      </div>

      {pendingInvites.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-semibold">Pending invites</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {pendingInvites.map((invite) => (
              <Card key={invite.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{invite.club.name}</CardTitle>
                  <CardDescription>You&apos;ve been invited to join this club</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild>
                    <Link href={`/invite/${invite.token}`}>Accept invite</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {unread.length > 0 && (
        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent notifications</h2>
            <Link href="/notifications" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="space-y-2">
            {unread.map((n) => (
              <Card key={n.id}>
                <CardContent className="flex items-center justify-between py-4">
                  <p className="text-sm">
                    {(n.payload as { message?: string }).message ?? n.type}
                  </p>
                  <Badge variant="secondary">New</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-4 text-lg font-semibold">Your clubs</h2>
        {memberships.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">You haven&apos;t joined any clubs yet.</p>
              <Button className="mt-4" asChild>
                <Link href="/clubs/new">Create your first club</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {memberships.map(({ club, role }) => (
              <Link key={club.id} href={`/clubs/${club.slug}`}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle>{club.name}</CardTitle>
                      {role === "OWNER" && <Badge>Owner</Badge>}
                    </div>
                    {club.description && (
                      <CardDescription className="line-clamp-2">{club.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {club._count.memberships} members · {club._count.polls} polls
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
