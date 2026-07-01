"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { confirmMeetingFromPoll } from "@/actions/polls";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ConfirmMeetingForm({ clubSlug, pollId }: { clubSlug: string; pollId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    formData.set("pollId", pollId);
    const scheduledAt = formData.get("scheduledAt") as string;
    formData.set("scheduledAt", new Date(scheduledAt).toISOString());
    const result = await confirmMeetingFromPoll(clubSlug, formData);
    if (!result.success) {
      setError(result.error);
      setLoading(false);
      return;
    }
    router.push(`/clubs/${clubSlug}/meetings`);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Confirm meeting</CardTitle>
        <CardDescription>Set the final date and time for this meeting.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="scheduledAt">Date & time</Label>
            <Input id="scheduledAt" name="scheduledAt" type="datetime-local" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Input id="timezone" name="timezone" defaultValue="America/New_York" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea id="notes" name="notes" placeholder="Bring snacks!" />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Confirming…" : "Confirm meeting"}
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/clubs/${clubSlug}/meetings`}>Cancel</Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
