"use client";

import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useState } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";

export default function NewRefinementFlowPage() {
	const router = useRouter();
	const locale = useLocale();
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [level, setLevel] = useState<
		"tool" | "category" | "subcategory" | "vague"
	>("tool");
	const [targetId, setTargetId] = useState("");
	const [isActive, setIsActive] = useState(true);

	// Convex queries for targets
	const tools = useQuery(api.tools.listActiveTools) ?? [];
	const categories = useQuery(api.tools.listAllCategories) ?? [];
	const subcategories = useQuery(api.tools.listAllSubCategories) ?? [];

	// Convex mutation
	const createFlowMutation = useMutation(api.refinementFlows.createFlow);

	const handleCreate = async () => {
		if (!name || !targetId) {
			alert("Please fill in all required fields");
			return;
		}

		try {
			const newFlowId = await createFlowMutation({
				name,
				description,
				triggerLevel: level,
				targetId,
				isActive,
				showConsultantIntro: false,
				allowSkip: true,
			});

			router.push(`/${locale}/admin/refinement-flows/${newFlowId}/edit`);
		} catch (error) {
			console.error("Failed to create flow:", error);
			alert("Failed to create flow. Please try again.");
		}
	};

	const getTargets = () => {
		switch (level) {
			case "tool":
				return tools.map((t) => ({ id: t._id, name: t.name }));
			case "category":
				return categories.map((c) => ({ id: c._id, name: c.name }));
			case "subcategory":
				return subcategories.map((s) => ({ id: s._id, name: s.name }));
			case "vague":
				return [{ id: "global", name: "Global (All Vague Queries)" }];
			default:
				return [];
		}
	};

	const targets = getTargets();

	return (
		<div className="h-full flex flex-col">
			<AdminHeader
				title="Create Refinement Flow"
				description="Configure a new guided question flow for users"
				action={{
					label: "Cancel",
					onClick: () => router.push(`/${locale}/admin/refinement-flows`),
				}}
			/>

			<div className="flex-1 overflow-auto p-6">
				<div className="max-w-2xl space-y-6">
					<div className="space-y-2">
						<Label htmlFor="name">Flow Name *</Label>
						<Input
							id="name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="e.g., Event Discovery Flow"
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="description">Description</Label>
						<Textarea
							id="description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="What does this flow help users discover?"
							rows={3}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="level">Level *</Label>
						<Select
							value={level}
							onValueChange={(
								value: "tool" | "category" | "subcategory" | "vague",
							) => {
								setLevel(value);
								setTargetId("");
							}}
						>
							<SelectTrigger id="level">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="tool">Tool</SelectItem>
								<SelectItem value="category">Category</SelectItem>
								<SelectItem value="subcategory">Subcategory</SelectItem>
								<SelectItem value="vague">Vague Query</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<Label htmlFor="target">Target {level.replace("-", " ")} *</Label>
						<Select value={targetId} onValueChange={setTargetId}>
							<SelectTrigger id="target">
								<SelectValue
									placeholder={`Select a ${level.replace("-", " ")}`}
								/>
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

					<div className="flex items-center space-x-2">
						<Checkbox
							id="active"
							checked={isActive}
							onCheckedChange={(checked) => setIsActive(checked === true)}
						/>
						<Label htmlFor="active" className="cursor-pointer">
							Active (flow will be shown to users)
						</Label>
					</div>

					<div className="flex gap-3 pt-4">
						<Button onClick={handleCreate}>Create Flow</Button>
						<Button
							variant="outline"
							onClick={() => router.push(`/${locale}/admin/refinement-flows`)}
						>
							Cancel
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
