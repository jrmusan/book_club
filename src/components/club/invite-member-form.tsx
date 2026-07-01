"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { inviteMember } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function InviteMemberForm({ clubSlug }: { clubSlug: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    setSuccess(null);
    const result = await inviteMember(clubSlug, formData);
    if (!result.success) {
      setError(result.error);
    } else {
      setSuccess("Invite sent! If they already have an account, they were added immediately.");
    }
    setLoading(false);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invite member</CardTitle>
        <CardDescription>Invite someone by email address.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="flex gap-2">
          <div className="flex-1 space-y-2">
            <Label htmlFor="email" className="sr-only">
              Email
            </Label>
            <Input id="email" name="email" type="email" required placeholder="friend@example.com" />
          </div>
          <Button type="submit" disabled={loading} className="self-end">
            {loading ? "Sending…" : "Invite"}
          </Button>
        </form>
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        {success && <p className="mt-2 text-sm text-emerald-600">{success}</p>}
      </CardContent>
    </Card>
  );
}
