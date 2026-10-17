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
    <header className="sticky top-0 z-50 animate-soft-in border-b border-border/70 bg-[rgba(253,248,245,0.92)] pt-[env(safe-area-inset-top)] backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-4 sm:h-16">
        <Link
          href="/dashboard"
          className="font-display flex min-w-0 items-center gap-2 text-base font-semibold tracking-tight text-foreground transition-colors hover:text-primary sm:text-lg"
        >
          <BookOpen className="h-5 w-5 shrink-0 text-primary" strokeWidth={2.25} />
          <span className="truncate">Book Club</span>
        </Link>
        <div className="flex shrink-0 items-center gap-1 sm:gap-3">
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
