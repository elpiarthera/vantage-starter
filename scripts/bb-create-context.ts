import Browserbase from "@browserbasehq/sdk";

async function main() {
	const apiKey = process.env.BROWSERBASE_API_KEY;
	const projectId = process.env.BROWSERBASE_PROJECT_ID;

	if (!apiKey || !projectId) {
		console.error(
			"Missing required env vars: BROWSERBASE_API_KEY and/or BROWSERBASE_PROJECT_ID",
		);
		process.exit(1);
	}

	const bb = new Browserbase({ apiKey });

	// Create a persistent context for Clerk auth sessions
	const context = await bb.contexts.create({ projectId });

	console.log("Context created:", context.id);
	console.log(`Add to .env.local: BB_CONTEXT_ID=${context.id}`);
}

main().catch(console.error);
