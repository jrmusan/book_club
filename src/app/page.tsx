import Link from "next/link";
import { BookOpen, Calendar, Star, Users, Vote } from "lucide-react";
import { CozyWindow } from "@/components/cozy/cozy-window";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <header className="animate-soft-in absolute inset-x-0 top-0 z-20 pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-4 sm:h-16">
          <div className="font-display flex min-w-0 items-center gap-2 text-base font-semibold tracking-tight sm:text-lg">
            <BookOpen className="h-5 w-5 shrink-0 text-primary sm:h-6 sm:w-6" strokeWidth={2.25} />
            <span className="truncate">Book Club</span>
          </div>
          <div className="flex shrink-0 gap-1.5 sm:gap-2">
            <Button variant="ghost" size="sm" className="px-2.5 sm:px-3" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button size="sm" className="px-2.5 sm:px-3" asChild>
              <Link href="/register">
                <span className="sm:hidden">Join</span>
                <span className="hidden sm:inline">Get started</span>
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative flex min-h-[100svh] flex-col overflow-hidden">
          <div className="relative z-10 mx-auto grid w-full max-w-6xl flex-1 items-center gap-6 px-4 pb-10 pt-20 sm:pt-24 lg:grid-cols-[1fr_1.1fr] lg:gap-10">
            <div className="text-center lg:text-left">
              <p className="font-display animate-fade-up text-3xl font-semibold tracking-tight text-primary sm:text-5xl md:text-6xl">
                Book Club
              </p>
              <h1 className="font-display animate-fade-up-delay-1 mt-3 text-2xl font-medium leading-tight tracking-tight text-foreground sm:mt-4 sm:text-4xl">
                Gather around the next great read
              </h1>
              <p className="animate-fade-up-delay-2 mx-auto mt-3 max-w-lg text-base leading-relaxed text-muted-foreground sm:mt-4 sm:text-lg lg:mx-0">
                Vote on books, plan cozy meetups, and keep every club&apos;s favorites on one soft
                little shelf.
              </p>
              <div className="animate-fade-up-delay-3 mt-6 flex w-full flex-col items-stretch gap-2.5 sm:mt-8 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-3 lg:justify-start">
                <Button size="lg" className="w-full sm:w-auto" asChild>
                  <Link href="/register">Start a club</Link>
                </Button>
                <Button size="lg" variant="outline" className="w-full sm:w-auto" asChild>
                  <Link href="/login">Sign in</Link>
                </Button>
              </div>
            </div>

            <div className="animate-fade-up-delay-2">
              <CozyWindow />
            </div>
          </div>
        </section>

        <section className="relative z-10 px-4 pb-16 pt-8">
          <div className="cozy-panel mx-auto max-w-3xl rounded-3xl px-4 py-10 sm:px-10 sm:py-12">
            <h2 className="font-display text-center text-2xl font-semibold tracking-tight sm:text-3xl">
              Everything your circle needs
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-center text-muted-foreground">
              From the first invite to the final ranking — simple tools for people who love reading
              together.
            </p>

            <ul className="mt-10 space-y-7">
              {[
                {
                  icon: Users,
                  title: "Multiple clubs",
                  description: "Host as many circles as you like and invite friends by email.",
                },
                {
                  icon: Vote,
                  title: "Book polls",
                  description: "Search covers and blurbs, then let everyone cast a vote.",
                },
                {
                  icon: Calendar,
                  title: "Meeting plans",
                  description: "Pick when and where to meet, then lock in the winner.",
                },
                {
                  icon: Star,
                  title: "Rate & rank",
                  description: "Score what you've finished and stack-rank club favorites.",
                },
              ].map((feature) => (
                <li key={feature.title} className="flex gap-4 sm:gap-5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                    <feature.icon className="h-5 w-5" strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-semibold tracking-tight">
                      {feature.title}
                    </h3>
                    <p className="mt-1 text-muted-foreground">{feature.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <footer className="relative z-10 px-4 pb-10 text-center text-sm text-muted-foreground">
          Made for reading groups who like a soft place to land.
        </footer>
      </main>
    </div>
  );
}
