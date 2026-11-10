import Link from "next/link";
import { BookOpen } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function CheckEmailPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-4 py-10 sm:py-16">
      <div className="animate-fade-up w-full max-w-md space-y-6">
        <Link
          href="/"
          className="font-display flex items-center justify-center gap-2 text-xl font-semibold tracking-tight text-foreground transition-colors hover:text-primary"
        >
          <BookOpen className="h-6 w-6 text-primary" strokeWidth={2.25} />
          Book Club
        </Link>
        <Card>
          <CardHeader>
            <CardTitle>Check your email</CardTitle>
            <CardDescription>
              We sent a sign-in link. It expires in one hour and works once. After you open it,
              you&apos;re signed in.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Wrong address?{" "}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Try again
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
