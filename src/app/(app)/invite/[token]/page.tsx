import { redirect } from "next/navigation";
import { acceptInvite } from "@/actions/auth";
import { auth } from "@/auth";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect(`/login?callbackUrl=/invite/${token}`);
  }

  const result = await acceptInvite(token);
  if (result.success && result.data) {
    redirect(`/clubs/${result.data.clubSlug}`);
  }

  return (
    <main className="flex min-h-[50vh] items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Invite error</h1>
        <p className="mt-2 text-muted-foreground">
          {!result.success ? result.error : "Something went wrong"}
        </p>
      </div>
    </main>
  );
}
