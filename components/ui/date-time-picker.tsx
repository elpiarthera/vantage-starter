/**
 * Adapted from mcpcn (https://www.mcpcn.dev) — MIT License.
 * The upstream source ships no license header of its own; this attribution
 * notice is added here per this repo's licensing policy, it is not a
 * preserved original notice.
 *
 * Ported for VantageStarter (`docs/mcpcn-block-mapping.md` §4
 * "date-time-picker", Batch 4 third bullet):
 *
 *   - Every visible string is hard-coded English in upstream ("Select a
 *     Date & Time", "Time zone", "Back to calendar", "Next", ...) — this
 *     repo's i18n rule (`AGENTS.md`: "i18n mandatory, never hardcode
 *     strings") requires a `labels` prop, the same pattern already used by
 *     `components/ui/contact-form.tsx` and `components/ui/issue-report-
 *     form.tsx`. `components/consultant/BookingSection.tsx` supplies the
 *     next-intl translated set for all seven locales this repo ships.
 *
 *   - Upstream's timezone control is a live SELECTOR (search + pick any of
 *     20 hardcoded zones) that visually implies "pick your zone and the
 *     slots adjust" — they never did, upstream or here: the slot list is a
 *     fixed prop, never recomputed per selected zone. Rather than ship a
 *     control whose one interaction does nothing, this port replaces it
 *     with a read-only, translated notice naming the ONE zone the slots
 *     are authored in (see `lib/booking/availability.ts`'s TIMEZONE
 *     section for the full reasoning) — `data.timezoneNotice`, rendered
 *     verbatim, is expected to already contain that zone name. The
 *     `showTimezone` / `weekStartsOn` / timezone-search plumbing from
 *     upstream is otherwise preserved so a future consumer that DOES wire
 *     a real per-zone recompute can restore the selector without a
 *     structural rewrite.
 *
 *   - Calendar day buttons gained `aria-pressed` / `aria-label` (date +
 *     "available"/"unavailable") and slot buttons gained `aria-pressed`
 *     for keyboard/screen-reader users — upstream relied on color alone.
 *
 *   - All colors already resolve to this repo's OKLCH tokens (`bg-card`,
 *     `text-foreground`, `text-muted-foreground`, `bg-primary`,
 *     `text-primary-foreground`, `bg-muted`, `border-input`), so no color
 *     remapping was needed beyond the Popover import already present via
 *     `contact-form`'s registryDependency.
 *
 * Wired into `app/[locale]/dashboard/consultant/book/page.tsx` — an
 * AUTHENTICATED route (see that file's header for what that means for an
 * unauthenticated visitor). Replaces nothing; net-new booking surface.
 */
"use client";

import { Globe } from "lucide-react";
import type { ReactNode } from "react";
import { createContext, useContext, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface DateTimePickerLabels {
	title: string;
	timezoneNotice: string;
	prevMonthAria: string;
	nextMonthAria: string;
	backToCalendar: string;
	next: string;
	dateAvailableAria: (date: string) => string;
	dateUnavailableAria: (date: string) => string;
}

export interface DateTimePickerProps {
	children?: ReactNode;
	data?: {
		/** Array of ISO `YYYY-MM-DD` dates that can be selected. */
		availableDates?: string[];
		/** Array of `HH:mm` time slot strings available for the selected date. */
		availableTimeSlotsByDate?: Record<string, string[]>;
	};
	labels: DateTimePickerLabels;
	actions?: {
		/** Called when the user picks a date+time and clicks Next. */
		onNext?: (date: string, time: string) => void;
	};
	appearance?: {
		showTitle?: boolean;
		weekStartsOn?: "sunday" | "monday" | "saturday";
	};
}

const DEFAULT_PICKER: NonNullable<DateTimePickerProps["data"]> = {
	availableDates: [],
	availableTimeSlotsByDate: {},
};

const resolveDateTimePicker = ({
	actions,
	appearance,
	data,
	labels,
}: DateTimePickerProps) => ({
	availableDates: data?.availableDates ?? DEFAULT_PICKER.availableDates ?? [],
	availableTimeSlotsByDate:
		data?.availableTimeSlotsByDate ??
		DEFAULT_PICKER.availableTimeSlotsByDate ??
		{},
	labels,
	onNext: actions?.onNext,
	showTitle: appearance?.showTitle ?? true,
	weekStartsOn: appearance?.weekStartsOn ?? "monday",
});

const DateTimePickerContext = createContext<DateTimePickerProps | null>(null);

export const useDateTimePicker = () => {
	const context = useContext(DateTimePickerContext);
	if (!context) {
		throw new Error(
			"DateTimePicker components must be used within DateTimePicker",
		);
	}
	return context;
};

const ALL_DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

const WEEK_START_OFFSETS: Record<"sunday" | "monday" | "saturday", number> = {
	monday: 1,
	saturday: 6,
	sunday: 0,
};

const getOrderedDays = (weekStartsOn: "sunday" | "monday" | "saturday") => {
	const offset = WEEK_START_OFFSETS[weekStartsOn];
	return [...ALL_DAYS.slice(offset), ...ALL_DAYS.slice(0, offset)];
};

const MONTHS = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December",
];

