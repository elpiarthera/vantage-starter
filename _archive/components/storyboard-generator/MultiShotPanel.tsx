"use client";

import { ChevronDown, Plus, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import type { SceneData } from "./types/schema";

interface MultiShotPanelProps {
	scene: SceneData;
	onUpdate: (patch: Partial<SceneData>) => void;
	disabled?: boolean;
}

interface ShotEntry {
	text: string;
}

const MAX_SHOTS = 5;

function getShots(scene: SceneData): ShotEntry[] {
	const raw = scene.mediaInputs.multi_shot;
	if (!raw || typeof raw === "string") return [];
	return (raw as string[]).map((t) => ({ text: t }));
}

function setShots(scene: SceneData, shots: ShotEntry[]): Partial<SceneData> {
	return {
		mediaInputs: {
			...scene.mediaInputs,
			multi_shot: shots.map((s) => s.text),
		},
	};
}

export function MultiShotPanel({
	scene,
	onUpdate,
	disabled,
}: MultiShotPanelProps) {
	const [open, setOpen] = useState(false);
	const shots = getShots(scene);

	const handleAdd = () => {
		if (shots.length >= MAX_SHOTS || disabled) return;
		onUpdate(setShots(scene, [...shots, { text: "" }]));
	};

	const handleRemove = (index: number) => {
		onUpdate(
			setShots(
				scene,
				shots.filter((_, i) => i !== index),
			),
		);
	};

	const handleTextChange = (index: number, text: string) => {
		onUpdate(
			setShots(
				scene,
				shots.map((s, i) => (i === index ? { text } : s)),
			),
		);
	};

	return (
		<Collapsible open={open} onOpenChange={setOpen}>
			<CollapsibleTrigger asChild>
				<Button
					variant="ghost"
					size="sm"
					className="w-full min-h-[44px] justify-between text-sm font-medium text-muted-foreground transition-smooth hover:text-foreground active:scale-95"
				>
					Multi-Shot ({shots.length}/{MAX_SHOTS})
					<ChevronDown
						className={cn("size-4 transition-transform", open && "rotate-180")}
					/>
				</Button>
			</CollapsibleTrigger>
			<CollapsibleContent>
				<div className="mt-2 flex flex-col gap-2">
					{shots.map((shot, i) => (
						<div
							key={`shot-${
								// biome-ignore lint/suspicious/noArrayIndexKey: stable index for shot list
								i
							}`}
							className="flex items-center gap-2"
						>
							<span className="w-5 shrink-0 text-xs text-muted-foreground text-right">
								{i + 1}.
							</span>
							<input
								type="text"
								value={shot.text}
								onChange={(e) => handleTextChange(i, e.target.value)}
								placeholder={`Shot ${i + 1} description`}
								disabled={disabled}
								className="min-h-[44px] flex-1 rounded-lg border border-border/30 bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
							/>
							{!disabled && (
								<button
									type="button"
									onClick={() => handleRemove(i)}
									className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border/30 text-muted-foreground transition-smooth hover:bg-muted active:scale-95"
									aria-label={`Remove shot ${i + 1}`}
								>
									<X className="size-3.5" />
								</button>
							)}
						</div>
					))}

					{shots.length < MAX_SHOTS && !disabled && (
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={handleAdd}
							className="min-h-[44px] w-full border border-dashed border-border/40 text-muted-foreground transition-smooth hover:bg-muted/30"
						>
							<Plus className="mr-1.5 size-4" />
							Add Shot
						</Button>
					)}
				</div>
			</CollapsibleContent>
		</Collapsible>
	);
}
