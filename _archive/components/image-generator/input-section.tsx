"use client";

import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ImageUploadBox } from "./image-upload-box";
import { OptionsPanel } from "./OptionsPanel";
import type { Generation } from "./types";
import type { ModelSchema } from "./types/schema";
import type { VisualSelectOption } from "./VisualSelect";
import { VisualSelect } from "./VisualSelect";

interface InputSectionProps {
	/** Used for Clear button disabled state (prompt is edited in FloatingPromptBar) */
	prompt: string;
	aspectRatio: string;
	setAspectRatio: (ratio: string) => void;
	availableAspectRatios: Array<{
		value: string;
		label: string;
		icon: React.ReactNode;
	}>;
	useUrls: boolean;
	setUseUrls: (use: boolean) => void;
	image1Preview: string | null;
	image2Preview: string | null;
	image1Url: string | null;
	image2Url: string | null;
	isConvertingHeic: boolean;
	hasImages: boolean;
	onClearAll: () => void;
	onImageUpload: (file: File, slot: 1 | 2) => Promise<void>;
	onUrlChange: (url: string, slot: 1 | 2) => void;
	onClearImage: (slot: 1 | 2) => void;
	onImageFullscreen: (url: string) => void;
	// Optional props for authentication and usage - not used in demo mode
	isAuthenticated?: boolean;
	remaining?: number;
	decrementOptimistic?: () => void;
	usageLoading?: boolean;
	onShowAuthModal?: () => void;
	generations?: Generation[];
	selectedGenerationId?: string | null;
	onSelectGeneration?: (id: string | null) => void;
	onCancelGeneration?: (id: string) => void;
	onDeleteGeneration?: (id: string) => Promise<void>;
	historyLoading?: boolean;
	hasMore?: boolean;
	onLoadMore?: () => void;
	isLoadingMore?: boolean;
	// Sprint 29 T2I options (Kling)
	model?: "o3" | "v3";
	setModel?: (m: "o3" | "v3") => void;
	resolution?: "1K" | "2K" | "4K";
	setResolution?: (r: "1K" | "2K" | "4K") => void;
	resultType?: "single" | "series";
	setResultType?: (r: "single" | "series") => void;
	numImages?: number;
	setNumImages?: (n: number) => void;
	seriesAmount?: number;
	setSeriesAmount?: (n: number) => void;
	negativePrompt?: string;
	setNegativePrompt?: (s: string) => void;
	isGenerating?: boolean;
	// Task 1.3: schema-driven options (when set, replaces hardcoded model/resolution/resultType/etc.)
	schema?: ModelSchema;
	params?: Record<string, unknown>;
	onParamsChange?: (key: string, value: unknown) => void;
}

