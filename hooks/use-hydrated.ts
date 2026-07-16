"use client";

/**
 * useHydrated — canonical hydration-safe primitive.
 *
 * Replaces every ad-hoc `const [mounted, setMounted] = useState(false)` +
 * `useEffect(() => setMounted(true), [])` guard.
 *
 * WHY useSyncExternalStore instead of useState+useEffect:
 *  - The useState/useEffect mount guard triggers TWO renders: one with false
 *    (SSR-matched) and one with true (client render).
 *  - useSyncExternalStore with a no-op subscribe is the React-team-blessed
 *    pattern: getServerSnapshot returns false on the server, getSnapshot
 *    returns true on the client. React batches this into a single client
 *    render — zero extra commit, zero flicker.
 *
 * Usage:
 *   const hydrated = useHydrated();
 *   if (!hydrated) return <Skeleton />;
 *   return <ClientOnlyContent />;
 *
 * Ported from vantage-registry@4dd1857 apps/dashboard/hooks/use-hydrated.ts
 */

import { useSyncExternalStore } from "react";

/** No-op subscribe — the store never changes after hydration. */
const subscribe = () => () => {};

/** On the server: not yet hydrated. */
const getServerSnapshot = () => false;

/** On the client: always hydrated. */
const getSnapshot = () => true;

/**
 * Returns `true` once the component is running on the client (post-hydration).
 * Returns `false` during SSR / the server snapshot pass.
 */
export function useHydrated(): boolean {
	return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
