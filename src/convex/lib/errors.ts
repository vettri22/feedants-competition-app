/**
 * Centralized API error handling — mirrors the assignment's standard error
 * envelope: { success: false, error: { code, message, details } }.
 */
export type ErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "COMPETITION_FULL"
  | "ALREADY_REGISTERED"
  | "REGISTRATION_CLOSED"
  | "REGISTRATION_REQUIRED"
  | "PAYMENT_REQUIRED"
  | "PAYMENT_FAILED"
  | "SUBMISSION_WINDOW_CLOSED"
  | "SUBMISSION_WINDOW_NOT_OPEN"
  | "INVALID_FILE"
  | "ALREADY_SUBMITTED"
  | "SELF_REFERRAL"
  | "REWARD_MISMATCH"
  | "CONFLICT";

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly details?: Record<string, unknown>;

  constructor(code: ErrorCode, message: string, details?: Record<string, unknown>) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

export function toErrorPayload(err: unknown): { code: string; message: string; details?: Record<string, unknown> } {
  if (err instanceof AppError) {
    return { code: err.code, message: err.message, details: err.details };
  }
  // Never leak stack traces / internals to clients.
  return { code: "INTERNAL", message: "Something went wrong. Please try again." };
}
