import Link from "next/link";
import { redirect } from "next/navigation";
import { acceptInvite } from "@/actions/auth";
import { auth } from "@/auth";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const session = await auth();
  const callbackPath = `/invite/${token}`;

  if (!session?.user) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="fixed right-[max(1rem,env(safe-area-inset-right))] top-[max(0.75rem,env(safe-area-inset-top))] z-[60]">
          <ThemeToggle />
        </div>
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold">You&apos;re invited</h1>
          <p className="mt-2 text-muted-foreground">
            Sign in with the email this invite was sent to, or create an account with that email,
            then accept the invite.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild>
              <Link href={`/login?callbackUrl=${encodeURIComponent(callbackPath)}`}>Sign in</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/register?callbackUrl=${encodeURIComponent(callbackPath)}`}>
                Create account
              </Link>
            </Button>
          </div>
        </div>
      </main>
    );
  }

  const result = await acceptInvite(token);
  if (result.success && result.data) {
    redirect(`/clubs/${result.data.clubSlug}`);
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="fixed right-[max(1rem,env(safe-area-inset-right))] top-[max(0.75rem,env(safe-area-inset-top))] z-[60]">
        <ThemeToggle />
      </div>
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold">Invite error</h1>
        <p className="mt-2 text-muted-foreground">
          {!result.success ? result.error : "Something went wrong"}
        </p>
        <Button className="mt-6" asChild>
          <Link href="/dashboard">Go to dashboard</Link>
        </Button>
      </div>
    </main>
  );
}
