"use client";

import React from "react";

interface ErrorBoundaryState {
	hasError: boolean;
	error?: Error;
}

interface ErrorBoundaryProps {
	children: React.ReactNode;
	fallback?: React.ComponentType<{ error?: Error }>;
}

export class ErrorBoundary extends React.Component<
	ErrorBoundaryProps,
	ErrorBoundaryState
> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		console.error("[ErrorBoundary] Caught error:", error, errorInfo);

		// In production, you might want to send this to an error reporting service
		if (process.env.NODE_ENV === "production") {
			// trackEvent('error_boundary_triggered', { error: error.message, stack: error.stack })
		}
	}

	render() {
		if (this.state.hasError) {
			const FallbackComponent = this.props.fallback;

			if (FallbackComponent) {
				return <FallbackComponent error={this.state.error} />;
			}

			return (
				<div className="min-h-screen bg-background flex items-center justify-center p-4">
					<div className="bg-card border border-border rounded-lg p-6 max-w-md w-full text-center">
						<h2 className="text-foreground text-xl font-bold mb-4">
							Something went wrong
						</h2>
						<p className="text-muted-foreground mb-4">
							An error occurred while rendering this component. Please refresh
							the page to try again.
						</p>
						<button
							onClick={() => window.location.reload()}
							className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg transition-colors"
						>
							Refresh Page
						</button>
					</div>
				</div>
			);
		}

		return this.props.children;
	}
}
