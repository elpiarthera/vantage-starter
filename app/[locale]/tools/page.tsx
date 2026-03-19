"use client";

import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { HierarchyWall } from "@/components/tools/HierarchyWall";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

/**
 * Tools Landing Page
 *
 * Displays the tool selection wall with dynamic hierarchy navigation.
 * Users can browse through tools and their categories/subcategories/themes.
 *
 * Features:
 * - Dynamic tool loading from Convex
 * - 4-level hierarchy (Tool → Category → SubCategory → Theme)
 * - Framer Motion animations
 * - Full i18n support
 * - Mobile-first responsive design
 * - WCAG 2.1 AA compliant
 */
export default function ToolsPage() {
	const t = useTranslations("tools");
	const locale = useLocale();
	const router = useRouter();
	const [selection, setSelection] = useState<{
		level: "tool" | "category" | "subcategory" | "theme";
		key: string;
		toolId?: Id<"tools">;
		categoryId?: Id<"toolCategories">;
		subcategoryId?: Id<"toolSubCategories">;
	} | null>(null);

	const tool = useQuery(
		api.tools.getById,
		selection?.toolId ? { toolId: selection.toolId } : "skip",
	);
	const category = useQuery(
		api.tools.getCategoryById,
		selection?.categoryId ? { categoryId: selection.categoryId } : "skip",
	);
	const subcategory = useQuery(
		api.tools.getSubCategoryById,
		selection?.subcategoryId
			? { subcategoryId: selection.subcategoryId }
			: "skip",
	);

	const paramNames = useMemo(() => {
		const toolConfig = tool || category?.tool || subcategory?.tool;
		return {
			targetUrl: toolConfig?.targetUrl || "/guided/step-0",
			categoryParam: toolConfig?.categoryParamName || "category",
			subCategoryParam: toolConfig?.subCategoryParamName || "subcategory",
			themeParam: toolConfig?.themeParamName || "theme",
		};
	}, [tool, category?.tool, subcategory?.tool]);

	useEffect(() => {
		if (!selection) return;
		if (selection.level === "tool") return;

		const localizedTargetUrl = paramNames.targetUrl?.startsWith(`/${locale}`)
			? paramNames.targetUrl
			: paramNames.targetUrl?.startsWith("/")
				? `/${locale}${paramNames.targetUrl}`
				: paramNames.targetUrl;

		if (selection.level === "category") {
			if (!localizedTargetUrl) return;
			const params = new URLSearchParams();
			params.set(paramNames.categoryParam, selection.key);
			router.push(`${localizedTargetUrl}?${params.toString()}`);
			return;
		}

		if (selection.level === "subcategory") {
			if (!category?.key) return;
			if (!localizedTargetUrl) return;
			const params = new URLSearchParams();
			params.set(paramNames.categoryParam, category.key);
			params.set(paramNames.subCategoryParam, selection.key);
			router.push(`${localizedTargetUrl}?${params.toString()}`);
			return;
		}

		if (selection.level === "theme") {
			if (!category?.key || !subcategory?.key) return;
			if (!localizedTargetUrl) return;
			const params = new URLSearchParams();
			params.set(paramNames.categoryParam, category.key);
			params.set(paramNames.subCategoryParam, subcategory.key);
			params.set(paramNames.themeParam, selection.key);
			router.push(`${localizedTargetUrl}?${params.toString()}`);
		}
	}, [selection, category?.key, subcategory?.key, paramNames, locale, router]);

	return (
		<div className="min-h-screen bg-background">
			{/* Header */}
			<header className="border-b border-border bg-card">
				<div className="container mx-auto px-4 py-8">
					<h1 className="text-4xl font-bold text-foreground mb-2">
						{t("page_title")}
					</h1>
					<p className="text-lg text-muted-foreground leading-relaxed">
						{t("page_description")}
					</p>
				</div>
			</header>

			{/* Main Content */}
			<main className="container mx-auto px-4 py-8">
				<HierarchyWall
					onSelectItem={(payload) => {
						if (payload.level === "tool") return;
						setSelection({
							level: payload.level,
							key: payload.key,
							toolId: payload.toolId,
							categoryId: payload.categoryId,
							subcategoryId: payload.subcategoryId,
						});
					}}
				/>
			</main>
		</div>
	);
}
