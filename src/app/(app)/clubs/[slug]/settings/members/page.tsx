import { InviteMemberForm } from "@/components/club/invite-member-form";
import { MemberRow } from "@/components/club/member-row";
import { PendingInviteRow } from "@/components/club/pending-invite-row";
import { inviteAcceptUrl } from "@/lib/app-url";
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
      select: { id: true, email: true, expiresAt: true, token: true },
    }),
  ]);

  return (
    <>
      <h1 className="mb-6 text-3xl font-bold">Members</h1>

      <div className="space-y-8">
        <InviteMemberForm clubSlug={slug} clubName={club.name} />

        <section>
          <h2 className="mb-4 text-lg font-semibold">Active members ({members.length})</h2>
          <div className="space-y-2">
            {members.map((m) => (
              <MemberRow
                key={m.id}
                clubSlug={slug}
                userId={m.user.id}
                displayName={m.user.name ?? m.user.username}
                username={m.user.username}
                email={m.user.email}
                role={m.role}
                canRemove={m.role !== "OWNER" && m.user.id !== user.id}
              />
            ))}
          </div>
        </section>

        {pendingInvites.length > 0 && (
          <section>
            <h2 className="mb-4 text-lg font-semibold">Pending invites</h2>
            <div className="space-y-2">
              {pendingInvites.map((invite) => (
                <PendingInviteRow
                  key={invite.id}
                  inviteId={invite.id}
                  clubSlug={slug}
                  email={invite.email}
                  expiresAt={invite.expiresAt.toISOString()}
                  inviteUrl={inviteAcceptUrl(invite.token)}
                  clubName={club.name}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
