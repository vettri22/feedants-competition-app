import { Compass } from "lucide-react";
import { StatusBar } from "@/components/mobile/StatusBar";
import { BottomNav } from "@/components/mobile/BottomNav";
import { PhoneShell } from "@/pages/app/CompetitionDetail";
import { useI18n } from "@/store/language";

/** Functional placeholder — the assignment's focus is Competition Details. */
export default function Explore() {
  const { t } = useI18n();
  return (
    <PhoneShell>
      <StatusBar />
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-secondary">
          <Compass className="size-7 text-primary" />
        </span>
        <p className="text-[17px] font-bold text-foreground">{t("nav.explore")}</p>
        <p className="max-w-60 text-[13px] text-muted-foreground">{t("common.empty")}</p>
      </div>
      <BottomNav />
    </PhoneShell>
  );
}
