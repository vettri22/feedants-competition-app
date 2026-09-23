import { useMemo, useState } from "react";
import { useQuery as useConvexQuery } from "convex/react";
import { useNavigate } from "react-router";
import { Compass, Loader2, Search, Trophy, ChevronRight } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { StatusBar } from "@/components/mobile/StatusBar";
import { BottomNav } from "@/components/mobile/BottomNav";
import { PhoneShell } from "@/pages/app/CompetitionDetail";
import { useI18n } from "@/store/language";
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
  currentParticipants: number;
  maxParticipants: number;
  status: string;
}

export default function Explore() {
  const navigate = useNavigate();
  const { t, language } = useI18n();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const raw = useConvexQuery(api.competitions.list, {});

  let competitions: ListComp[] = [];
  let error: string | null = null;
  if (raw !== undefined) {
    try {
      competitions = unwrapResult<{ competitions: ListComp[] }>(raw).competitions;
    } catch (err) {
      error = describeError(err).message;
    }
  }

  const categories = useMemo(
    () => ["ALL", ...Array.from(new Set(competitions.map((c) => c.category))).sort()],
    [competitions],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return competitions.filter((c) => {
      const title = language === "HINDI" && c.titleLocalized?.HINDI ? c.titleLocalized.HINDI : c.title;
      if (activeCategory && activeCategory !== "ALL" && c.category !== activeCategory) return false;
      return q === "" || title.toLowerCase().includes(q) || c.category.toLowerCase().includes(q);
    });
  }, [competitions, query, activeCategory, language]);

  const titleOf = (c: ListComp) =>
    language === "HINDI" && c.titleLocalized?.HINDI ? c.titleLocalized.HINDI : c.title;

  return (
    <PhoneShell>
      <StatusBar />
      <header className="px-4 pb-3 pt-4">
        <h1 className="text-[22px] font-bold tracking-tight text-foreground">{t("explore.title")}</h1>
        <p className="text-[13px] text-muted-foreground">{t("explore.subtitle")}</p>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 pb-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("explore.searchPh")}
            className="h-10 w-full rounded-full border border-border bg-card pl-9 pr-4 text-[13.5px] text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/50"
          />
        </div>

        {/* Category chips */}
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat === "ALL" ? null : cat)}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[12.5px] font-bold cursor-pointer transition-colors ${
                (activeCategory ?? "ALL") === cat
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40"
              }`}
            >
              {cat === "ALL" ? t("explore.all") : cat}
            </button>
          ))}
        </div>

        {/* Results */}
        {raw === undefined && !error ? (
          <div className="flex justify-center py-16">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            {error}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border py-12 text-center">
            {competitions.length === 0 ? (
              <>
                <Trophy className="size-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{t("list.empty")}</p>
              </>
            ) : (
              <>
                <Compass className="size-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{t("explore.noResults")}</p>
              </>
            )}
          </div>
        ) : (
          filtered.map((c) => {
            const chip =
              c.status === "REGISTRATION_OPEN"
                ? t("list.open")
                : c.status === "UPCOMING"
                  ? t("list.upcoming")
                  : c.status === "SUBMISSION_OPEN"
                    ? t("list.live")
                    : t("list.closed");
            const chipColor =
              c.status === "REGISTRATION_OPEN"
                ? "bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300"
                : c.status === "UPCOMING"
                  ? "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                  : c.status === "SUBMISSION_OPEN"
                    ? "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300"
                    : "bg-muted text-muted-foreground";
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
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-bold ${chipColor}`}>
                      {chip}
                    </span>
                  </span>
                  <span className="mt-1 flex items-center gap-2 text-[12.5px] text-muted-foreground">
                    <span className="font-semibold text-primary">{formatINRCompact(c.prizePool)}</span>
                    <span>·</span>
                    <span>
                      {c.remainingSpots} {t("home.quickStats.spots")}
                    </span>
                    <span>·</span>
                    <span>{c.category}</span>
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
