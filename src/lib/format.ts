/** Formatting utilities — currency, dates (locale-aware), countdown. */

export function formatINR(amount: number): string {
  return `₹ ${new Intl.NumberFormat("en-IN").format(amount)}`;
}

export function formatINRCompact(amount: number): string {
  return `₹${new Intl.NumberFormat("en-IN").format(amount)}`;
}

const dateFmt = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "2-digit",
  timeZone: "Asia/Kolkata",
});

const timeFmt = new Intl.DateTimeFormat("en-IN", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
  timeZone: "Asia/Kolkata",
});

/** "10 Aug 26" in IST, matching the reference screen's date format. */
export function formatDateIST(epochMs: number): string {
  return dateFmt.format(new Date(epochMs));
}

/** "11:50 PM" in IST. */
export function formatTimeIST(epochMs: number): string {
  return timeFmt.format(new Date(epochMs)).toUpperCase();
}

export interface CountdownParts {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
  expired: boolean;
}

/** Splits ms into 2-digit padded d/h/m/s parts — timer ticks from this. */
export function countdownParts(targetMs: number, now: number): CountdownParts {
  const diff = targetMs - now;
  if (diff <= 0) {
    return { days: "00", hours: "00", minutes: "00", seconds: "00", expired: true };
  }
  const s = Math.floor(diff / 1000);
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    days: pad(days),
    hours: pad(hours),
    minutes: pad(minutes),
    seconds: pad(seconds),
    expired: false,
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
