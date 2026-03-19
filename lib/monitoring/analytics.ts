export const trackEvent = (event: string, data?: any): void => {
	if (process.env.NODE_ENV === "development") {
		console.log(`[Analytics] ${event}`, data);
	}

	// In production, send to analytics service
	// Example: analytics.track(event, data)
};

export const trackResponsiveIssue = (device: string, issue: string): void => {
	trackEvent("responsive_issue", { device, issue });
};

export const debugResponsive = (breakpoint: string, issue?: string): void => {
	if (process.env.NODE_ENV === "development") {
		console.log(`[Debug] Responsive: ${breakpoint}`, issue);
	}
};

export const trackPerformance = (
	metric: string,
	value: number,
	unit = "ms",
): void => {
	trackEvent("performance_metric", { metric, value, unit });
};

export const trackUserInteraction = (
	action: string,
	component: string,
	data?: any,
): void => {
	trackEvent("user_interaction", { action, component, ...data });
};
