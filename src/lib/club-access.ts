import type { MembershipRole } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export class AuthError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "AuthError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new AuthError();
  }
  return session.user;
}

export async function getClubBySlug(slug: string) {
  return db.club.findUnique({
    where: { slug },
    include: {
      owner: { select: { id: true, username: true, name: true } },
    },
  });
}

export async function requireClubMember(clubId: string, userId: string) {
  const membership = await db.clubMembership.findUnique({
    where: { clubId_userId: { clubId, userId } },
  });

  if (!membership || membership.status !== "ACTIVE") {
    throw new ForbiddenError("You are not a member of this club");
  }

  return membership;
}

export async function requireClubOwner(clubId: string, userId: string) {
  const membership = await requireClubMember(clubId, userId);
  if (membership.role !== "OWNER") {
    throw new ForbiddenError("Only club owners can perform this action");
  }
  return membership;
}

export async function requireClubMemberBySlug(slug: string, userId: string) {
  const club = await getClubBySlug(slug);
  if (!club) {
    throw new ForbiddenError("Club not found");
  }
  const membership = await requireClubMember(club.id, userId);
  return { club, membership };
}

export async function requireClubOwnerBySlug(slug: string, userId: string) {
  const { club, membership } = await requireClubMemberBySlug(slug, userId);
  if (membership.role !== ("OWNER" satisfies MembershipRole)) {
    throw new ForbiddenError("Only club owners can perform this action");
  }
  return { club, membership };
}
