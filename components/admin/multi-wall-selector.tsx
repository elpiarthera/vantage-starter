"use client";

import { useQuery } from "convex/react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";

type AdTarget = {
	level: "tool" | "category" | "subcategory";
	contextId?: string;
};

interface MultiWallSelectorProps {
	selectedTargets: AdTarget[];
	onChange: (targets: AdTarget[]) => void;
}

export function MultiWallSelector({
	selectedTargets,
	onChange,
}: MultiWallSelectorProps) {
	const t = useTranslations("admin.ads");
	const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set());
	const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
		new Set(),
	);

	// Fetch data from Convex
	const tools = useQuery(api.tools.listActiveTools);
	const allCategories = useQuery(api.tools.getAllCategories, {});
	const allSubCategories = useQuery(api.tools.getAllSubCategories, {});

	const toggleTool = (toolId: string) => {
		const newExpanded = new Set(expandedTools);
		if (newExpanded.has(toolId)) {
			newExpanded.delete(toolId);
		} else {
			newExpanded.add(toolId);
		}
		setExpandedTools(newExpanded);
	};

	const toggleCategory = (categoryId: string) => {
		const newExpanded = new Set(expandedCategories);
		if (newExpanded.has(categoryId)) {
			newExpanded.delete(categoryId);
		} else {
			newExpanded.add(categoryId);
		}
		setExpandedCategories(newExpanded);
	};

	const isTargetSelected = (
		level: AdTarget["level"],
		contextId?: string,
	): boolean => {
		return selectedTargets.some(
			(t) => t.level === level && t.contextId === contextId,
		);
	};

	const toggleTarget = (level: AdTarget["level"], contextId?: string) => {
		const isSelected = isTargetSelected(level, contextId);
		if (isSelected) {
			onChange(
				selectedTargets.filter(
					(t) => !(t.level === level && t.contextId === contextId),
				),
			);
		} else {
			onChange([...selectedTargets, { level, contextId }]);
		}
	};

	const countSelectedTargets = () => {
		return selectedTargets.length;
	};

	const getCategoriesForTool = (toolId: string) => {
		return (allCategories || []).filter((c) => c.toolId === toolId);
	};

	const getSubCategoriesForCategory = (categoryId: string) => {
		return (allSubCategories || []).filter((s) => s.categoryId === categoryId);
	};

	if (!tools) {
		return (
			<div className="space-y-2">
				<Label>{t("form.targets")}</Label>
				<div className="border border-border rounded-lg p-4 text-center text-muted-foreground">
					Loading...
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between mb-2">
				<Label>{t("form.targets")}</Label>
				<Badge variant="secondary">{countSelectedTargets()} selected</Badge>
			</div>
			<div className="border border-border rounded-lg p-4 max-h-[400px] overflow-y-auto space-y-1">
				{/* Tool Level (show on all tools) */}
				<div className="flex items-center gap-2 py-1.5 hover:bg-accent/50 rounded-md px-2 transition-colors mb-2 border-b border-border pb-3">
					<div className="w-5" />
					<Checkbox
						id="tool-level"
						checked={isTargetSelected("tool")}
						onCheckedChange={() => toggleTarget("tool")}
					/>
					<Label
						htmlFor="tool-level"
						className="flex-1 cursor-pointer font-semibold"
					>
						Tool Wall (All Tools)
					</Label>
					<Badge variant="outline" className="text-xs">
						Global
					</Badge>
				</div>

				{tools.map((tool: Doc<"tools">) => {
					const categories = getCategoriesForTool(tool._id);
					const isToolExpanded = expandedTools.has(tool._id);

					return (
						<div key={tool._id} className="space-y-1">
							{/* Tool Level */}
							<div className="flex items-center gap-2 py-1.5 hover:bg-accent/50 rounded-md px-2 transition-colors">
								<button
									type="button"
									onClick={() => toggleTool(tool._id)}
									className="flex items-center justify-center w-5 h-5 hover:bg-accent rounded transition-colors"
								>
									{isToolExpanded ? (
										<ChevronDown className="w-4 h-4 text-muted-foreground" />
									) : (
										<ChevronRight className="w-4 h-4 text-muted-foreground" />
									)}
								</button>
								<span className="flex-1 font-semibold">{tool.name}</span>
							</div>

							{/* Categories Level */}
							{isToolExpanded &&
								categories.map((category: Doc<"toolCategories">) => {
									const subcategories = getSubCategoriesForCategory(
										category._id,
									);
									const isCategoryExpanded = expandedCategories.has(
										category._id,
									);

									return (
										<div key={category._id} className="ml-6 space-y-1">
											<div className="flex items-center gap-2 py-1.5 hover:bg-accent/50 rounded-md px-2 transition-colors">
												{subcategories.length > 0 ? (
													<button
														type="button"
														onClick={() => toggleCategory(category._id)}
														className="flex items-center justify-center w-5 h-5 hover:bg-accent rounded transition-colors"
													>
														{isCategoryExpanded ? (
															<ChevronDown className="w-4 h-4 text-muted-foreground" />
														) : (
															<ChevronRight className="w-4 h-4 text-muted-foreground" />
														)}
													</button>
												) : (
													<div className="w-5" />
												)}
												<Checkbox
													id={`cat-${category._id}`}
													checked={isTargetSelected("category", category._id)}
													onCheckedChange={() =>
														toggleTarget("category", category._id)
													}
												/>
												<Label
													htmlFor={`cat-${category._id}`}
													className="flex-1 cursor-pointer"
												>
													{category.name}
												</Label>
												<Badge variant="outline" className="text-xs">
													Category
												</Badge>
											</div>

											{/* Subcategories Level */}
											{isCategoryExpanded &&
												subcategories.map(
													(subcategory: Doc<"toolSubCategories">) => (
														<div
															key={subcategory._id}
															className="ml-6 flex items-center gap-2 py-1.5 hover:bg-accent/50 rounded-md px-2 transition-colors"
														>
															<div className="w-5" />
															<Checkbox
																id={`sub-${subcategory._id}`}
																checked={isTargetSelected(
																	"subcategory",
																	subcategory._id,
																)}
																onCheckedChange={() =>
																	toggleTarget("subcategory", subcategory._id)
																}
															/>
															<Label
																htmlFor={`sub-${subcategory._id}`}
																className="flex-1 cursor-pointer text-sm"
															>
																{subcategory.name}
															</Label>
															<Badge variant="outline" className="text-xs">
																Sub
															</Badge>
														</div>
													),
												)}
										</div>
									);
								})}
						</div>
					);
				})}
			</div>
			<p className="text-xs text-muted-foreground mt-2">
				{t("form.targets_help")}
			</p>
		</div>
	);
}
