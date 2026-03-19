/**
 * Common utilities for AI model language support testing
 * Shared across all model-specific test scripts
 *
 * USAGE:
 *   npx tsx tests/ai-language-support/test-text-generation.ts --lang=fr
 *   npx tsx tests/ai-language-support/test-text-generation.ts --lang=all
 */

import * as fs from "node:fs";
import * as path from "node:path";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

// ==================== CLI ARGUMENT PARSING ====================

/**
 * Parse --lang argument from command line
 * @returns Language code or "all" for all languages
 */
export function getTargetLanguage(): string {
	const args = process.argv.slice(2);
	const langArg = args.find((arg) => arg.startsWith("--lang="));
	if (langArg) {
		return langArg.split("=")[1].toLowerCase();
	}
	// Default to French (first non-English language to test)
	return "fr";
}

/**
 * Get languages to test based on CLI argument
 */
export function getLanguagesToTest(): (typeof TARGET_LANGUAGES)[number][] {
	const targetLang = getTargetLanguage();
	if (targetLang === "all") {
		return [...TARGET_LANGUAGES];
	}
	const lang = TARGET_LANGUAGES.find((l) => l.code === targetLang);
	if (!lang) {
		console.error(`❌ Unknown language: ${targetLang}`);
		console.log(
			`   Available: ${TARGET_LANGUAGES.map((l) => l.code).join(", ")}, all`,
		);
		process.exit(1);
	}
	// Always include English as baseline + target language
	const english = TARGET_LANGUAGES.find((l) => l.code === "en")!;
	return targetLang === "en" ? [english] : [english, lang];
}

// ==================== CONFIGURATION ====================

export const TARGET_LANGUAGES = [
	{ code: "en", name: "English", flag: "🇺🇸", iso: "en-US" },
	{ code: "fr", name: "French", flag: "🇫🇷", iso: "fr-FR" },
	{ code: "de", name: "German", flag: "🇩🇪", iso: "de-DE" },
	{ code: "it", name: "Italian", flag: "🇮🇹", iso: "it-IT" },
	{ code: "es", name: "Spanish", flag: "🇪🇸", iso: "es-ES" },
	{ code: "pt", name: "Portuguese", flag: "🇧🇷", iso: "pt-BR" },
	{ code: "ru", name: "Russian", flag: "🇷🇺", iso: "ru-RU" },
] as const;

export type LanguageCode = (typeof TARGET_LANGUAGES)[number]["code"];

// ==================== REAL TEST CASE: WEDDING ANNOUNCEMENT ====================

/**
 * Real test case based on actual app flow
 * Occasion: Wedding Announcement
 * Names: Laurent & Laurence
 * Theme: Romantic Warmth
 * Visual Style: Cinematic
 */
export const WEDDING_TEST_CASE: Record<
	LanguageCode,
	{
		occasion: string;
		eventTitle: string;
		theme: string;
		visualStyle: string;
		personalStory: string;
		sceneDescriptions: string[];
		narrationScript: string;
		musicPrompt: string;
	}
