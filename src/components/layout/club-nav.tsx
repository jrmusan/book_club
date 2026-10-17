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
    <nav className="cozy-panel flex flex-wrap gap-1.5 rounded-2xl p-2">
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
              "inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-accent/80 hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
      <Link
        href={`${base}/polls/new`}
        className="ml-auto inline-flex items-center gap-2 rounded-2xl bg-rose px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-200 hover:brightness-105"
      >
        New poll
      </Link>
    </nav>
  );
}
