"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/club-access";
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
  return { success: true };
}
