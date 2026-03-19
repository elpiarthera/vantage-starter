"use client";

import { Plus, X } from "lucide-react";
import Image from "next/image";
import type React from "react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { AdminAdStore } from "@/lib/admin-mock-data";
import { metaCategoriesStore } from "@/lib/meta-categories-mock-data";
import type { FlowQuestion } from "@/lib/refinement-flow-store";

interface QuestionEditorDialogProps {
	open: boolean;
	question: FlowQuestion | null;
	flowId: string;
	onClose: () => void;
	onSave: (question: FlowQuestion) => void;
}

export function QuestionEditorDialog({
	open,
	question,
	flowId,
	onClose,
	onSave,
}: QuestionEditorDialogProps) {
	const [formData, setFormData] = useState<FlowQuestion>({
		id: "",
		order: 1,
		type: "text",
		text: "",
		question: "",
		description: "",
		isRequired: true,
		allowOther: false,
		allowMultiple: false,
		options: [],
		layout: "grid",
		gridCols: 2,
	});

	useEffect(() => {
		if (question) {
			setFormData(question);
		} else {
			setFormData({
				id: `q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
				order: 1,
				type: "text",
				text: "",
				question: "",
				description: "",
				isRequired: true,
				allowOther: false,
				allowMultiple: false,
				options: [],
				layout: "grid",
				gridCols: 2,
			});
		}
	}, [question]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onSave(formData);
	};

	const handleAddTextOption = () => {
		setFormData({
			...formData,
			options: [
				...(formData.options || []),
				{
					id: `opt-${Date.now()}`,
					label: "",
					value: "",
				},
			],
		});
	};

	const handleRemoveTextOption = (index: number) => {
		setFormData({
			...formData,
			options: formData.options?.filter((_, i) => i !== index),
		});
	};

	const handleUpdateTextOption = (
		index: number,
		field: "label" | "value",
		value: string,
	) => {
		setFormData({
			...formData,
			options: formData.options?.map((opt, i) =>
				i === index ? { ...opt, [field]: value } : opt,
			),
		});
	};

	const handleToggleVisualItem = (
		type: "categories" | "subcategories",
		itemId: string,
	) => {
		const currentSource = formData.visualSource || { type };

		if (type === "categories") {
			const categoryIds = currentSource.categoryIds || [];
			setFormData({
				...formData,
				visualSource: {
					...currentSource,
					type,
					categoryIds: categoryIds.includes(itemId)
						? categoryIds.filter((id) => id !== itemId)
						: [...categoryIds, itemId],
				},
			});
		} else {
			const subcategoryIds = currentSource.subcategoryIds || [];
			setFormData({
				...formData,
				visualSource: {
					...currentSource,
					type,
					subcategoryIds: subcategoryIds.includes(itemId)
						? subcategoryIds.filter((id) => id !== itemId)
						: [...subcategoryIds, itemId],
				},
			});
		}
	};

	const availableCategories = metaCategoriesStore.getAllCategories();
	const availableSubcategories = metaCategoriesStore.getAllSubCategories();
	const _availableAds = AdminAdStore.getAllActiveAds();

	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent className="w-full h-[100dvh] max-w-full top-0 left-0 translate-x-0 translate-y-0 rounded-none border-0 p-0 flex flex-col sm:max-w-full sm:h-[100dvh] lg:max-w-[900px] lg:max-h-[90vh] lg:top-[50%] lg:left-[50%] lg:translate-x-[-50%] lg:translate-y-[-50%] lg:rounded-lg lg:border">
				<div className="px-6 pt-6 lg:p-6 flex-shrink-0 border-b border-border">
					<DialogHeader>
						<DialogTitle>
							{question ? "Edit Question" : "Add Question"}
						</DialogTitle>
						<DialogDescription>
							Configure the question settings and options below
						</DialogDescription>
					</DialogHeader>
				</div>

				<form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
					<div className="flex-1 overflow-y-auto px-6 py-6">
						<div className="space-y-6">
							{/* Question Type */}
							<div className="space-y-2">
								<Label>Question Type</Label>
								<Select
									value={formData.type}
									onValueChange={(value) =>
										setFormData({
											...formData,
											type: value as "text" | "visual",
										})
									}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="text">Text Options</SelectItem>
										<SelectItem value="visual">Visual Cards</SelectItem>
									</SelectContent>
								</Select>
							</div>

							{/* Question Text */}
							<div className="space-y-2">
								<Label htmlFor="text">Question Text</Label>
								<Input
									id="text"
									value={formData.text}
									onChange={(e) =>
										setFormData({ ...formData, text: e.target.value })
									}
									placeholder="e.g., What are you looking for tonight?"
									required
								/>
							</div>

							{/* Description */}
							<div className="space-y-2">
								<Label htmlFor="description">Description (Optional)</Label>
								<Textarea
									id="description"
									value={formData.description}
									onChange={(e) =>
										setFormData({ ...formData, description: e.target.value })
									}
									placeholder="Helper text for users"
									rows={2}
								/>
							</div>

							{/* Options Section */}
							{formData.type === "text" ? (
								<div className="space-y-3">
									<div className="flex items-center justify-between">
										<Label>Text Options</Label>
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={handleAddTextOption}
										>
											<Plus className="w-4 h-4 mr-2" />
											Add Option
										</Button>
									</div>

									{formData.options && formData.options.length > 0 ? (
										<div className="space-y-2">
											{formData.options.map((option, index) => (
												<div key={option.id} className="flex gap-2">
													<Input
														placeholder="Label"
														value={option.label}
														onChange={(e) =>
															handleUpdateTextOption(
																index,
																"label",
																e.target.value,
															)
														}
														className="flex-1"
													/>
													<Input
														placeholder="Value"
														value={option.value}
														onChange={(e) =>
															handleUpdateTextOption(
																index,
																"value",
																e.target.value,
															)
														}
														className="flex-1"
													/>
													<Button
														type="button"
														variant="ghost"
														size="sm"
														onClick={() => handleRemoveTextOption(index)}
													>
														<X className="w-4 h-4" />
													</Button>
												</div>
											))}
										</div>
									) : (
										<div className="text-sm text-muted-foreground py-8 text-center border-2 border-dashed rounded-lg">
											No options yet. Click "Add Option" to get started.
										</div>
									)}
								</div>
							) : (
								<div className="space-y-3">
									<Label>Visual Source</Label>
									<Tabs defaultValue="categories">
										<TabsList className="grid w-full grid-cols-2">
											<TabsTrigger value="categories">Categories</TabsTrigger>
											<TabsTrigger value="subcategories">
												Subcategories
											</TabsTrigger>
										</TabsList>

										<TabsContent value="categories" className="space-y-3 mt-4">
											<div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto">
												{availableCategories.map((cat) => (
													<label
														key={cat.id}
														className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-accent/5 transition-colors"
													>
														<Checkbox
															checked={formData.visualSource?.categoryIds?.includes(
																cat.id,
															)}
															onCheckedChange={() =>
																handleToggleVisualItem("categories", cat.id)
															}
														/>
														<div className="flex-1 min-w-0">
															<div className="flex items-center gap-2 mb-1">
																{cat.imageUrl && (
																	<div className="relative w-8 h-8 rounded overflow-hidden flex-shrink-0">
																		<Image
																			src={cat.imageUrl || "/placeholder.svg"}
																			alt={cat.name}
																			fill
																			className="object-cover"
																		/>
																	</div>
																)}
																<span className="text-sm font-medium truncate">
																	{cat.name}
																</span>
															</div>
														</div>
													</label>
												))}
											</div>
										</TabsContent>

										<TabsContent
											value="subcategories"
											className="space-y-3 mt-4"
										>
											<div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto">
												{availableSubcategories.map((sub) => (
													<label
														key={sub.id}
														className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-accent/5 transition-colors"
													>
														<Checkbox
															checked={formData.visualSource?.subcategoryIds?.includes(
																sub.id,
															)}
															onCheckedChange={() =>
																handleToggleVisualItem("subcategories", sub.id)
															}
														/>
														<div className="flex-1 min-w-0">
															<div className="flex items-center gap-2 mb-1">
																{sub.imageUrl && (
																	<div className="relative w-8 h-8 rounded overflow-hidden flex-shrink-0">
																		<Image
																			src={sub.imageUrl || "/placeholder.svg"}
																			alt={sub.name}
																			fill
																			className="object-cover"
																		/>
																	</div>
																)}
																<span className="text-sm font-medium truncate">
																	{sub.name}
																</span>
															</div>
														</div>
													</label>
												))}
											</div>
										</TabsContent>
									</Tabs>

									<div className="pt-2">
										<Label>Layout</Label>
										<div className="flex gap-4 mt-2">
											<Select
												value={formData.layout}
												onValueChange={(value) =>
													setFormData({
														...formData,
														layout: value as "grid" | "list",
													})
												}
											>
												<SelectTrigger className="w-[150px]">
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="grid">Grid</SelectItem>
													<SelectItem value="list">List</SelectItem>
												</SelectContent>
											</Select>

											{formData.layout === "grid" && (
												<Select
													value={String(formData.gridCols)}
													onValueChange={(value) =>
														setFormData({
															...formData,
															gridCols: Number(value),
														})
													}
												>
													<SelectTrigger className="w-[150px]">
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="2">2 Columns</SelectItem>
														<SelectItem value="3">3 Columns</SelectItem>
														<SelectItem value="4">4 Columns</SelectItem>
													</SelectContent>
												</Select>
											)}
										</div>
									</div>
								</div>
							)}

							{/* Settings */}
							<div className="space-y-4 pt-4 border-t">
								<div className="flex items-center justify-between">
									<div>
										<Label>Required</Label>
										<p className="text-xs text-muted-foreground">
											User must answer to proceed
										</p>
									</div>
									<Switch
										checked={formData.isRequired}
										onCheckedChange={(checked) =>
											setFormData({ ...formData, isRequired: checked })
										}
									/>
								</div>

								<div className="flex items-center justify-between">
									<div>
										<Label>Allow "Other" Option</Label>
										<p className="text-xs text-muted-foreground">
											Show custom text input
										</p>
									</div>
									<Switch
										checked={formData.allowOther}
										onCheckedChange={(checked) =>
											setFormData({ ...formData, allowOther: checked })
										}
									/>
								</div>

								<div className="flex items-center justify-between">
									<div>
										<Label>Allow Multiple Selection</Label>
										<p className="text-xs text-muted-foreground">
											User can select multiple options
										</p>
									</div>
									<Switch
										checked={formData.allowMultiple}
										onCheckedChange={(checked) =>
											setFormData({ ...formData, allowMultiple: checked })
										}
									/>
								</div>
							</div>
						</div>
					</div>

					<DialogFooter className="px-6 pb-6 border-t pt-4 flex-shrink-0 bg-background">
						<Button type="button" variant="outline" onClick={onClose}>
							Cancel
						</Button>
						<Button type="submit">
							{question ? "Save Changes" : "Add Question"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
