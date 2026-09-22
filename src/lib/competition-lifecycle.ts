import type { CompetitionStatus } from "../convex/schema";

/**
 * Competition lifecycle service — derives a competition's status from
 * database-driven date fields plus any manual admin override.
 *
 * This is the single source of truth for lifecycle rules. The backend calls
 * this to compute authoritative status for API responses; the frontend uses
 * the same pure functions ONLY for rendering the state returned by the API
 * (never re-derives status from dates client-side as the authority).
 */

export interface LifecycleDates {
  registrationStart: number;
  registrationEnd: number;
  submissionStart: number;
  submissionEnd: number;
  resultDate: number;
}

export function deriveCompetitionStatus(
  now: number,
  dates: LifecycleDates,
  override?: CompetitionStatus,
  hasCapacity = true,
): CompetitionStatus {
  if (override === "CANCELLED" || override === "DRAFT" || override === "JUDGING" || override === "RESULTS_PUBLISHED") {
    return override;
  }
  // NOTE: the reference data has OVERLAPPING windows (submission opens Aug 6
  // while registration runs until Aug 10). Registration is the primary
  // surface while it is open; the submission CTA is derived independently
  // from the same dates via isSubmissionWindowOpen().
  if (now < dates.registrationStart) return "UPCOMING";
  if (now <= dates.registrationEnd) return hasCapacity ? "REGISTRATION_OPEN" : "REGISTRATION_CLOSED";
  if (now >= dates.submissionStart && now <= dates.submissionEnd) return "SUBMISSION_OPEN";
  if (now < dates.submissionStart) return "REGISTRATION_CLOSED";
  if (now < dates.resultDate) return "SUBMISSION_CLOSED";
  return "RESULTS_PUBLISHED";
}

export function isRegistrationOpen(status: CompetitionStatus, now: number, registrationEnd: number): boolean {
  return status === "REGISTRATION_OPEN" && now <= registrationEnd;
}

export function isSubmissionWindowOpen(status: CompetitionStatus, now: number, dates: Pick<LifecycleDates, "submissionStart" | "submissionEnd">): boolean {
  const inWindow = now >= dates.submissionStart && now <= dates.submissionEnd;
  return (status === "SUBMISSION_OPEN" || status === "REGISTRATION_CLOSED") && inWindow;
}

// ─── CTA derivation ───────────────────────────────────────────────────────────

export interface CtaInput {
  status: CompetitionStatus;
  authenticated: boolean;
  registered: boolean;
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED" | null;
  entryFee: number;
  remainingSpots: number;
  registrationOpen: boolean;
  submissionOpen: boolean;
  hasSubmission: boolean;
}

export interface CtaResult {
  label: string;
  enabled: boolean;
  /** semantic state key so the UI never shows conflicting states */
  state:
    | "LOGIN_REQUIRED"
    | "REGISTER_FREE"
    | "PAY_REGISTER"
    | "PAYMENT_PENDING"
    | "REGISTERED_UPLOAD"
    | "REGISTERED"
    | "REGISTRATION_CLOSED"
    | "COMPETITION_FULL"
    | "CANCELLED"
    | "RESULTS"
    | "SUBMISSION_CLOSED"
    | "UNAVAILABLE";
  action: "NAVIGATE_AUTH" | "REGISTER" | "UPLOAD" | "NONE" | "VIEW_RESULTS";
}

export function deriveCta(input: CtaInput): CtaResult {
  const { status } = input;

  if (status === "CANCELLED") {
    return { label: "competition.cta.cancelled", enabled: false, state: "CANCELLED", action: "NONE" };
  }
  if (status === "RESULTS_PUBLISHED") {
    return { label: "competition.cta.viewResults", enabled: false, state: "RESULTS", action: "VIEW_RESULTS" };
  }
  if (!input.authenticated) {
    return { label: "competition.cta.loginToRegister", enabled: true, state: "LOGIN_REQUIRED", action: "NAVIGATE_AUTH" };
  }
  if (input.registered) {
    if (input.submissionOpen && !input.hasSubmission) {
      return { label: "competition.cta.uploadSubmission", enabled: true, state: "REGISTERED_UPLOAD", action: "UPLOAD" };
    }
    if (input.hasSubmission) {
      return { label: "competition.cta.registered", enabled: false, state: "REGISTERED", action: "NONE" };
    }
    if (input.paymentStatus === "PENDING") {
      return { label: "competition.cta.completePayment", enabled: true, state: "PAYMENT_PENDING", action: "REGISTER" };
    }
    return { label: "competition.cta.registered", enabled: false, state: "REGISTERED", action: "NONE" };
  }
  if (input.remainingSpots <= 0) {
    return { label: "competition.cta.competitionFull", enabled: false, state: "COMPETITION_FULL", action: "NONE" };
  }
  if (!input.registrationOpen) {
    return { label: "competition.cta.registrationClosed", enabled: false, state: "REGISTRATION_CLOSED", action: "NONE" };
  }
  if (input.paymentStatus === "PENDING") {
    return { label: "competition.cta.completePayment", enabled: true, state: "PAYMENT_PENDING", action: "REGISTER" };
  }
  if (input.entryFee > 0) {
    return { label: "competition.cta.payAndRegister", enabled: true, state: "PAY_REGISTER", action: "REGISTER" };
  }
  return { label: "competition.cta.registerNow", enabled: true, state: "REGISTER_FREE", action: "REGISTER" };
}
