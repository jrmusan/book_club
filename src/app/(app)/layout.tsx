import { CozyLongWindow } from "@/components/cozy/cozy-long-window";
import { AppHeader } from "@/components/layout/app-header";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <div className="flex-1">{children}</div>
      <footer className="mt-10 pb-[calc(4.5rem+env(safe-area-inset-bottom))] sm:mt-14 sm:pb-[env(safe-area-inset-bottom)]">
        <CozyLongWindow />
      </footer>
    </div>
  );
}
