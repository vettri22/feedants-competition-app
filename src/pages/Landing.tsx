import { useQuery as useConvexQuery } from "convex/react";
import { motion } from "framer-motion";
import { ArrowRight, Trophy, Users, Zap, ShieldCheck, Timer, Gift } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { unwrapResult } from "@/lib/api-client";
import { formatINRCompact } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/store/language";

interface ListComp {
  slug: string;
  title: string;
  prizePool: number;
  remainingSpots: number;
  maxParticipants: number;
  currentParticipants: number;
  status: string;
}

export default function Landing() {
  const { isAuthenticated, isLoading } = useAuth();
  const { t } = useI18n();
  const raw = useConvexQuery(api.competitions.list, {});

  let featured: ListComp | null = null;
  if (raw !== undefined) {
    try {
      featured = unwrapResult<{ competitions: ListComp[] }>(raw).competitions[0] ?? null;
    } catch {
      featured = null;
    }
  }

  const primaryCta = isAuthenticated ? "Open Feedants" : "Get Started";
  const primaryHref = isAuthenticated ? "/app/home" : "/auth?returnTo=%2Fapp%2Fhome";

  return (
    <div className="min-h-dvh bg-background">
      {/* Nav */}
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
        <a href="/" className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-xl bg-primary">
            <Trophy className="size-4.5 text-primary-foreground" />
          </span>
          <span className="text-[17px] font-bold tracking-tight text-foreground">Feedants</span>
        </a>
        <div className="flex items-center gap-2">
          <a href="/app/competitions" className="text-[13.5px] font-semibold text-muted-foreground hover:text-foreground transition-colors">
            Competitions
          </a>
          <Button asChild className="rounded-full font-bold">
            <a href={primaryHref}>{primaryCta}</a>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-5 pt-10 pb-14 sm:pt-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl"
        >
          <Badge variant="outline" className="rounded-full border-teal-200 bg-teal-50 px-3 py-1 text-[12px] font-semibold text-teal-700 dark:border-teal-800 dark:bg-teal-950 dark:text-teal-300">
            <Zap className="mr-1.5 size-3.5" />
            Live competitions · Multi-Win rewards
          </Badge>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl sm:leading-[1.08]">
            Showcase your talent.
            <br />
            <span className="text-primary">Win, every week.</span>
  </h1>
          <p className="mt-4 max-w-xl text-[15.5px] leading-7 text-muted-foreground">
            Feedants runs online talent competitions with real prizes, verified judges and
            instant certificates. Register in minutes, upload from anywhere in India.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="rounded-2xl px-7 text-[15px] font-bold">
              <a href={primaryHref}>
                {isLoading ? "…" : primaryCta}
                <ArrowRight className="ml-2 size-4.5" />
              </a>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-2xl px-6 font-bold">
              <a href="/app/competitions">Browse competitions</a>
            </Button>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] font-medium text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-primary" /> Secure Razorpay payments
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Timer className="size-4 text-primary" /> Live countdowns & fair windows
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Gift className="size-4 text-primary" /> ₹10 per referral signup
            </span>
          </div>
        </motion.div>

        {/* Featured competition card (live from DB) */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.12 }}
          className="mt-12"
        >
          {featured ? (
            <a
              href={`/app/competitions/${featured.slug}`}
              className="block max-w-md overflow-hidden rounded-3xl border border-border bg-card transition-colors hover:border-primary/40"
            >
              <div className="flex h-36 items-center justify-center gap-2 bg-gradient-to-br from-teal-100 via-teal-50 to-amber-50 dark:from-teal-950 dark:via-teal-900 dark:to-amber-950">
                <Trophy className="size-6 text-primary" />
                <span className="text-xl font-bold tracking-tight text-primary">{featured.title}</span>
              </div>
              <div className="flex items-center justify-between p-5">
                <div>
                  <p className="text-[12px] font-medium text-muted-foreground">Prize pool</p>
                  <p className="text-[24px] font-bold tracking-tight text-primary">
                    {formatINRCompact(featured.prizePool)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-foreground">
                    <Users className="size-4 text-primary" />
                    {featured.remainingSpots} spots left
                  </p>
                  <p className="mt-0.5 text-[12px] text-muted-foreground">
                    {featured.currentParticipants}/{featured.maxParticipants} booked
                  </p>
                </div>
              </div>
            </a>
          ) : (
            <div className="h-28 max-w-md animate-pulse rounded-3xl border border-border bg-muted/60" />
          )}
        </motion.div>
      </section>

      {/* Feature grid */}
      <section className="mx-auto max-w-5xl px-5 pb-20">
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { icon: Trophy, title: "Multi-Win rewards", body: "Six prize positions per competition — 1st through 6th, paid over UPI." },
            { icon: ShieldCheck, title: "Verified judges", body: "Industry professionals score technique, expression, rhythm and presentation." },
            { icon: Timer, title: "Time-boxed windows", body: "Registration and submission windows are enforced server-side with live countdowns." },
          ].map(({ icon: Icon, title, body }) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-secondary">
                <Icon className="size-5 text-primary" />
              </span>
              <h3 className="mt-3 text-[15px] font-bold tracking-tight text-foreground">{title}</h3>
              <p className="mt-1 text-[13px] leading-5 text-muted-foreground">{body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-6 text-[12.5px] text-muted-foreground">
          <span>© 2026 Feedants · Full-stack internship assignment build</span>
          <span className="inline-flex items-center gap-1.5">
            Powered by Convex · React · <span className="font-semibold text-foreground">Razorpay (sim)</span>
          </span>
        </div>
      </footer>
    </div>
  );
}
