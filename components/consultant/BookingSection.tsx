"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import {
	DateTimePicker,
	type DateTimePickerLabels,
} from "@/components/ui/date-time-picker";
import {
	BOOKING_AVAILABILITY,
	type BookingPayload,
	buildBookingPayload,
	generateAvailableSlots,
} from "@/lib/booking/availability";

/**
 * Client wiring for the authenticated `/dashboard/consultant/book` page
 * (Batch 4, `docs/mcpcn-block-mapping.md` §4 "date-time-picker" — the
 * consultant booking surface). The presentational block lives in
 * `components/ui/date-time-picker.tsx`; this component owns slot
 * generation (from the single declared `lib/booking/availability.ts`
 * config) and the booking-payload construction.
 *
 * TDD assertion this file exists to satisfy: "selecting a slot from the
 * static config and confirming produces a booking payload carrying the
 * selected start time and timezone, matching the config entry that was
 * clicked." `handleNext` below calls `buildBookingPayload` with EXACTLY
 * the `(date, time)` pair the picker reports as clicked — never a
 * recomputed or re-typed value.
 *
 * Convex: none for this entry (declared out of scope by
 * `docs/mcpcn-block-mapping.md` §4 — a real calendar-integration data
 * source is a separate, later feature). This surface produces a payload
 * and shows a confirmation; it does not persist a booking anywhere yet.
 */
export function BookingSection() {
	const t = useTranslations("booking");
	const [payload, setPayload] = useState<BookingPayload | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	// The anchor is fixed once per mount so the slot list a visitor sees
	// and the slot list `buildBookingPayload` validates against can never
	// drift apart within a single visit (see `lib/booking/availability.ts`'s
	// `buildBookingPayload` docstring on why `from` must match).
	const [anchor] = useState(() => new Date());

	const slots = useMemo(
		() => generateAvailableSlots(BOOKING_AVAILABILITY, anchor),
		[anchor],
	);

	const availableDates = useMemo(
		() => Array.from(new Set(slots.map((slot) => slot.date))),
		[slots],
	);

	const availableTimeSlotsByDate = useMemo(() => {
		const byDate: Record<string, string[]> = {};
		for (const slot of slots) {
			if (!byDate[slot.date]) {
				byDate[slot.date] = [];
			}
			byDate[slot.date].push(slot.time);
		}
		return byDate;
	}, [slots]);

	const labels: DateTimePickerLabels = {
		title: t("title"),
		timezoneNotice: t("timezone_notice", {
			zone: BOOKING_AVAILABILITY.timezone,
		}),
		prevMonthAria: t("prev_month_aria"),
		nextMonthAria: t("next_month_aria"),
		backToCalendar: t("back_home"),
		next: t("next"),
		dateAvailableAria: (date: string) => t("date_available_aria", { date }),
		dateUnavailableAria: (date: string) => t("date_unavailable_aria", { date }),
	};

	const handleNext = (date: string, time: string) => {
		setErrorMessage(null);
		try {
			const built = buildBookingPayload(
				{ date, time },
				BOOKING_AVAILABILITY,
				anchor,
			);
			setPayload(built);
		} catch {
			setErrorMessage(t("error_generic"));
		}
	};

	if (payload) {
		const [datePart, timeWithOffset] = payload.startTime.split("T");
		const timePart = timeWithOffset.slice(0, 5);
		return (
			<div className="w-full max-w-xl rounded-xl bg-card p-8 text-center">
				<h2 className="font-semibold text-foreground text-xl">
					{t("success_title")}
				</h2>
				<p className="mt-2 text-muted-foreground text-sm">
					{t("success_description", {
						date: datePart,
						time: timePart,
						zone: payload.timezone,
					})}
				</p>
			</div>
		);
	}

	return (
		<div className="w-full max-w-2xl">
			<DateTimePicker
				data={{ availableDates, availableTimeSlotsByDate }}
				labels={labels}
				actions={{ onNext: handleNext }}
			/>
			{errorMessage ? (
				<p role="alert" className="mt-4 text-destructive text-sm">
					{errorMessage}
				</p>
			) : null}
		</div>
	);
}
