"use client";

import { Progress as ProgressPrimitive } from "@base-ui/react/progress";
import * as React from "react";

import { cn } from "@/lib/utils";

const Progress = React.forwardRef<
	React.ComponentRef<typeof ProgressPrimitive.Root>,
	Omit<
		React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>,
		"value"
	> & {
		value?: number | null;
	}
>(({ className, value, ...props }, ref) => (
	<ProgressPrimitive.Root
		ref={ref}
		value={value ?? 0}
		className={cn(
			"relative h-4 w-full overflow-hidden rounded-full bg-secondary",
			className,
		)}
		{...props}
	>
		<ProgressPrimitive.Track className="relative h-full w-full">
			<ProgressPrimitive.Indicator className="h-full flex-1 bg-primary transition-all" />
		</ProgressPrimitive.Track>
	</ProgressPrimitive.Root>
));
Progress.displayName = "Progress";

export { Progress };
