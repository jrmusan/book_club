"use server";

import bcrypt from "bcryptjs";
import { signIn } from "@/auth";
import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { registerSchema } from "@/lib/validations/auth";
import { AuthError } from "next-auth";

export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

export async function registerUser(formData: FormData): Promise<ActionResult<{ userId: string }>> {
  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    username: formData.get("username"),
    password: formData.get("password"),
    name: formData.get("name") || undefined,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await db.user.findFirst({
    where: { OR: [{ email }, { username: parsed.data.username }] },
  });
  if (existing) {
    return { success: false, error: "Email or username already in use" };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const user = await db.user.create({
    data: {
      email,
      username: parsed.data.username,
      passwordHash,
      name: parsed.data.name,
    },
  });

  return { success: true, data: { userId: user.id } };
}

export async function loginUser(formData: FormData): Promise<ActionResult> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError && error.type === "CredentialsSignin") {
      return { success: false, error: "Invalid email or password" };
    }
    if (error instanceof AuthError) {
      return { success: false, error: "Invalid email or password" };
    }
    throw error;
  }
}

export async function createClub(formData: FormData): Promise<ActionResult<{ slug: string }>> {
  const { requireUser } = await import("@/lib/club-access");
  const { createClubSchema } = await import("@/lib/validations/auth");

  let user;
  try {
    user = await requireUser();
  } catch {
    return { success: false, error: "You must be logged in" };
  }

  const parsed = createClubSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  let baseSlug = slugify(parsed.data.name);
  if (!baseSlug) baseSlug = "club";

  let slug = baseSlug;
  let suffix = 1;
  while (await db.club.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${suffix++}`;
  }

  const club = await db.club.create({
    data: {
      name: parsed.data.name,
      slug,
      description: parsed.data.description,
      ownerId: user.id,
      memberships: {
        create: {
          userId: user.id,
          role: "OWNER",
          status: "ACTIVE",
        },
      },
    },
  });

  return { success: true, data: { slug: club.slug } };
}

export async function inviteMember(
  clubSlug: string,
  formData: FormData
): Promise<
  ActionResult<
    | { kind: "added"; email: string }
    | { kind: "pending"; email: string; inviteToken: string; inviteUrl: string }
  >
> {
  const { requireClubOwnerBySlug } = await import("@/lib/club-access");
  const { inviteMemberSchema } = await import("@/lib/validations/auth");
  const { createNotification } = await import("@/lib/notifications");
  const { inviteAcceptUrl } = await import("@/lib/app-url");

  let user;
  try {
    user = await (await import("@/lib/club-access")).requireUser();
  } catch {
    return { success: false, error: "You must be logged in" };
  }

  const parsed = inviteMemberSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid email" };
  }

  let club;
  try {
    ({ club } = await requireClubOwnerBySlug(clubSlug, user.id));
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Forbidden" };
  }

  const email = parsed.data.email.toLowerCase();
  const existingMember = await db.user.findUnique({ where: { email } });
  if (existingMember) {
    const membership = await db.clubMembership.findUnique({
      where: { clubId_userId: { clubId: club.id, userId: existingMember.id } },
    });
    if (membership?.status === "ACTIVE") {
      return { success: false, error: "User is already a member" };
    }
    if (!membership) {
      await db.clubMembership.create({
        data: {
          clubId: club.id,
          userId: existingMember.id,
          role: "MEMBER",
          status: "ACTIVE",
        },
      });
    } else {
      await db.clubMembership.update({
        where: { id: membership.id },
        data: { status: "ACTIVE" },
      });
    }
    await createNotification(
      existingMember.id,
      "CLUB_INVITE",
      {
        message: `You were added to ${club.name}`,
        clubSlug: club.slug,
        clubName: club.name,
      },
      club.id
    );
    return { success: true, data: { kind: "added", email } };
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const invite = await db.clubInvite.create({
    data: {
      clubId: club.id,
      email,
      invitedById: user.id,
      expiresAt,
    },
  });

  return {
    success: true,
    data: {
      kind: "pending",
      email,
      inviteToken: invite.token,
      inviteUrl: inviteAcceptUrl(invite.token),
    },
  };
}

export async function acceptInvite(token: string): Promise<ActionResult<{ clubSlug: string }>> {
  const { requireUser } = await import("@/lib/club-access");

  let user;
  try {
    user = await requireUser();
  } catch {
    return { success: false, error: "You must be logged in to accept an invite" };
  }

  const invite = await db.clubInvite.findUnique({
    where: { token },
    include: { club: true },
  });

  if (!invite) return { success: false, error: "Invite not found" };
  if (invite.acceptedAt) return { success: false, error: "Invite already accepted" };
  if (invite.expiresAt < new Date()) return { success: false, error: "Invite has expired" };
  if (invite.email.toLowerCase() !== user.email?.toLowerCase()) {
    return { success: false, error: "This invite was sent to a different email address" };
  }

  await db.$transaction([
    db.clubMembership.upsert({
      where: { clubId_userId: { clubId: invite.clubId, userId: user.id } },
      create: {
        clubId: invite.clubId,
        userId: user.id,
        role: "MEMBER",
        status: "ACTIVE",
      },
      update: { status: "ACTIVE" },
    }),
    db.clubInvite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    }),
  ]);

  return { success: true, data: { clubSlug: invite.club.slug } };
}
