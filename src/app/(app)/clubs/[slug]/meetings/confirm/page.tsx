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
    return <p>Missing poll ID</p>;
  }

  return (
    <div className="mx-auto max-w-lg">
      <ConfirmMeetingForm clubSlug={slug} pollId={pollId} />
    </div>
  );
}
