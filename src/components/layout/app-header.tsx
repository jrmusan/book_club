import Link from "next/link";
import { Suspense } from "react";
import { Bell, BookOpen, LogOut } from "lucide-react";
import { signOut } from "@/auth";
import { requireUser } from "@/lib/club-access";
import { getUnreadNotificationCount } from "@/lib/notifications";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/** Sync chrome so navigations aren't blocked on session/DB. */
export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 animate-soft-in border-b border-border/70 bg-[rgba(253,248,245,0.82)] backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link
          href="/dashboard"
          className="font-display flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground transition-colors hover:text-primary"
        >
          <BookOpen className="h-5 w-5 text-primary" strokeWidth={2.25} />
          Book Club
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/notifications" className="relative" aria-label="Notifications">
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <Bell className="h-5 w-5" />
            </Button>
            <Suspense fallback={null}>
              <NotificationBadge />
            </Suspense>
          </Link>
          <Suspense fallback={<div className="h-5 w-20 animate-pulse rounded bg-muted" />}>
            <HeaderUser />
          </Suspense>
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

async function NotificationBadge() {
  const user = await requireUser();
  const unreadCount = await getUnreadNotificationCount(user.id!);
  if (unreadCount <= 0) return null;

  return (
    <Badge className="absolute -right-0.5 -top-0.5 h-5 min-w-5 justify-center px-1 pointer-events-none">
      {unreadCount > 99 ? "99+" : unreadCount}
    </Badge>
  );
}

async function HeaderUser() {
  const user = await requireUser();
  return (
    <span className="hidden text-sm text-muted-foreground sm:inline">@{user.username}</span>
  );
}
