import { memo } from "react";
import { Play, Trophy } from "lucide-react";
import { useI18n } from "@/store/language";

export interface Winner {
  name: string;
  rank: number;
  rankLabel: string;
  imageUrl?: string;
  videoUrl?: string;
}

interface WinnerCarouselProps {
  winners: Winner[];
  onPlay: (winner: Winner) => void;
}

/**
 * Horizontally scrollable previous-winners strip. Cards carry name, rank and
 * a functional play button (opens the video modal); missing videos degrade
 * gracefully in the modal. Data comes exclusively from the API.
 */
export const WinnerCarousel = memo(function WinnerCarousel({ winners, onPlay }: WinnerCarouselProps) {
  const { t } = useI18n();

  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <h2 className="text-[15px] font-bold tracking-tight text-foreground">
        {t("comp.previousWinners")}
      </h2>
      {winners.length === 0 ? (
        <EmptyStrip icon={Trophy} message={t("comp.noWinners")} />
      ) : (
        <div className="mt-3 flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {winners.map((w) => (
            <WinnerCard key={`${w.name}-${w.rank}`} winner={w} onPlay={onPlay} />
          ))}
        </div>
      )}
    </section>
  );
});

const WinnerCard = memo(function WinnerCard({ winner, onPlay }: { winner: Winner; onPlay: (w: Winner) => void }) {
  const initials = winner.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <button
      onClick={() => onPlay(winner)}
      className="flex w-36 shrink-0 items-center gap-2.5 rounded-xl border border-border bg-background p-2 text-left cursor-pointer transition-colors hover:border-primary/40"
      aria-label={`${winner.name}, ${winner.rankLabel}${winner.videoUrl ? " — play video" : ""}`}
    >
      {winner.imageUrl ? (
        <img src={winner.imageUrl} alt="" className="size-14 rounded-lg object-cover" />
      ) : (
        <span
          aria-hidden="true"
          className="relative flex size-14 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-200 via-rose-100 to-amber-100 dark:from-violet-900 dark:via-rose-900 dark:to-amber-900"
        >
          <span className="text-sm font-bold text-foreground/70">{initials}</span>
          <span className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full bg-primary shadow-sm">
            <Play className="size-3 fill-primary-foreground text-primary-foreground" />
          </span>
        </span>
      )}
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-bold text-foreground">{winner.name}</span>
        <span className="block text-xs text-primary">{winner.rankLabel}</span>
      </span>
    </button>
  );
});

export function EmptyStrip({ icon: Icon, message }: { icon: typeof Trophy; message: string }) {
  return (
    <div className="mt-3 flex items-center gap-2 rounded-xl border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
      <Icon className="size-4" />
      {message}
    </div>
  );
}

export function WinnerSkeleton() {
  return (
    <section className="rounded-2xl border border-border bg-card p-4" aria-busy="true">
      <div className="h-4 w-36 animate-pulse rounded bg-muted" />
      <div className="mt-3 flex gap-3 overflow-hidden">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="w-36 shrink-0 rounded-xl border border-border bg-background p-2">
            <div className="flex items-center gap-2.5">
              <div className="size-14 animate-pulse rounded-lg bg-muted" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-16 animate-pulse rounded bg-muted" />
                <div className="h-2.5 w-12 animate-pulse rounded bg-muted" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