> = {
	en: {
		occasion: "Wedding Announcement",
		eventTitle: "Laurent & Laurence Wedding",
		theme: "Romantic Warmth",
		visualStyle: "Cinematic",
		personalStory:
			"We met in Paris under the Eiffel Tower five years ago. A chance encounter that became destiny. Now we're ready to begin our forever, and we want you to be part of our story.",
		sceneDescriptions: [
			"Opening scene: Soft morning light filtering through lace curtains, revealing elegant wedding rings on a velvet cushion",
			"Main scene: Laurent and Laurence walking hand in hand through a sunlit garden, rose petals falling gently around them",
			"Closing scene: The couple embracing under golden hour light, the Eiffel Tower visible in the distance",
		],
		narrationScript:
			"Five years ago, under the Parisian sky, our story began. A chance meeting became destiny. Now, Laurent and Laurence invite you to witness the beginning of their forever. Join us as we celebrate love, on this most special day.",
		musicPrompt:
			"Romantic piano and strings, elegant wedding ceremony, emotional and uplifting, soft crescendo, intimate and warm",
	},
	fr: {
		occasion: "Annonce de Mariage",
		eventTitle: "Mariage de Laurent & Laurence",
		theme: "Chaleur Romantique",
		visualStyle: "Cinématique",
		personalStory:
			"Nous nous sommes rencontrés à Paris sous la Tour Eiffel il y a cinq ans. Une rencontre fortuite devenue destin. Maintenant nous sommes prêts à commencer notre éternité, et nous voulons que vous fassiez partie de notre histoire.",
		sceneDescriptions: [
			"Scène d'ouverture: Douce lumière matinale filtrant à travers des rideaux de dentelle, révélant d'élégantes alliances sur un coussin de velours",
			"Scène principale: Laurent et Laurence marchant main dans la main dans un jardin ensoleillé, des pétales de roses tombant doucement autour d'eux",
			"Scène finale: Le couple s'embrassant sous la lumière dorée, la Tour Eiffel visible au loin",
		],
		narrationScript:
			"Il y a cinq ans, sous le ciel parisien, notre histoire a commencé. Une rencontre fortuite est devenue notre destin. Aujourd'hui, Laurent et Laurence vous invitent à être témoins du début de leur éternité. Rejoignez-nous pour célébrer l'amour, en ce jour si spécial.",
		musicPrompt:
			"Piano romantique et cordes, cérémonie de mariage élégante, émouvant et inspirant, crescendo doux, intime et chaleureux",
	},
	de: {
		occasion: "Hochzeitsankündigung",
		eventTitle: "Hochzeit von Laurent & Laurence",
		theme: "Romantische Wärme",
		visualStyle: "Filmisch",
		personalStory:
			"Wir haben uns vor fünf Jahren in Paris unter dem Eiffelturm kennengelernt. Eine zufällige Begegnung wurde zum Schicksal. Jetzt sind wir bereit, unsere Ewigkeit zu beginnen, und wir möchten, dass Sie Teil unserer Geschichte werden.",
		sceneDescriptions: [
			"Eröffnungsszene: Sanftes Morgenlicht filtert durch Spitzenvorhänge und enthüllt elegante Eheringe auf einem Samtkissen",
			"Hauptszene: Laurent und Laurence gehen Hand in Hand durch einen sonnendurchfluteten Garten, Rosenblätter fallen sanft um sie herum",
			"Schlussszene: Das Paar umarmt sich im goldenen Stundenlicht, der Eiffelturm ist in der Ferne sichtbar",
		],
		narrationScript:
			"Vor fünf Jahren, unter dem Pariser Himmel, begann unsere Geschichte. Eine zufällige Begegnung wurde zum Schicksal. Heute laden Laurent und Laurence Sie ein, den Beginn ihrer Ewigkeit zu bezeugen. Feiern Sie mit uns die Liebe an diesem besonderen Tag.",
		musicPrompt:
			"Romantisches Klavier und Streicher, elegante Hochzeitszeremonie, emotional und erhebend, sanftes Crescendo, intim und warm",
	},
	it: {
		occasion: "Annuncio di Matrimonio",
		eventTitle: "Matrimonio di Laurent & Laurence",
		theme: "Calore Romantico",
		visualStyle: "Cinematico",
		personalStory:
			"Ci siamo incontrati a Parigi sotto la Torre Eiffel cinque anni fa. Un incontro casuale diventato destino. Ora siamo pronti a iniziare la nostra eternità e vogliamo che facciate parte della nostra storia.",
		sceneDescriptions: [
			"Scena d'apertura: Dolce luce mattutina che filtra attraverso tende di pizzo, rivelando eleganti fedi nuziali su un cuscino di velluto",
			"Scena principale: Laurent e Laurence che camminano mano nella mano in un giardino soleggiato, petali di rosa che cadono dolcemente intorno a loro",
			"Scena finale: La coppia che si abbraccia nella luce dorata, la Torre Eiffel visibile in lontananza",
		],
		narrationScript:
			"Cinque anni fa, sotto il cielo parigino, la nostra storia è iniziata. Un incontro casuale è diventato il nostro destino. Oggi, Laurent e Laurence vi invitano a essere testimoni dell'inizio della loro eternità. Unitevi a noi per celebrare l'amore in questo giorno speciale.",
		musicPrompt:
			"Pianoforte romantico e archi, cerimonia di matrimonio elegante, emozionante e ispirante, crescendo dolce, intimo e caldo",
	},
	es: {
		occasion: "Anuncio de Boda",
		eventTitle: "Boda de Laurent & Laurence",
		theme: "Calidez Romántica",
		visualStyle: "Cinematográfico",
		personalStory:
			"Nos conocimos en París bajo la Torre Eiffel hace cinco años. Un encuentro casual que se convirtió en destino. Ahora estamos listos para comenzar nuestra eternidad, y queremos que seas parte de nuestra historia.",
		sceneDescriptions: [
			"Escena de apertura: Suave luz matutina filtrándose a través de cortinas de encaje, revelando elegantes anillos de boda sobre un cojín de terciopelo",
			"Escena principal: Laurent y Laurence caminando de la mano por un jardín soleado, pétalos de rosa cayendo suavemente a su alrededor",
			"Escena final: La pareja abrazándose bajo la luz dorada, la Torre Eiffel visible a lo lejos",
		],
		narrationScript:
			"Hace cinco años, bajo el cielo parisino, nuestra historia comenzó. Un encuentro casual se convirtió en nuestro destino. Hoy, Laurent y Laurence los invitan a ser testigos del comienzo de su eternidad. Únanse a nosotros para celebrar el amor en este día tan especial.",
		musicPrompt:
			"Piano romántico y cuerdas, ceremonia de boda elegante, emotivo e inspirador, crescendo suave, íntimo y cálido",
	},
	pt: {
		occasion: "Anúncio de Casamento",
		eventTitle: "Casamento de Laurent & Laurence",
		theme: "Calor Romântico",
		visualStyle: "Cinematográfico",
		personalStory:
			"Nos conhecemos em Paris sob a Torre Eiffel há cinco anos. Um encontro casual que se tornou destino. Agora estamos prontos para começar nossa eternidade, e queremos que você faça parte da nossa história.",
		sceneDescriptions: [
			"Cena de abertura: Luz suave da manhã filtrando através de cortinas de renda, revelando elegantes alianças de casamento em uma almofada de veludo",
			"Cena principal: Laurent e Laurence caminhando de mãos dadas por um jardim ensolarado, pétalas de rosa caindo suavemente ao redor deles",
			"Cena final: O casal se abraçando sob a luz dourada, a Torre Eiffel visível ao longe",
		],
		narrationScript:
			"Há cinco anos, sob o céu parisiense, nossa história começou. Um encontro casual se tornou nosso destino. Hoje, Laurent e Laurence convidam vocês a testemunhar o início de sua eternidade. Juntem-se a nós para celebrar o amor neste dia tão especial.",
		musicPrompt:
			"Piano romântico e cordas, cerimônia de casamento elegante, emocionante e inspirador, crescendo suave, íntimo e caloroso",
	},
	ru: {
		occasion: "Объявление о Свадьбе",
		eventTitle: "Свадьба Лорана и Лоранс",
		theme: "Романтическое Тепло",
		visualStyle: "Кинематографический",
		personalStory:
			"Мы встретились в Париже под Эйфелевой башней пять лет назад. Случайная встреча, ставшая судьбой. Теперь мы готовы начать нашу вечность, и мы хотим, чтобы вы стали частью нашей истории.",
		sceneDescriptions: [
			"Открывающая сцена: Мягкий утренний свет, проникающий сквозь кружевные занавески, освещает элегантные обручальные кольца на бархатной подушечке",
			"Основная сцена: Лоран и Лоранс идут рука об руку по залитому солнцем саду, лепестки роз мягко падают вокруг них",
			"Финальная сцена: Пара обнимается в золотистом свете, Эйфелева башня видна вдалеке",
		],
		narrationScript:
			"Пять лет назад, под парижским небом, началась наша история. Случайная встреча стала нашей судьбой. Сегодня Лоран и Лоранс приглашают вас стать свидетелями начала их вечности. Присоединяйтесь к нам, чтобы отпраздновать любовь в этот особенный день.",
		musicPrompt:
			"Романтическое фортепиано и струнные, элегантная свадебная церемония, эмоционально и вдохновляюще, мягкое крещендо, интимно и тепло",
	},
};

