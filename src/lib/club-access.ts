import { cache } from "react";
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

/** Deduped per React request — safe for layout + page + header. */
export const requireUser = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) {
    throw new AuthError();
  }
  return session.user;
});

export const getClubBySlug = cache(async (slug: string) => {
  return db.club.findUnique({
    where: { slug },
    include: {
      owner: { select: { id: true, username: true, name: true } },
    },
  });
});

export const requireClubMember = cache(async (clubId: string, userId: string) => {
  const membership = await db.clubMembership.findUnique({
    where: { clubId_userId: { clubId, userId } },
  });

  if (!membership || membership.status !== "ACTIVE") {
    throw new ForbiddenError("You are not a member of this club");
  }

  return membership;
});

/**
 * Single round-trip: club by slug + caller's active membership.
 * Cached so club layout and page share one lookup per request.
 */
export const requireClubMemberBySlug = cache(async (slug: string, userId: string) => {
  const club = await db.club.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      ownerId: true,
      createdAt: true,
      updatedAt: true,
      memberships: {
        where: { userId, status: "ACTIVE" },
        take: 1,
      },
    },
  });

  if (!club) {
    throw new ForbiddenError("Club not found");
  }

  const membership = club.memberships[0];
  if (!membership) {
    throw new ForbiddenError("You are not a member of this club");
  }

  const { memberships, ...clubFields } = club;
  void memberships;
  return {
    club: clubFields,
    membership,
  };
});

export const requireClubOwner = cache(async (clubId: string, userId: string) => {
  const membership = await requireClubMember(clubId, userId);
  if (membership.role !== "OWNER") {
    throw new ForbiddenError("Only club owners can perform this action");
  }
  return membership;
});

export const requireClubOwnerBySlug = cache(async (slug: string, userId: string) => {
  const { club, membership } = await requireClubMemberBySlug(slug, userId);
  if (membership.role !== ("OWNER" satisfies MembershipRole)) {
    throw new ForbiddenError("Only club owners can perform this action");
  }
  return { club, membership };
});
