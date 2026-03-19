"use client";

export function ApiKeyWarning() {
	return (
		<div className="mb-4 p-3 bg-yellow-900/50 border border-yellow-600/50 rounded-lg">
			<div className="flex items-start gap-2">
				<svg
					className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
					/>
				</svg>
				<div>
					<p className="text-sm text-yellow-200 font-medium">
						API Key Not Configured
					</p>
					<p className="text-xs text-yellow-300/70 mt-1">
						Please configure your AI Gateway API key to enable image generation.
					</p>
				</div>
			</div>
		</div>
	);
}
