/**
 * Adapted from mcpcn (https://www.mcpcn.dev) — MIT License.
 * The upstream source ships no license header of its own; this attribution
 * notice is added here per this repo's licensing policy, it is not a
 * preserved original notice.
 *
 * THE BULLET'S ASSERTION, taken as written: "`event-confirmation` renders
 * only when [the registration] insert has succeeded." This component is
 * purely presentational and unconditional by itself — the "only when
 * succeeded" guarantee is enforced by its ONE caller,
 * `components/events/EventDetailSection.tsx`, which mounts
 * `<EventConfirmation>` only inside the `try` block's success branch (the
 * `catch` branch never renders it — see that file). A mutation-proof
 * sequence in the PR body demonstrates this by neutralizing that guard and
 * observing the render-only-on-success test go red.
 *
 * Wired into `components/events/EventDetailSection.tsx` (Batch 4 fourth
 * bullet, docs/mcpcn-block-mapping.md §4 "Events").
 */
import { CheckCircle2 } from "lucide-react";
import type { ComponentProps } from "react";

import { formatEventDateTime } from "@/lib/events/formatEventDateTime";
import { cn } from "@/lib/utils";

export interface EventConfirmationProps extends ComponentProps<"div"> {
	data: {
		title: string;
		startDateTime: string;
		timezone: string;
	};
	locale?: string;
	labels: {
		heading: string;
		description: (eventTitle: string, when: string) => string;
	};
}

export function EventConfirmation({
	className,
	data,
	locale = "en",
	labels,
	...props
}: EventConfirmationProps) {
	const when = formatEventDateTime(data.startDateTime, data.timezone, locale);
	return (
		<div
			data-slot="event-confirmation"
			aria-live="polite"
			className={cn(
				"flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-8 text-center",
				className,
			)}
			{...props}
		>
			<CheckCircle2 className="size-10 text-primary" aria-hidden="true" />
			<h2 className="font-semibold text-foreground text-xl">
				{labels.heading}
			</h2>
			<p className="text-muted-foreground text-sm">
				{labels.description(data.title, when)}
			</p>
		</div>
	);
}
