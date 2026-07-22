/**
 * routes — single source of truth for internal route paths.
 *
 * Every internal navigation (`router.push`, `router.replace`, `redirect`,
 * `href`, `Link`) MUST consume a value produced by this module. A path is
 * never hand-typed at the call site — see `.claude/rules/derive-never-type.md`.
 *
 * Paths exported here are LOCALE-FREE. `i18n/routing.ts` configures
 * `localePrefix: "as-needed"` and `createNavigation()` from `next-intl`
 * (its `Link` / `redirect` / `useRouter` exports) prepends the locale
 * prefix automatically for any pathname that is not part of a `pathnames`
 * map — this repo defines no such map, so it runs in next-intl's "shared
 * pathnames" navigation mode. Concretely: pass `ROUTES.dashboardMission(id)`
 * straight into `useRouter()` (imported from `@/i18n/routing`, NOT
 * `next/navigation`) or into `<Link>` (same import) and the locale prefix
 * is handled once, here, for every caller.
 *
 * Source: `node_modules/next-intl/dist/types/navigation/react-client/createNavigation.d.ts`
 * (`RoutingConfigSharedNavigation` branch selected when no `pathnames` is
 * passed to `defineRouting`) and `i18n/routing.ts` itself.
 *
 * The static half of this object is verified against the real route tree
 * (`find "app/[locale]" -name page.tsx`) by
 * `__tests__/lib/route-tree-guard.test.ts` — that test also scans
 * `app/ components/ lib/ hooks/ providers/` for hand-typed internal paths
 * that bypass this module.
 */

export const ROUTES = {
	home: "/",
	dashboard: "/dashboard",
	dashboardAccount: "/dashboard/account",
	dashboardArchitect: "/dashboard/architect",
	dashboardChat: "/dashboard/chat",
	dashboardChatSession: (chatId: string) => `/dashboard/chat/${chatId}`,
	dashboardConfigurator: "/dashboard/configurator",
	dashboardConsultantBook: "/dashboard/consultant/book",
	dashboardConsultantOnboard: "/dashboard/consultant/onboard",
	dashboardConsultantOnboardProject: (projectId: string) =>
		`/dashboard/consultant/onboard/${projectId}`,
	dashboardMissions: "/dashboard/missions",
	dashboardMission: (missionId: string) => `/dashboard/missions/${missionId}`,
	accessibilite: "/accessibilite",
	accessibility: "/accessibility",
	accessibilityPlan: "/accessibility-plan",
	changelog: "/changelog",
	changelogDetail: (slug: string) => `/changelog/${slug}`,
	contact: "/contact",
	create: "/create",
	events: "/events",
	eventDetail: (slug: string) => `/events/${slug}`,
	legal: "/legal",
	privacy: "/privacy",
	report: "/report",
	schemaAccessibilite: "/schema-accessibilite",
	signIn: "/sign-in",
	signUp: "/sign-up",
	waitlist: "/waitlist",
} as const;

type RouteValue = string | ((arg: string) => string);
const routeValues: RouteValue[] = Object.values(ROUTES);

/** Every statically-known (non-dynamic) route path, for guard/test use. */
export const STATIC_ROUTE_PATHS: readonly string[] = routeValues.filter(
	(value): value is string => typeof value === "string",
);

/**
 * Static prefix of every dynamic route builder, e.g. `dashboardMission`
 * yields `/dashboard/missions`. Used by the guard to recognize a
 * template-literal call site (`` `/dashboard/missions/${id}` ``) as
 * belonging to a known dynamic route rather than a hand-typed one.
 */
export const DYNAMIC_ROUTE_PREFIXES: readonly string[] = routeValues
	.filter(
		(value): value is (arg: string) => string => typeof value === "function",
	)
	.map((builder) => {
		const sample = builder("__PROBE__");
		return sample.slice(0, sample.indexOf("__PROBE__"));
	});
