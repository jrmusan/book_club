import Link from "next/link";
import { BookOpen, Users, Vote, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2 font-semibold">
            <BookOpen className="h-6 w-6 text-primary" />
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
        <section className="mx-auto max-w-6xl px-4 py-20 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            One place for your entire book club
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Vote on your next read, plan meetings, rate books, and stack-rank your favorites — all in one app built for multiple clubs.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/register">Create free account</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-6 px-4 pb-20 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: Users,
              title: "Multiple clubs",
              description: "Create clubs and invite members by email.",
            },
            {
              icon: Vote,
              title: "Book polls",
              description: "Search books, add covers & descriptions, and let everyone vote.",
            },
            {
              icon: BookOpen,
              title: "Meeting plans",
              description: "Poll when and where to meet, then confirm the winner.",
            },
            {
              icon: Star,
              title: "Rate & rank",
              description: "Rate books you've read and stack-rank your club favorites.",
            },
          ].map((feature) => (
            <Card key={feature.title}>
              <CardHeader>
                <feature.icon className="mb-2 h-8 w-8 text-primary" />
                <CardTitle className="text-lg">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent />
            </Card>
          ))}
        </section>
      </main>
    </div>
  );
}
