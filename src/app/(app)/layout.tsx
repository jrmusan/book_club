import Image from "next/image";
import { Suspense } from "react";
import { AppHeader, AppHeaderFallback } from "@/components/layout/app-header";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Suspense fallback={<AppHeaderFallback />}>
        <AppHeader />
      </Suspense>
      <div className="flex-1">{children}</div>
      <div className="pointer-events-none relative mt-8 select-none" aria-hidden>
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-background to-transparent" />
        <Image
          src="/cozy-bookshelf.jpg"
          alt=""
          width={1600}
          height={400}
          className="mx-auto h-auto w-full max-w-4xl object-contain object-bottom opacity-70"
        />
      </div>
    </div>
  );
}
