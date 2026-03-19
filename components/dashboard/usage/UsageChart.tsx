"use client";

import { useTranslations } from "next-intl";
import { useDevice } from "@/contexts/DeviceContext";

interface UsageData {
	service: string;
	cost: number;
}

interface UsageChartProps {
	usageData: UsageData[];
}

export function UsageChart({ usageData }: UsageChartProps) {
	const { isMobile } = useDevice();
	const t = useTranslations("usage_chart");

	// Group usage by service
	const serviceBreakdown = usageData.reduce(
		(acc, usage) => {
			if (!acc[usage.service]) {
				acc[usage.service] = 0;
			}
			acc[usage.service] += usage.cost;
			return acc;
		},
		{} as Record<string, number>,
	);

	// Calculate total cost
	const totalCost = Object.values(serviceBreakdown).reduce(
		(sum, cost) => sum + cost,
		0,
	);

	// Service colors
	const serviceColors: Record<string, string> = {
		"fal-ai": "#3b82f6", // blue
		fal: "#3b82f6", // blue (alternative name)
		openai: "#10b981", // green
		anthropic: "#f59e0b", // amber
		elevenlabs: "#8b5cf6", // purple
		together: "#ec4899", // pink
	};

	// Empty state
	if (usageData.length === 0 || totalCost === 0) {
		return (
			<div className="py-8 text-center text-muted-foreground">
				<p>{t("no_cost_data_available")}</p>
				<p className="text-sm">{t("service_usage_breakdown_hint")}</p>
			</div>
		);
	}

	return (
		<div className="space-y-4 md:space-y-6">
			{/* Bar Chart */}
			<div className="space-y-3">
				{Object.entries(serviceBreakdown).map(([service, cost]) => {
					const percentage = (cost / totalCost) * 100;

					return (
						<div key={service} className="space-y-2">
							<div className="flex items-center justify-between text-sm">
								<span className="font-medium capitalize">{service}</span>
								<span className="text-muted-foreground">
									${cost.toFixed(2)} ({percentage.toFixed(1)}%)
								</span>
							</div>
							<div className="h-3 md:h-4 bg-muted rounded-full overflow-hidden">
								<div
									className="h-full rounded-full transition-all duration-500"
									style={{
										width: `${percentage}%`,
										backgroundColor: serviceColors[service] || "#6b7280",
									}}
								/>
							</div>
						</div>
					);
				})}
			</div>

			{/* Legend */}
			<div className={`grid ${isMobile ? "grid-cols-2" : "grid-cols-4"} gap-3`}>
				{Object.entries(serviceBreakdown).map(([service, _cost]) => (
					<div key={service} className="flex items-center gap-2">
						<div
							className="w-3 h-3 rounded-full"
							style={{ backgroundColor: serviceColors[service] || "#6b7280" }}
						/>
						<span className="text-xs text-muted-foreground capitalize">
							{service}
						</span>
					</div>
				))}
			</div>
		</div>
	);
}
