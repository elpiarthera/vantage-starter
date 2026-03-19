"use client";

import type { DragEndEvent } from "@dnd-kit/core";
import {
	DndContext,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Loader2, Upload } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useCallback, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { ModelSchema } from "./types/schema";

export interface RefItem {
	id: string;
	url: string;
}

interface RefsPanelProps {
	/** I2I schema: drives single vs multi slot (multiImage) and Elements visibility. */
	schema: ModelSchema;
	refs: RefItem[];
	onRefsChange: (refs: RefItem[]) => void;
	/** For History tab: pick image from past generations. */
	generations?: Array<{ id: string; imageUrl?: string | null }>;
	onUpload: (file: File) => Promise<void>;
	uploading?: boolean;
	disabled?: boolean;
}

const MAX_MULTI_REFS = 10;

function SortableRefThumb({
	refItem,
	label,
	onRemove,
	disabled,
	removeAriaLabel,
	dragAriaLabel,
}: {
	refItem: RefItem;
	label: string;
	onRemove: () => void;
	disabled?: boolean;
	removeAriaLabel: string;
	dragAriaLabel: string;
}) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: refItem.id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={cn(
				"relative flex flex-col w-20 h-20 rounded border border-border overflow-hidden bg-muted/50 flex-shrink-0",
				isDragging && "opacity-60 shadow-lg z-10",
			)}
		>
			<Image
				src={refItem.url}
				alt={label}
				width={80}
				height={80}
				className="object-cover w-full h-full"
				unoptimized
			/>
			<div className="absolute inset-x-0 bottom-0 bg-background/70 py-0.5 text-center text-xs font-medium text-foreground">
				{label}
			</div>
			{!disabled && (
				<>
					<button
						type="button"
						className="absolute top-0 left-0 flex items-center justify-center min-h-[44px] min-w-[44px] -translate-x-1/4 -translate-y-1/4 rounded-br bg-background/60 text-foreground hover:bg-background/80 cursor-grab active:cursor-grabbing active:scale-95 touch-none transition-smooth"
						aria-label={dragAriaLabel}
						{...attributes}
						{...listeners}
					>
						<GripVertical className="size-4" />
					</button>
					<button
						type="button"
						onClick={onRemove}
						className="absolute top-0 right-0 flex items-center justify-center min-h-[44px] min-w-[44px] translate-x-1/4 -translate-y-1/4 rounded-bl bg-background/70 text-foreground hover:bg-destructive hover:text-destructive-foreground active:scale-95 transition-smooth"
						aria-label={removeAriaLabel}
					>
						<svg
							className="size-4"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							aria-hidden
						>
							<title>{removeAriaLabel}</title>
							<path d="M18 6L6 18M6 6l12 12" />
						</svg>
					</button>
				</>
			)}
		</div>
	);
}

