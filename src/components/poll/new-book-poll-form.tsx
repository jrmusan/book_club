"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookSearchPicker } from "@/components/book/book-search-picker";
import { createBookPoll } from "@/actions/polls";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { BookSearchResult } from "@/lib/books";

export function NewBookPollForm({ clubSlug }: { clubSlug: string }) {
  const router = useRouter();
  const [selected, setSelected] = useState<(BookSearchResult & { id?: string })[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    const bookIds = selected.map((b) => b.id).filter(Boolean) as string[];
    if (bookIds.length < 2) {
      setError("Add at least 2 books");
      return;
    }
    setLoading(true);
    setError(null);
    formData.set("bookIds", JSON.stringify(bookIds));
    const result = await createBookPoll(clubSlug, formData);
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
        <CardTitle>New book poll</CardTitle>
        <CardDescription>Search for books and add them as poll options.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Poll title</Label>
            <Input id="title" name="title" required placeholder="What should we read in March?" />
          </div>
          <BookSearchPicker selected={selected} onChange={setSelected} />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Creating…" : "Create poll"}
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/clubs/${clubSlug}/polls`}>Cancel</Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
