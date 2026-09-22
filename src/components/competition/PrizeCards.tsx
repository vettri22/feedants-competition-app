import { BadgeCheck, Trophy, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatINR, formatINRCompact } from "@/lib/format";
import { useI18n } from "@/store/language";

interface PrizeCardsProps {
  title: string;
  category: string;
  tags: string[];
  certificateEnabled: boolean;
  registered: boolean;
  prizePool: number;
  entryFee: number;
  remainingSpots: number;
  maxParticipants: number;
  currentParticipants: number;
}

/** Hero card: title, category/tag badges, certificate, prize/fee, progress. */
export function PrizeCards(props: PrizeCardsProps) {
  const { t } = useI18n();
  const {
    title,
    category,
    tags,
    certificateEnabled,
    registered,
    prizePool,
    entryFee,
    remainingSpots,
    maxParticipants,
    currentParticipants,
  } = props;

  return (
    <section className="rounded-2xl border border-border bg-card px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <h1 className="text-[22px] leading-7 font-bold tracking-tight text-foreground">
          {title}
        </h1>
        {registered && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700 dark:bg-teal-950 dark:text-teal-300">
            <BadgeCheck className="size-3.5" />
            {t("top.registered")}
          </span>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="rounded-lg bg-muted px-2.5 py-1 text-xs font-semibold text-foreground">
          {category}
        </span>
        {tags.map((tag) => (
          <span
            key={tag}
            className="rounded-lg bg-muted px-2.5 py-1 text-xs font-semibold text-foreground"
          >
            {tag}
          </span>
        ))}
        {certificateEnabled && (
          <span className="ml-auto inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary">
            <Trophy className="size-4" />
            {t("comp.winnersGetCertificate")}
          </span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-start gap-3">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{t("comp.prizePool")}</p>
          <p className="mt-0.5 text-[26px] font-bold tracking-tight text-primary">
            {formatINR(prizePool)}
          </p>
        </div>
        <div className="pt-1 text-center">
          <p className="text-xs font-medium text-muted-foreground">{t("comp.entryFee")}</p>
          <p className="mt-0.5 text-[22px] font-bold tracking-tight text-foreground">
            {formatINRCompact(entryFee)}
          </p>
        </div>
      </div>

      <SpotsProgress
        remainingSpots={remainingSpots}
        maxParticipants={maxParticipants}
        currentParticipants={currentParticipants}
      />
    </section>
  );
}

export function SpotsProgress({
  remainingSpots,
  maxParticipants,
  currentParticipants,
}: {
  remainingSpots: number;
  maxParticipants: number;
  currentParticipants: number;
}) {
  const { t } = useI18n();
  const fraction = maxParticipants > 0 ? currentParticipants / maxParticipants : 0;
  return (
    <div className="mt-4">
      <div className="flex items-center gap-1.5 text-[13px] font-semibold text-foreground">
        <Users className="size-4 text-primary" />
        <span>{t("comp.spotsLeft", { n: remainingSpots })}</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={currentParticipants}
        aria-valuemin={0}
        aria-valuemax={maxParticipants}
        className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted"
      >
        <div
          className={cn("h-full rounded-full bg-primary transition-all", fraction >= 1 && "bg-destructive")}
          style={{ width: `${Math.max(4, fraction * 100)}%` }}
        />
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">
        {t("comp.booked", { booked: currentParticipants, total: maxParticipants })}
      </p>
    </div>
  );
}
