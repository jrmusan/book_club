import Link from "next/link";
import { markAllNotificationsRead } from "@/actions/notifications";
import { requireUser } from "@/lib/club-access";
import { getUserNotifications } from "@/lib/notifications";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
          notifications.map((n) => {
            const payload = n.payload as { message?: string; clubSlug?: string };
            const href =
              n.pollId && payload.clubSlug
                ? `/clubs/${payload.clubSlug}/polls/${n.pollId}`
                : payload.clubSlug
                  ? `/clubs/${payload.clubSlug}`
                  : null;

            const inner = (
              <Card className={!n.readAt ? "border-primary/30 bg-accent/30" : ""}>
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <p className="text-sm">{payload.message ?? n.type}</p>
                    <p className="text-xs text-muted-foreground">{n.createdAt.toLocaleString()}</p>
                  </div>
                  {!n.readAt && <Badge variant="secondary">New</Badge>}
                </CardContent>
              </Card>
            );

            if (!href) return <div key={n.id}>{inner}</div>;

            return (
              <Link key={n.id} href={href} className="block">
                {inner}
              </Link>
            );
          })
        )}
      </div>
    </main>
  );
}
