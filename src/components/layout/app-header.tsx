import Link from "next/link";
import { Suspense } from "react";
import { Bell, BookOpen, LogOut } from "lucide-react";
import { signOut } from "@/auth";
import { getUnreadNotificationCount } from "@/lib/notifications";
import { requireUser } from "@/lib/club-access";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

async function NotificationBadge({ userId }: { userId: string }) {
  const unreadCount = await getUnreadNotificationCount(userId);
  if (unreadCount <= 0) return null;

  return (
    <Badge className="absolute -right-1 -top-1 h-5 min-w-5 justify-center px-1">
      {unreadCount}
    </Badge>
  );
}

export async function AppHeader() {
  const user = await requireUser();

  return (
    <header className="sticky top-0 z-50 animate-soft-in border-b border-border/70 bg-card/75 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link
          href="/dashboard"
          className="font-display flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground transition-colors hover:text-primary"
        >
          <BookOpen className="h-5 w-5 text-primary" strokeWidth={2.25} />
          Book Club
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/notifications" className="relative">
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <Bell className="h-5 w-5" />
            </Button>
            <Suspense fallback={null}>
              <NotificationBadge userId={user.id!} />
            </Suspense>
          </Link>
          <span className="hidden text-sm text-muted-foreground sm:inline">
            @{user.username}
          </span>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <Button variant="ghost" size="icon" type="submit" aria-label="Sign out">
              <LogOut className="h-5 w-5" />
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}

export function AppHeaderFallback() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-card/75 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <div className="font-display flex items-center gap-2 text-lg font-semibold">
          <BookOpen className="h-5 w-5 text-primary" />
          Book Club
        </div>
        <div className="h-8 w-24 animate-pulse rounded-md bg-muted" />
      </div>
    </header>
  );
}
