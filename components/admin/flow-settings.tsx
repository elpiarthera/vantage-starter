"use client";

import { useQuery } from "convex/react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";

interface FlowSettingsProps {
	flow: {
		name: string;
		description: string;
		triggerLevel: "tool" | "category" | "subcategory" | "vague";
		targetId: string;
		isActive: boolean;
		allowSkip?: boolean;
		showConsultantIntro?: boolean;
		consultantMessage?: string;
	};
	onChange: (settings: Partial<FlowSettingsProps["flow"]>) => void;
}

export function FlowSettings({ flow, onChange }: FlowSettingsProps) {
	// Convex queries for targets
	const tools = useQuery(api.tools.listActiveTools) ?? [];
	const categories = useQuery(api.tools.listAllCategories) ?? [];
	const subcategories = useQuery(api.tools.listAllSubCategories) ?? [];

	const getTargetOptions = () => {
		if (flow.triggerLevel === "tool") {
			return tools.map((t) => ({ id: t._id, name: t.name }));
		}
		if (flow.triggerLevel === "category") {
			return categories.map((c) => ({ id: c._id, name: c.name }));
		}
		if (flow.triggerLevel === "subcategory") {
			return subcategories.map((s) => ({ id: s._id, name: s.name }));
		}
		return [];
	};

	const targets = getTargetOptions();

	return (
		<Card className="p-6">
			<h2 className="text-lg font-semibold mb-4">Flow Settings</h2>

			<div className="space-y-6">
				<div className="space-y-2">
					<Label htmlFor="name">Flow Name</Label>
					<Input
						id="name"
						value={flow.name}
						onChange={(e) => onChange({ name: e.target.value })}
						placeholder="e.g., Concert Finder"
						required
					/>
				</div>

				<div className="space-y-2">
					<Label htmlFor="description">Description</Label>
					<Textarea
						id="description"
						value={flow.description}
						onChange={(e) => onChange({ description: e.target.value })}
						placeholder="Help users find the perfect concert"
						rows={3}
					/>
				</div>

				<div className="space-y-2">
					<Label htmlFor="triggerLevel">Trigger Level</Label>
					<Select
						value={flow.triggerLevel}
						onValueChange={(
							value: "tool" | "category" | "subcategory" | "vague",
						) =>
							onChange({
								triggerLevel: value,
								targetId: "",
							})
						}
					>
						<SelectTrigger id="triggerLevel">
							<SelectValue placeholder="Select level" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="tool">Tool</SelectItem>
							<SelectItem value="category">Category</SelectItem>
							<SelectItem value="subcategory">Subcategory</SelectItem>
							<SelectItem value="vague">Vague Query</SelectItem>
						</SelectContent>
					</Select>
				</div>

				{flow.triggerLevel !== "vague" && (
					<div className="space-y-2">
						<Label htmlFor="targetId">Target</Label>
						<Select
							value={flow.targetId}
							onValueChange={(value) => onChange({ targetId: value })}
						>
							<SelectTrigger id="targetId">
								<SelectValue placeholder="Select target" />
							</SelectTrigger>
							<SelectContent>
								{targets.map((target) => (
									<SelectItem key={target.id} value={target.id}>
										{target.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				)}

				<div className="flex items-center justify-between">
					<div className="space-y-0.5">
						<Label>Allow Skip</Label>
						<p className="text-xs text-muted-foreground">
							Let users skip the refinement flow
						</p>
					</div>
					<Switch
						checked={flow.allowSkip ?? true}
						onCheckedChange={(checked) => onChange({ allowSkip: checked })}
					/>
				</div>

				<div className="flex items-center justify-between">
					<div className="space-y-0.5">
						<Label>Active Status</Label>
						<p className="text-xs text-muted-foreground">
							Make this flow live for users
						</p>
					</div>
					<Switch
						checked={flow.isActive}
						onCheckedChange={(checked) => onChange({ isActive: checked })}
					/>
				</div>
			</div>
		</Card>
	);
}
