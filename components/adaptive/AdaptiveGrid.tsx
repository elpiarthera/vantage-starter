"use client";

import type { ReactNode } from "react";
import { useDevice } from "@/contexts/DeviceContext";

interface AdaptiveGridProps {
	children: ReactNode;
	className?: string;
	mobileColumns?: number;
	tabletColumns?: number;
	desktopColumns?: number;
}

export function AdaptiveGrid({
	children,
	className = "",
	mobileColumns = 1,
	tabletColumns = 2,
	desktopColumns = 3,
}: AdaptiveGridProps) {
	const { isMobile, isTablet, isDesktop } = useDevice();

	let gridCols = "grid-cols-1";

	if (isMobile) {
		gridCols = `grid-cols-${mobileColumns}`;
	} else if (isTablet) {
		gridCols = `grid-cols-${tabletColumns}`;
	} else if (isDesktop) {
		gridCols = `grid-cols-${desktopColumns}`;
	}

	return (
		<div className={`grid gap-4 ${gridCols} ${className}`}>{children}</div>
	);
}
