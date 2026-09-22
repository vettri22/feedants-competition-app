/**
 * Standard API response envelope helpers — mirror the assignment's contract:
 *   success: { success: true, data, message? }
 *   error:   { success: false, error: { code, message, details? } }
 * Errors are thrown as AppError and normalized in each public function's
 * try/catch so clients always receive a predictable shape.
 */
import { toErrorPayload } from "./errors";

export function ok<T>(data: T, message?: string) {
  return message ? { success: true as const, data, message } : { success: true as const, data };
}

export function fail(err: unknown) {
  return { success: false as const, error: toErrorPayload(err) };
}
