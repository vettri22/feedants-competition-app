import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/**
 * PhoneFrame — presents the app inside a fixed 420px mobile viewport,
 * centered on desktop with a subtle device surround. On real mobile widths
 * it becomes edge-to-edge full-screen.
 */
export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh w-full bg-slate-200/70 dark:bg-slate-900 flex justify-center">
      <div
        className={cn(
          "w-full max-w-[430px] min-h-dvh bg-background flex flex-col",
          "sm:my-4 sm:rounded-[2rem] sm:border sm:border-border sm:shadow-sm sm:overflow-hidden",
        )}
      >
        {children}
      </div>
    </div>
  );
}
