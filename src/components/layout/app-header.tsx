import Link from "next/link";
import { Suspense } from "react";
import { Bell, BookOpen } from "lucide-react";
import { signOut } from "@/auth";
import { AccountMenu } from "@/components/layout/account-menu";
import { headerIconClass } from "@/components/layout/header-icon";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { requireUser } from "@/lib/club-access";
import { getUnreadNotificationCount } from "@/lib/notifications";
import { Badge } from "@/components/ui/badge";

/** Sync chrome so navigations aren't blocked on session/DB. */
export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 animate-soft-in border-b border-border/70 bg-[var(--header-bg)] pt-[env(safe-area-inset-top)] backdrop-blur-md transition-colors duration-300">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-4 sm:h-16">
        <Link
          href="/dashboard"
          className="font-display flex min-w-0 items-center gap-2 text-base font-semibold tracking-tight text-foreground transition-colors hover:text-primary sm:text-lg"
        >
          <BookOpen className="h-5 w-5 shrink-0 text-primary" strokeWidth={2.25} />
          <span className="truncate">Book Club</span>
        </Link>
        <div className="flex shrink-0 items-center gap-0.5">
          <Link href="/notifications" className={headerIconClass} aria-label="Notifications">
            <Bell className="h-5 w-5" strokeWidth={2.25} />
            <Suspense fallback={null}>
              <NotificationBadge />
            </Suspense>
          </Link>
          <Suspense fallback={<div className="h-10 w-10 animate-pulse rounded-full bg-muted" />}>
            <HeaderAccount />
          </Suspense>
          <ThemeToggle variant="plain" />
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
    <Badge className="pointer-events-none absolute -right-0.5 -top-0.5 h-5 min-w-5 justify-center px-1">
      {unreadCount > 99 ? "99+" : unreadCount}
    </Badge>
  );
}

async function HeaderAccount() {
  const user = await requireUser();

  async function signOutAction() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return <AccountMenu username={user.username} name={user.name} signOutAction={signOutAction} />;
}
