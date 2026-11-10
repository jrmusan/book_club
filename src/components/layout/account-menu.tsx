"use client";

import { useTransition } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { LogOut, UserRound } from "lucide-react";
import { headerIconClass } from "@/components/layout/header-icon";

export function AccountMenu({
  name,
  email,
  signOutAction,
}: {
  name?: string | null;
  email?: string | null;
  signOutAction: () => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();
  const title = name?.trim() || email || "Account";
  const detail = name?.trim() && email ? email : null;

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className={headerIconClass} aria-label={`Account menu for ${title}`}>
        <UserRound className="h-5 w-5" strokeWidth={2.25} />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={10}
          className="z-[80] min-w-52 rounded-2xl border border-border bg-card p-1.5 text-foreground shadow-lg"
        >
          <div className="px-3 py-2">
            <p className="text-sm font-semibold leading-tight">{title}</p>
            {detail && <p className="text-xs text-muted-foreground">{detail}</p>}
          </div>
          <DropdownMenu.Separator className="my-1 h-px bg-border" />
          <DropdownMenu.Item
            disabled={pending}
            className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm outline-none data-[highlighted]:bg-accent/70"
            onSelect={() => {
              startTransition(() => {
                void signOutAction();
              });
            }}
          >
            <LogOut className="h-4 w-4" strokeWidth={2.25} />
            {pending ? "Signing out…" : "Sign out"}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
