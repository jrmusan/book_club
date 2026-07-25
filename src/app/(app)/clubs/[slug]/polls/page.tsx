import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireClubMemberBySlug, requireUser } from "@/lib/club-access";
import { db } from "@/lib/db";

export default async function PollsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireUser();
  const { club, membership } = await requireClubMemberBySlug(slug, user.id);

  const polls = await db.poll.findMany({
    where: { clubId: club.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      type: true,
      status: true,
      _count: { select: { votes: true, options: true } },
    },
  });

  return (
    <>
      <h1 className="mb-6 text-3xl font-bold">Polls</h1>

      <div className="space-y-4">
        {polls.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No polls yet.
              {membership.role === "OWNER" && (
                <p className="mt-2">
                  <Link href={`/clubs/${slug}/polls/new`} className="text-primary hover:underline">
                    Create your first book poll
                  </Link>
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          polls.map((poll) => (
            <Link key={poll.id} href={`/clubs/${slug}/polls/${poll.id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{poll.title}</CardTitle>
                    <CardDescription>
                      {poll.type.replace("_", " ")} · {poll._count.options} options ·{" "}
                      {poll._count.votes} votes
                    </CardDescription>
                  </div>
                  <Badge
                    variant={
                      poll.status === "OPEN"
                        ? "success"
                        : poll.status === "CLOSED"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {poll.status}
                  </Badge>
                </CardHeader>
              </Card>
            </Link>
          ))
        )}
      </div>
    </>
  );
}
