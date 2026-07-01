import Link from "next/link";
import { Bell, BookOpen, LogOut } from "lucide-react";
import { signOut } from "@/auth";
import { getUnreadNotificationCount } from "@/lib/notifications";
import { requireUser } from "@/lib/club-access";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export async function AppHeader() {
  const user = await requireUser();
  const unreadCount = await getUnreadNotificationCount(user.id!);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <BookOpen className="h-5 w-5 text-primary" />
          Book Club
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/notifications" className="relative">
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <Bell className="h-5 w-5" />
            </Button>
            {unreadCount > 0 && (
              <Badge className="absolute -right-1 -top-1 h-5 min-w-5 justify-center px-1">
                {unreadCount}
              </Badge>
            )}
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
