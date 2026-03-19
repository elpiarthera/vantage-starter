"use client";
import { ImageIcon, LayoutGrid, Plus } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AdminAd, AdminCategory } from "@/lib/admin-mock-data";

interface ItemPickerProps {
	categories: AdminCategory[];
	ads: AdminAd[];
	selectedIds: string[];
	onAddItem: (type: "category" | "ad", referenceId: string) => void;
}

export function ItemPicker({
	categories,
	ads,
	selectedIds,
	onAddItem,
}: ItemPickerProps) {
	return (
		<div className="sticky top-8">
			<div className="mb-4">
				<h2 className="text-lg font-semibold text-foreground">Add Items</h2>
				<p className="text-sm text-muted-foreground">
					Select categories or ads to display
				</p>
			</div>

			<Tabs defaultValue="categories" className="w-full">
				<TabsList className="grid w-full grid-cols-2">
					<TabsTrigger value="categories" className="gap-2">
						<LayoutGrid className="w-4 h-4" />
						Categories
					</TabsTrigger>
					<TabsTrigger value="ads" className="gap-2">
						<ImageIcon className="w-4 h-4" />
						Ads
					</TabsTrigger>
				</TabsList>

				<TabsContent
					value="categories"
					className="space-y-3 mt-4 max-h-[600px] overflow-auto"
				>
					{categories.map((category) => {
						const isSelected = selectedIds.includes(category.id);
						return (
							<div
								key={category.id}
								className="border border-border rounded-lg p-3 bg-card"
							>
								<div className="flex items-start gap-3">
									<div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
										<Image
											src={category.imageUrl || "/placeholder.svg"}
											alt={category.name}
											fill
											className="object-cover"
										/>
									</div>
									<div className="flex-1 min-w-0">
										<h4 className="font-medium text-foreground text-sm mb-1">
											{category.name}
										</h4>
										<p className="text-xs text-muted-foreground line-clamp-2">
											{category.baseline}
										</p>
									</div>
								</div>
								<Button
									size="sm"
									variant={isSelected ? "secondary" : "default"}
									onClick={() => onAddItem("category", category.id)}
									disabled={isSelected}
									className="w-full mt-3 gap-2"
								>
									{isSelected ? (
										"Added"
									) : (
										<>
											<Plus className="w-4 h-4" />
											Add
										</>
									)}
								</Button>
							</div>
						);
					})}
					{categories.length === 0 && (
						<p className="text-sm text-muted-foreground text-center py-8">
							No active categories available
						</p>
					)}
				</TabsContent>

				<TabsContent
					value="ads"
					className="space-y-3 mt-4 max-h-[600px] overflow-auto"
				>
					{ads.map((ad) => {
						const isSelected = selectedIds.includes(ad.id);
						return (
							<div
								key={ad.id}
								className="border border-border rounded-lg p-3 bg-card"
							>
								<div className="flex items-start gap-3">
									<div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
										<Image
											src={ad.imageUrl || "/placeholder.svg"}
											alt={ad.title}
											fill
											className="object-cover"
										/>
									</div>
									<div className="flex-1 min-w-0">
										<h4 className="font-medium text-foreground text-sm mb-1">
											{ad.title}
										</h4>
										<p className="text-xs text-muted-foreground line-clamp-2">
											{ad.baseline}
										</p>
									</div>
								</div>
								<Button
									size="sm"
									variant={isSelected ? "secondary" : "default"}
									onClick={() => onAddItem("ad", ad.id)}
									disabled={isSelected}
									className="w-full mt-3 gap-2"
								>
									{isSelected ? (
										"Added"
									) : (
										<>
											<Plus className="w-4 h-4" />
											Add
										</>
									)}
								</Button>
							</div>
						);
					})}
					{ads.length === 0 && (
						<p className="text-sm text-muted-foreground text-center py-8">
							No active ads available
						</p>
					)}
				</TabsContent>
			</Tabs>
		</div>
	);
}
