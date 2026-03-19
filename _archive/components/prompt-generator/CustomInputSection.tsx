"use client";

import { Upload01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface CustomInputSectionProps {
	customText: string;
	imageFile: File | null;
	imageUrl: string;
	onCustomTextChange: (value: string) => void;
	onImageFileChange: (file: File | null) => void;
	onImageUrlChange: (url: string) => void;
}

export function CustomInputSection({
	customText,
	imageFile,
	imageUrl,
	onCustomTextChange,
	onImageFileChange,
	onImageUrlChange,
}: CustomInputSectionProps) {
	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0] || null;
		onImageFileChange(file);
	};

	return (
		<section className="border-t border-border">
			<div className="px-6 py-6">
				<div className="max-w-7xl mx-auto">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						{/* Custom Text Input */}
						<div className="space-y-3">
							<h3 className="text-lg font-semibold text-foreground">
								Custom Text
							</h3>
							<p className="text-sm text-muted-foreground">
								Add your own creative elements to the prompt
							</p>
							<Textarea
								placeholder="Add any additional details or style preferences..."
								value={customText}
								onChange={(e) => onCustomTextChange(e.target.value)}
								className="min-h-[120px] resize-none"
							/>
						</div>

						{/* Image Input */}
						<div className="space-y-3">
							<h3 className="text-lg font-semibold text-foreground">
								Reference Image
							</h3>
							<div className="space-y-4">
								{/* File Upload */}
								<div>
									<p className="text-sm text-muted-foreground mb-2">
										Upload an image for reference
									</p>
									<div className="relative">
										<input
											type="file"
											accept="image/*"
											onChange={handleFileChange}
											className="sr-only"
											id="image-upload"
										/>
										<label
											htmlFor="image-upload"
											className="flex items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-border/80 hover:bg-accent/20 transition-colors"
										>
											<div className="text-center">
												<HugeiconsIcon
													icon={Upload01Icon}
													className="size-8 text-muted-foreground mb-2 mx-auto"
												/>
												<p className="text-sm text-muted-foreground">
													{imageFile ? imageFile.name : "Click to upload"}
												</p>
											</div>
										</label>
									</div>
								</div>

								{/* Or Separator */}
								<div className="relative">
									<div className="absolute inset-0 flex items-center">
										<div className="w-full border-t border-border" />
									</div>
									<div className="relative flex justify-center text-xs uppercase">
										<span className="bg-background px-2 text-muted-foreground">
											Or
										</span>
									</div>
								</div>

								{/* URL Input */}
								<div>
									<p className="text-sm text-muted-foreground mb-2">
										Enter image URL
									</p>
									<Input
										type="url"
										placeholder="https://example.com/image.jpg"
										value={imageUrl}
										onChange={(e) => onImageUrlChange(e.target.value)}
									/>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
