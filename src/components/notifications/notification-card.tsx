import type { NotificationType } from "@prisma/client";
import { openNotification } from "@/actions/notifications";
import { NotificationMessage } from "@/components/notifications/notification-message";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { LocalDateTime } from "@/components/ui/local-date-time";
import { cn } from "@/lib/utils";

export function NotificationCard({
  notification,
}: {
  notification: {
    id: string;
    type: NotificationType;
    payload: unknown;
    readAt: Date | null;
    createdAt: Date;
  };
}) {
  const unread = !notification.readAt;
  return (
    <form action={openNotification.bind(null, notification.id)}>
      <button type="submit" className="block w-full text-left">
        <Card
          className={cn(
            "transition-colors hover:border-primary/50",
            unread && "border-primary/30 bg-accent/30"
          )}
        >
          <CardContent className="flex items-center justify-between gap-3 py-4">
            <div className="min-w-0">
              <p className="text-sm leading-relaxed">
                <NotificationMessage type={notification.type} payload={notification.payload} />
              </p>
              <p className="text-xs text-muted-foreground">
                <LocalDateTime
                  iso={notification.createdAt.toISOString()}
                  options={{ dateStyle: "medium", timeStyle: "short" }}
                />
              </p>
            </div>
            {unread && (
              <Badge variant="secondary" className="shrink-0">
                New
              </Badge>
            )}
          </CardContent>
        </Card>
      </button>
    </form>
  );
}
