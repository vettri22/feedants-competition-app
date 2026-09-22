import { Play } from "lucide-react";
import { useI18n } from "@/store/language";

interface JudgeCardProps {
  name: string;
  designation: string;
  experience: string;
  avatarUrl?: string;
  onPlayIntro: () => void;
}

/** Judge profile: circular avatar, label/name/profession/experience, intro video. */
export function JudgeCard({ name, designation, experience, avatarUrl, onPlayIntro }: JudgeCardProps) {
  const { t } = useI18n();
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-4">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            className="size-16 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div
            aria-hidden="true"
            className="flex size-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-100 to-teal-200 text-lg font-bold text-teal-800 dark:from-teal-900 dark:to-teal-800 dark:text-teal-200"
          >
            {initials}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-foreground">{t("judge.label")}</p>
          <p className="text-[17px] font-bold tracking-tight text-foreground">{name}</p>
          <p className="mt-0.5 truncate text-[13px] text-muted-foreground">{designation}</p>
          <p className="text-[13px] text-muted-foreground">{experience}</p>
        </div>
        <button
          onClick={onPlayIntro}
          className="flex flex-col items-center gap-1.5 cursor-pointer rounded-xl p-2 transition-colors hover:bg-muted"
          aria-label={`${t("judge.introVideo")} — ${name}`}
        >
          <span className="flex size-11 items-center justify-center rounded-full bg-secondary">
            <Play className="size-5 fill-primary text-primary" />
          </span>
          <span className="text-[11px] font-medium text-foreground">{t("judge.introVideo")}</span>
        </button>
      </div>
    </section>
  );
}

export function JudgeSkeleton() {
  return (
    <section className="rounded-2xl border border-border bg-card p-4" aria-busy="true">
      <div className="flex items-center gap-4">
        <div className="size-16 shrink-0 animate-pulse rounded-full bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-10 animate-pulse rounded bg-muted" />
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          <div className="h-3 w-40 animate-pulse rounded bg-muted" />
        </div>
        <div className="size-11 animate-pulse rounded-full bg-muted" />
      </div>
    </section>
  );
}
