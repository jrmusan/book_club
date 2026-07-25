import { InviteMemberForm } from "@/components/club/invite-member-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireClubOwnerBySlug, requireUser } from "@/lib/club-access";
import { db } from "@/lib/db";

export default async function MembersPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireUser();
  const { club } = await requireClubOwnerBySlug(slug, user.id);

  const [members, pendingInvites] = await Promise.all([
    db.clubMembership.findMany({
      where: { clubId: club.id, status: "ACTIVE" },
      include: { user: { select: { id: true, username: true, email: true, name: true } } },
      orderBy: { createdAt: "asc" },
    }),
    db.clubInvite.findMany({
      where: { clubId: club.id, acceptedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
      select: { id: true, email: true, expiresAt: true },
    }),
  ]);

  return (
    <>
      <h1 className="mb-6 text-3xl font-bold">Members</h1>

      <div className="space-y-8">
        <InviteMemberForm clubSlug={slug} />

        <section>
          <h2 className="mb-4 text-lg font-semibold">Active members ({members.length})</h2>
          <div className="space-y-2">
            {members.map((m) => (
              <Card key={m.id}>
                <CardHeader className="flex flex-row items-center justify-between py-4">
                  <div>
                    <CardTitle className="text-base">{m.user.name ?? m.user.username}</CardTitle>
                    <CardContent className="p-0 text-sm text-muted-foreground">
                      @{m.user.username} · {m.user.email}
                    </CardContent>
                  </div>
                  {m.role === "OWNER" && <Badge>Owner</Badge>}
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        {pendingInvites.length > 0 && (
          <section>
            <h2 className="mb-4 text-lg font-semibold">Pending invites</h2>
            <div className="space-y-2">
              {pendingInvites.map((invite) => (
                <Card key={invite.id}>
                  <CardContent className="py-4 text-sm">
                    {invite.email} — expires {invite.expiresAt.toLocaleDateString()}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
