import { Suspense } from "react";
import { AppHeader, AppHeaderFallback } from "@/components/layout/app-header";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={<AppHeaderFallback />}>
        <AppHeader />
      </Suspense>
      {children}
    </div>
  );
}
