import Image from "next/image";
import { AppHeader } from "@/components/layout/app-header";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <div className="flex-1">{children}</div>
      <div className="pointer-events-none relative mt-6 select-none sm:mt-8" aria-hidden>
        <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-background to-transparent sm:h-16" />
        <Image
          src="/cozy-bookshelf.jpg"
          alt=""
          width={1600}
          height={400}
          className="bookshelf-deco mx-auto h-auto max-h-28 w-full max-w-4xl object-contain object-bottom sm:max-h-none"
        />
      </div>
    </div>
  );
}
