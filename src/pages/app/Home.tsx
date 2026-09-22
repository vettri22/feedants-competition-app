import { useQuery as useConvexQuery } from "convex/react";
import { useNavigate } from "react-router";
import { Loader2, Sparkles, Trophy } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { StatusBar } from "@/components/mobile/StatusBar";
import { BottomNav } from "@/components/mobile/BottomNav";
import { PhoneShell } from "@/pages/app/CompetitionDetail";
import { useI18n } from "@/store/language";
import { useAuth } from "@/hooks/use-auth";
import { unwrapResult, describeError } from "@/lib/api-client";
import { formatINRCompact } from "@/lib/format";

interface ListComp {
  id: string;
  slug: string;
  title: string;
  titleLocalized: { ENG: string; HINDI?: string } | null;
  category: string;
  prizePool: number;
  remainingSpots: number;
  maxParticipants: number;
  currentParticipants: number;
  status: string;
}

export default function Home() {
  const navigate = useNavigate();
  const { t, language } = useI18n();
  const { user } = useAuth();
  const raw = useConvexQuery(api.competitions.list, {});

  let featured: ListComp | null = null;
  let total = 0;
  if (raw !== undefined) {
    try {
      const d = unwrapResult<{ competitions: ListComp[] }>(raw);
      featured = d.competitions[0] ?? null;
      total = d.competitions.length;
    } catch {
      // error state handled by featured == null
    }
  }

  const title = featured
    ? language === "HINDI" && featured.titleLocalized?.HINDI
      ? featured.titleLocalized.HINDI
      : featured.title
    : "";

  return (
    <PhoneShell>
      <StatusBar />
      <header className="px-4 pb-3 pt-4">
        <p className="text-[13px] font-medium text-muted-foreground">
          {t("home.greeting")}{user?.name ? `, ${user.name}` : ""} 👋
        </p>
        <h1 className="text-[22px] font-bold tracking-tight text-foreground">{t("home.tagline")}</h1>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 pb-6">
        <p className="text-[13px] font-bold text-muted-foreground">{t("home.featured")}</p>
        {raw === undefined ? (
          <div className="flex justify-center py-12">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : featured ? (
          <button
            onClick={() => navigate(`/app/competitions/${featured!.slug}`)}
            className="w-full overflow-hidden rounded-2xl border border-border bg-card text-left cursor-pointer transition-colors hover:border-primary/40"
          >
            <div className="flex h-28 items-center justify-center gap-2 bg-gradient-to-br from-teal-100 via-teal-50 to-amber-50 dark:from-teal-950 dark:via-teal-900 dark:to-amber-950">
              <Sparkles className="size-5 text-primary" />
              <span className="text-lg font-bold tracking-tight text-primary">{title}</span>
            </div>
            <div className="flex items-center justify-between p-4">
              <div>
                <p className="text-[12px] text-muted-foreground">{featured.category}</p>
                <p className="text-[17px] font-bold text-primary">{formatINRCompact(featured.prizePool)}</p>
              </div>
              <div className="text-right">
                <p className="text-[12px] text-muted-foreground">
                  {featured.remainingSpots} {t("home.quickStats.spots")}
                </p>
                <p className="text-[12px] text-muted-foreground">
                  {featured.currentParticipants}/{featured.maxParticipants} booked
                </p>
              </div>
            </div>
          </button>
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border py-12 text-center">
            <Trophy className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{t("list.empty")}</p>
          </div>
        )}

        {total > 1 && (
          <button
            onClick={() => navigate("/app/competitions")}
            className="w-full rounded-2xl border border-border bg-card p-4 text-center text-[13.5px] font-bold text-primary cursor-pointer"
          >
            {t("home.viewAll")} ({total})
          </button>
        )}
      </div>

      <BottomNav />
    </PhoneShell>
  );
}
