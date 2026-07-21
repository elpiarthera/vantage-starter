"use client";

import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Base UI popover primitive, ported following the same Root/Trigger/Portal/
 * Positioner/Popup shape already used by `dialog.tsx` and `dropdown-menu.tsx`
 * in this repo (post-migration to Base UI, see `docs/migration-base-ui.md`).
 * Added as a `registryDependency` of the mcpcn `contact-form` block
 * (docs/mcpcn-block-mapping.md §4 "contact-form") — it did not exist in this
 * repo's shadcn primitives before this change, so it is a genuinely new file,
 * not an edit over an existing one.
 */

const Popover = PopoverPrimitive.Root;

const PopoverTrigger = PopoverPrimitive.Trigger;

const PopoverContent = React.forwardRef<
	React.ComponentRef<typeof PopoverPrimitive.Popup>,
	React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Popup> & {
		align?: "start" | "center" | "end";
		sideOffset?: number;
	}
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
	<PopoverPrimitive.Portal>
		<PopoverPrimitive.Positioner
			align={align}
			sideOffset={sideOffset}
			className="z-50"
		>
			<PopoverPrimitive.Popup
				ref={ref}
				className={cn(
					"w-72 rounded-md border border-border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[open]:animate-in data-[closed]:animate-out data-[closed]:fade-out-0 data-[open]:fade-in-0 data-[closed]:zoom-out-95 data-[open]:zoom-in-95",
					className,
				)}
				{...props}
			/>
		</PopoverPrimitive.Positioner>
	</PopoverPrimitive.Portal>
));
PopoverContent.displayName = "PopoverContent";

export { Popover, PopoverTrigger, PopoverContent };
