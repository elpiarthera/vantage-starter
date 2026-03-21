/**
 * @lit-ui/calendar shim — re-exports date utilities from date-fns.
 * date-range-picker.ts imports addMonths, subMonths, getYear, format,
 * isBefore, isAfter, and the DayCellState type from '@lit-ui/calendar'.
 * We map each to its date-fns equivalent and mirror the DayCellState interface.
 */

export {
	addMonths,
	format,
	getYear,
	isAfter,
	isBefore,
	subMonths,
} from "date-fns";

/**
 * DayCellState — mirrors the interface defined in calendar.ts.
 * Imported as a type only by date-range-picker.ts.
 */
export interface DayCellState {
	date: Date;
	isToday: boolean;
	isSelected: boolean;
	isDisabled: boolean;
	isOutsideMonth: boolean;
	isInRange: boolean;
	weekNumber: number;
	formattedDate: string;
}
