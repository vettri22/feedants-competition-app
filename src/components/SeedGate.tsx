import { useEffect, useRef } from "react";
import { useMutation, useQuery as useConvexQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { unwrapResult } from "@/lib/api-client";

/**
 * SeedGate — runs the backend demo seeder exactly when the backend says to:
 *  - demo competition missing (fresh deployment) → create it
 *  - demo competition concluded (result date passed) → refresh its dates
 * The mutation is idempotent (upsert-by-slug, dates-only refresh) and Convex
 * serializable transactions make concurrent double-fires safe. Renders nothing.
 */
export function SeedGate() {
  const raw = useConvexQuery(api.seed.demoStatus, {});
  const seed = useMutation(api.seed.seedAll);
  const attempted = useRef(false);

  useEffect(() => {
    if (raw === undefined) return;
    if (attempted.current) return;
    try {
      const { seed: should } = unwrapResult<{ seed: boolean }>(raw);
      if (should) {
        attempted.current = true;
        void seed({}).catch((err) => {
          attempted.current = false;
          console.warn("[seed] demo seeding failed:", err);
          console.warn(err);
        });
      }
    } catch {
      // demoStatus threw (e.g. unauthenticated edge) — nothing to seed.
    }
  }, [raw, seed]);

  return null;
}
