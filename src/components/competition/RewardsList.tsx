import { memo } from "react";
import { Gift, Star, Trophy, TriangleAlert } from "lucide-react";
import { formatINRCompact } from "@/lib/format";
import { useI18n } from "@/store/language";

export interface Reward {
  position: number;
  label: string;
  amount: number;
}

interface RewardsListProps {
  rewards: Reward[];
  prizePool: number;
}

/**
 * Dynamic rewards list rendered from API data. If configured rewards don't
 * sum to the advertised prize pool, a visible (not silent) warning shows —
 * values are never auto-corrected.
 */
export const RewardsList = memo(function RewardsList({ rewards, prizePool }: RewardsListProps) {
  const { t } = useI18n();
  const sum = rewards.reduce((acc, r) => acc + r.amount, 0);
  const inconsistent = rewards.length > 0 && sum !== prizePool;

  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-baseline gap-2">
        <h2 className="text-[15px] font-bold tracking-tight text-foreground">{t("comp.rewards")}</h2>
        <span className="text-xs text-muted-foreground">({t("comp.allPositions")})</span>
      </div>

      {rewards.length === 0 ? (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
          <Gift className="size-4" />
          {t("comp.noRewards")}
        </div>
      ) : (
        <ul className="mt-3 space-y-1.5">
          {rewards.map((r) => (
            <li
              key={r.position}
              className="flex items-center justify-between rounded-xl bg-muted/60 px-3 py-2.5"
            >
              <span className="flex items-center gap-2.5">
                {r.position <= 3 ? (
                  <MedalIcon position={r.position} />
                ) : (
                  <Star className="size-4.5 text-primary/50" />
                )}
                <span className="text-[13.5px] font-semibold text-foreground">{r.label}</span>
              </span>
              <span className="text-[14.5px] font-bold text-primary">{formatINRCompact(r.amount)}</span>
            </li>
          ))}
        </ul>
      )}

      {inconsistent && (
        <p className="mt-2.5 flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-2 text-[12px] font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-300">
          <TriangleAlert className="size-3.5 shrink-0" />
          Reward allocations total {formatINRCompact(sum)} of the {formatINRCompact(prizePool)} prize pool.
        </p>
      )}
    </section>
  );
});

function MedalIcon({ position }: { position: number }) {
  const colors: Record<number, string> = {
    1: "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-300",
    2: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300",
    3: "bg-orange-100 text-orange-500 dark:bg-orange-950 dark:text-orange-300",
  };
  return (
    <span
      aria-hidden="true"
      className={`flex size-6 items-center justify-center rounded-full ${colors[position] ?? colors[3]}`}
    >
      <Trophy className="size-3.5" />
    </span>
  );
}
