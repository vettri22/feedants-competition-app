/**
 * Centralized API client — the single place that unwraps the backend's
 * { success, data | error } envelope. Components use `useApiMutation` /
 * `useApiQuery` instead of touching convex/react directly, so envelope
 * parsing and error normalization happen in exactly one spot.
 *
 * Convex queries are reactive subscriptions (live server state), which
 * replaces React Query's cache+refetch role here: the "refetch after
 * mutation" requirement is satisfied automatically because registration/
 * payment/submission mutations write to the same documents the detail query
 * subscribes to — every subscribed client updates in real time.
 */
import { useCallback, useState } from "react";
import { useQuery as useConvexQuery, useMutation as useConvexMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { FunctionReturnType } from "convex/server";

/** Normalized client-side error carrying the backend's machine-readable code. */
export class ApiError extends Error {
  readonly code: string;
  readonly details?: Record<string, unknown>;
  /** Backend AppError codes are "expected" failures (full, duplicate…). */
  readonly expected: boolean;

  constructor(code: string, message: string, details?: Record<string, unknown>) {
    super(message);
    this.code = code;
    this.details = details;
    this.expected = code !== "INTERNAL";
  }
}

type Envelope<T> = { success: true; data: T; message?: string } | { success: false; error: { code: string; message: string; details?: Record<string, unknown> } };

function unwrap<T>(res: unknown): T {
  const env = res as Envelope<T>;
  if (env && typeof env === "object" && "success" in env) {
    if (env.success) return env.data;
    throw new ApiError(env.error.code, env.error.message, env.error.details);
  }
  // Defensive: backend always sends the envelope; normalize otherwise.
  throw new ApiError("INTERNAL", "Something went wrong. Please try again.");
}

/** Unwraps a raw envelope result (for use inside event handlers). */
export function unwrapResult<T>(res: unknown): T {
  return unwrap<T>(res);
}

export function isRetryable(err: unknown): boolean {
  return err instanceof ApiError ? !err.expected : true;
}

/**
 * Convex error messages (e.g. "Uncaught Error: sent too many requests")
 * normalized for user display — never expose internals/stack traces.
 */
export function describeError(err: unknown): ApiError {
  if (err instanceof ApiError) return err;
  const msg = err instanceof Error ? err.message : String(err);
  if (/too many|rate limit/i.test(msg)) {
    return new ApiError("RATE_LIMITED", "Too many attempts. Please wait a moment and try again.");
  }
  if (/network|fetch|Failed to fetch/i.test(msg)) {
    return new ApiError("NETWORK", "You appear to be offline. Check your connection and try again.");
  }
  return new ApiError("INTERNAL", "Something went wrong. Please try again.");
}

type AnyMutation = (typeof api)[keyof typeof api][keyof (typeof api)[keyof typeof api]];

/**
 * useApiMutation — imperative mutation with envelope unwrapping.
 * Returns [mutate, { pending, error }].
 */
export function useApiMutation<F extends AnyMutation>(
  fn: F,
): [(args: Record<string, unknown>) => Promise<FunctionReturnType<F>>, { pending: boolean; error: ApiError | null }] {
  const mutateRaw = useConvexMutation(fn as never);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const mutate = useCallback(
    async (args: Record<string, unknown>) => {
      setPending(true);
      setError(null);
      try {
        const raw = await (mutateRaw as unknown as (a: unknown) => Promise<unknown>)(args);
        return unwrap<FunctionReturnType<F>>(raw);
      } catch (err) {
        const normalized = describeError(err);
        setError(normalized);
        throw normalized;
      } finally {
        setPending(false);
      }
    },
    [mutateRaw],
  );

  return [mutate, { pending, error }];
}

/**
 * useApiQuery — reactive query with envelope unwrapping.
 * Returns undefined while loading; throws ApiError via `error` field
 * (Convex rethrows on subscription) — handled per-component.
 */
export function useApiQuery<F extends AnyMutation>(
  fn: F,
  args: Record<string, unknown> | "skip",
): { data: FunctionReturnType<F> | undefined; loading: boolean; error: ApiError | null } {
  const res = useConvexQuery(
    fn as never,
    args === "skip" ? ("skip" as never) : (args as never),
  );
  // Convex queries that throw surface here as an error boundary; we surface
  // envelope failures by unwrapping when data arrives.
  let data: FunctionReturnType<F> | undefined;
  let error: ApiError | null = null;
  if (res !== undefined) {
    try {
      data = unwrap<FunctionReturnType<F>>(res);
    } catch (err) {
      error = describeError(err);
    }
  }
  return { data, loading: res === undefined && error === null, error };
}
