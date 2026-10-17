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
    <nav className="flex flex-wrap gap-1.5 border-b border-border/80 pb-4">
      {visibleLinks.map(({ href, label, icon: Icon, match }) => {
        const target = `${base}${href}`;
        const isActive =
          match === "exact"
            ? pathname === target
            : pathname === target || pathname.startsWith(`${target}/`);

        return (
          <Link
            key={href || "home"}
            href={target}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-primary/12 text-primary shadow-[inset_0_-2px_0_0_var(--primary)]"
                : "text-muted-foreground hover:bg-accent/70 hover:text-foreground"
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
          className="ml-auto inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-all duration-200 hover:brightness-110"
        >
          New poll
        </Link>
      )}
    </nav>
  );
}
