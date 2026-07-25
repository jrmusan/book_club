import { Card, CardContent } from "@/components/ui/card";

export type MemberRankingList = {
  userId: string;
  displayName: string;
  username: string;
  books: {
    id: string;
    title: string;
    authors: string[];
    coverUrl: string | null;
    rank: number;
  }[];
};

export function MemberRankings({
  members,
  currentUserId,
}: {
  members: MemberRankingList[];
  currentUserId: string;
}) {
  const others = members.filter((m) => m.userId !== currentUserId && m.books.length > 0);

  if (others.length === 0) {
    return (
      <p className="text-muted-foreground">
        No other members have submitted rankings yet.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {others.map((member) => (
        <div key={member.userId}>
          <h3 className="mb-3 text-base font-semibold">
            {member.displayName}
            <span className="ml-1.5 font-normal text-muted-foreground">
              @{member.username}
            </span>
          </h3>
          <ol className="space-y-2">
            {member.books.map((book) => (
              <li key={book.id}>
                <Card>
                  <CardContent className="flex items-center gap-3 py-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold">
                      {book.rank}
                    </span>
                    {book.coverUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={book.coverUrl}
                        alt=""
                        className="h-12 w-8 rounded object-cover"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-medium">{book.title}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {book.authors.join(", ")}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}
