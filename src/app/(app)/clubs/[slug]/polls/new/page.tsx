import { NewBookPollForm } from "@/components/poll/new-book-poll-form";
import { requireClubMemberBySlug, requireUser } from "@/lib/club-access";

export default async function NewPollPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireUser();
  await requireClubMemberBySlug(slug, user.id);

  return (
    <div className="mx-auto max-w-2xl">
      <NewBookPollForm clubSlug={slug} />
    </div>
  );
}