// ==================== TEST SCENARIOS ====================

/**
 * Two test scenarios for each model:
 * A: Mixed Language (EN system + target language user content) - Current production behavior
 * B: Full Target Language (everything in target language) - To test if quality improves
 */
export type TestScenario = "mixed" | "full";

export interface ScenarioConfig {
	scenario: TestScenario;
	systemLanguage: LanguageCode;
	userContentLanguage: LanguageCode;
	description: string;
}

export function getTestScenarios(targetLang: LanguageCode): ScenarioConfig[] {
	if (targetLang === "en") {
		return [
			{
				scenario: "full",
				systemLanguage: "en",
				userContentLanguage: "en",
				description: "English baseline",
			},
		];
	}

	return [
		{
			scenario: "mixed",
			systemLanguage: "en",
			userContentLanguage: targetLang,
			description: `Mixed: EN system + ${targetLang.toUpperCase()} content`,
		},
		{
			scenario: "full",
			systemLanguage: targetLang,
			userContentLanguage: targetLang,
			description: `Full ${targetLang.toUpperCase()}`,
		},
	];
}

// ==================== RESULT TYPES ====================

export interface TestResult {
	language: LanguageCode;
	languageName: string;
	scenario: TestScenario;
	scenarioDescription: string;
	success: boolean;
	latency: number; // ms
	error?: string;
	inputPrompt?: string; // What was sent to the model
	outputSample?: string; // What was received
	qualityScore?: number; // 1-10
	notes?: string;
}

