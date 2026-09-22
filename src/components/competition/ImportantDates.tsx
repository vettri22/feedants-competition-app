import { CalendarClock, Send, Upload, Trophy } from "lucide-react";
import { formatDateIST, formatTimeIST } from "@/lib/format";
import { useI18n } from "@/store/language";
import type { TranslationKey } from "@/lib/i18n";

interface Dates {
  registrationEnd: number;
  submissionStart: number;
  submissionEnd: number;
  resultDate: number;
}

/**
 * Reusable ImportantDates component — renders the four reference dates from
 * backend data, formatted for the user's locale (IST). Nothing hardcoded.
 */
export function ImportantDates({ dates }: { dates: Dates }) {
  const { t } = useI18n();
  const cells: {
    icon: typeof CalendarClock;
    labelKey: TranslationKey;
    date: number;
  }[] = [
    { icon: CalendarClock, labelKey: "comp.registerBefore", date: dates.registrationEnd },
    { icon: Send, labelKey: "comp.submissionStarts", date: dates.submissionStart },
    { icon: Upload, labelKey: "comp.submissionEnds", date: dates.submissionEnd },
    { icon: Trophy, labelKey: "comp.resultDate", date: dates.resultDate },
  ];

  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <h2 className="text-[15px] font-bold tracking-tight text-foreground">
        {t("comp.importantDates")}
      </h2>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {cells.map(({ icon: Icon, labelKey, date }) => (
          <div key={labelKey} className="flex items-start gap-3 rounded-xl bg-muted/50 p-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
              <Icon className="size-4.5 text-primary" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">{t(labelKey)}</p>
              <p className="mt-0.5 text-[13.5px] font-bold text-foreground">{formatDateIST(date)}</p>
              <p className="text-xs text-muted-foreground">{formatTimeIST(date)}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ImportantDatesSkeleton() {
  return (
    <section className="rounded-2xl border border-border bg-card p-4" aria-busy="true">
      <div className="h-4 w-32 animate-pulse rounded bg-muted" />
      <div className="mt-3 grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl bg-muted/50 p-3">
            <div className="h-3 w-20 animate-pulse rounded bg-muted" />
            <div className="mt-2 h-3.5 w-16 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    </section>
  );
}
