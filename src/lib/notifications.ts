import type { NotificationType, Prisma } from "@prisma/client";
import { db } from "@/lib/db";

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

export async function getUnreadNotificationCount(userId: string) {
  return db.notification.count({
    where: { userId, readAt: null },
  });
}
