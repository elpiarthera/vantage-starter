"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface AIInputProps {
	value: string;
	onChange: (value: string) => void;
	onSubmit: () => void;
	placeholder?: string;
	disabled?: boolean;
	className?: string;
}

export function AIInput({
	value,
	onChange,
	onSubmit,
	placeholder = "Type your message...",
	disabled = false,
	className,
}: AIInputProps) {
	return (
		<div
			className={cn("border-t border-[#314d68] p-4 flex-shrink-0", className)}
		>
			<div className="flex gap-3">
				<Textarea
					value={value}
					onChange={(e) => onChange(e.target.value)}
					placeholder={placeholder}
					className="flex-1 text-white border-[#314d68] focus:border-[#0d7ff2] resize-none"
					style={{ backgroundColor: "#223649" }}
					rows={2}
					onKeyDown={(e) => {
						if (e.key === "Enter" && !e.shiftKey) {
							e.preventDefault();
							onSubmit();
						}
					}}
				/>
				<Button
					onClick={onSubmit}
					disabled={!value.trim() || disabled}
					className="h-fit px-6 self-end flex-shrink-0"
					style={{ backgroundColor: "#0d7ff2" }}
				>
					Send
				</Button>
			</div>
		</div>
	);
}
