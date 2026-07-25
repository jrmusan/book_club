import { Suspense } from "react";
import { RegisterForm } from "@/components/auth/auth-forms";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <Suspense fallback={<div className="h-80 w-full max-w-md animate-pulse rounded-lg bg-muted" />}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
