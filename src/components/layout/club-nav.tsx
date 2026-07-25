"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Home, ListChecks, Star, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "", label: "Overview", icon: Home, match: "exact" as const },
  { href: "/polls", label: "Polls", icon: ListChecks, match: "prefix" as const },
  { href: "/meetings", label: "Meetings", icon: Calendar, match: "prefix" as const },
  { href: "/books", label: "Books", icon: Star, match: "prefix" as const },
  { href: "/rankings", label: "Rankings", icon: Star, match: "prefix" as const },
  { href: "/settings/members", label: "Members", icon: Users, match: "prefix" as const },
];

export function ClubNav({ slug, isOwner }: { slug: string; isOwner: boolean }) {
  const pathname = usePathname();
  const base = `/clubs/${slug}`;
  const visibleLinks = isOwner ? links : links.filter((l) => l.href !== "/settings/members");

  return (
    <nav className="flex flex-wrap gap-2 border-b border-border pb-4">
      {visibleLinks.map(({ href, label, icon: Icon, match }) => {
        const target = `${base}${href}`;
        const isActive =
          match === "exact" ? pathname === target : pathname === target || pathname.startsWith(`${target}/`);

        return (
          <Link
            key={href || "home"}
            href={target}
            className={cn(
              "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
      {isOwner && (
        <Link
          href={`${base}/polls/new`}
          className="ml-auto inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          New poll
        </Link>
      )}
    </nav>
  );
}
