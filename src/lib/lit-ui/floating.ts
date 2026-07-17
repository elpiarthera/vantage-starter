/**
 * @lit-ui/core/floating shim — re-exports @floating-ui/dom with lit-ui's API names.
 */

import {
	arrow as _arrow,
	computePosition as _computePosition,
	flip as _flip,
	offset as _offset,
	shift as _shift,
	size as _size,
	autoUpdate,
	type Placement,
} from "@floating-ui/dom";

export type { Placement };
export const flip = _flip;
export const shift = _shift;
export const offset = _offset;
export const arrow = _arrow;
export const size = _size;

/**
 * computePosition wrapper matching lit-ui's API.
 */
export const computePosition = _computePosition;

/**
 * autoUpdatePosition — wraps @floating-ui/dom's autoUpdate.
 */
export const autoUpdatePosition = autoUpdate;
