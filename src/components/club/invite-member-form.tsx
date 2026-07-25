"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Mail } from "lucide-react";
import { inviteMember } from "@/actions/auth";
import { inviteMailtoHref } from "@/lib/invite-share";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type InviteResult =
  | { kind: "added"; email: string }
  | { kind: "pending"; email: string; inviteUrl: string };

export function InviteMemberForm({
  clubSlug,
  clubName,
}: {
  clubSlug: string;
  clubName: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<InviteResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    setResult(null);
    setCopied(false);
    const response = await inviteMember(clubSlug, formData);
    if (!response.success) {
      setError(response.error);
    } else if (response.data) {
      setResult(response.data);
    }
    setLoading(false);
    router.refresh();
  }

  async function copyLink(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy — select the link and copy it manually.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invite member</CardTitle>
        <CardDescription>
          Enter their email to create an invite. Nothing is emailed automatically — you share the
          link (or open your mail app) yourself.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form action={handleSubmit} className="flex gap-2">
          <div className="flex-1 space-y-2">
            <Label htmlFor="email" className="sr-only">
              Email
            </Label>
            <Input id="email" name="email" type="email" required placeholder="friend@example.com" />
          </div>
          <Button type="submit" disabled={loading} className="self-end">
            {loading ? "Creating…" : "Create invite"}
          </Button>
        </form>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {result?.kind === "added" && (
          <p className="text-sm text-emerald-700">
            <strong>{result.email}</strong> already had an account, so they were added to the club.
            No email was sent — they&apos;ll see it when they next open the app.
          </p>
        )}

        {result?.kind === "pending" && (
          <div className="space-y-3 rounded-lg border border-border bg-muted/40 p-4">
            <p className="text-sm">
              Invite saved for <strong>{result.email}</strong>. Share this link with them:
            </p>
            <p className="break-all rounded-md bg-background px-3 py-2 font-mono text-xs">
              {result.inviteUrl}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => copyLink(result.inviteUrl)}>
                {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                {copied ? "Copied" : "Copy link"}
              </Button>
              <Button type="button" variant="outline" size="sm" asChild>
                <a
                  href={inviteMailtoHref({
                    to: result.email,
                    clubName,
                    inviteUrl: result.inviteUrl,
                  })}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Open in mail app
                </a>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
