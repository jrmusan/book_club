"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { confirmMeetingFromPoll } from "@/actions/polls";
import { toLocalInputValue } from "@/components/poll/poll-deadline-field";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ConfirmMeetingForm({
  clubSlug,
  pollId,
  winningOption,
}: {
  clubSlug: string;
  pollId: string;
  winningOption: { place: string | null; startsAt: string | null } | null;
}) {
  const router = useRouter();
  const [scheduledAt, setScheduledAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // The local datetime string depends on the viewer's timezone, so it is only known in the browser.
  useEffect(() => {
    if (winningOption?.startsAt) {
      setScheduledAt(toLocalInputValue(new Date(winningOption.startsAt)));
    }
  }, [winningOption?.startsAt]);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    formData.set("pollId", pollId);
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
        <CardDescription>
          {winningOption?.place
            ? `Winning option: ${winningOption.place}. Check the date and time, then confirm.`
            : "Set the final date and time for this meeting."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="scheduledAt">Date & time</Label>
            <Input
              id="scheduledAt"
              name="scheduledAt"
              type="datetime-local"
              required
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
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
