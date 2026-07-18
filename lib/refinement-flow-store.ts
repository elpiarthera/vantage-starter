// Refinement Flow Builder - Data Models & Store
// Supports text questions, visual category cards, and ad placements

export type QuestionType =
	| "text-radio"
	| "text-checkbox"
	| "visual-categories"
	| "visual-subcategories"
	| "visual-ads";

export interface RefinementQuestion {
	id: string;
	type: QuestionType;
	question: string; // Display text
	text?: string; // Alias for question, for compatibility with FlowQuestion
	description?: string; // Optional helper text
	isRequired: boolean;
	allowOther: boolean; // Show "Other" option
	allowMultiple?: boolean; // For compatibility with FlowQuestion
	order?: number; // For compatibility with FlowQuestion

	// For text-based questions
	options?: Array<{
		id: string;
		label: string;
		value: string;
	}>;

	// For visual questions - reference to categories/subcategories
	visualReferenceIds?: string[]; // IDs of categories, subcategories, or ads

	// Conditional logic
	showIf?: {
		questionId: string;
		answerValue: string | string[];
	};

	// Default value for returning users
	defaultValue?: string | string[];
}

export interface RefinementFlow {
	id: string;
	name: string; // Admin-facing name
	description: string;

	// Context - where this flow applies
	// "tool" is the new name for "meta-category" in Convex schema
	triggerLevel: "tool" | "meta-category" | "category" | "subcategory" | "vague";
	targetLevel: "tool" | "meta-category" | "category" | "subcategory" | "vague";
	targetId: string; // ID of the tool, category, or subcategory

	// Questions in order - can be either type
	questions: (RefinementQuestion | FlowQuestion)[];

	// Settings
	isActive: boolean;
	showConsultantIntro: boolean; // Show "Let me help you find..." intro
	consultantMessage?: string; // Custom intro message
	allowSkip: boolean; // Allow users to skip questions

	// Analytics
	createdAt: string;
	updatedAt: string;
}

export interface RefinementSession {
	id: string;
	flowId: string;
	userId?: string; // For logged-in users
	sessionId: string; // Browser session ID

	// User's answers
	answers: Record<string, string | string[]>; // questionId -> answer(s)

	// Navigation state
	currentQuestionIndex: number;
	isComplete: boolean;
	wasAbandoned: boolean;

	// Timestamps
	startedAt: string;
	completedAt?: string;
	lastUpdatedAt: string;
}

// Mock Refinement Flows
const mockRefinementFlows: RefinementFlow[] = [
	{
		id: "rf-going-out",
		name: "Going Out - Event Discovery",
		description: "Guides users to find the perfect event",
		triggerLevel: "meta-category",
		targetLevel: "meta-category",
		targetId: "meta-1", // Fixed to match actual meta-category ID
		isActive: true,
		showConsultantIntro: true,
		consultantMessage: "Let me help you find the perfect night out! 🎉",
		allowSkip: true,
		questions: [
			{
				id: "q1-event-type",
				type: "visual-categories",
				question: "What are you looking for tonight?",
				description: "Choose the type of event you'd like to attend",
				isRequired: true,
				allowOther: true,
				visualReferenceIds: ["cat-1-1", "cat-1-2", "cat-1-3", "cat-1-4"], // Concerts, Nightlife, Cinema, Events
			},
			{
				id: "q2-concert-style",
				type: "visual-subcategories",
				question: "What music style are you in the mood for?",
				isRequired: true,
				allowOther: true,
				visualReferenceIds: [
					"sub-1-1-1",
					"sub-1-1-2",
					"sub-1-1-3",
					"sub-1-1-4",
				], // Rock, Jazz, Classical, Electronic
				showIf: {
					questionId: "q1-event-type",
					answerValue: "cat-1-1", // Fixed to match Concerts & Live Music category ID
				},
			},
			{
				id: "q3-vibe",
				type: "text-radio",
				question: "What's your vibe for tonight?",
				description: "Choose your vibe for the evening",
				isRequired: true,
				allowOther: false,
				options: [
					{ id: "vibe-chill", label: "Chill & Relaxed", value: "chill" },
					{ id: "vibe-energetic", label: "High Energy", value: "energetic" },
					{ id: "vibe-romantic", label: "Romantic", value: "romantic" },
					{ id: "vibe-social", label: "Social & Fun", value: "social" },
				],
			},
			{
				id: "q4-budget",
				type: "text-radio",
				question: "What's your budget range?",
				description: "Select your budget preference",
				isRequired: false,
				allowOther: false,
				options: [
					{ id: "budget-low", label: "€ - Budget-friendly", value: "low" },
					{ id: "budget-mid", label: "€€ - Moderate", value: "mid" },
					{ id: "budget-high", label: "€€€ - Premium", value: "high" },
					{ id: "budget-any", label: "Any price", value: "any" },
				],
				defaultValue: "any",
			},
		],
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	},
];

// Refined interface for new editor
export interface FlowQuestion {
	id: string;
	order: number;
	type:
		| "text"
		| "visual"
		| "single-select"
		| "multi-select"
		| "text-radio"
		| "text-checkbox"
		| "visual-categories"
		| "visual-subcategories"
		| "visual-ads";
	text: string;
	question: string; // Alias for text, for compatibility with RefinementQuestion
	description?: string;
	isRequired: boolean;
	allowOther: boolean;
	allowMultiple: boolean;

