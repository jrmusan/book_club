import Link from "next/link";
import { Calendar, Home, ListChecks, Star, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "", label: "Overview", icon: Home },
  { href: "/polls", label: "Polls", icon: ListChecks },
  { href: "/meetings", label: "Meetings", icon: Calendar },
  { href: "/books", label: "Books", icon: Star },
  { href: "/rankings", label: "Rankings", icon: Star },
  { href: "/settings/members", label: "Members", icon: Users },
];

export function ClubNav({ slug, isOwner }: { slug: string; isOwner: boolean }) {
  const visibleLinks = isOwner ? links : links.filter((l) => l.href !== "/settings/members");

  return (
    <nav className="flex flex-wrap gap-2 border-b border-border pb-4">
      {visibleLinks.map(({ href, label, icon: Icon }) => (
        <Link
          key={href || "home"}
          href={`/clubs/${slug}${href}`}
          className={cn(
            "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}
        >
          <Icon className="h-4 w-4" />
          {label}
        </Link>
      ))}
      {isOwner && (
        <Link
          href={`/clubs/${slug}/polls/new`}
          className="ml-auto inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          New poll
        </Link>
      )}
    </nav>
  );
}
