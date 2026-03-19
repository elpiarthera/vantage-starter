"use client";

import { CheckmarkCircle01Icon } from "@hugeicons/core-free-icons";
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

interface SuccessDialogProps {
	isOpen: boolean;
	message: string;
	onOpenChange: (open: boolean) => void;
}

export function SuccessDialog({
	isOpen,
	message,
	onOpenChange,
}: SuccessDialogProps) {
	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<div className="flex items-center gap-2">
						<HugeiconsIcon
							icon={CheckmarkCircle01Icon}
							className="size-5 text-green-500"
						/>
						<DialogTitle className="text-green-600">Success!</DialogTitle>
					</div>
					<DialogDescription>{message}</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button
						onClick={() => onOpenChange(false)}
						className="w-full sm:w-auto"
					>
						Continue
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
