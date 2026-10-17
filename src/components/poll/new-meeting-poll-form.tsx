"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, X } from "lucide-react";
import { PollDeadlineField, defaultPollDeadline } from "@/components/poll/poll-deadline-field";
import { createMeetingPoll } from "@/actions/polls";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function NewMeetingPollForm({ clubSlug }: { clubSlug: string }) {
  const router = useRouter();
  const [options, setOptions] = useState(["", ""]);
  const [closesAt, setClosesAt] = useState(() => defaultPollDeadline(72));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function updateOption(index: number, value: string) {
    setOptions((prev) => prev.map((o, i) => (i === index ? value : o)));
  }

  async function handleSubmit(formData: FormData) {
    const validOptions = options.map((o) => o.trim()).filter(Boolean);
    if (validOptions.length < 2) {
      setError("Add at least 2 meeting options");
      return;
    }
    if (!closesAt) {
      setError("Set a voting deadline");
      return;
    }
    setLoading(true);
    setError(null);
    formData.set("options", JSON.stringify(validOptions));
    formData.set("closesAt", closesAt);
    const result = await createMeetingPoll(clubSlug, formData);
    if (!result.success) {
      setError(result.error);
      setLoading(false);
      return;
    }
    router.push(`/clubs/${clubSlug}/polls/${result.data!.pollId}`);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>New meeting poll</CardTitle>
        <CardDescription>Add time and place options for members to vote on.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Poll title</Label>
            <Input id="title" name="title" required placeholder="March meetup — when & where?" />
          </div>
          <PollDeadlineField value={closesAt} onChange={setClosesAt} />
          <div className="space-y-3">
            <Label>Options</Label>
            {options.map((option, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  placeholder="Tue Mar 12, 7pm @ Central Library"
                />
                {options.length > 2 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setOptions((prev) => prev.filter((_, i) => i !== index))}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOptions((prev) => [...prev, ""])}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add option
            </Button>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Creating…" : "Create poll"}
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