	// Text options
	options?: Array<{
		id: string;
		label: string;
		value: string;
	}>;

	// Visual source
	visualSource?: {
		type: "categories" | "subcategories" | "ads";
		categoryIds?: string[];
		subcategoryIds?: string[];
		adTargets?: string[];
	};

	// Visual reference IDs (for compatibility with RefinementQuestion)
	visualReferenceIds?: string[];

	// Layout
	layout?: "grid" | "list";
	gridCols?: number;

	// Conditional
	showIf?: {
		questionId: string;
		answerValue: string | string[];
	};

	defaultValue?: string | string[];
}

// In-memory sessions store
const activeSessions = new Map<string, RefinementSession>();

export class RefinementFlowStore {
	// Get flow by target
	static getFlowByTarget(
		level: "meta-category" | "category" | "subcategory",
		targetId: string,
	): RefinementFlow | null {
		return (
			mockRefinementFlows.find(
				(flow) =>
					flow.isActive &&
					flow.targetLevel === level &&
					flow.targetId === targetId,
			) || null
		);
	}

	// Get all flows
	static getAllFlows(): RefinementFlow[] {
		return mockRefinementFlows;
	}

	// Get flow by ID
	static getFlowById(id: string): RefinementFlow | null {
		return mockRefinementFlows.find((flow) => flow.id === id) || null;
	}

	// Session Management
	static createSession(flowId: string, sessionId: string): RefinementSession {
		const session: RefinementSession = {
			id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
			flowId,
			sessionId,
			answers: {},
			currentQuestionIndex: 0,
			isComplete: false,
			wasAbandoned: false,
			startedAt: new Date().toISOString(),
			lastUpdatedAt: new Date().toISOString(),
		};

		activeSessions.set(session.id, session);
		return session;
	}

	static getSession(sessionId: string): RefinementSession | null {
		return activeSessions.get(sessionId) || null;
	}

	static updateSession(
		sessionId: string,
		updates: Partial<RefinementSession>,
	): void {
		const session = activeSessions.get(sessionId);
		if (session) {
			Object.assign(session, updates, {
				lastUpdatedAt: new Date().toISOString(),
			});
			activeSessions.set(sessionId, session);
		}
	}

	static completeSession(sessionId: string): void {
		const session = activeSessions.get(sessionId);
		if (session) {
			session.isComplete = true;
			session.completedAt = new Date().toISOString();
			activeSessions.set(sessionId, session);
		}
	}

	static abandonSession(sessionId: string): void {
		const session = activeSessions.get(sessionId);
		if (session) {
			session.wasAbandoned = true;
			activeSessions.set(sessionId, session);
		}
	}

	// Get current question for session
	static getCurrentQuestion(
		session: RefinementSession,
	): RefinementQuestion | FlowQuestion | null {
		const flow = RefinementFlowStore.getFlowById(session.flowId);
		if (!flow) return null;

		// Find next visible question based on conditional logic
		for (let i = session.currentQuestionIndex; i < flow.questions.length; i++) {
			const question = flow.questions[i];

			// Check if question should be shown
			if (question.showIf) {
				const dependencyAnswer = session.answers[question.showIf.questionId];
				const expectedValue = question.showIf.answerValue;

				const matches = Array.isArray(expectedValue)
					? Array.isArray(dependencyAnswer) &&
						dependencyAnswer.some((v) => expectedValue.includes(v))
					: dependencyAnswer === expectedValue;

				if (!matches) continue; // Skip this question
			}

			return question;
		}

		return null; // No more questions
	}

	// Get question by ID from flow
	static getQuestionById(
		flowId: string,
		questionId: string,
	): RefinementQuestion | FlowQuestion | null {
		const flow = RefinementFlowStore.getFlowById(flowId);
		if (!flow) return null;
		return flow.questions.find((q) => q.id === questionId) || null;
	}
}

export const refinementFlowStore = {
	getAll(): RefinementFlow[] {
		return mockRefinementFlows;
	},

	getById(id: string): RefinementFlow | null {
		return mockRefinementFlows.find((f) => f.id === id) || null;
	},

	create(
		flow: Omit<RefinementFlow, "id" | "createdAt" | "updatedAt">,
	): RefinementFlow {
		const newFlow: RefinementFlow = {
			...flow,
			id: `rf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};
		mockRefinementFlows.push(newFlow);
		return newFlow;
	},

	update(id: string, updates: Partial<RefinementFlow>): void {
		const index = mockRefinementFlows.findIndex((f) => f.id === id);
		if (index !== -1) {
			mockRefinementFlows[index] = {
				...mockRefinementFlows[index],
				...updates,
				updatedAt: new Date().toISOString(),
			};
		}
	},

	delete(id: string): void {
		const index = mockRefinementFlows.findIndex((f) => f.id === id);
		if (index !== -1) {
			mockRefinementFlows.splice(index, 1);
		}
	},

	duplicate(id: string): RefinementFlow | null {
		const flow = this.getById(id);
		if (!flow) return null;

		const duplicate = this.create({
			...flow,
			name: `${flow.name} (Copy)`,
			isActive: false,
		});
		return duplicate;
	},

	createEmpty(): RefinementFlow {
		return {
			id: "temp-new",
			name: "",
			description: "",
			triggerLevel: "meta-category",
			targetLevel: "meta-category",
			targetId: "",
			questions: [],
			isActive: false,
			showConsultantIntro: false,
			consultantMessage: "",
			allowSkip: true,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};
	},
};
