"use client";

import { useMutation, useQuery } from "convex/react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useState } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { RefinementFlowList } from "@/components/admin/refinement-flow-list";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";

export default function RefinementFlowsPage() {
	const locale = useLocale();
	const router = useRouter();
	const [levelFilter, setLevelFilter] = useState<string>("all");
	const [targetFilter, setTargetFilter] = useState<string>("all");

	// Convex queries
	const flows = useQuery(api.refinementFlows.getAllFlows) ?? [];

	// Convex mutations
	const updateFlow = useMutation(api.refinementFlows.updateFlow);
	const deleteFlowMutation = useMutation(api.refinementFlows.deleteFlow);
	const duplicateFlowMutation = useMutation(api.refinementFlows.duplicateFlow);

	const handleToggleActive = async (id: string, isActive: boolean) => {
		await updateFlow({
			flowId: id as Id<"refinementFlows">,
			updates: { isActive },
		});
	};

	const handleDelete = async (id: string) => {
		if (confirm("Are you sure you want to delete this refinement flow?")) {
			await deleteFlowMutation({ flowId: id as Id<"refinementFlows"> });
		}
	};

	const handleDuplicate = async (flow: Doc<"refinementFlows">) => {
		await duplicateFlowMutation({ flowId: flow._id });
	};

	const filteredFlows = flows.filter((flow) => {
		if (levelFilter !== "all" && flow.triggerLevel !== levelFilter)
			return false;
		if (targetFilter !== "all" && flow.targetId !== targetFilter) return false;
		return true;
	});

	return (
		<div className="h-full flex flex-col">
			<AdminHeader
				title="Refinement Flows"
				description="Configure guided question flows for meta-categories, categories, and subcategories"
				action={{
					label: "Create Flow",
					onClick: () => router.push(`/${locale}/admin/refinement-flows/new`),
					icon: Plus,
				}}
			/>

			<div className="flex-1 overflow-auto">
				<RefinementFlowList
					flows={filteredFlows}
					levelFilter={levelFilter}
					targetFilter={targetFilter}
					onLevelFilterChange={setLevelFilter}
					onTargetFilterChange={setTargetFilter}
					onToggleActive={handleToggleActive}
					onDelete={handleDelete}
					onDuplicate={handleDuplicate}
				/>
			</div>
		</div>
	);
}
