import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router";
import { cn } from "@/lib/utils";
import { LANGUAGES, type Language } from "@/lib/i18n";
import { useI18n } from "@/store/language";

/** Pill-shaped ENG/हिंदी switcher — persists preference + backend profile. */
export function LanguageSwitcher({ className }: { className?: string }) {
  const { language, setLanguage } = useI18n();
  return (
    <div
      role="radiogroup"
      aria-label="Language"
      className={cn(
        "flex items-center rounded-full border border-border bg-muted p-0.5",
        className,
      )}
    >
      {LANGUAGES.map((l: { code: Language; label: string }) => (
        <button
          key={l.code}
          role="radio"
          aria-checked={language === l.code}
          onClick={() => setLanguage(l.code)}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-semibold transition-colors cursor-pointer",
            language === l.code
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}

/** Go-back header bar with the language toggle on the right. */
export function TopBar({ onBack }: { onBack?: () => void }) {
  const navigate = useNavigate();
  const { t } = useI18n();
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <button
        onClick={onBack ?? (() => navigate(-1))}
        className="flex items-center gap-2 text-foreground cursor-pointer rounded-full px-2 py-1 -ml-2 hover:bg-muted transition-colors"
        aria-label={t("common.back")}
      >
        <ArrowLeft className="size-5" strokeWidth={2.25} />
        <span className="text-[15px] font-semibold">{t("common.back")}</span>
      </button>
      <LanguageSwitcher />
    </div>
  );
}
