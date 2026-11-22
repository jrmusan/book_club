"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, X } from "lucide-react";
import {
  PollDeadlineField,
  defaultPollDeadline,
  useMinLocalDateTime,
} from "@/components/poll/poll-deadline-field";
import { createMeetingPoll } from "@/actions/polls";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type MeetingOption = { place: string; startsAt: string };

const emptyOption = (): MeetingOption => ({ place: "", startsAt: "" });

export function NewMeetingPollForm({ clubSlug }: { clubSlug: string }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [options, setOptions] = useState<MeetingOption[]>(() => [emptyOption(), emptyOption()]);
  const [closesAt, setClosesAt] = useState(() => defaultPollDeadline(72));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const minStartsAt = useMinLocalDateTime();

  function updateOption(index: number, patch: Partial<MeetingOption>) {
    setOptions((prev) => prev.map((o, i) => (i === index ? { ...o, ...patch } : o)));
  }

  async function handleSubmit(formData: FormData) {
    const filled = options
      .map((o) => ({ place: o.place.trim(), startsAt: o.startsAt }))
      .filter((o) => o.place || o.startsAt);
    if (filled.some((o) => !o.place || !o.startsAt)) {
      setError("Each option needs both a place and a date & time");
      return;
    }
    if (filled.length < 2) {
      setError("Add at least 2 meeting options");
      return;
    }
    if (!closesAt) {
      setError("Set a voting deadline");
      return;
    }
    setLoading(true);
    setError(null);
    formData.set(
      "options",
      JSON.stringify(
        filled.map((o) => ({ place: o.place, startsAt: new Date(o.startsAt).toISOString() }))
      )
    );
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
            <Input
              id="title"
              name="title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="March meetup — when & where?"
            />
          </div>
          <PollDeadlineField value={closesAt} onChange={setClosesAt} />
          <div className="space-y-3">
            <Label>Options</Label>
            {options.map((option, index) => (
              <div key={index} className="flex items-start gap-2">
                <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
                  <Input
                    aria-label={`Option ${index + 1} place`}
                    value={option.place}
                    onChange={(e) => updateOption(index, { place: e.target.value })}
                    placeholder="Central Library"
                  />
                  <Input
                    aria-label={`Option ${index + 1} date and time`}
                    type="datetime-local"
                    min={minStartsAt}
                    value={option.startsAt}
                    onChange={(e) => updateOption(index, { startsAt: e.target.value })}
                    className="min-w-0 max-w-full"
                  />
                </div>
                {options.length > 2 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove option ${index + 1}`}
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
              onClick={() => setOptions((prev) => [...prev, emptyOption()])}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add option
            </Button>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button variant="outline" className="w-full sm:w-auto" asChild>
              <Link href={`/clubs/${clubSlug}/meetings`}>Cancel</Link>
            </Button>
            <Button type="submit" className="w-full sm:w-auto" disabled={loading}>
              {loading ? "Creating…" : "Create poll"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
