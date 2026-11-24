"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/club-access";
import { notificationHref } from "@/lib/notifications";
import type { ActionResult } from "@/actions/auth";

export async function markNotificationRead(notificationId: string): Promise<ActionResult> {
  let user;
  try {
    user = await requireUser();
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  await db.notification.updateMany({
    where: { id: notificationId, userId: user.id },
    data: { readAt: new Date() },
  });

  revalidatePath("/notifications");
  revalidatePath("/dashboard");
  return { success: true };
}

/** Marks a notification read and goes to the poll or club it is about. */
export async function openNotification(notificationId: string) {
  const user = await requireUser();
  const notification = await db.notification.findFirst({
    where: { id: notificationId, userId: user.id },
    select: { id: true, readAt: true, pollId: true, payload: true, club: { select: { slug: true } } },
  });
  if (!notification) redirect("/notifications");

  if (!notification.readAt) {
    await db.notification.update({ where: { id: notification.id }, data: { readAt: new Date() } });
  }
  const clubSlug =
    notification.club?.slug ?? (notification.payload as { clubSlug?: string } | null)?.clubSlug;
  redirect(notificationHref(clubSlug, notification.pollId) ?? "/notifications");
}

export async function markAllNotificationsRead(): Promise<ActionResult> {
  let user;
  try {
    user = await requireUser();
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  await db.notification.updateMany({
    where: { userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });

  revalidatePath("/notifications");
  revalidatePath("/dashboard");
  return { success: true };
}
