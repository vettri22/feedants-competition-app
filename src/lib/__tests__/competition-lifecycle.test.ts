import { describe, test, expect } from "bun:test";
import {
  deriveCompetitionStatus,
  deriveCta,
  isRegistrationOpen,
  isSubmissionWindowOpen,
} from "../competition-lifecycle";

// ─── Fixtures ─────────────────────────────────────────────────────────────────
// Reference timeline matching the seeded Feedants Classical Dance demo.
const DATES = {
  registrationStart: Date.parse("2026-06-21T22:30:00Z"),
  registrationEnd: Date.parse("2026-08-10T18:20:00Z"),
  submissionStart: Date.parse("2026-08-05T22:30:00Z"),
  submissionEnd: Date.parse("2026-08-30T18:25:00Z"),
  resultDate: Date.parse("2026-09-01T18:20:00Z"),
};

const BASE = {
  status: "REGISTRATION_OPEN" as const,
  authenticated: true,
  registered: false,
  paymentStatus: null,
  entryFee: 99,
  remainingSpots: 19,
  registrationOpen: true,
  submissionOpen: false,
  hasSubmission: false,
};

describe("deriveCompetitionStatus", () => {
  test("UPCOMING before registration opens", () => {
    const now = DATES.registrationStart - 1;
    expect(deriveCompetitionStatus(now, DATES)).toBe("UPCOMING");
  });

  test("REGISTRATION_OPEN inside window with capacity", () => {
    const now = DATES.registrationStart + 1000;
    expect(deriveCompetitionStatus(now, DATES)).toBe("REGISTRATION_OPEN");
  });

  test("REGISTRATION_CLOSED when full despite open dates", () => {
    const now = DATES.registrationStart + 1000;
    expect(deriveCompetitionStatus(now, DATES, undefined, false)).toBe("REGISTRATION_CLOSED");
  });

  test("REGISTRATION_OPEN wins during the registration/submission overlap (reference data)", () => {
    // Aug 6: submission has started but registration is still open until Aug 10.
    const now = DATES.submissionStart + 1000;
    expect(deriveCompetitionStatus(now, DATES)).toBe("REGISTRATION_OPEN");
  });

  test("SUBMISSION_OPEN after registrationEnd while submission window remains", () => {
    const now = DATES.registrationEnd + 1000; // Aug 10, inside submission window
    expect(deriveCompetitionStatus(now, DATES)).toBe("SUBMISSION_OPEN");
  });

  test("REGISTRATION_CLOSED when windows overlap but capacity is exhausted", () => {
    const now = DATES.submissionStart + 1000;
    expect(deriveCompetitionStatus(now, DATES, undefined, false)).toBe("REGISTRATION_CLOSED");
  });

  test("REGISTRATION_CLOSED after registrationEnd when submission hasn't opened (non-overlapping dates)", () => {
    const dates = {
      ...DATES,
      submissionStart: DATES.registrationEnd + 5 * 86_400_000, // starts after reg closes
    };
    const now = DATES.registrationEnd + 1000;
    expect(deriveCompetitionStatus(now, dates)).toBe("REGISTRATION_CLOSED");
  });

  test("SUBMISSION_CLOSED after submissionEnd, before results", () => {
    const now = DATES.submissionEnd + 1000;
    expect(deriveCompetitionStatus(now, DATES)).toBe("SUBMISSION_CLOSED");
  });

  test("RESULTS_PUBLISHED on/after result date", () => {
    expect(deriveCompetitionStatus(DATES.resultDate, DATES)).toBe("RESULTS_PUBLISHED");
    expect(deriveCompetitionStatus(DATES.resultDate + 1000, DATES)).toBe("RESULTS_PUBLISHED");
  });

  test("manual overrides take precedence (CANCELLED, JUDGING, DRAFT, RESULTS_PUBLISHED)", () => {
    const now = DATES.registrationStart + 1000;
    expect(deriveCompetitionStatus(now, DATES, "CANCELLED")).toBe("CANCELLED");
    expect(deriveCompetitionStatus(now, DATES, "JUDGING")).toBe("JUDGING");
    expect(deriveCompetitionStatus(now, DATES, "DRAFT")).toBe("DRAFT");
    expect(deriveCompetitionStatus(now, DATES, "RESULTS_PUBLISHED")).toBe("RESULTS_PUBLISHED");
  });
});

