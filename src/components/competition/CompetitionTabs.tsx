import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/store/language";
import type { TranslationKey } from "@/lib/i18n";

export interface LocalizedText {
  ENG: string;
  HINDI?: string;
}

interface CompetitionTabsProps {
  description: LocalizedText;
  judgingParameters: { name: LocalizedText; weight: number }[];
  rules: LocalizedText[];
  eligibility: LocalizedText[];
}

type TabKey = "about" | "judging" | "rules";

/**
 * Functional tabs: About Competition / Judging Parameters / Rules &
 * Eligibility. Content is picked by the user's language from API data.
 */
export function CompetitionTabs({ description, judgingParameters, rules, eligibility }: CompetitionTabsProps) {
  const { t, language } = useI18n();
  const [tab, setTab] = useState<TabKey>("about");
  const [expanded, setExpanded] = useState(false);

  const pick = (l: LocalizedText) => (language === "HINDI" && l.HINDI ? l.HINDI : l.ENG);

  const tabs: { key: TabKey; labelKey: TranslationKey }[] = [
    { key: "about", labelKey: "comp.aboutCompetition" },
    { key: "judging", labelKey: "comp.judgingParameters" },
    { key: "rules", labelKey: "comp.rulesEligibility" },
  ];

  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <div role="tablist" aria-label="Competition information" className="flex border-b border-border">
        {tabs.map(({ key, labelKey }) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={cn(
              "relative flex-1 px-2 pb-2.5 text-[13px] font-semibold transition-colors cursor-pointer",
              tab === key ? "text-primary" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t(labelKey)}
            {tab === key && (
              <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" />
            )}
          </button>
        ))}
      </div>

      <div className="pt-3">
        {tab === "about" && (
          <div>
            <p className={cn("text-[13.5px] leading-6 text-muted-foreground", !expanded && "line-clamp-3")}>
              {pick(description)}
            </p>
            <button
              onClick={() => setExpanded((e) => !e)}
              className="mx-auto mt-2 flex items-center gap-1 text-[13px] font-semibold text-primary cursor-pointer"
              aria-expanded={expanded}
            >
              {expanded ? t("common.viewLess") : t("common.viewMore")}
              <ChevronDown className={cn("size-4 transition-transform", expanded && "rotate-180")} />
            </button>
          </div>
        )}

        {tab === "judging" && (
          <JudgingParameters items={judgingParameters} pick={pick} emptyLabel={t("comp.noJudging")} />
        )}

        {tab === "rules" && (
          <div className="space-y-4">
            <ListBlock title={t("comp.rules")} items={rules.map(pick)} />
            <ListBlock title={t("comp.eligibility")} items={eligibility.map(pick)} />
          </div>
        )}
      </div>
    </section>
  );
}

function JudgingParameters({
  items,
  pick,
  emptyLabel,
}: {
  items: { name: LocalizedText; weight: number }[];
  pick: (l: LocalizedText) => string;
  emptyLabel: string;
}) {
  if (items.length === 0) {
    return <EmptyList label={emptyLabel} />;
  }
  return (
    <ul className="space-y-2.5">
      {items.map((p, i) => (
        <li key={i}>
          <div className="flex items-center justify-between text-[13px]">
            <span className="font-semibold text-foreground">{pick(p.name)}</span>
            <span className="font-bold text-primary">{p.weight}%</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary/70" style={{ width: `${p.weight}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <h3 className="text-[13px] font-bold text-foreground">{title}</h3>
      <ul className="mt-2 space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 text-[13px] leading-5 text-muted-foreground">
            <span className="mt-1.75 size-1.5 shrink-0 rounded-full bg-primary/60" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function EmptyList({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
      {label}
    </div>
  );
}
