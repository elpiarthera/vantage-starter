"use client";

import { useQuery } from "convex/react";
import { ArrowLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { RefinementFlowPreview } from "@/components/admin/refinement-flow-preview";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export default function PreviewFlowPage() {
	const params = useParams();
	const router = useRouter();
	const locale = useLocale();
	const flowId = params.id as string;

	// Convex queries
	const flow = useQuery(api.refinementFlows.getFlowById, {
		flowId: flowId as Id<"refinementFlows">,
	});
	const questions = useQuery(api.refinementFlows.getQuestionsForFlow, {
		flowId: flowId as Id<"refinementFlows">,
	});

	if (flow === undefined || questions === undefined) {
		return (
			<div className="h-full flex items-center justify-center">
				<div className="text-center space-y-4">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
					<p className="text-muted-foreground">Loading flow...</p>
				</div>
			</div>
		);
	}

	if (flow === null) {
		router.push(`/${locale}/admin/refinement-flows`);
		return null;
	}

	// Transform to the format expected by RefinementFlowPreview
	const flowWithQuestions = {
		id: flow._id,
		_id: flow._id,
		name: flow.name,
		description: flow.description,
		triggerLevel: flow.triggerLevel,
		targetLevel: flow.triggerLevel, // Alias for compatibility
		targetId: flow.targetId,
		isActive: flow.isActive,
		showConsultantIntro: flow.showConsultantIntro ?? false,
		consultantMessage: flow.consultantMessage ?? "",
		allowSkip: flow.allowSkip ?? true,
		createdAt: new Date(flow.createdAt ?? Date.now()).toISOString(),
		updatedAt: new Date(flow.updatedAt ?? Date.now()).toISOString(),
		questions: questions.map((q) => ({
			id: q._id,
			_id: q._id,
			type: q.type,
			question: q.question,
			text: q.question,
			description: q.description,
			isRequired: q.isRequired,
			allowOther: q.allowOther,
			allowMultiple: q.allowMultiple,
			options: q.options,
			visualSource: q.visualSource,
			layout: q.layout,
			gridCols: q.gridCols,
			showIf: q.showIf,
			defaultValue: q.defaultValue,
			sortOrder: q.sortOrder,
			order: q.sortOrder,
		})),
	};

	return (
		<div className="h-full flex flex-col">
			<AdminHeader
				title="Preview Refinement Flow"
				description={`Testing: ${flow.name}`}
				action={{
					label: (
						<div className="flex items-center gap-2">
							<ArrowLeft className="w-4 h-4" />
							Back to Editor
						</div>
					),
					onClick: () =>
						router.push(`/${locale}/admin/refinement-flows/${flowId}/edit`),
				}}
			/>

			<div className="flex-1 overflow-hidden">
				<RefinementFlowPreview flow={flowWithQuestions} />
			</div>
		</div>
	);
}
