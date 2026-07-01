"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { saveBookRankings } from "@/actions/polls";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type RankBook = {
  id: string;
  title: string;
  authors: string[];
  coverUrl: string | null;
  rating?: number;
};

function SortableBook({ book, rank }: { book: RankBook; rank: number }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: book.id });

  return (
    <Card ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}>
      <CardContent className="flex items-center gap-3 py-4">
        <button type="button" className="cursor-grab text-muted-foreground" {...attributes} {...listeners}>
          <GripVertical className="h-5 w-5" />
        </button>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
          {rank}
        </span>
        {book.coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={book.coverUrl} alt="" className="h-14 w-10 rounded object-cover" />
        )}
        <div>
          <p className="font-medium">{book.title}</p>
          <p className="text-sm text-muted-foreground">{book.authors.join(", ")}</p>
          {book.rating && (
            <p className="text-xs text-muted-foreground">Your rating: {book.rating}/5</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function BookRankingList({
  clubSlug,
  books,
  initialOrder,
}: {
  clubSlug: string;
  books: RankBook[];
  initialOrder: string[];
}) {
  const orderedBooks =
    initialOrder.length > 0
      ? initialOrder
          .map((id) => books.find((b) => b.id === id))
          .filter(Boolean) as RankBook[]
      : [...books];

  const [items, setItems] = useState(orderedBooks);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setItems((prev) => {
      const oldIndex = prev.findIndex((b) => b.id === active.id);
      const newIndex = prev.findIndex((b) => b.id === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
    setSaved(false);
  }

  async function handleSave() {
    setLoading(true);
    const result = await saveBookRankings(
      clubSlug,
      items.map((book, index) => ({ bookId: book.id, rank: index + 1 }))
    );
    setLoading(false);
    if (result.success) setSaved(true);
  }

  if (books.length === 0) {
    return (
      <p className="text-muted-foreground">
        Rate some books first, then come back to stack-rank your favorites.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Drag to reorder — #1 is your all-time favorite in this club.
      </p>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((b) => b.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {items.map((book, index) => (
              <SortableBook key={book.id} book={book} rank={index + 1} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <Button onClick={handleSave} disabled={loading}>
        {loading ? "Saving…" : saved ? "Saved!" : "Save rankings"}
      </Button>
    </div>
  );
}
