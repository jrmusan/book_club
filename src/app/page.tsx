import Link from "next/link";
import { BookOpen, Calendar, Star, Users, Vote } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <header className="animate-soft-in absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="font-display flex items-center gap-2 text-lg font-semibold tracking-tight">
            <BookOpen className="h-6 w-6 text-primary" strokeWidth={2.25} />
            Book Club
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* First viewport: brand + one story + CTAs */}
        <section className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden px-4 pb-16 pt-24">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              backgroundImage:
                "radial-gradient(ellipse 70% 55% at 70% 35%, rgba(47,111,94,0.18), transparent 70%), radial-gradient(ellipse 50% 40% at 15% 80%, rgba(201,149,58,0.16), transparent 65%)",
            }}
          />

          <div className="mx-auto w-full max-w-3xl text-center">
            <p className="font-display animate-fade-up text-4xl font-semibold tracking-tight text-primary sm:text-5xl md:text-6xl">
              Book Club
            </p>
            <h1 className="font-display animate-fade-up-delay-1 mt-5 text-3xl font-medium leading-tight tracking-tight text-foreground sm:text-4xl md:text-[2.75rem]">
              Gather around the next great read
            </h1>
            <p className="animate-fade-up-delay-2 mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Vote on books, plan cozy meetups, and keep every club&apos;s favorites in one warm
              little corner of the internet.
            </p>
            <div className="animate-fade-up-delay-3 mt-9 flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" asChild>
                <Link href="/register">Start a club</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/login">Sign in</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Below fold: one calm features section */}
        <section className="border-t border-border/60 bg-card/40 px-4 py-20 backdrop-blur-[1px]">
          <div className="mx-auto max-w-4xl">
            <h2 className="font-display text-center text-3xl font-semibold tracking-tight">
              Everything your circle needs
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-center text-muted-foreground">
              From the first invite to the final ranking — simple tools for people who love reading
              together.
            </p>

            <ul className="mt-12 space-y-8">
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
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
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

        <footer className="border-t border-border/60 px-4 py-8 text-center text-sm text-muted-foreground">
          Made for reading groups who like a soft place to land.
        </footer>
      </main>
    </div>
  );
}
