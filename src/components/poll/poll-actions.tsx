"use client";

import { useRouter } from "next/navigation";
import { publishPoll, closePoll } from "@/actions/polls";
import { Button } from "@/components/ui/button";

export function PollActions({
  clubSlug,
  pollId,
  status,
  pollType,
}: {
  clubSlug: string;
  pollId: string;
  status: string;
  pollType: string;
}) {
  const router = useRouter();

  async function handlePublish() {
    await publishPoll(clubSlug, pollId);
    router.refresh();
  }

  async function handleClose() {
    await closePoll(clubSlug, pollId);
    router.refresh();
  }

  return (
    <div className="flex gap-2 rounded-lg border border-border bg-accent/50 p-4">
      {status === "DRAFT" && (
        <Button onClick={handlePublish}>Publish poll to club</Button>
      )}
      {status === "OPEN" && (
        <Button variant="secondary" onClick={handleClose}>
          Close poll
        </Button>
      )}
      {status === "CLOSED" && pollType === "BOOK_SELECTION" && (
        <p className="text-sm text-muted-foreground">Poll closed. Winner shown in results above.</p>
      )}
    </div>
  );
}