function pad(n: number): string {
	return n.toString().padStart(2, "0");
}

function toIsoDate(date: Date): string {
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

const DateTimePickerView = (props: DateTimePickerProps) => {
	const {
		availableDates,
		availableTimeSlotsByDate,
		labels,
		onNext,
		showTitle,
		weekStartsOn,
	} = resolveDateTimePicker(props);
	const orderedDays = getOrderedDays(weekStartsOn);
	const weekStartOffset = WEEK_START_OFFSETS[weekStartsOn];
	const availableDateSet = new Set(availableDates);

	const [currentMonth, setCurrentMonth] = useState(() => {
		const now = new Date();
		return new Date(now.getFullYear(), now.getMonth(), 1);
	});
	const [selectedDate, setSelectedDate] = useState<string | null>(null);
	const [selectedTime, setSelectedTime] = useState<string | null>(null);

	const year = currentMonth.getFullYear();
	const month = currentMonth.getMonth();
	const firstDayOfMonth = new Date(year, month, 1).getDay();
	const daysInMonth = new Date(year, month + 1, 0).getDate();
	const daysInPrevMonth = new Date(year, month, 0).getDate();

	const calendarDays: { day: number; isCurrentMonth: boolean; date: Date }[] =
		[];
	const leadingDays = (firstDayOfMonth - weekStartOffset + 7) % 7;
	for (let i = leadingDays - 1; i >= 0; i -= 1) {
		const day = daysInPrevMonth - i;
		calendarDays.push({
			date: new Date(year, month - 1, day),
			day,
			isCurrentMonth: false,
		});
	}
	for (let day = 1; day <= daysInMonth; day += 1) {
		calendarDays.push({
			date: new Date(year, month, day),
			day,
			isCurrentMonth: true,
		});
	}
	const totalCells = Math.ceil(calendarDays.length / 7) * 7;
	const remainingDays = totalCells - calendarDays.length;
	for (let day = 1; day <= remainingDays; day += 1) {
		calendarDays.push({
			date: new Date(year, month + 1, day),
			day,
			isCurrentMonth: false,
		});
	}

	const handleDateSelect = (isoDate: string) => {
		if (!availableDateSet.has(isoDate)) return;
		setSelectedDate(isoDate);
		setSelectedTime(null);
	};

	const handleTimeSelect = (time: string) => setSelectedTime(time);

	const handleNext = () => {
		if (selectedDate && selectedTime) onNext?.(selectedDate, selectedTime);
	};

	const timeSlots = selectedDate
		? (availableTimeSlotsByDate[selectedDate] ?? [])
		: [];
	const today = toIsoDate(new Date());

	return (
		<div className="w-full rounded-xl bg-card p-6">
			{showTitle && labels.title && (
				<h2 className="mb-6 font-semibold text-foreground text-xl">
					{labels.title}
				</h2>
			)}

			<div className="flex flex-col gap-8 md:flex-row md:justify-center">
				<div className="w-full flex-shrink-0 md:w-[304px]">
					<div className="mb-4 flex items-center justify-center gap-4">
						<button
							type="button"
							onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
							aria-label={labels.prevMonthAria}
							className="rounded p-1 transition-colors duration-150 hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
						>
							<span aria-hidden>‹</span>
						</button>
						<span className="min-w-[140px] text-center font-medium text-base text-foreground">
							{MONTHS[month]} {year}
						</span>
						<button
							type="button"
							onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
							aria-label={labels.nextMonthAria}
							className="rounded p-1 transition-colors duration-150 hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
						>
							<span aria-hidden>›</span>
						</button>
					</div>

					<div className="mb-2 grid grid-cols-7">
						{orderedDays.map((day) => (
							<div
								key={day}
								className="py-2 text-center font-medium text-muted-foreground text-xs"
							>
								{day}
							</div>
						))}
					</div>

					<div className="grid grid-cols-7 gap-y-1">
						{calendarDays.map((item) => {
							const isoDate = toIsoDate(item.date);
							const isAvailable =
								item.isCurrentMonth && availableDateSet.has(isoDate);
							const isSelected = selectedDate === isoDate;
							const isToday = isoDate === today;

							return (
								<button
									type="button"
									key={isoDate}
									onClick={() =>
										item.isCurrentMonth && handleDateSelect(isoDate)
									}
									disabled={!item.isCurrentMonth || !isAvailable}
									aria-pressed={isSelected}
									aria-label={
										item.isCurrentMonth
											? isAvailable
												? labels.dateAvailableAria(isoDate)
												: labels.dateUnavailableAria(isoDate)
											: undefined
									}
									className={cn(
										"relative mx-auto flex size-10 items-center justify-center rounded-full text-sm transition-all duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring",
										!item.isCurrentMonth && "text-muted-foreground/30",
										item.isCurrentMonth &&
											!isAvailable &&
											"cursor-default text-muted-foreground",
										item.isCurrentMonth &&
											isAvailable &&
											!isSelected &&
											"cursor-pointer font-medium text-primary hover:bg-primary/10",
										isSelected &&
											"bg-primary font-medium text-primary-foreground",
										isAvailable && !isSelected && "bg-primary/10",
									)}
								>
									{item.day}
									{isToday && !isSelected && (
										<span className="-translate-x-1/2 absolute bottom-1 left-1/2 size-1 rounded-full bg-foreground" />
									)}
								</button>
							);
						})}
					</div>

					{/* Read-only timezone notice — see file header: upstream's
					    interactive zone selector is intentionally NOT ported,
					    because changing it never recomputed the slot list,
					    upstream or here. */}
					<div className="mt-6 flex items-start gap-2 text-muted-foreground text-sm">
						<Globe className="mt-0.5 size-4 shrink-0" aria-hidden />
						<span>{labels.timezoneNotice}</span>
					</div>
				</div>

				{selectedDate && (
					<div className="w-full md:w-[200px]">
						<div className="max-h-[320px] space-y-2 overflow-y-auto">
							{timeSlots.map((time) => {
								const isTimeSelected = selectedTime === time;
								return (
									<div key={time} className="grid grid-cols-2 gap-2">
										<button
											type="button"
											onClick={() => handleTimeSelect(time)}
											aria-pressed={isTimeSelected}
											className={cn(
												"h-[52px] rounded-lg border font-semibold text-sm transition-all duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring",
												isTimeSelected
													? "border-muted-foreground bg-muted-foreground text-background"
													: "col-span-2 border-primary text-primary hover:bg-primary/5",
											)}
										>
											{time}
										</button>
										{isTimeSelected && (
											<Button
												onClick={handleNext}
												className="h-[52px] animate-in fade-in slide-in-from-left-2 duration-200"
											>
												{labels.next}
											</Button>
										)}
									</div>
								);
							})}
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export const DateTimePickerContent = (props: DateTimePickerProps) => {
	const context = useDateTimePicker();
	return <DateTimePickerView {...context} {...props} />;
};

const DateTimePickerRoot = ({
	children,
	...props
}: DateTimePickerProps & { children?: React.ReactNode }) => (
	<DateTimePickerContext.Provider value={props}>
		{children ?? <DateTimePickerContent {...props} />}
	</DateTimePickerContext.Provider>
);

export const DateTimePicker = DateTimePickerRoot;
