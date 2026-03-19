"use client";

import type { ReactNode } from "react";

interface AssetGridProps {
	children: ReactNode;
}

export function AssetGrid({ children }: AssetGridProps) {
	return (
		<div
			className="
        grid gap-4
        grid-cols-1
        sm:grid-cols-2
        lg:grid-cols-3
        xl:grid-cols-4
      "
		>
			{children}
		</div>
	);
}
