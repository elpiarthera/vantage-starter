"use client";

import { useQuery } from "convex/react";
import { ArrowLeft, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Suspense, useState } from "react";
import { VoiceGenerator } from "@/components/voice-generator";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

function VoiceGeneratorPageContent() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const t = useTranslations("common");
	const projectId = searchParams.get("projectId") ?? undefined;
	const returnTo = searchParams.get("returnTo");
	const tab = searchParams.get("tab");
	const initialMode: "generate" | "record" =
		tab === "record" ? "record" : "generate";

	// Load project only when coming from guided flow (returnTo + record mode + projectId)
	const showScriptBanner =
		initialMode === "record" && !!returnTo && !!projectId;
	const project = useQuery(
		api.projects.get,
		showScriptBanner ? { projectId: projectId as Id<"projects"> } : "skip",
	);
	const narrationScript = project?.approvedNarrationScript ?? null;
	const [scriptOpen, setScriptOpen] = useState(false);

	return (
		<main className="h-screen bg-background flex flex-col">
			{returnTo && (
				<div className="w-full bg-[#182634] border-b border-[#314d68] px-4 flex-shrink-0">
					<button
						type="button"
						onClick={() => router.push(returnTo)}
						className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 active:text-blue-500 active:bg-[#1e3347] min-h-[44px] w-full"
					>
						<ArrowLeft className="h-4 w-4" aria-hidden="true" />
						{t("back_to_step4")}
					</button>
				</div>
			)}
			{showScriptBanner && narrationScript && (
				<div className="w-full bg-[#182634] border-b border-[#314d68] flex-shrink-0">
					<button
						type="button"
						onClick={() => setScriptOpen((v) => !v)}
						className="flex items-center justify-between w-full px-4 min-h-[44px] text-sm text-gray-300 hover:text-white active:bg-[#1e3347]"
						aria-expanded={scriptOpen}
					>
						<span>
							{scriptOpen
								? t("hide_narration_script")
								: t("your_narration_script")}
						</span>
						{scriptOpen ? (
							<ChevronUp className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
						) : (
							<ChevronDown
								className="h-4 w-4 flex-shrink-0"
								aria-hidden="true"
							/>
						)}
					</button>
					{scriptOpen && (
						<div className="px-4 pb-4 max-h-48 overflow-y-auto">
							<p className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed select-all">
								{narrationScript}
							</p>
						</div>
					)}
				</div>
			)}
			<div className="flex-1 min-h-0">
				<VoiceGenerator projectId={projectId} initialMode={initialMode} />
			</div>
		</main>
	);
}

function Loading() {
	return (
		<div className="flex min-h-screen items-center justify-center bg-background">
			<Loader2 className="h-12 w-12 animate-spin text-primary" />
		</div>
	);
}

export default function VoiceGeneratorPage() {
	return (
		<Suspense fallback={<Loading />}>
			<VoiceGeneratorPageContent />
		</Suspense>
	);
}
