import { useEffect, useRef, useState } from "react";
import { Hourglass, Timer } from "lucide-react";
import { countdownParts } from "@/lib/format";
import { useI18n } from "@/store/language";
import type { TranslationKey } from "@/lib/i18n";

interface CountdownBannerProps {
  /** Backend-provided epoch deadline (registrationEnd or submissionEnd). */
  deadlineMs: number;
  /** Fired once when the countdown reaches zero so the UI re-derives state. */
  onExpire?: () => void;
  labelKey?: TranslationKey;
  tone?: "teal" | "amber";
}

/**
 * Real per-second countdown computed from the backend-provided timestamp.
 * Stops at zero, fires onExpire (parent re-polls competition status), and
 * renders the closed state. No static countdown is ever stored.
 */
export function CountdownBanner({ deadlineMs, onExpire, labelKey = "comp.registrationClosesIn", tone = "teal" }: CountdownBannerProps) {
  const { t } = useI18n();
  const [now, setNow] = useState(() => Date.now());
  const firedRef = useRef(false);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (Date.now() >= deadlineMs && !firedRef.current) {
      firedRef.current = true;
      onExpire?.();
    }
  }, [deadlineMs, onExpire]);

  const parts = countdownParts(deadlineMs, now);
  if (parts.expired) return null;

  return (
    <section
      className={
        tone === "teal"
          ? "flex items-center justify-between rounded-2xl border border-teal-100 bg-teal-50/70 px-4 py-3 dark:border-teal-900 dark:bg-teal-950/40"
          : "flex items-center justify-between rounded-2xl border border-amber-100 bg-amber-50/70 px-4 py-3 dark:border-amber-900 dark:bg-amber-950/40"
      }
      role="timer"
      aria-live="off"
    >
      <div className="flex items-center gap-2.5">
        <Hourglass className="size-4.5 text-primary" />
        <span className="text-[13px] font-semibold text-foreground">
          {t(labelKey)}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="font-mono text-[15px] font-bold tabular-nums text-primary"
          aria-label={`${parts.days} days ${parts.hours} hours ${parts.minutes} minutes ${parts.seconds} seconds`}
        >
          {parts.days}d : {parts.hours}h : {parts.minutes}m : {parts.seconds}s
        </span>
        <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-primary/80">
          <Timer className="size-3.5" />
          {t("comp.hurryUp")}
        </span>
      </div>
    </section>
  );
}