export function RefsPanel({
	schema,
	refs,
	onRefsChange,
	generations = [],
	onUpload,
	uploading = false,
	disabled,
}: RefsPanelProps) {
	const t = useTranslations("image_generator");
	const multiImage = schema.capabilities.multiImage ?? false;
	const maxRefs = multiImage ? MAX_MULTI_REFS : 1;
	const showElements = schema.capabilities.elements ?? false;

	const effectiveRefs = multiImage ? refs : refs.slice(0, 1);
	const canAddRef = effectiveRefs.length < maxRefs;

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	const handleDragEnd = useCallback(
		(event: DragEndEvent) => {
			const { active, over } = event;
			if (!over || active.id === over.id || !multiImage) return;
			const oldIndex = refs.findIndex((r) => r.id === active.id);
			const newIndex = refs.findIndex((r) => r.id === over.id);
			if (oldIndex === -1 || newIndex === -1) return;
			onRefsChange(arrayMove(refs, oldIndex, newIndex));
		},
		[refs, multiImage, onRefsChange],
	);

	const removeRef = useCallback(
		(id: string) => {
			onRefsChange(refs.filter((r) => r.id !== id));
		},
		[refs, onRefsChange],
	);

	const addFromHistory = useCallback(
		(url: string) => {
			if (!canAddRef) return;
			const id = crypto.randomUUID();
			if (multiImage) {
				onRefsChange([...refs, { id, url }]);
			} else {
				onRefsChange([{ id, url }]);
			}
		},
		[canAddRef, multiImage, refs, onRefsChange],
	);

	const handleFileChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (file?.type.startsWith("image/")) onUpload(file);
			e.target.value = "";
		},
		[onUpload],
	);

	const sortableIds = useMemo(() => refs.map((r) => r.id), [refs]);

	return (
		<div className="space-y-4">
			{/* Selected Refs */}
			<div className="space-y-2">
				<span className="text-sm font-medium text-muted-foreground">
					{t("edit_refs_label")} ({effectiveRefs.length}/{maxRefs})
				</span>
				{multiImage && refs.length > 0 ? (
					<DndContext sensors={sensors} onDragEnd={handleDragEnd}>
						<SortableContext items={sortableIds} strategy={() => null}>
							<div className="flex flex-wrap gap-2 items-start">
								{refs.map((ref, index) => (
									<SortableRefThumb
										key={ref.id}
										refItem={ref}
										label={`@Image${index + 1}`}
										onRemove={() => removeRef(ref.id)}
										disabled={disabled}
										removeAriaLabel={t("refs_remove_reference")}
										dragAriaLabel={t("refs_drag_reorder")}
									/>
								))}
							</div>
						</SortableContext>
					</DndContext>
				) : (
					<div className="flex flex-wrap gap-2 items-start">
						{effectiveRefs.map((ref, index) => (
							<div
								key={ref.id}
								className="relative flex flex-col w-20 h-20 rounded border border-border overflow-hidden bg-muted/50 flex-shrink-0"
							>
								<Image
									src={ref.url}
									alt={`@Image${index + 1}`}
									width={80}
									height={80}
									className="object-cover w-full h-full"
									unoptimized
								/>
								<div className="absolute inset-x-0 bottom-0 bg-background/70 py-0.5 text-center text-xs font-medium text-foreground">
									{`@Image${index + 1}`}
								</div>
								{!disabled && (
									<button
										type="button"
										onClick={() => removeRef(ref.id)}
										className="absolute top-0 right-0 flex items-center justify-center min-h-[44px] min-w-[44px] translate-x-1/4 -translate-y-1/4 rounded-bl bg-background/70 text-foreground hover:bg-destructive hover:text-destructive-foreground active:scale-95 transition-smooth"
										aria-label={t("refs_remove_reference")}
									>
										<svg
											className="size-4"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											strokeWidth="2"
											aria-hidden
										>
											<title>{t("refs_remove_reference")}</title>
											<path d="M18 6L6 18M6 6l12 12" />
										</svg>
									</button>
								)}
							</div>
						))}
					</div>
				)}
			</div>

			{/* Add Refs: Upload / History */}
			{canAddRef && (
				<div>
					<Tabs defaultValue="upload" className="w-full">
						<TabsList className="w-full grid grid-cols-2 bg-muted/50">
							<TabsTrigger
								value="upload"
								className="min-h-[44px] text-xs active:scale-95 transition-smooth"
							>
								<Upload className="size-3.5 mr-1.5" />
								{t("refs_tab_upload")}
							</TabsTrigger>
							<TabsTrigger
								value="history"
								className="min-h-[44px] text-xs active:scale-95 transition-smooth"
							>
								{t("refs_tab_history")}
							</TabsTrigger>
						</TabsList>
						<TabsContent value="upload" className="mt-2">
							<label className="flex flex-col items-center justify-center w-full min-h-[80px] rounded-lg border border-dashed border-border bg-muted/30 hover:bg-muted/50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
								<input
									type="file"
									accept="image/*"
									className="hidden"
									disabled={disabled || uploading}
									onChange={handleFileChange}
								/>
								{uploading ? (
									<Loader2 className="size-6 animate-spin text-muted-foreground" />
								) : (
									<>
										<Upload className="size-5 text-muted-foreground mb-1" />
										<span className="text-xs text-muted-foreground">
											{t("upload_ref")}
										</span>
									</>
								)}
							</label>
						</TabsContent>
						<TabsContent value="history" className="mt-2">
							{generations.length === 0 ? (
								<p className="text-xs text-muted-foreground py-4 text-center">
									{t("select_from_history")}
								</p>
							) : (
								<div className="flex gap-2 flex-wrap">
									{generations
										.filter((g): g is typeof g & { imageUrl: string } =>
											Boolean(g.imageUrl),
										)
										.slice(0, 12)
										.map((gen) => (
											<button
												key={gen.id}
												type="button"
												onClick={() => addFromHistory(gen.imageUrl)}
												className="relative min-w-[44px] min-h-[44px] w-14 h-14 rounded border border-border overflow-hidden flex-shrink-0 hover:border-primary active:scale-95 transition-smooth focus:outline-none focus:ring-2 focus:ring-ring"
												aria-label={t("select_from_history")}
											>
												<Image
													src={gen.imageUrl}
													alt={t("select_from_history")}
													width={56}
													height={56}
													className="object-cover w-full h-full"
													unoptimized
												/>
											</button>
										))}
								</div>
							)}
						</TabsContent>
					</Tabs>
				</div>
			)}

			{/* Elements (Kling): hint when schema supports it */}
			{showElements && (
				<div className="rounded-lg border border-border bg-muted/20 p-3">
					<p className="text-xs text-muted-foreground">{t("edit_refs_hint")}</p>
					<p className="text-xs text-muted-foreground mt-1">
						{t("refs_elements_hint")}
					</p>
				</div>
			)}
		</div>
	);
}
