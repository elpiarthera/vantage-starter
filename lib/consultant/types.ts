/**
 * Consultant Onboarding Types
 *
 * Context passed to onboardingPrompt() to generate a pain-oriented
 * discovery session prompt. Populated from:
 *   - consultantProjects.brandKit (auto-scraped via Firecrawl)
 *   - consultantProjects.competitors (scraped competitor profiles)
 *   - vantage-registry teams query (convex/registry.ts)
 */

export interface OnboardingContext {
	projectName: string;
	clientName: string;
	clientWebsiteUrl: string;
	sector: string;

	/**
	 * Auto-generated from Firecrawl scrape of the client website.
	 * Present only after Phase 0 scrape completes.
	 */
	brandKit?: {
		name?: string;
		tagline?: string;
		colors?: string[];
		products?: string[];
		techStack?: string[];
	};

	/**
	 * Scraped profiles of 3-5 competitors added by the consultant.
	 * Present only after Phase 0 competitor scrapes complete.
	 */
	competitors?: Array<{
		name: string;
		url: string;
		positioning?: string;
		pricing?: string;
		offers?: string;
		differentiators?: string;
	}>;

	/**
	 * Available teams from vantage-registry for this session.
	 * Injected from convex/registry.ts query results.
	 */
	availableTeams: Array<{
		teamId: string;
		name: string;
		description: string;
		category: string;
		agentCount: number;
	}>;
}
