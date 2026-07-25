"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import type { ActionResult } from "@/actions/auth";

export async function cancelInvite(
  clubSlug: string,
  inviteId: string
): Promise<ActionResult> {
  const { requireClubOwnerBySlug, requireUser } = await import("@/lib/club-access");

  let user;
  try {
    user = await requireUser();
  } catch {
    return { success: false, error: "You must be logged in" };
  }

  let club;
  try {
    ({ club } = await requireClubOwnerBySlug(clubSlug, user.id));
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Forbidden" };
  }

  const invite = await db.clubInvite.findFirst({
    where: { id: inviteId, clubId: club.id, acceptedAt: null },
  });
  if (!invite) {
    return { success: false, error: "Invite not found" };
  }

  await db.clubInvite.delete({ where: { id: invite.id } });

  revalidatePath(`/clubs/${clubSlug}/settings/members`);
  revalidatePath("/dashboard");
  return { success: true };
}

export async function removeMember(
  clubSlug: string,
  memberUserId: string
): Promise<ActionResult> {
  const { requireClubOwnerBySlug, requireUser } = await import("@/lib/club-access");

  let user;
  try {
    user = await requireUser();
  } catch {
    return { success: false, error: "You must be logged in" };
  }

  let club;
  try {
    ({ club } = await requireClubOwnerBySlug(clubSlug, user.id));
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Forbidden" };
  }

  if (memberUserId === user.id) {
    return { success: false, error: "You can't remove yourself from the club" };
  }

  if (memberUserId === club.ownerId) {
    return { success: false, error: "You can't remove the club owner" };
  }

  const membership = await db.clubMembership.findUnique({
    where: { clubId_userId: { clubId: club.id, userId: memberUserId } },
  });
  if (!membership || membership.status !== "ACTIVE") {
    return { success: false, error: "Member not found" };
  }
  if (membership.role === "OWNER") {
    return { success: false, error: "You can't remove the club owner" };
  }

  await db.clubMembership.delete({ where: { id: membership.id } });

  revalidatePath(`/clubs/${clubSlug}/settings/members`);
  revalidatePath(`/clubs/${clubSlug}`);
  revalidatePath("/dashboard");
  return { success: true };
}
