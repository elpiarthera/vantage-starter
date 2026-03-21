/**
 * JSX type declarations for lit-ui custom elements.
 * Extends React's IntrinsicElements so TSX files can use these tags without errors.
 * Keep in sync with register-all.ts.
 */

import type React from "react";

/** Shared extra props for all lit-ui custom elements */
type LitUIBaseProps = {
	/** Native HTML class attribute — needed for web components that don't remap className */
	class?: string;
};

declare global {
	namespace JSX {
		interface IntrinsicElements {
			// ----------------------------------------------------------------
			// ui-button
			// ----------------------------------------------------------------
			"ui-button": React.DetailedHTMLProps<
				React.HTMLAttributes<HTMLElement> &
					LitUIBaseProps & {
						variant?:
							| "primary"
							| "secondary"
							| "outline"
							| "ghost"
							| "destructive";
						size?: "sm" | "md" | "lg";
						type?: "button" | "submit" | "reset";
						disabled?: boolean;
						loading?: boolean;
					},
				HTMLElement
			>;
			// ----------------------------------------------------------------
			// lui-accordion / lui-accordion-item
			// ----------------------------------------------------------------
			"lui-accordion": React.DetailedHTMLProps<
				React.HTMLAttributes<HTMLElement> &
					LitUIBaseProps & {
						value?: string;
						"default-value"?: string;
						multiple?: boolean;
						collapsible?: boolean;
						disabled?: boolean;
					},
				HTMLElement
			>;
			"lui-accordion-item": React.DetailedHTMLProps<
				React.HTMLAttributes<HTMLElement> &
					LitUIBaseProps & {
						value?: string;
						expanded?: boolean;
						disabled?: boolean;
						"heading-level"?: number;
						lazy?: boolean;
					},
				HTMLElement
			>;
			// ----------------------------------------------------------------
			// lui-tabs / lui-tab-panel
			// ----------------------------------------------------------------
			"lui-tabs": React.DetailedHTMLProps<
				React.HTMLAttributes<HTMLElement> & {
					value?: string;
					"default-value"?: string;
					orientation?: "horizontal" | "vertical";
					"activation-mode"?: "automatic" | "manual";
				},
				HTMLElement
			>;
			"lui-tab-panel": React.DetailedHTMLProps<
				React.HTMLAttributes<HTMLElement> & {
					value?: string;
					lazy?: boolean;
				},
				HTMLElement
			>;
			// ----------------------------------------------------------------
			// lui-input
			// ----------------------------------------------------------------
			"lui-input": React.DetailedHTMLProps<
				React.HTMLAttributes<HTMLElement> & {
					type?: string;
					value?: string;
					placeholder?: string;
					label?: string;
					name?: string;
					disabled?: boolean;
					required?: boolean;
					readonly?: boolean;
					size?: "sm" | "md" | "lg";
					error?: string;
				},
				HTMLElement
			>;
			// ----------------------------------------------------------------
			// lui-textarea
			// ----------------------------------------------------------------
			"lui-textarea": React.DetailedHTMLProps<
				React.HTMLAttributes<HTMLElement> & {
					value?: string;
					placeholder?: string;
					label?: string;
					name?: string;
					disabled?: boolean;
					required?: boolean;
					readonly?: boolean;
					rows?: number;
					resize?: "none" | "vertical" | "horizontal" | "both";
					error?: string;
				},
				HTMLElement
			>;
			// ----------------------------------------------------------------
			// lui-checkbox / lui-checkbox-group
			// ----------------------------------------------------------------
			"lui-checkbox": React.DetailedHTMLProps<
				React.HTMLAttributes<HTMLElement> & {
					checked?: boolean;
					indeterminate?: boolean;
					value?: string;
					name?: string;
					disabled?: boolean;
					required?: boolean;
					label?: string;
				},
				HTMLElement
			>;
			"lui-checkbox-group": React.DetailedHTMLProps<
				React.HTMLAttributes<HTMLElement> & {
					value?: string;
					name?: string;
					disabled?: boolean;
					required?: boolean;
					label?: string;
					orientation?: "horizontal" | "vertical";
				},
				HTMLElement
			>;
			// ----------------------------------------------------------------
			// lui-radio / lui-radio-group
			// ----------------------------------------------------------------
			"lui-radio": React.DetailedHTMLProps<
				React.HTMLAttributes<HTMLElement> & {
					value?: string;
					checked?: boolean;
					disabled?: boolean;
					label?: string;
				},
				HTMLElement
			>;
			"lui-radio-group": React.DetailedHTMLProps<
				React.HTMLAttributes<HTMLElement> & {
					value?: string;
					name?: string;
					disabled?: boolean;
					required?: boolean;
					label?: string;
					orientation?: "horizontal" | "vertical";
				},
				HTMLElement
			>;
			// ----------------------------------------------------------------
			// lui-switch
			// ----------------------------------------------------------------
			"lui-switch": React.DetailedHTMLProps<
				React.HTMLAttributes<HTMLElement> & {
					checked?: boolean;
					value?: string;
					name?: string;
					disabled?: boolean;
					required?: boolean;
					label?: string;
					size?: "sm" | "md" | "lg";
				},
				HTMLElement
			>;
			// ----------------------------------------------------------------
			// lui-dialog
			// ----------------------------------------------------------------
			"lui-dialog": React.DetailedHTMLProps<
				React.HTMLAttributes<HTMLElement> & {
					open?: boolean;
					"close-on-backdrop"?: boolean;
					"close-on-escape"?: boolean;
					modal?: boolean;
					size?: "sm" | "md" | "lg" | "xl" | "full";
				},
				HTMLElement
			>;
			// ----------------------------------------------------------------
			// lui-popover
			// ----------------------------------------------------------------
			"lui-popover": React.DetailedHTMLProps<
				React.HTMLAttributes<HTMLElement> & {
					open?: boolean;
					placement?:
						| "top"
						| "bottom"
						| "left"
						| "right"
						| "top-start"
						| "top-end"
						| "bottom-start"
						| "bottom-end";
					offset?: number;
					"close-on-outside-click"?: boolean;
					"close-on-escape"?: boolean;
				},
				HTMLElement
			>;
			// ----------------------------------------------------------------
			// lui-tooltip
			// ----------------------------------------------------------------
			"lui-tooltip": React.DetailedHTMLProps<
				React.HTMLAttributes<HTMLElement> & {
					content?: string;
					placement?:
						| "top"
						| "bottom"
						| "left"
						| "right"
						| "top-start"
						| "top-end"
						| "bottom-start"
						| "bottom-end";
					delay?: number;
					disabled?: boolean;
				},
				HTMLElement
			>;
			// ----------------------------------------------------------------
			// lui-toast / lui-toaster
			// ----------------------------------------------------------------
			"lui-toast": React.DetailedHTMLProps<
				React.HTMLAttributes<HTMLElement> & {
					variant?: "default" | "success" | "error" | "warning" | "info";
					duration?: number;
					dismissible?: boolean;
					title?: string;
					description?: string;
				},
				HTMLElement
			>;
			"lui-toaster": React.DetailedHTMLProps<
				React.HTMLAttributes<HTMLElement> & {
					position?:
						| "top-left"
						| "top-center"
						| "top-right"
						| "bottom-left"
						| "bottom-center"
						| "bottom-right";
					"max-toasts"?: number;
				},
				HTMLElement
			>;
			// ----------------------------------------------------------------
			// lui-calendar / lui-calendar-multi
			// ----------------------------------------------------------------
			"lui-calendar": React.DetailedHTMLProps<
				React.HTMLAttributes<HTMLElement> & {
					value?: string;
					min?: string;
					max?: string;
					locale?: string;
					disabled?: boolean;
					"first-day-of-week"?: number;
					"show-week-numbers"?: boolean;
				},
				HTMLElement
			>;
			"lui-calendar-multi": React.DetailedHTMLProps<
				React.HTMLAttributes<HTMLElement> & {
					value?: string;
					min?: string;
					max?: string;
					locale?: string;
					disabled?: boolean;
					"first-day-of-week"?: number;
				},
				HTMLElement
			>;
			// ----------------------------------------------------------------
			// lui-date-picker / lui-date-range-picker
			// ----------------------------------------------------------------
			"lui-date-picker": React.DetailedHTMLProps<
				React.HTMLAttributes<HTMLElement> & {
					value?: string;
					placeholder?: string;
					label?: string;
					name?: string;
					disabled?: boolean;
					required?: boolean;
					min?: string;
					max?: string;
					locale?: string;
					format?: string;
				},
				HTMLElement
			>;
			"lui-date-range-picker": React.DetailedHTMLProps<
				React.HTMLAttributes<HTMLElement> & {
					"start-date"?: string;
					"end-date"?: string;
					placeholder?: string;
					label?: string;
					name?: string;
					disabled?: boolean;
					required?: boolean;
					min?: string;
					max?: string;
					locale?: string;
				},
				HTMLElement
			>;
			// ----------------------------------------------------------------
			// lui-time-picker
			// ----------------------------------------------------------------
			"lui-time-picker": React.DetailedHTMLProps<
				React.HTMLAttributes<HTMLElement> & {
					value?: string;
					placeholder?: string;
					label?: string;
					name?: string;
					disabled?: boolean;
					required?: boolean;
					"hour-format"?: "12" | "24";
					step?: number;
				},
				HTMLElement
			>;
			// ----------------------------------------------------------------
			// lui-option / lui-option-group
			// ----------------------------------------------------------------
			"lui-option": React.DetailedHTMLProps<
				React.HTMLAttributes<HTMLElement> & {
					value?: string;
					label?: string;
					disabled?: boolean;
					selected?: boolean;
					multiselect?: boolean;
				},
				HTMLElement
			>;
			"lui-option-group": React.DetailedHTMLProps<
				React.HTMLAttributes<HTMLElement> & {
					label?: string;
				},
				HTMLElement
			>;
		}
	}
}
