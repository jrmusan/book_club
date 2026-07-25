"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserMinus } from "lucide-react";
import { removeMember } from "@/actions/club-members";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function MemberRow({
  clubSlug,
  userId,
  displayName,
  username,
  email,
  role,
  canRemove,
}: {
  clubSlug: string;
  userId: string;
  displayName: string;
  username: string;
  email: string;
  role: "OWNER" | "MEMBER";
  canRemove: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onRemove() {
    if (!window.confirm(`Remove ${displayName} (@${username}) from the club?`)) return;
    setError(null);
    startTransition(async () => {
      const result = await removeMember(clubSlug, userId);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 py-4">
        <div className="min-w-0">
          <CardTitle className="text-base">{displayName}</CardTitle>
          <CardContent className="p-0 text-sm text-muted-foreground">
            @{username} · {email}
          </CardContent>
          {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {role === "OWNER" && <Badge>Owner</Badge>}
          {canRemove && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onRemove}
              disabled={pending}
            >
              <UserMinus className="mr-2 h-4 w-4" />
              {pending ? "Removing…" : "Remove"}
            </Button>
          )}
        </div>
      </CardHeader>
    </Card>
  );
}
