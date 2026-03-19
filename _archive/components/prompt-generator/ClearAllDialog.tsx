"use client";

import { RefreshIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

interface ClearAllDialogProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void;
}

export function ClearAllDialog({
	isOpen,
	onOpenChange,
	onConfirm,
}: ClearAllDialogProps) {
	const handleConfirm = () => {
		onConfirm();
		onOpenChange(false);
	};

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="text-destructive">
						Clear All Selections
					</DialogTitle>
					<DialogDescription>
						This will remove all your current selections and reset the prompt
						generator. This action cannot be undone.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter className="flex-col sm:flex-row gap-2">
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						className="w-full sm:w-auto order-2 sm:order-1"
					>
						Cancel
					</Button>
					<Button
						onClick={handleConfirm}
						variant="destructive"
						className="w-full sm:w-auto bg-red hover:bg-red/90 text-white border-red order-1 sm:order-2"
					>
						<HugeiconsIcon icon={RefreshIcon} className="size-4 mr-2" />
						Clear All
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
