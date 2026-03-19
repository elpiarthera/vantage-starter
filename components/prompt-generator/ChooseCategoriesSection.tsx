"use client";

import { CheckmarkCircle01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "@/components/ui/carousel";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";

interface ChooseCategoriesSectionProps {
	promptBank: Record<string, any[]>;
	selectedTopic: string;
	selections: Record<string, string>;
	onTopicChange: (topic: string) => void;
	formatOptionName: (name: string) => string;
}

export function ChooseCategoriesSection({
	promptBank,
	selectedTopic,
	selections,
	onTopicChange,
	formatOptionName,
}: ChooseCategoriesSectionProps) {
	return (
		<section className="border-b border-border bg-card/30">
			<div className="px-6 py-6">
				<div className="max-w-7xl mx-auto">
					<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 lg:mb-8">
						<div>
							<h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-2">
								Choose Categories
							</h2>
							<p className="text-sm sm:text-base text-muted-foreground">
								Select from different cinematic elements to build your perfect
								prompt
							</p>
						</div>
						<div className="flex items-center gap-3">
							<div className="text-sm text-muted-foreground">
								{Object.keys(promptBank).length} categories available
							</div>
						</div>
					</div>

					<div className="w-full overflow-hidden">
						<Carousel
							className="w-full"
							opts={{
								align: "start",
								dragFree: true,
								containScroll: "trimSnaps",
							}}
						>
							<div className="flex items-center gap-0 w-full">
								<CarouselPrevious className="relative left-0 h-10 w-10 rounded-md border border-border flex-shrink-0" />
								<CarouselContent className="ml-0 gap-0 flex-1">
									{Object.keys(promptBank).map((category) => (
										<CarouselItem
											key={category}
											className="pl-0 pr-0 basis-auto"
										>
											<TooltipProvider>
												<Tooltip>
													<TooltipTrigger asChild>
														<button
															type="button"
															onClick={() => onTopicChange(category)}
															className={`px-3 sm:px-4 py-2 rounded-md border-l-none transition-all duration-200 whitespace-nowrap font-medium flex items-center gap-2 text-sm sm:text-base ${
																selectedTopic === category
																	? "bg-orange/20 border-l-none border border-orange text-orange  shadow-sm"
																	: "bg-card hover:bg-accent text-muted-foreground hover:text-foreground border border-l-none border-border hover:border-border/80"
															}`}
														>
															{formatOptionName(category)}
															{selections[category] && (
																<HugeiconsIcon
																	icon={CheckmarkCircle01Icon}
																	className={`size-4 ${
																		selectedTopic === category
																			? "text-orange"
																			: "text-primary/60"
																	}`}
																/>
															)}
														</button>
													</TooltipTrigger>
													<TooltipContent>
														<p>
															Switch to {formatOptionName(category)} options
														</p>
													</TooltipContent>
												</Tooltip>
											</TooltipProvider>
										</CarouselItem>
									))}
								</CarouselContent>
								<CarouselNext className="relative right-0 h-10 w-10 rounded-md border border-border flex-shrink-0" />
							</div>
						</Carousel>
					</div>
				</div>
			</div>
		</section>
	);
}
