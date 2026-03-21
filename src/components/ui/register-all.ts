/**
 * lit-ui — Register all web components.
 * This is the single entry point for the esbuild bundle.
 * Import this file once to register every <ui-*> / <lui-*> custom element.
 *
 * Excluded (require @tanstack/lit-table or @tanstack/lit-virtual — not in npm):
 *   - data-table.js
 *   - select.js
 */

// Core form components
import "./button.js";
import "./input.js";
import "./textarea.js";
import "./checkbox.js";
import "./checkbox-group.js";
import "./radio.js";
import "./radio-group.js";
import "./switch.js";

// Layout & navigation
import "./accordion.js";
import "./accordion-item.js";
import "./tabs.js";
import "./tab-panel.js";
import "./dialog.js";
import "./popover.js";
import "./tooltip.js";
import "./toast.js";
import "./toaster.js";

// Date & time
import "./calendar.js";
import "./calendar-multi.js";
import "./date-picker.js";
import "./date-range-picker.js";
import "./time-picker.js";

// Options (used standalone; option-group.js uses no tanstack dep)
import "./option.js";
import "./option-group.js";
