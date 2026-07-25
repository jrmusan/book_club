"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Mail, X } from "lucide-react";
import { cancelInvite } from "@/actions/club-members";
import { inviteMailtoHref } from "@/lib/invite-share";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function PendingInviteRow({
  inviteId,
  clubSlug,
  email,
  expiresAt,
  inviteUrl,
  clubName,
}: {
  inviteId: string;
  clubSlug: string;
  email: string;
  expiresAt: string;
  inviteUrl: string;
  clubName: string;
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function copyLink() {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  function onCancel() {
    if (!window.confirm(`Cancel the invite for ${email}?`)) return;
    setError(null);
    startTransition(async () => {
      const result = await cancelInvite(clubSlug, inviteId);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm">
          <p className="font-medium">{email}</p>
          <p className="text-muted-foreground">
            Expires {new Date(expiresAt).toLocaleDateString()}
          </p>
          {error && <p className="mt-1 text-destructive">{error}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={copyLink} disabled={pending}>
            {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
            {copied ? "Copied" : "Copy link"}
          </Button>
          <Button type="button" variant="outline" size="sm" asChild>
            <a href={inviteMailtoHref({ to: email, clubName, inviteUrl })}>
              <Mail className="mr-2 h-4 w-4" />
              Mail app
            </a>
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={onCancel}
            disabled={pending}
          >
            <X className="mr-2 h-4 w-4" />
            {pending ? "Canceling…" : "Cancel"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
