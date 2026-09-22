import { describe, test, expect } from "bun:test";
import { countdownParts, formatINR, formatINRCompact, formatFileSize } from "../format";

describe("countdownParts — real ticking countdown math", () => {
  const target = Date.parse("2026-08-10T18:20:00Z");

  test("splits remaining time into padded parts", () => {
    const now = target - ((1 * 86400 + 6 * 3600 + 28 * 60 + 32) * 1000);
    const p = countdownParts(target, now);
    expect(p.expired).toBe(false);
    expect(p.days).toBe("01");
    expect(p.hours).toBe("06");
    expect(p.minutes).toBe("28");
    expect(p.seconds).toBe("32");
  });

  test("pads single digits and rolls over correctly", () => {
    const now = target - ((0 * 86400 + 0 * 3600 + 0 * 60 + 5) * 1000);
    const p = countdownParts(target, now);
    expect(p.days).toBe("00");
    expect(p.hours).toBe("00");
    expect(p.minutes).toBe("00");
    expect(p.seconds).toBe("05");
  });

  test("reports expired at/past the deadline and stops", () => {
    expect(countdownParts(target, target).expired).toBe(true);
    expect(countdownParts(target, target + 86_400_000).expired).toBe(true);
  });
});

describe("currency + file size formatting", () => {
  test("Indian-grouped rupee formatting", () => {
    expect(formatINR(1500)).toBe("₹ 1,500");
    expect(formatINRCompact(99)).toBe("₹99");
    expect(formatINRCompact(550)).toBe("₹550");
  });

  test("file sizes read naturally", () => {
    expect(formatFileSize(500)).toBe("500 B");
    expect(formatFileSize(2048)).toBe("2 KB");
    expect(formatFileSize(5 * 1024 * 1024)).toBe("5.0 MB");
  });
});
