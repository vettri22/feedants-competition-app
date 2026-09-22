import { useQuery as useConvexQuery } from "convex/react";
import { useNavigate } from "react-router";
import { Loader2, Trophy, ChevronRight } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { StatusBar } from "@/components/mobile/StatusBar";
import { BottomNav } from "@/components/mobile/BottomNav";
import { PhoneShell } from "@/pages/app/CompetitionDetail";
import { useI18n } from "@/store/language";
import { unwrapResult, describeError } from "@/lib/api-client";
import { formatINRCompact, formatDateIST } from "@/lib/format";
import type { CompetitionStatus } from "@/convex/schema";

interface ListComp {
  id: string;
  slug: string;
  title: string;
  titleLocalized: { ENG: string; HINDI?: string } | null;
  category: string;
  prizePool: number;
  entryFee: number;
  remainingSpots: number;
  maxParticipants: number;
  currentParticipants: number;
  status: CompetitionStatus;
  dates: { registrationEnd: number };
}

function statusChip(status: CompetitionStatus, t: (k: never) => string): { label: string; cls: string } {
  switch (status) {
    case "REGISTRATION_OPEN":
      return { label: t("list.open" as never), cls: "bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300" };
    case "UPCOMING":
      return { label: t("list.upcoming" as never), cls: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300" };
    case "SUBMISSION_OPEN":
      return { label: t("list.live" as never), cls: "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300" };
    default:
      return { label: t("list.closed" as never), cls: "bg-muted text-muted-foreground" };
  }
}

export default function CompetitionsList() {
  const navigate = useNavigate();
  const { t, language } = useI18n();
  const raw = useConvexQuery(api.competitions.list, {});

  let competitions: ListComp[] = [];
  let error: string | null = null;
  if (raw !== undefined) {
    try {
      const d = unwrapResult<{ competitions: ListComp[] }>(raw);
      competitions = d.competitions;
    } catch (err) {
      error = describeError(err).message;
    }
  }

  const titleOf = (c: ListComp) =>
    language === "HINDI" && c.titleLocalized?.HINDI ? c.titleLocalized.HINDI : c.title;

  return (
    <PhoneShell>
      <StatusBar />
      <header className="px-4 pb-3 pt-4">
        <h1 className="text-[22px] font-bold tracking-tight text-foreground">{t("list.title")}</h1>
        <p className="text-[13px] text-muted-foreground">{t("list.subtitle")}</p>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 pb-6">
        {raw === undefined && !error ? (
          <div className="flex justify-center py-16">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            {error}
          </div>
        ) : competitions.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border py-12 text-center">
            <Trophy className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{t("list.empty")}</p>
          </div>
        ) : (
          competitions.map((c) => {
            const chip = statusChip(c.status, t as never);
            return (
              <button
                key={c.id}
                onClick={() => navigate(`/app/competitions/${c.slug}`)}
                className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left cursor-pointer transition-colors hover:border-primary/40"
              >
                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-secondary">
                  <Trophy className="size-6 text-primary" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-[15px] font-bold text-foreground">{titleOf(c)}</span>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-bold ${chip.cls}`}>
                      {chip.label}
                    </span>
                  </span>
                  <span className="mt-1 flex items-center gap-2 text-[12.5px] text-muted-foreground">
                    <span className="font-semibold text-primary">{formatINRCompact(c.prizePool)}</span>
                    <span>·</span>
                    <span>
                      {c.remainingSpots} {t("home.quickStats.spots" as never)}
                    </span>
                    <span>·</span>
                    <span>{formatDateIST(c.dates.registrationEnd)}</span>
                  </span>
                </span>
                <ChevronRight className="size-4.5 shrink-0 text-muted-foreground" />
              </button>
            );
          })
        )}
      </div>

      <BottomNav />
    </PhoneShell>
  );
}
