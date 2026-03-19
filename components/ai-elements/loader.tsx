"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const Loader = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		className={cn("flex items-center space-x-1 text-gray-400", className)}
		{...props}
	>
		<span className="text-xs">AI Assistant is thinking</span>
		<div className="flex space-x-1">
			<div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
			<div
				className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
				style={{ animationDelay: "0.1s" }}
			></div>
			<div
				className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
				style={{ animationDelay: "0.2s" }}
			></div>
		</div>
	</div>
));
Loader.displayName = "Loader";

export { Loader };
