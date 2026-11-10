"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { requestEmailSignIn } from "@/actions/auth";
import { safeCallbackUrl } from "@/lib/safe-callback-url";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function authErrorMessage(code: string) {
  switch (code) {
    case "Verification":
      return "That sign-in link is invalid or has expired. Request a new one.";
    case "Configuration":
      return "Sign-in email is not configured yet.";
    case "AccessDenied":
      return "Sign-in was denied for that email.";
    default:
      return "Could not sign you in. Request a new link.";
  }
}

export function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = safeCallbackUrl(searchParams.get("callbackUrl"));
  const urlError = searchParams.get("error");
  const [error, setError] = useState<string | null>(urlError ? authErrorMessage(urlError) : null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    formData.set("callbackUrl", callbackUrl);
    const result = await requestEmailSignIn(formData);
    if (result && !result.success) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
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
          <CardTitle>Sign in with email</CardTitle>
          <CardDescription>
            We&apos;ll send a one-time link. A new email creates your account when you open it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Sending link…" : "Email me a sign-in link"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
