"use client";

import { useQuery } from "convex/react";
import { Copy, Edit, Eye, EyeOff, Play, Sparkles, Trash2 } from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { EmptyState } from "./EmptyState";

interface RefinementFlowListProps {
	flows: Doc<"refinementFlows">[];
	levelFilter: string;
	targetFilter: string;
	onLevelFilterChange: (value: string) => void;
	onTargetFilterChange: (value: string) => void;
	onToggleActive: (id: string, isActive: boolean) => void;
	onDelete: (id: string) => void;
	onDuplicate: (flow: Doc<"refinementFlows">) => void;
}

export function RefinementFlowList({
	flows,
	levelFilter,
	targetFilter,
	onLevelFilterChange,
	onTargetFilterChange,
	onToggleActive,
	onDelete,
	onDuplicate,
}: RefinementFlowListProps) {
	const locale = useLocale();

	// Fetch tools, categories, subcategories from Convex for target name lookup
	const tools = useQuery(api.tools.listActiveTools) ?? [];
	const categories = useQuery(api.tools.listAllCategories) ?? [];
	const subcategories = useQuery(api.tools.listAllSubCategories) ?? [];

	const formatTriggerLevel = (level: string) => {
		const labels: Record<string, string> = {
			tool: "Tool",
			"meta-category": "Meta-Category",
			category: "Category",
			subcategory: "Subcategory",
			vague: "Vague Query",
		};
		return labels[level] || level;
	};

	const getTargetName = (flow: Doc<"refinementFlows">) => {
		if (flow.triggerLevel === "tool") {
			const tool = tools.find((t) => t._id === flow.targetId);
			return tool?.name || "Unknown";
		}
		if (flow.triggerLevel === "category") {
			const category = categories.find((c) => c._id === flow.targetId);
			return category?.name || "Unknown";
		}
		if (flow.triggerLevel === "subcategory") {
			const subcategory = subcategories.find((s) => s._id === flow.targetId);
			return subcategory?.name || "Unknown";
		}
		return "Global";
	};

	if (flows.length === 0 && levelFilter === "all" && targetFilter === "all") {
		return (
			<EmptyState
				icon={Sparkles}
				title="No refinement flows yet"
				description="Create your first flow to guide users with targeted questions"
				action={{
					label: "Create Flow",
					onClick: () =>
						(window.location.href = `/${locale}/admin/refinement-flows/new`),
				}}
			/>
		);
	}

	return (
		<div className="p-8">
			<div className="flex flex-col md:flex-row gap-4 mb-6">
				<div className="flex-1">
					<Label>Filter by Level</Label>
					<Select value={levelFilter} onValueChange={onLevelFilterChange}>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Levels</SelectItem>
							<SelectItem value="tool">Tool</SelectItem>
							<SelectItem value="category">Category</SelectItem>
							<SelectItem value="subcategory">Subcategory</SelectItem>
							<SelectItem value="vague">Vague Query</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>

			{flows.length === 0 ? (
				<div className="text-center py-12 text-muted-foreground">
					<p>No flows match your filters</p>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{flows.map((flow) => (
						<div
							key={flow._id}
							className="group relative bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 p-5"
						>
							<div className="flex items-start justify-between mb-3">
								<div className="flex items-center gap-2">
									<Sparkles className="w-5 h-5 text-accent" />
									<h3 className="text-base font-semibold text-foreground">
										{flow.name}
									</h3>
								</div>
								<Badge variant={flow.isActive ? "default" : "secondary"}>
									{flow.isActive ? "Active" : "Inactive"}
								</Badge>
							</div>

							<p className="text-sm text-muted-foreground mb-4 line-clamp-2">
								{flow.description}
							</p>

							<div className="space-y-2 mb-4">
								<div className="flex items-center justify-between text-sm">
									<span className="text-muted-foreground">Level:</span>
									<span className="font-bold text-foreground">
										{formatTriggerLevel(flow.triggerLevel) || "Not Set"}
									</span>
								</div>
								<div className="flex items-center justify-between text-sm">
									<span className="text-muted-foreground">Target:</span>
									<span className="font-medium text-foreground truncate ml-2">
										{getTargetName(flow)}
									</span>
								</div>
							</div>

							<div className="flex items-center gap-2 pt-4 border-t border-border">
								<Button
									variant="ghost"
									size="sm"
									onClick={() => onToggleActive(flow._id, !flow.isActive)}
									className="flex-1 gap-2"
								>
									{flow.isActive ? (
										<EyeOff className="w-4 h-4" />
									) : (
										<Eye className="w-4 h-4" />
									)}
								</Button>
								<Button variant="ghost" size="sm" asChild>
									<Link
										href={`/${locale}/admin/refinement-flows/${flow._id}/preview`}
									>
										<Play className="w-4 h-4" />
									</Link>
								</Button>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => onDuplicate(flow)}
								>
									<Copy className="w-4 h-4" />
								</Button>
								<Button variant="ghost" size="sm" asChild>
									<Link
										href={`/${locale}/admin/refinement-flows/${flow._id}/edit`}
									>
										<Edit className="w-4 h-4" />
									</Link>
								</Button>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => onDelete(flow._id)}
								>
									<Trash2 className="w-4 h-4 text-destructive" />
								</Button>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
