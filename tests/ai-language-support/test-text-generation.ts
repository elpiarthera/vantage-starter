/**
 * Text Generation Language Support Test
 * Compares GPT-4o-mini vs GPT-5-mini with real wedding announcement test case
 *
 * Tests two scenarios per language:
 * - Mixed: EN system prompt + target language user content (production behavior)
 * - Full: Everything in target language
 *
 * USAGE:
 *   npx tsx tests/ai-language-support/test-text-generation.ts --lang=fr
 *   npx tsx tests/ai-language-support/test-text-generation.ts --lang=all
 *
 * @see docs/Understanding/ai-models-overview.md
 */

import {
	assessLanguageQuality,
	calculateSummary,
	generateRecommendation,
	getApiKeys,
	getLanguagesToTest,
	getTestScenarios,
	type LanguageCode,
	type ModelTestResults,
	printSummary,
	type ScenarioConfig,
	saveResults,
	type TestResult,
	validateApiKey,
	WEDDING_TEST_CASE,
	wait,
} from "./common";

const MODELS_TO_TEST = [
	{ id: "gpt-4o-mini", name: "GPT-4o Mini", inputCost: 0.15, outputCost: 0.6 },
	{ id: "gpt-5-mini", name: "GPT-5 Mini", inputCost: 0.25, outputCost: 2.0 },
];

/**
 * System prompts - matching STORY_GENERATION_PROMPT structure
 */
const SYSTEM_PROMPTS: Record<LanguageCode, string> = {
	en: `You are an expert AI Director for emotionally resonant short-form videos.

Your task is to create a compelling video story concept based on the provided event details.

The story should:
1. Be structured for a 30-second video (approximately 75-90 words for narration)
2. Have a clear emotional arc: opening hook → emotional core → meaningful conclusion
3. Match the occasion and emotional theme perfectly
4. Be personal and authentic, not generic
5. Include specific visual scene suggestions (3-4 scenes)

Return ONLY the narration script (75-90 words), no explanations.`,

	fr: `Vous êtes un directeur artistique IA expert pour des vidéos courtes émotionnellement résonnantes.

Votre tâche est de créer un concept d'histoire vidéo captivant basé sur les détails de l'événement fournis.

L'histoire doit:
1. Être structurée pour une vidéo de 30 secondes (environ 75-90 mots pour la narration)
2. Avoir un arc émotionnel clair: accroche d'ouverture → cœur émotionnel → conclusion significative
3. Correspondre parfaitement à l'occasion et au thème émotionnel
4. Être personnelle et authentique, pas générique
5. Inclure des suggestions de scènes visuelles spécifiques (3-4 scènes)

Retournez UNIQUEMENT le script de narration (75-90 mots), sans explications.`,

	de: `Sie sind ein erfahrener KI-Regisseur für emotional berührende Kurzvideos.

Ihre Aufgabe ist es, ein fesselndes Videogeschichtskonzept basierend auf den bereitgestellten Veranstaltungsdetails zu erstellen.

Die Geschichte sollte:
1. Für ein 30-Sekunden-Video strukturiert sein (ca. 75-90 Wörter für die Narration)
2. Einen klaren emotionalen Bogen haben: Eröffnungshaken → emotionaler Kern → bedeutungsvoller Abschluss
3. Perfekt zum Anlass und emotionalen Thema passen
4. Persönlich und authentisch sein, nicht generisch
5. Spezifische visuelle Szenenvorschläge enthalten (3-4 Szenen)

Geben Sie NUR das Narrationsskript zurück (75-90 Wörter), keine Erklärungen.`,

	it: `Sei un esperto regista AI per video brevi emotivamente coinvolgenti.

Il tuo compito è creare un concetto di storia video avvincente basato sui dettagli dell'evento forniti.

La storia dovrebbe:
1. Essere strutturata per un video di 30 secondi (circa 75-90 parole per la narrazione)
2. Avere un chiaro arco emotivo: gancio di apertura → nucleo emotivo → conclusione significativa
3. Corrispondere perfettamente all'occasione e al tema emotivo
4. Essere personale e autentica, non generica
5. Includere suggerimenti per scene visive specifiche (3-4 scene)

Restituisci SOLO lo script della narrazione (75-90 parole), nessuna spiegazione.`,

	es: `Eres un director de IA experto para videos cortos emocionalmente resonantes.

Tu tarea es crear un concepto de historia de video convincente basado en los detalles del evento proporcionados.

La historia debe:
1. Estar estructurada para un video de 30 segundos (aproximadamente 75-90 palabras para la narración)
2. Tener un arco emocional claro: gancho de apertura → núcleo emocional → conclusión significativa
3. Coincidir perfectamente con la ocasión y el tema emocional
4. Ser personal y auténtica, no genérica
5. Incluir sugerencias de escenas visuales específicas (3-4 escenas)

Devuelve SOLO el guión de narración (75-90 palabras), sin explicaciones.`,

	pt: `Você é um diretor de IA especialista para vídeos curtos emocionalmente ressonantes.

Sua tarefa é criar um conceito de história de vídeo envolvente com base nos detalhes do evento fornecidos.

A história deve:
1. Ser estruturada para um vídeo de 30 segundos (aproximadamente 75-90 palavras para narração)
2. Ter um arco emocional claro: gancho de abertura → núcleo emocional → conclusão significativa
3. Corresponder perfeitamente à ocasião e ao tema emocional
4. Ser pessoal e autêntica, não genérica
5. Incluir sugestões de cenas visuais específicas (3-4 cenas)

Retorne APENAS o roteiro de narração (75-90 palavras), sem explicações.`,

	ru: `Вы опытный ИИ-режиссёр для эмоционально резонирующих коротких видео.

Ваша задача — создать захватывающую концепцию видеоистории на основе предоставленных деталей мероприятия.

История должна:
1. Быть структурирована для 30-секундного видео (приблизительно 75-90 слов для повествования)
2. Иметь чёткую эмоциональную арку: вступительный крючок → эмоциональное ядро → значимое заключение
3. Идеально соответствовать событию и эмоциональной теме
4. Быть личной и аутентичной, не шаблонной
5. Включать конкретные визуальные предложения сцен (3-4 сцены)

Верните ТОЛЬКО сценарий повествования (75-90 слов), без объяснений.`,
};