export interface ModelTestResults {
	modelId: string;
	modelCategory: string;
	testDate: string;
	targetLanguage: LanguageCode;
	results: TestResult[];
	summary: {
		totalTests: number;
		passed: number;
		failed: number;
		avgLatency: number;
		avgQualityScore: number;
		mixedScenarioScore: number;
		fullLanguageScore: number;
	};
	recommendation?: string;
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Save test results to JSON file
 */
export function saveResults(
	modelId: string,
	targetLang: LanguageCode,
	results: ModelTestResults,
): void {
	const timestamp = new Date().toISOString().split("T")[0];
	const safeModelId = modelId.replace(/\//g, "-").replace(/\./g, "-");
	const filename = `${safeModelId}-${targetLang}-${timestamp}.json`;
	const filepath = path.join(__dirname, "results", filename);

	fs.writeFileSync(filepath, JSON.stringify(results, null, 2));
	console.log(`\n💾 Results saved to: ${filepath}\n`);
}

/**
 * Print test results summary
 */
export function printSummary(results: ModelTestResults): void {
	const lang = TARGET_LANGUAGES.find((l) => l.code === results.targetLanguage);

	console.log(
		"\n╔═══════════════════════════════════════════════════════════════════════╗",
	);
	console.log(`║  📊 ${results.modelId.padEnd(58)}║`);
	console.log(
		`${`║  🌍 Target: ${lang?.flag} ${lang?.name} (${results.targetLanguage})`.padEnd(
			72,
		)}║`,
	);
	console.log(
		"╚═══════════════════════════════════════════════════════════════════════╝\n",
	);

	console.log(`📁 Category: ${results.modelCategory}`);
	console.log(`📅 Test Date: ${results.testDate}`);
	console.log("");

	// Print results table
	console.log(
		"┌──────────────────────────────────┬──────────┬──────────┬──────────┐",
	);
	console.log(
		"│ Scenario                         │ Status   │ Latency  │ Quality  │",
	);
	console.log(
		"├──────────────────────────────────┼──────────┼──────────┼──────────┤",
	);

	for (const result of results.results) {
		const status = result.success ? "✅ Pass" : "❌ Fail";
		const latency = `${result.latency}ms`.padStart(7);
		const quality = result.qualityScore
			? `${result.qualityScore}/10`.padStart(6)
			: "  N/A ";
		const desc = result.scenarioDescription.substring(0, 32).padEnd(32);
		console.log(`│ ${desc} │ ${status.padEnd(8)} │ ${latency} │ ${quality} │`);
	}

	console.log(
		"└──────────────────────────────────┴──────────┴──────────┴──────────┘",
	);

	// Summary stats
	console.log("\n📊 Summary:");
	console.log(`   Total Tests:        ${results.summary.totalTests}`);
	console.log(`   ✅ Passed:          ${results.summary.passed}`);
	console.log(`   ❌ Failed:          ${results.summary.failed}`);
	console.log(
		`   ⏱️  Avg Latency:     ${results.summary.avgLatency.toFixed(0)}ms`,
	);
	console.log(
		`   ⭐ Avg Quality:     ${results.summary.avgQualityScore.toFixed(1)}/10`,
	);

	// Scenario comparison
	if (
		results.summary.mixedScenarioScore > 0 &&
		results.summary.fullLanguageScore > 0
	) {
		console.log("\n📈 Scenario Comparison:");
		console.log(
			`   Mixed (EN+${results.targetLanguage.toUpperCase()}):  ${results.summary.mixedScenarioScore.toFixed(1)}/10`,
		);
		console.log(
			`   Full ${results.targetLanguage.toUpperCase()}:       ${results.summary.fullLanguageScore.toFixed(1)}/10`,
		);

		const diff =
			results.summary.fullLanguageScore - results.summary.mixedScenarioScore;
		if (Math.abs(diff) < 0.5) {
			console.log("   → Similar quality (use mixed for compatibility)");
		} else if (diff > 0) {
			console.log(
				`   → Full ${results.targetLanguage.toUpperCase()} is BETTER by ${diff.toFixed(1)} points`,
			);
		} else {
			console.log(
				`   → Mixed is BETTER by ${Math.abs(diff).toFixed(1)} points`,
			);
		}
	}

	// Recommendation
	if (results.recommendation) {
		console.log(`\n💡 Recommendation: ${results.recommendation}`);
	}
}

/**
 * Calculate summary statistics from test results
 */
export function calculateSummary(
	results: TestResult[],
	_targetLang: LanguageCode,
): ModelTestResults["summary"] {
	const passedResults = results.filter((r) => r.success);
	const qualityScores = results
		.filter((r) => r.qualityScore !== undefined)
		.map((r) => r.qualityScore!);

	const mixedResults = results.filter(
		(r) => r.scenario === "mixed" && r.qualityScore,
	);
	const fullResults = results.filter(
		(r) => r.scenario === "full" && r.qualityScore,
	);

	return {
		totalTests: results.length,
		passed: passedResults.length,
		failed: results.length - passedResults.length,
		avgLatency:
			passedResults.length > 0
				? passedResults.reduce((sum, r) => sum + r.latency, 0) /
					passedResults.length
				: 0,
		avgQualityScore:
			qualityScores.length > 0
				? qualityScores.reduce((sum, q) => sum + q, 0) / qualityScores.length
				: 0,
		mixedScenarioScore:
			mixedResults.length > 0
				? mixedResults.reduce((sum, r) => sum + r.qualityScore!, 0) /
					mixedResults.length
				: 0,
		fullLanguageScore:
			fullResults.length > 0
				? fullResults.reduce((sum, r) => sum + r.qualityScore!, 0) /
					fullResults.length
				: 0,
	};
}

/**
 * Generate recommendation based on results
 */
export function generateRecommendation(
	summary: ModelTestResults["summary"],
	targetLang: LanguageCode,
): string {
	if (summary.failed > 0) {
		return `⚠️ ${summary.failed} test(s) failed. Investigate errors before production use.`;
	}

	if (summary.avgQualityScore >= 8) {
		return `✅ Excellent ${targetLang.toUpperCase()} support. Ready for production.`;
	} else if (summary.avgQualityScore >= 6) {
		return `⚠️ Good ${targetLang.toUpperCase()} support with minor issues. Review output samples.`;
	} else {
		return `❌ Poor ${targetLang.toUpperCase()} support. Consider alternative approaches.`;
	}
}

/**
 * Wait helper
 */
export function wait(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

// ==================== API KEYS ====================

export function getApiKeys() {
	return {
		FAL_KEY: process.env.FAL_KEY,
		OPENAI_API_KEY: process.env.OPENAI_API_KEY,
		TOGETHER_API_KEY: process.env.TOGETHER_API_KEY,
	};
}

export function validateApiKey(key: string | undefined, name: string): void {
	if (!key) {
		console.error(`❌ ${name} not found in .env.local`);
		process.exit(1);
	}
	console.log(`✅ ${name} found`);
}

// ==================== MiniMax TTS CONFIGURATION ====================

/**
 * MiniMax voice settings per language
 * @see https://fal.ai/models/fal-ai/minimax/speech-2.6-hd
 */
export const MINIMAX_LANGUAGE_CONFIG: Record<
	LanguageCode,
	{ languageBoost: string; voiceId: string }
> = {
	en: { languageBoost: "English", voiceId: "Wise_Woman" },
	fr: { languageBoost: "French", voiceId: "Wise_Woman" },
	de: { languageBoost: "German", voiceId: "Wise_Woman" },
	it: { languageBoost: "Italian", voiceId: "Wise_Woman" },
	es: { languageBoost: "Spanish", voiceId: "Wise_Woman" },
	pt: { languageBoost: "Portuguese", voiceId: "Wise_Woman" },
	ru: { languageBoost: "Russian", voiceId: "Wise_Woman" },
};

// ==================== LANGUAGE QUALITY ASSESSMENT ====================

/**
 * Assess the quality of language output
 * Uses basic heuristics - in production you might use a language detection API
 */
export function assessLanguageQuality(
	content: string,
	expectedLang: LanguageCode,
): number {
	if (!content || content.length < 10) return 0;

	// Basic language detection heuristics
	const languageMarkers: Record<string, RegExp[]> = {
		en: [/\b(the|and|to|of|is|are|was|were|be|been|have|has)\b/gi],
		fr: [/\b(le|la|les|de|et|est|sont|une|un|pour|avec|nous|vous)\b/gi],
		de: [/\b(der|die|das|und|ist|sind|ein|eine|für|mit|wir|sie)\b/gi],
		it: [/\b(il|la|di|e|è|sono|un|una|per|con|noi|loro)\b/gi],
		es: [/\b(el|la|de|y|es|son|un|una|para|con|nosotros|ellos)\b/gi],
		pt: [/\b(o|a|de|e|é|são|um|uma|para|com|nós|eles)\b/gi],
		ru: [/[а-яА-ЯёЁ]/g], // Russian Cyrillic characters
	};

	const markers = languageMarkers[expectedLang];
	if (!markers) return 7; // Default if no markers defined

	// Count matches
	let matchCount = 0;
	for (const marker of markers) {
		const matches = content.match(marker);
		matchCount += matches ? matches.length : 0;
	}

	// Score based on match density
	const density = matchCount / (content.length / 50);

	if (density > 2) return 10;
	if (density > 1) return 9;
	if (density > 0.5) return 8;
	if (density > 0.2) return 7;
	if (density > 0.1) return 5;
	return 3;
}
