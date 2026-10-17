"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Home, ListChecks, Plus, Star, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "", label: "Home", icon: Home, match: "exact" as const },
  { href: "/polls", label: "Polls", icon: ListChecks, match: "prefix" as const },
  { href: "/meetings", label: "Meet", icon: Calendar, match: "prefix" as const },
  { href: "/books", label: "Books", icon: Star, match: "prefix" as const },
  { href: "/rankings", label: "Ranks", icon: Star, match: "prefix" as const },
  { href: "/settings/members", label: "Members", icon: Users, match: "prefix" as const },
];

const fullLabels: Record<string, string> = {
  "": "Overview",
  "/polls": "Polls",
  "/meetings": "Meetings",
  "/books": "Books",
  "/rankings": "Rankings",
  "/settings/members": "Members",
};

export function ClubNav({ slug, isOwner }: { slug: string; isOwner: boolean }) {
  const pathname = usePathname();
  const base = `/clubs/${slug}`;
  const visibleLinks = isOwner ? links : links.filter((l) => l.href !== "/settings/members");

  return (
    <nav className="-mx-4 sm:mx-0">
      <div className="cozy-panel flex items-stretch gap-1 overflow-x-auto overscroll-x-contain rounded-none border-x-0 p-1.5 scrollbar-none sm:rounded-2xl sm:border-x sm:p-2">
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
                "inline-flex shrink-0 touch-manipulation items-center gap-1.5 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all duration-200 sm:gap-2 sm:px-3 sm:py-2",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent/80 hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="sm:hidden">{label}</span>
              <span className="hidden sm:inline">{fullLabels[href] ?? label}</span>
            </Link>
          );
        })}
        <Link
          href={`${base}/polls/new`}
          className="ml-auto inline-flex shrink-0 touch-manipulation items-center gap-1.5 rounded-2xl bg-rose px-3 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-200 hover:brightness-105 sm:gap-2"
        >
          <Plus className="h-4 w-4 sm:hidden" />
          <span className="sm:hidden">New</span>
          <span className="hidden sm:inline">New poll</span>
        </Link>
      </div>
    </nav>
  );
}
