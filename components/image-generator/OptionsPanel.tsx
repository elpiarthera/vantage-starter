"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { DynamicField } from "./DynamicField";
import type { ModelSchema, ParamSchema } from "./types/schema";

/**
 * Primary params that are shown in the inline pills (Sprint 30e.1)
 * These are excluded from the OptionsPanel when advancedOnly is true
 */
const PRIMARY_PILL_PARAMS = [
	"aspect_ratio",
	"resolution",
	"result_type",
	"num_images",
	"series_amount",
] as const;

interface OptionsPanelProps {
	schema: ModelSchema;
	params: Record<string, unknown>;
	onParamsChange: (key: string, value: unknown) => void;
	/** Optional: aspect ratio options with React icons (from useAspectRatio or constants). */
	aspectOptionIcons?: Record<string, React.ReactNode>;
	disabled?: boolean;
	/**
	 * Sprint 30e.2: When true, only shows advanced params (excludes primary params shown in pills).
	 * Default: true (since pills now handle primary params)
	 */
	advancedOnly?: boolean;
}

function getParamValue(
	params: Record<string, unknown>,
	param: ParamSchema,
): unknown {
	const v = params[param.key];
	if (v !== undefined) return v;
	return param.default;
}

function isParamVisible(
	param: ParamSchema,
	params: Record<string, unknown>,
): boolean {
	if (!param.showWhen) return true;
	const current = params[param.showWhen.param];
	return current === param.showWhen.value;
}

/** Params that are not refs (image_url, image_urls, elements) — rendered by parent RefsPanel/upload. */
function isRefParam(p: ParamSchema): boolean {
	return (
		p.refType === "single" || p.refType === "multi" || p.refType === "elements"
	);
}

export function OptionsPanel({
	schema,
	params,
	onParamsChange,
	aspectOptionIcons,
	disabled,
	advancedOnly = true,
}: OptionsPanelProps) {
	const t = useTranslations("image_generator");
	const [advancedOpen, setAdvancedOpen] = useState(false);

	// Sprint 30e.2: Filter out primary params when advancedOnly is true
	const isPrimaryPillParam = (key: string): boolean =>
		PRIMARY_PILL_PARAMS.includes(key as (typeof PRIMARY_PILL_PARAMS)[number]);

	const mainParams = schema.params.filter(
		(p) =>
			!isRefParam(p) &&
			!p.advanced &&
			p.key !== "prompt" &&
			isParamVisible(p, params) &&
			// Sprint 30e.2: Exclude primary params when advancedOnly
			(!advancedOnly || !isPrimaryPillParam(p.key)),
	);
	const advancedParams = schema.params.filter(
		(p) =>
			!isRefParam(p) &&
			p.advanced &&
			p.key !== "prompt" &&
			isParamVisible(p, params),
	);

	return (
		<div className="space-y-3 md:space-y-4">
			{mainParams.map((param) => (
				<DynamicField
					key={param.key}
					param={param}
					value={getParamValue(params, param)}
					onChange={(v) => onParamsChange(param.key, v)}
					optionIcons={
						param.key === "aspect_ratio" ? aspectOptionIcons : undefined
					}
					disabled={disabled}
				/>
			))}

			{advancedParams.length > 0 && (
				<Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
					<CollapsibleTrigger asChild>
						<Button
							variant="ghost"
							size="sm"
							className="min-h-[44px] text-sm text-muted-foreground hover:text-foreground active:scale-95 transition-smooth"
						>
							{advancedOpen
								? t("advanced_options_hide")
								: t("advanced_options_show")}
						</Button>
					</CollapsibleTrigger>
					<CollapsibleContent>
						<div className="mt-2 space-y-3">
							{advancedParams.map((param) => (
								<DynamicField
									key={param.key}
									param={param}
									value={getParamValue(params, param)}
									onChange={(v) => onParamsChange(param.key, v)}
									disabled={disabled}
								/>
							))}
						</div>
					</CollapsibleContent>
				</Collapsible>
			)}
		</div>
	);
}
