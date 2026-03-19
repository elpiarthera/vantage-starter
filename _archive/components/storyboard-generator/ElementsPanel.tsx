"use client";

import { ChevronDown, ImageIcon, Plus, X } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import type { SceneData } from "./types/schema";

interface ElementsPanelProps {
	scene: SceneData;
	onUpdate: (patch: Partial<SceneData>) => void;
	disabled?: boolean;
}

interface ElementEntry {
	imageUrl?: string;
	text?: string;
}

const MAX_ELEMENTS = 4;

function getElements(scene: SceneData): ElementEntry[] {
	const raw = scene.mediaInputs.elements;
	if (!raw || typeof raw === "string") return [];
	try {
		return raw.map((item) => {
			try {
				return JSON.parse(item) as ElementEntry;
			} catch {
				return { imageUrl: item };
			}
		});
	} catch {
		return [];
	}
}

function setElements(
	scene: SceneData,
	elements: ElementEntry[],
): Partial<SceneData> {
	return {
		mediaInputs: {
			...scene.mediaInputs,
			elements: elements.map((e) => JSON.stringify(e)),
		},
	};
}

export function ElementsPanel({
	scene,
	onUpdate,
	disabled,
}: ElementsPanelProps) {
	const [open, setOpen] = useState(false);
	const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
	const elements = getElements(scene);

	const handleAddElement = () => {
		if (elements.length >= MAX_ELEMENTS || disabled) return;
		onUpdate(setElements(scene, [...elements, {}]));
	};

	const handleRemoveElement = (index: number) => {
		onUpdate(
			setElements(
				scene,
				elements.filter((_, i) => i !== index),
			),
		);
	};

	const handleTextChange = (index: number, text: string) => {
		const next = elements.map((e, i) => (i === index ? { ...e, text } : e));
		onUpdate(setElements(scene, next));
	};

	const handleImageChange = (
		index: number,
		e: React.ChangeEvent<HTMLInputElement>,
	) => {
		const file = e.target.files?.[0];
		if (!file) return;
		const url = URL.createObjectURL(file);
		const next = elements.map((el, i) =>
			i === index ? { ...el, imageUrl: url } : el,
		);
		onUpdate(setElements(scene, next));
	};

	return (
		<Collapsible open={open} onOpenChange={setOpen}>
			<CollapsibleTrigger asChild>
				<Button
					variant="ghost"
					size="sm"
					className="w-full min-h-[44px] justify-between text-sm font-medium text-muted-foreground transition-smooth hover:text-foreground active:scale-95"
				>
					Elements ({elements.length}/{MAX_ELEMENTS})
					<ChevronDown
						className={cn("size-4 transition-transform", open && "rotate-180")}
					/>
				</Button>
			</CollapsibleTrigger>
			<CollapsibleContent>
				<div className="mt-2 flex flex-col gap-2">
					{elements.map((el, i) => (
						<div
							key={`element-${
								// biome-ignore lint/suspicious/noArrayIndexKey: stable index for element list
								i
							}`}
							className="flex items-start gap-2 rounded-lg border border-border/30 bg-muted/20 p-2"
						>
							{/* Image slot */}
							<button
								type="button"
								onClick={() => !disabled && inputRefs.current[i]?.click()}
								className="flex size-12 shrink-0 items-center justify-center rounded-lg border border-dashed border-border/50 bg-muted/20 transition-smooth hover:bg-muted/30 active:scale-95"
								aria-label={`Upload image for element ${i + 1}`}
								disabled={disabled}
							>
								{el.imageUrl ? (
									// biome-ignore lint/performance/noImgElement: object URL preview
									<img
										src={el.imageUrl}
										alt={`Element ${i + 1}`}
										className="size-full rounded-lg object-cover"
									/>
								) : (
									<ImageIcon className="size-5 text-muted-foreground/40" />
								)}
							</button>
							<input
								ref={(ref) => {
									inputRefs.current[i] = ref;
								}}
								type="file"
								accept="image/*"
								className="sr-only"
								onChange={(e) => handleImageChange(i, e)}
								disabled={disabled}
								aria-label={`Element ${i + 1} image`}
							/>

							{/* Text input */}
							<input
								type="text"
								value={el.text ?? ""}
								onChange={(e) => handleTextChange(i, e.target.value)}
								placeholder={`@Element${i + 1}`}
								disabled={disabled}
								className="min-h-[44px] flex-1 rounded-lg border border-border/30 bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
							/>

							{/* Remove */}
							{!disabled && (
								<button
									type="button"
									onClick={() => handleRemoveElement(i)}
									className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border/30 text-muted-foreground transition-smooth hover:bg-muted active:scale-95"
									aria-label={`Remove element ${i + 1}`}
								>
									<X className="size-3.5" />
								</button>
							)}
						</div>
					))}

					{elements.length < MAX_ELEMENTS && !disabled && (
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={handleAddElement}
							className="min-h-[44px] w-full border border-dashed border-border/40 text-muted-foreground transition-smooth hover:bg-muted/30"
						>
							<Plus className="mr-1.5 size-4" />
							Add Element
						</Button>
					)}
				</div>
			</CollapsibleContent>
		</Collapsible>
	);
}