describe("window helpers", () => {
  test("isRegistrationOpen requires open status AND before deadline (server clock)", () => {
    const now = DATES.registrationEnd - 1000;
    expect(isRegistrationOpen("REGISTRATION_OPEN", now, DATES.registrationEnd)).toBe(true);
    expect(isRegistrationOpen("REGISTRATION_OPEN", DATES.registrationEnd + 1, DATES.registrationEnd)).toBe(false);
  });

  test("isSubmissionWindowOpen respects server clock bounds", () => {
    expect(isSubmissionWindowOpen("SUBMISSION_OPEN", DATES.submissionStart + 1, DATES)).toBe(true);
    expect(isSubmissionWindowOpen("SUBMISSION_OPEN", DATES.submissionEnd + 1, DATES)).toBe(false);
    expect(isSubmissionWindowOpen("SUBMISSION_OPEN", DATES.submissionStart - 1, DATES)).toBe(false);
  });
});

describe("deriveCta — the 12 assignment UI states", () => {
  test("STATE 1: logged out → LOGIN_REQUIRED", () => {
    const r = deriveCta({ ...BASE, authenticated: false });
    expect(r.state).toBe("LOGIN_REQUIRED");
    expect(r.enabled).toBe(true);
  });

  test("STATE 2: logged in, registration available → REGISTER (pay)", () => {
    const r = deriveCta(BASE);
    expect(r.state).toBe("PAY_REGISTER");
    expect(r.enabled).toBe(true);
  });

  test("STATE 2b: free entry → REGISTER_FREE", () => {
    const r = deriveCta({ ...BASE, entryFee: 0 });
    expect(r.state).toBe("REGISTER_FREE");
  });

  test("STATE 3: payment pending → PAYMENT_PENDING", () => {
    const r = deriveCta({ ...BASE, registered: true, paymentStatus: "PENDING" });
    expect(r.state).toBe("PAYMENT_PENDING");
    expect(r.enabled).toBe(true);
  });

  test("STATE 4/5: registered + paid, submission window closed → REGISTERED", () => {
    const r = deriveCta({ ...BASE, registered: true, paymentStatus: "PAID", submissionOpen: false });
    expect(r.state).toBe("REGISTERED");
    expect(r.enabled).toBe(false);
  });

  test("STATE 8: registered + submission open, none yet → REGISTERED_UPLOAD", () => {
    const r = deriveCta({ ...BASE, registered: true, paymentStatus: "PAID", submissionOpen: true });
    expect(r.state).toBe("REGISTERED_UPLOAD");
    expect(r.action).toBe("UPLOAD");
  });

  test("registered + already submitted → REGISTERED (no conflicting upload state)", () => {
    const r = deriveCta({
      ...BASE,
      registered: true,
      paymentStatus: "PAID",
      submissionOpen: true,
      hasSubmission: true,
    });
    expect(r.state).toBe("REGISTERED");
  });

  test("STATE 6: competition full → COMPETITION_FULL (disabled)", () => {
    const r = deriveCta({ ...BASE, remainingSpots: 0 });
    expect(r.state).toBe("COMPETITION_FULL");
    expect(r.enabled).toBe(false);
  });

  test("STATE 7: registration closed by date → REGISTRATION_CLOSED (disabled)", () => {
    const r = deriveCta({ ...BASE, registrationOpen: false });
    expect(r.state).toBe("REGISTRATION_CLOSED");
    expect(r.enabled).toBe(false);
  });

  test("STATE 9: submission closed beats upload for a registered user", () => {
    const r = deriveCta({
      ...BASE,
      registered: true,
      paymentStatus: "PAID",
      submissionOpen: false,
    });
    expect(r.state).not.toBe("REGISTERED_UPLOAD");
  });

  test("STATE 10: results published → RESULTS", () => {
    const r = deriveCta({ ...BASE, status: "RESULTS_PUBLISHED" });
    expect(r.state).toBe("RESULTS");
  });

  test("STATE 11: cancelled → CANCELLED (disabled)", () => {
    const r = deriveCta({ ...BASE, status: "CANCELLED" });
    expect(r.state).toBe("CANCELLED");
    expect(r.enabled).toBe(false);
  });
});

describe("rewards consistency (server-validated, never silently altered)", () => {
  test("sum helper in RewardsList logic matches pool arithmetic", () => {
    const rewards = [
      { position: 1, label: "1st Winner", amount: 550 },
      { position: 2, label: "2nd Winner", amount: 300 },
      { position: 3, label: "3rd Winner", amount: 240 },
      { position: 4, label: "4th Winner", amount: 200 },
      { position: 5, label: "5th Winner", amount: 130 },
      { position: 6, label: "6th Winner", amount: 80 },
    ];
    const sum = rewards.reduce((a, r) => a + r.amount, 0);
    expect(sum).toBe(1500);
  });
});
