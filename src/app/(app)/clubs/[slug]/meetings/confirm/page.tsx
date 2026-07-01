import { ConfirmMeetingForm } from "@/components/meeting/confirm-meeting-form";
import { requireClubOwnerBySlug, requireUser } from "@/lib/club-access";

export default async function ConfirmMeetingPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ pollId?: string }>;
}) {
  const { slug } = await params;
  const { pollId } = await searchParams;
  const user = await requireUser();
  await requireClubOwnerBySlug(slug, user.id);

  if (!pollId) {
    return <main className="p-8">Missing poll ID</main>;
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <ConfirmMeetingForm clubSlug={slug} pollId={pollId} />
    </main>
  );
}
