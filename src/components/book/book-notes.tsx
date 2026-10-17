"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveBookNote } from "@/actions/book-notes";
import { Button } from "@/components/ui/button";
import { Label, Textarea } from "@/components/ui/input";
import type { SharedBookNote } from "@/lib/book-notes";

const MAX_LENGTH = 8000;

export function BookNotes({
  clubSlug,
  bookId,
  initialBody,
  others,
}: {
  clubSlug: string;
  bookId: string;
  initialBody: string;
  others: SharedBookNote[];
}) {
  const router = useRouter();
  const [body, setBody] = useState(initialBody);
  const [savedBody, setSavedBody] = useState(initialBody);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const unchanged = body.trim() === savedBody.trim();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSaved(false);

    const result = await saveBookNote(clubSlug, bookId, body);
    setLoading(false);

    if (!result.success) {
      setError(result.error ?? "Could not save notes");
      return;
    }

    const next = body.trim();
    setBody(next);
    setSavedBody(next);
    setSaved(true);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold">Reading notes</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Save quotes, questions, and reactions. Everyone in the club can read them.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor={`notes-${bookId}`}>Your notes</Label>
          <Textarea
            id={`notes-${bookId}`}
            name="body"
            value={body}
            onChange={(event) => {
              setBody(event.target.value);
              setSaved(false);
            }}
            placeholder="What are you thinking about this book?"
            rows={5}
            maxLength={MAX_LENGTH}
          />
          <p className="text-xs text-muted-foreground">
            {body.length.toLocaleString()} / {MAX_LENGTH.toLocaleString()}
          </p>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex items-center gap-3">
          <Button type="submit" size="sm" disabled={loading || unchanged || body.length > MAX_LENGTH}>
            {loading ? "Saving…" : savedBody ? "Update notes" : "Save notes"}
          </Button>
          {saved && <p className="text-sm text-muted-foreground">Saved</p>}
        </div>
      </form>

      {others.length > 0 && (
        <div className="space-y-3 border-t border-border pt-4">
          <h4 className="text-sm font-semibold">Club notes</h4>
          <ul className="space-y-3">
            {others.map((note) => (
              <li key={note.id} className="rounded-lg border border-border px-3 py-2.5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm font-medium">
                    {note.displayName}
                    <span className="ml-1.5 font-normal text-muted-foreground">@{note.username}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{note.updatedAtLabel}</p>
                </div>
                <p className="mt-1.5 whitespace-pre-wrap text-sm text-muted-foreground">{note.body}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