export function InputSection({
	prompt,
	aspectRatio,
	setAspectRatio,
	availableAspectRatios,
	useUrls,
	setUseUrls,
	image1Preview,
	image2Preview,
	image1Url,
	image2Url,
	isConvertingHeic: _isConvertingHeic,
	hasImages,
	onClearAll,
	onImageUpload,
	onUrlChange,
	onClearImage,
	onImageFullscreen,
	model = "o3",
	setModel,
	resolution = "1K",
	setResolution,
	resultType = "single",
	setResultType,
	numImages = 1,
	setNumImages,
	seriesAmount = 2,
	setSeriesAmount,
	negativePrompt = "",
	setNegativePrompt,
	schema,
	params,
	onParamsChange,
}: InputSectionProps) {
	const t = useTranslations("image_generator");
	const [advancedOpen, setAdvancedOpen] = useState(false);
	const useSchemaDriven = Boolean(schema && params && onParamsChange);

	const aspectLabelMap: Record<string, string> = {
		square: t("visual_select_aspect_square"),
		landscape: t("visual_select_aspect_landscape"),
		portrait: t("visual_select_aspect_portrait"),
		wide: t("visual_select_aspect_wide"),
	};
	const aspectOptions: VisualSelectOption[] = availableAspectRatios.map(
		(opt) => ({
			value: opt.value,
			label: aspectLabelMap[opt.value] ?? opt.label,
			icon: opt.icon,
		}),
	);

	const resolutionOptions: VisualSelectOption<"1K" | "2K" | "4K">[] = [
		{ value: "1K", label: t("resolution_1k") },
		{ value: "2K", label: t("resolution_2k") },
		...(model === "o3"
			? [{ value: "4K" as const, label: t("resolution_4k") }]
			: []),
	];

	return (
		<div className="flex flex-col h-full min-h-0">
			<div className="space-y-3 md:space-y-4 min-h-0 flex flex-col">
				<div className="space-y-3 md:space-y-4 flex flex-col">
					{useSchemaDriven && schema && params && onParamsChange ? (
						<>
							<OptionsPanel
								schema={schema}
								params={params}
								onParamsChange={onParamsChange}
							/>
							<div className="flex flex-wrap items-center justify-end gap-2 select-none">
								<Button
									onClick={onClearAll}
									disabled={!prompt.trim() && !hasImages}
									variant="outline"
									className="min-h-[44px] px-3 py-0 text-xs md:text-sm bg-transparent border-border text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
								>
									<Trash2 className="size-4 md:hidden" />
									<span className="hidden md:inline">{t("clear")}</span>
								</Button>
							</div>
						</>
					) : (
						<>
							{setModel && setResolution && (
								<div className="flex flex-wrap items-center gap-2">
									<span className="text-xs font-medium tracking-tight text-muted-foreground">
										{t("quick_settings")}:
									</span>
									<button
										type="button"
										onClick={() => {
											setModel("v3");
											setResolution("1K");
										}}
										className="min-h-[44px] rounded-lg border border-border bg-card/50 px-3 py-2 text-xs font-medium text-muted-foreground transition-smooth hover:bg-muted hover:text-foreground"
									>
										{t("preset_fast")}
									</button>
									<button
										type="button"
										onClick={() => {
											setModel("o3");
											setResolution("4K");
										}}
										className="min-h-[44px] rounded-lg border border-border bg-card/50 px-3 py-2 text-xs font-medium text-muted-foreground transition-smooth hover:bg-muted hover:text-foreground"
									>
										{t("preset_quality")}
									</button>
									{setResultType && (
										<button
											type="button"
											onClick={() => setResultType("series")}
											className="min-h-[44px] rounded-lg border border-border bg-card/50 px-3 py-2 text-xs font-medium text-muted-foreground transition-smooth hover:bg-muted hover:text-foreground"
										>
											{t("preset_batch")}
										</button>
									)}
								</div>
							)}
							<div className="mb-3 flex flex-wrap items-center justify-end gap-2 select-none md:mb-6">
								{setModel && (
									<fieldset
										className="inline-flex rounded-md border border-border bg-card/50 p-0.5 border-none"
										aria-label={t("model")}
									>
										<button
											type="button"
											onClick={() => setModel("o3")}
											aria-pressed={model === "o3"}
											className={cn(
												"min-h-[44px] px-2 py-1 md:px-3 md:py-1.5 text-xs md:text-sm font-medium rounded transition-smooth",
												model === "o3"
													? "bg-primary text-primary-foreground"
													: "text-muted-foreground hover:text-foreground hover:bg-muted",
											)}
										>
											{t("model_o3")}
										</button>
										<button
											type="button"
											onClick={() => setModel("v3")}
											aria-pressed={model === "v3"}
											className={cn(
												"min-h-[44px] px-2 py-1 md:px-3 md:py-1.5 text-xs md:text-sm font-medium rounded transition-smooth",
												model === "v3"
													? "bg-primary text-primary-foreground"
													: "text-muted-foreground hover:text-foreground hover:bg-muted",
											)}
										>
											{t("model_v3")}
										</button>
									</fieldset>
								)}
								{setResolution && (
									<VisualSelect<"1K" | "2K" | "4K">
										type="segmented"
										options={resolutionOptions}
										value={resolution}
										onChange={setResolution}
										aria-label={t("resolution")}
									/>
								)}
								<VisualSelect
									type="grid"
									options={aspectOptions}
									value={aspectRatio}
									onChange={setAspectRatio}
									aria-label={t("aspect_ratio")}
								/>
								<Button
									onClick={onClearAll}
									disabled={!prompt.trim() && !hasImages}
									variant="outline"
									className="min-h-[44px] px-3 py-0 text-xs md:text-sm bg-transparent border-border text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
								>
									<Trash2 className="size-4 md:hidden" />
									<span className="hidden md:inline">{t("clear")}</span>
								</Button>
							</div>
							{setResultType && (
								<div className="flex flex-wrap items-center gap-3 text-sm">
									<div className="flex items-center gap-2">
										<span className="text-sm font-medium tracking-tight text-muted-foreground">
											{t("result_type")}:
										</span>
										<fieldset
											className="inline-flex rounded border border-border bg-card/50 p-0.5"
											aria-label={t("result_type")}
										>
											<button
												type="button"
												onClick={() => setResultType("single")}
												aria-pressed={resultType === "single"}
												className={cn(
													"min-h-[44px] px-2 py-1 text-xs rounded transition-smooth",
													resultType === "single"
														? "bg-primary text-primary-foreground"
														: "text-muted-foreground hover:bg-muted hover:text-foreground",
												)}
											>
												{t("result_type_single")}
											</button>
											<button
												type="button"
												onClick={() => setResultType("series")}
												aria-pressed={resultType === "series"}
												className={cn(
													"min-h-[44px] px-2 py-1 text-xs rounded transition-smooth",
													resultType === "series"
														? "bg-primary text-primary-foreground"
														: "text-muted-foreground hover:bg-muted hover:text-foreground",
												)}
											>
												{t("result_type_series")}
											</button>
										</fieldset>
									</div>
									{resultType === "single" && setNumImages && (
										<div className="flex items-center gap-2">
											<span className="text-gray-400">Count:</span>
											<Select
												value={String(numImages)}
												onValueChange={(v) => setNumImages(Number(v))}
											>
												<SelectTrigger className="w-16 !h-8 text-xs">
													<SelectValue />
												</SelectTrigger>
												<SelectContent className="bg-black/95 border-gray-600">
													{[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
														<SelectItem
															key={n}
															value={String(n)}
															className="text-xs"
														>
															{n}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
									)}
									{resultType === "series" && setSeriesAmount && (
										<div className="flex items-center gap-2">
											<span className="text-gray-400">Size:</span>
											<Select
												value={String(seriesAmount)}
												onValueChange={(v) => setSeriesAmount(Number(v))}
											>
												<SelectTrigger className="w-16 !h-8 text-xs">
													<SelectValue />
												</SelectTrigger>
												<SelectContent className="bg-black/95 border-gray-600">
													{[2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
														<SelectItem
															key={n}
															value={String(n)}
															className="text-xs"
														>
															{n}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
									)}
								</div>
							)}
							{model === "v3" && setNegativePrompt && (
								<Collapsible
									open={advancedOpen}
									onOpenChange={setAdvancedOpen}
									className="w-full"
								>
									<CollapsibleTrigger asChild>
										<button
											type="button"
											className="text-xs text-muted-foreground hover:text-foreground"
										>
											{advancedOpen
												? t("advanced_options_hide")
												: t("advanced_options_show")}
										</button>
									</CollapsibleTrigger>
									<CollapsibleContent>
										<div className="pt-2">
											<label
												htmlFor="image-tool-negative-prompt"
												className="mb-1 block text-sm font-medium tracking-tight text-muted-foreground"
											>
												{t("negative_prompt")}
											</label>
											<input
												id="image-tool-negative-prompt"
												type="text"
												value={negativePrompt}
												onChange={(e) => setNegativePrompt(e.target.value)}
												placeholder={t("negative_prompt_placeholder")}
												className="min-h-[48px] w-full border border-border bg-card/50 p-2 text-base text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
											/>
										</div>
									</CollapsibleContent>
								</Collapsible>
							)}
						</>
					)}

					<div className="space-y-2 md:space-y-4">
						<div>
							<div className="flex items-center justify-between mb-2 md:mb-3 select-none">
								<div className="flex flex-col gap-1">
									<span className="text-sm md:text-base font-medium text-gray-300">
										Images (optional)
									</span>
								</div>
								<div className="inline-flex bg-black/50 border border-gray-600">
									<button
										type="button"
										onClick={() => setUseUrls(false)}
										className={cn(
											"px-2 py-1 md:px-4 md:py-2 text-xs md:text-sm font-medium transition-all",
											!useUrls
												? "bg-white text-black"
												: "text-gray-300 hover:text-white",
										)}
									>
										Files
									</button>
									<button
										type="button"
										onClick={() => setUseUrls(true)}
										className={cn(
											"px-2 py-1 md:px-4 md:py-2 text-xs md:text-sm font-medium transition-all",
											useUrls
												? "bg-white text-black"
												: "text-gray-300 hover:text-white",
										)}
									>
										URLs
									</button>
								</div>
							</div>

							{useUrls ? (
								<div className="space-y-2 lg:min-h-[12vh] xl:min-h-[14vh]">
									<div className="relative">
										<input
											type="url"
											value={image1Url ?? ""}
											onChange={(e) => onUrlChange(e.target.value, 1)}
											placeholder="First image URL"
											className="w-full p-2 md:p-3 pr-8 bg-black/50 border border-gray-600 text-white text-xs focus:outline-none focus:ring-2 focus:ring-white select-text"
										/>
										{image1Url && (
											<button
												type="button"
												onClick={() => onClearImage(1)}
												className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
											>
												<svg
													className="w-3 h-3"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
													aria-hidden
												>
													<title>Clear</title>
													<line x1="18" y1="6" x2="6" y2="18" />
													<line x1="6" y1="6" x2="18" y2="18" />
												</svg>
											</button>
										)}
									</div>
									<div className="relative">
										<input
											type="url"
											value={image2Url ?? ""}
											onChange={(e) => onUrlChange(e.target.value, 2)}
											placeholder="Second image URL"
											className="w-full p-2 md:p-3 pr-8 bg-black/50 border border-gray-600 text-white text-xs focus:outline-none focus:ring-2 focus:ring-white select-text"
										/>
										{image2Url && (
											<button
												type="button"
												onClick={() => onClearImage(2)}
												className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
											>
												<svg
													className="w-3 h-3"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
													aria-hidden
												>
													<title>Clear</title>
													<line x1="18" y1="6" x2="6" y2="18" />
													<line x1="6" y1="6" x2="18" y2="18" />
												</svg>
											</button>
										)}
									</div>
								</div>
							) : (
								<div className="select-none lg:min-h-[12vh] xl:min-h-[14vh]">
									<div className="grid grid-cols-2 gap-3 sm:gap-4 w-full">
										<ImageUploadBox
											imageNumber={1}
											preview={image1Preview}
											onDrop={(e) => {
												e.preventDefault();
												const file = e.dataTransfer.files[0];
												if (file?.type.startsWith("image/")) {
													onImageUpload(file, 1);
												}
											}}
											onClear={() => onClearImage(1)}
											onSelect={() => {
												if (image1Preview) {
													onImageFullscreen(image1Preview);
												} else {
													document.getElementById("file1")?.click();
												}
											}}
											uploadLabel={t("upload_image_label")}
											secondImageLabel={t("second_image_label")}
											dragDropLabel={t("drag_drop_label")}
										/>
										<input
											id="file1"
											type="file"
											accept="image/*,.heic,.heif"
											className="hidden"
											onChange={(e) => {
												const file = e.target.files?.[0];
												if (file) {
													onImageUpload(file, 1);
													e.target.value = "";
												}
											}}
										/>

										<ImageUploadBox
											imageNumber={2}
											preview={image2Preview}
											onDrop={(e) => {
												e.preventDefault();
												const file = e.dataTransfer.files[0];
												if (file?.type.startsWith("image/")) {
													onImageUpload(file, 2);
												}
											}}
											onClear={() => onClearImage(2)}
											onSelect={() => {
												if (image2Preview) {
													onImageFullscreen(image2Preview);
												} else {
													document.getElementById("file2")?.click();
												}
											}}
											uploadLabel={t("upload_image_label")}
											secondImageLabel={t("second_image_label")}
											dragDropLabel={t("drag_drop_label")}
										/>
										<input
											id="file2"
											type="file"
											accept="image/*,.heic,.heif"
											className="hidden"
											onChange={(e) => {
												const file = e.target.files?.[0];
												if (file) {
													onImageUpload(file, 2);
													e.target.value = "";
												}
											}}
										/>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
