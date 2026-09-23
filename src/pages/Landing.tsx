import { useQuery as useConvexQuery } from "convex/react";
import { motion } from "framer-motion";
import { ArrowRight, Trophy, Users, Zap, ShieldCheck, Timer, Gift, Upload, Medal, IndianRupee, Quote } from "lucide-react";
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

      {/* How it works */}
      <section className="border-t border-border bg-muted/40">
        <div className="mx-auto max-w-5xl px-5 py-16">
          <h2 className="text-center text-2xl font-bold tracking-tight text-foreground">How Feedants works</h2>
          <p className="mx-auto mt-2 max-w-md text-center text-[14px] text-muted-foreground">
            Three steps from signup to prize money — all enforced server-side.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              { icon: Users, step: "01", title: "Register & pay", body: "Pick a competition, pay the entry fee via secure checkout, and your spot is locked instantly." },
              { icon: Upload, step: "02", title: "Upload your video", body: "Record your performance and upload within the submission window — deadlines enforced by the server clock." },
              { icon: Medal, step: "03", title: "Get judged & win", body: "Verified judges score every entry. Winners are paid over UPI and receive digital certificates." },
            ].map(({ icon: Icon, step, title, body }) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="relative rounded-2xl border border-border bg-card p-5"
              >
                <span className="text-[11px] font-bold tracking-widest text-primary/60">{step}</span>
                <span className="mt-2 flex size-10 items-center justify-center rounded-xl bg-secondary">
                  <Icon className="size-5 text-primary" />
                </span>
                <h3 className="mt-3 text-[15px] font-bold tracking-tight text-foreground">{title}</h3>
                <p className="mt-1 text-[13px] leading-5 text-muted-foreground">{body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-5xl px-5 py-16">
        <h2 className="text-center text-2xl font-bold tracking-tight text-foreground">Hear from our winners</h2>
        <p className="mx-auto mt-2 max-w-md text-center text-[14px] text-muted-foreground">
          Thousands of performers across India trust Feedants for their big break.
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {[
            { name: "Riya Shah", role: "1st Winner · Classical Dance", quote: "Registered, paid and uploaded in under ten minutes. The certificate arrived the same day results were announced." },
            { name: "Aarav Mehta", role: "1st Winner · Singing", quote: "The countdown kept me on track, and the judging felt genuinely fair. Prize money hit my UPI in two days." },
            { name: "Neha Verma", role: "2nd Winner · Painting", quote: "I found the competition on the explore tab and competed from home. Best ₹99 I've spent." },
          ].map(({ name, role, quote }, i) => (
            <motion.figure
              key={name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="flex flex-col rounded-2xl border border-border bg-card p-5"
            >
              <Quote className="size-5 text-primary/50" />
              <blockquote className="mt-2 flex-1 text-[13.5px] leading-6 text-foreground">"{quote}"</blockquote>
              <figcaption className="mt-4 flex items-center gap-2.5">
                <span className="flex size-9 items-center justify-center rounded-full bg-secondary text-[13px] font-bold text-primary">
                  {name.split(" ").map((p) => p[0]).join("")}
                </span>
                <span>
                  <span className="block text-[13px] font-bold text-foreground">{name}</span>
                  <span className="block text-[11.5px] text-muted-foreground">{role}</span>
                </span>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-5xl px-5 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl border border-teal-200 bg-gradient-to-br from-teal-50 via-teal-100 to-amber-50 p-8 text-center dark:border-teal-800 dark:from-teal-950 dark:via-teal-900 dark:to-amber-950 sm:p-12"
        >
          <IndianRupee className="mx-auto size-8 text-primary" />
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Your next win is one tap away</h2>
          <p className="mx-auto mt-2 max-w-md text-[14.5px] leading-6 text-muted-foreground">
            Join {featured ? featured.maxParticipants.toLocaleString() : "hundreds of"} participants competing this week. Registration closes soon.
          </p>
          <Button asChild size="lg" className="mt-6 rounded-2xl px-8 text-[15px] font-bold">
            <a href={primaryHref}>
              {primaryCta}
              <ArrowRight className="ml-2 size-4.5" />
            </a>
          </Button>
        </motion.div>
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
