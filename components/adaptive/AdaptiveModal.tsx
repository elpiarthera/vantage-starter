"use client";

import type { ReactNode } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer";
import { useDevice } from "@/contexts/DeviceContext";

interface AdaptiveModalProps {
	isOpen: boolean;
	onClose: () => void;
	title: string;
	description?: string;
	children: ReactNode;
	className?: string;
	/** Size variant: "default" (max-w-4xl), "large" (max-w-6xl), "full" (w-[90vw] h-[90vh]) */
	size?: "default" | "large" | "full";
}

export function AdaptiveModal({
	isOpen,
	onClose,
	title,
	description,
	children,
	className,
	size = "default",
}: AdaptiveModalProps) {
	const { isMobile } = useDevice();

	// Size classes for desktop modal
	const sizeClasses = {
		default: "max-w-4xl max-h-[90vh]",
		large: "max-w-6xl max-h-[90vh]",
		full: "w-[90vw] h-[90vh] max-w-[1400px]",
	};

	if (isMobile) {
		return (
			<Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
				<DrawerContent
					className={`bg-card border-border max-h-[90vh] ${className}`}
				>
					<DrawerHeader>
						<DrawerTitle className="text-foreground">{title}</DrawerTitle>
						{description && (
							<DrawerDescription className="text-muted-foreground">
								{description}
							</DrawerDescription>
						)}
					</DrawerHeader>
					<div className="px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] overflow-y-auto">
						{children}
					</div>
				</DrawerContent>
			</Drawer>
		);
	}

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent
				className={`bg-card border-border text-foreground ${sizeClasses[size]} overflow-y-auto ${className}`}
			>
				<DialogHeader>
					<DialogTitle className="text-foreground">{title}</DialogTitle>
					{description && (
						<DialogDescription className="text-muted-foreground">
							{description}
						</DialogDescription>
					)}
				</DialogHeader>
				{children}
			</DialogContent>
		</Dialog>
	);
}
