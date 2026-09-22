import { Battery, BatteryCharging, Signal, Wifi } from "lucide-react";

/** Simulated mobile status bar matching the reference (9:41, full signal). */
export function StatusBar() {
  return (
    <div
      aria-hidden="true"
      className="flex items-center justify-between px-6 pt-3 pb-1 select-none text-foreground"
    >
      <span className="text-[13px] font-semibold tracking-tight">9:41</span>
      <div className="flex items-center gap-1.5">
        <Signal className="size-3.5" strokeWidth={2.5} />
        <Wifi className="size-3.5" strokeWidth={2.5} />
        <Battery className="size-4" strokeWidth={2.5} />
      </div>
    </div>
  );
}
