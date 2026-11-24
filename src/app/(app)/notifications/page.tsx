import { markAllNotificationsRead } from "@/actions/notifications";
import { NotificationCard } from "@/components/notifications/notification-card";
import { requireUser } from "@/lib/club-access";
import { getUserNotifications } from "@/lib/notifications";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function NotificationsPage() {
  const user = await requireUser();
  const notifications = await getUserNotifications(user.id);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Notifications</h1>
        <form
          action={async () => {
            "use server";
            await markAllNotificationsRead();
          }}
        >
          <Button variant="outline" size="sm" type="submit">
            Mark all read
          </Button>
        </form>
      </div>

      <div className="space-y-2">
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No notifications yet.
            </CardContent>
          </Card>
        ) : (
          notifications.map((n) => <NotificationCard key={n.id} notification={n} />)
        )}
      </div>
    </main>
  );
}