/**
 * Build user prompt from wedding test case
 */
function buildUserPrompt(
	testCase: (typeof WEDDING_TEST_CASE)[LanguageCode],
): string {
	return `Occasion: ${testCase.occasion}
Event Title: ${testCase.eventTitle}
Emotional Theme: ${testCase.theme}
Visual Style: ${testCase.visualStyle}

Personal Story from the creator:
"${testCase.personalStory}"

Create a compelling narration script for this wedding video. The story should feel ${testCase.theme} and deeply personal.`;
}

async function testScenario(
	apiKey: string,
	modelId: string,
	scenario: ScenarioConfig,
	targetLang: LanguageCode,
): Promise<TestResult> {
	const startTime = Date.now();

	// Get system prompt based on scenario
	const systemPrompt =
		SYSTEM_PROMPTS[scenario.systemLanguage] || SYSTEM_PROMPTS.en;

	// Get user content based on scenario
	const testCase = WEDDING_TEST_CASE[scenario.userContentLanguage];
	const userPrompt = buildUserPrompt(testCase);

	console.log(`   Testing: ${scenario.description}`);

	try {
		const response = await fetch("https://api.openai.com/v1/chat/completions", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${apiKey}`,
			},
			body: JSON.stringify({
				model: modelId,
				messages: [
					{ role: "system", content: systemPrompt },
					{ role: "user", content: userPrompt },
				],
				temperature: 0.7,
				max_tokens: 300,
			}),
		});

		if (!response.ok) {
			const error = await response.text();
			throw new Error(`API error: ${response.status} - ${error}`);
		}

		const data = await response.json();
		const content = data.choices[0]?.message?.content || "";
		const latency = Date.now() - startTime;

		// Quality assessment: Check if response is in the expected language
		const expectedOutputLang = scenario.userContentLanguage;
		const qualityScore = assessLanguageQuality(content, expectedOutputLang);

		return {
			language: targetLang,
			languageName: testCase.occasion,
			scenario: scenario.scenario,
			scenarioDescription: scenario.description,
			success: true,
			latency,
			inputPrompt: `[System: ${scenario.systemLanguage.toUpperCase()}] + [User: ${scenario.userContentLanguage.toUpperCase()}]`,
			outputSample:
				content.substring(0, 150) + (content.length > 150 ? "..." : ""),
			qualityScore,
			notes:
				qualityScore >= 8
					? "Excellent language quality"
					: qualityScore >= 6
						? "Good but some issues"
						: "Poor language quality",
		};
	} catch (error) {
		return {
			language: targetLang,
			languageName: scenario.userContentLanguage.toUpperCase(),
			scenario: scenario.scenario,
			scenarioDescription: scenario.description,
			success: false,
			latency: Date.now() - startTime,
			error: error instanceof Error ? error.message : String(error),
		};
	}
}

async function testModelWithLanguage(
	apiKey: string,
	model: (typeof MODELS_TO_TEST)[0],
	targetLang: LanguageCode,
): Promise<ModelTestResults> {
	console.log(`\n${"=".repeat(78)}`);
	console.log(
		`🧪 ${model.name} (${model.id}) - Testing ${targetLang.toUpperCase()}`,
	);
	console.log(`${"=".repeat(78)}\n`);

	const scenarios = getTestScenarios(targetLang);
	const results: TestResult[] = [];

	for (const scenario of scenarios) {
		const result = await testScenario(apiKey, model.id, scenario, targetLang);
		results.push(result);

		// Show immediate feedback
		const status = result.success ? "✅" : "❌";
		const quality = result.qualityScore
			? `(Quality: ${result.qualityScore}/10)`
			: "";
		console.log(
			`   ${status} ${scenario.description}: ${result.latency}ms ${quality}`,
		);

		// Rate limiting
		await wait(500);
	}

	const summary = calculateSummary(results, targetLang);
	const recommendation = generateRecommendation(summary, targetLang);

	return {
		modelId: model.id,
		modelCategory: "Text Generation",
		testDate: new Date().toISOString(),
		targetLanguage: targetLang,
		results,
		summary,
		recommendation,
	};
}

async function main() {
	console.log(
		"\n╔═══════════════════════════════════════════════════════════════════════╗",
	);
	console.log(
		"║        🌍 TEXT GENERATION LANGUAGE SUPPORT TEST                       ║",
	);
	console.log(
		"║                                                                       ║",
	);
	console.log(
		"║        Real test case: Laurent & Laurence Wedding Announcement       ║",
	);
	console.log(
		"╚═══════════════════════════════════════════════════════════════════════╝\n",
	);

	// Validate API keys
	const keys = getApiKeys();
	validateApiKey(keys.OPENAI_API_KEY, "OPENAI_API_KEY");

	const languagesToTest = getLanguagesToTest();

	console.log("\n📋 Models to test:");
	for (const model of MODELS_TO_TEST) {
		console.log(
			`   - ${model.name} ($${model.inputCost}/$${model.outputCost} per 1M tokens)`,
		);
	}

	console.log("\n📋 Languages to test:");
	for (const lang of languagesToTest) {
		console.log(`   - ${lang.flag} ${lang.name} (${lang.code})`);
	}

	console.log("\n📋 Test scenarios per language:");
	console.log("   - Mixed: EN system prompt + target language user content");
	console.log("   - Full: Everything in target language\n");

	// Run tests for each model and language combination
	const allResults: Map<string, ModelTestResults[]> = new Map();

	for (const model of MODELS_TO_TEST) {
		const modelResults: ModelTestResults[] = [];

		for (const lang of languagesToTest) {
			if (lang.code === "en") continue; // Skip English-only for comparison tests

			const results = await testModelWithLanguage(
				keys.OPENAI_API_KEY!,
				model,
				lang.code,
			);
			modelResults.push(results);
			printSummary(results);
			saveResults(model.id, lang.code, results);

			// Wait between languages
			await wait(1000);
		}

		allResults.set(model.id, modelResults);
	}

	// Print model comparison
	console.log(
		"\n╔═══════════════════════════════════════════════════════════════════════╗",
	);
	console.log(
		"║                    📊 MODEL COMPARISON                                ║",
	);
	console.log(
		"╚═══════════════════════════════════════════════════════════════════════╝\n",
	);

	console.log(
		"┌────────────────┬────────────┬────────────┬────────────┬────────────┐",
	);
	console.log(
		"│ Model          │ Lang       │ Mixed Scn  │ Full Scn   │ Avg Quality│",
	);
	console.log(
		"├────────────────┼────────────┼────────────┼────────────┼────────────┤",
	);

	for (const [modelId, results] of Array.from(allResults.entries())) {
		for (const result of results) {
			const model = modelId.split("-").slice(-2).join("-").padEnd(14);
			const lang = result.targetLanguage.toUpperCase().padEnd(10);
			const mixed =
				`${result.summary.mixedScenarioScore.toFixed(1)}/10`.padStart(10);
			const full = `${result.summary.fullLanguageScore.toFixed(1)}/10`.padStart(
				10,
			);
			const avg = `${result.summary.avgQualityScore.toFixed(1)}/10`.padStart(
				10,
			);
			console.log(`│ ${model} │ ${lang} │ ${mixed} │ ${full} │ ${avg} │`);
		}
	}

	console.log(
		"└────────────────┴────────────┴────────────┴────────────┴────────────┘",
	);

	// Cost comparison
	console.log("\n💰 Cost Analysis (per 1M tokens):");
	console.log("   gpt-4o-mini: $0.15 input / $0.60 output");
	console.log("   gpt-5-mini:  $0.25 input / $2.00 output");
	console.log(
		"   → GPT-5-mini is ~1.6x more expensive for input, ~3.3x for output",
	);

	// Final recommendation
	const gpt4oResults = allResults.get("gpt-4o-mini") || [];
	const gpt5Results = allResults.get("gpt-5-mini") || [];

	if (gpt4oResults.length > 0 && gpt5Results.length > 0) {
		const gpt4oAvg =
			gpt4oResults.reduce((sum, r) => sum + r.summary.avgQualityScore, 0) /
			gpt4oResults.length;
		const gpt5Avg =
			gpt5Results.reduce((sum, r) => sum + r.summary.avgQualityScore, 0) /
			gpt5Results.length;
		const qualityDiff = gpt5Avg - gpt4oAvg;

		console.log("\n📝 Final Recommendation:");
		if (qualityDiff < 0.5) {
			console.log("   → Stick with gpt-4o-mini (similar quality, lower cost)");
		} else if (qualityDiff < 1.5) {
			console.log(
				"   → Consider gpt-5-mini for critical content (noticeable quality improvement)",
			);
		} else {
			console.log(
				"   → Upgrade to gpt-5-mini (significant quality improvement justifies cost)",
			);
		}
	}

	console.log("\n✅ Text generation language test complete!\n");
}

main().catch(console.error);
