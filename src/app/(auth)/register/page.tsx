import { Suspense } from "react";
import { RegisterForm } from "@/components/auth/auth-forms";

export default function RegisterPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-4 py-10 sm:py-16">
      <Suspense
        fallback={<div className="h-96 w-full max-w-md animate-pulse rounded-xl bg-muted/80" />}
      >
        <RegisterForm />
      </Suspense>
    </div>
  );
}
