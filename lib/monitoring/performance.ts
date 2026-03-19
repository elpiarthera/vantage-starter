export const markPerformance = (name: string): void => {
	if (typeof window !== "undefined" && window.performance) {
		performance.mark(name);
	}
};

export const measurePerformance = (
	name: string,
	startMark: string,
	endMark: string,
): number | null => {
	if (typeof window !== "undefined" && window.performance) {
		try {
			performance.measure(name, startMark, endMark);
			const measure = performance.getEntriesByName(name, "measure")[0];
			return measure ? measure.duration : null;
		} catch (error) {
			console.warn("[Performance] Failed to measure:", error);
			return null;
		}
	}
	return null;
};

export const clearPerformanceMarks = (name?: string): void => {
	if (typeof window !== "undefined" && window.performance) {
		if (name) {
			performance.clearMarks(name);
			performance.clearMeasures(name);
		} else {
			performance.clearMarks();
			performance.clearMeasures();
		}
	}
};
