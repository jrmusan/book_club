import { cache } from "react";
import type { NotificationType, Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export function notificationHref(clubSlug: string | null | undefined, pollId: string | null) {
  if (!clubSlug) return null;
  return pollId ? `/clubs/${clubSlug}/polls/${pollId}` : `/clubs/${clubSlug}`;
}

/** Clears the viewer's unread notifications about a poll once they look at it. */
export async function markPollNotificationsRead(userId: string, pollId: string) {
  await db.notification.updateMany({
    where: { userId, pollId, readAt: null },
    data: { readAt: new Date() },
  });
}

export async function createNotificationsForClubMembers(
  clubId: string,
  excludeUserId: string,
  type: NotificationType,
  payload: Prisma.InputJsonValue,
  pollId?: string
) {
  const members = await db.clubMembership.findMany({
    where: { clubId, status: "ACTIVE", userId: { not: excludeUserId } },
    select: { userId: true },
  });

  if (members.length === 0) return;

  await db.notification.createMany({
    data: members.map((m) => ({
      userId: m.userId,
      type,
      payload,
      clubId,
      pollId,
    })),
  });
}

export async function createNotification(
  userId: string,
  type: NotificationType,
  payload: Prisma.InputJsonValue,
  clubId?: string,
  pollId?: string
) {
  return db.notification.create({
    data: { userId, type, payload, clubId, pollId },
  });
}

export const getUnreadNotificationCount = cache(async (userId: string) => {
  return db.notification.count({
    where: { userId, readAt: null },
  });
});

export const getRecentUnreadNotifications = cache(async (userId: string, take = 5) => {
  return db.notification.findMany({
    where: { userId, readAt: null },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      type: true,
      payload: true,
      createdAt: true,
    },
  });
});

export const getUserNotifications = cache(async (userId: string) => {
  return db.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      club: { select: { name: true, slug: true } },
      poll: { select: { title: true, id: true } },
    },
  });
});
