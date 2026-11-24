"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { publishPoll, closePoll, deletePoll } from "@/actions/polls";
import { Button } from "@/components/ui/button";

export function PollActions({
  clubSlug,
  pollId,
  pollTitle,
  status,
  pollType,
  canDelete = false,
}: {
  clubSlug: string;
  pollId: string;
  pollTitle: string;
  status: string;
  pollType: string;
  canDelete?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePublish() {
    await publishPoll(clubSlug, pollId);
    router.refresh();
  }

  async function handleClose() {
    if (!window.confirm(`Close voting on "${pollTitle}" now? Members won't be able to vote after this.`)) {
      return;
    }
    setBusy(true);
    setError(null);
    const result = await closePoll(clubSlug, pollId);
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  async function handleDelete() {
    if (
      !window.confirm(
        `Delete "${pollTitle}"? Its options and every vote will be removed for everyone. This can't be undone.`
      )
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    const result = await deletePoll(clubSlug, pollId);
    if (!result.success) {
      setError(result.error);
      setBusy(false);
      return;
    }
    router.push(pollType === "MEETING" ? `/clubs/${clubSlug}/meetings` : `/clubs/${clubSlug}/polls`);
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-border bg-accent/50 p-3 sm:p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {status === "DRAFT" && (
          <Button className="w-full sm:w-auto" onClick={handlePublish} disabled={busy}>
            Publish poll to club
          </Button>
        )}
        {status === "OPEN" && (
          <Button className="w-full sm:w-auto" variant="secondary" onClick={handleClose} disabled={busy}>
            Close poll early
          </Button>
        )}
        {status === "CLOSED" && pollType === "BOOK_SELECTION" && (
          <p className="text-sm text-muted-foreground">Poll closed. Winner shown in results above.</p>
        )}
        {canDelete && (
          <Button
            className="w-full sm:ml-auto sm:w-auto"
            variant="destructive"
            onClick={handleDelete}
            disabled={busy}
          >
            <Trash2 className="mr-2 h-4 w-4" aria-hidden />
            Delete poll
          </Button>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}
