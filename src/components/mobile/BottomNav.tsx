import { House, Search, Plus, Trophy, CircleUserRound } from "lucide-react";
import { useNavigate, useLocation } from "react-router";
import { cn } from "@/lib/utils";
import { useI18n } from "@/store/language";
import type { TranslationKey } from "@/lib/i18n";

const TABS: { path: string; icon: typeof House; key: TranslationKey }[] = [
  { path: "/app/home", icon: House, key: "nav.home" },
  { path: "/app/explore", icon: Search, key: "nav.explore" },
  { path: "/app/competitions", icon: Trophy, key: "nav.competitions" },
  { path: "/app/profile", icon: CircleUserRound, key: "nav.profile" },
];

/**
 * Reference bottom navigation: Home · Explore · (+ FAB) · Competitions ·
 * Profile. Navigates to functional placeholder-capable screens.
 */
export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useI18n();

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <nav
      aria-label="Primary"
      className="mt-auto border-t border-border bg-card px-2 pt-1.5 pb-5"
    >
      <div className="flex items-end justify-between">
        {TABS.slice(0, 2).map((tab) => (
          <NavButton key={tab.path} icon={tab.icon} path={tab.path} active={isActive(tab.path)} onClick={() => navigate(tab.path)} label={t(tab.key)} />
        ))}

        <button
          onClick={() => navigate("/app/home")}
          aria-label="Create"
          className="size-12 -mt-6 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm cursor-pointer active:scale-95 transition-transform"
        >
          <Plus className="size-6" strokeWidth={2.5} />
        </button>

        {TABS.slice(2).map((tab) => (
          <NavButton key={tab.path} icon={tab.icon} path={tab.path} active={isActive(tab.path)} onClick={() => navigate(tab.path)} label={t(tab.key)} />
        ))}
      </div>
    </nav>
  );
}

function NavButton({
  icon: Icon,
  active,
  onClick,
  label,
}: {
  icon: typeof House;
  path?: string;
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl cursor-pointer transition-colors min-w-16",
        active ? "text-primary" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="size-5.5" strokeWidth={active ? 2.4 : 2} />
      <span className={cn("text-[11px]", active ? "font-semibold" : "font-medium")}>{label}</span>
    </button>
  );
}
