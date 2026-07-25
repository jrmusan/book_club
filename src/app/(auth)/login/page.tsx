import { Suspense } from "react";
import { LoginForm } from "@/components/auth/auth-forms";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <Suspense fallback={<div className="h-80 w-full max-w-md animate-pulse rounded-lg bg-muted" />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
