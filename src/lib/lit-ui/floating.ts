/**
 * @lit-ui/core/floating shim — re-exports @floating-ui/dom with lit-ui's API names.
 */

import {
  computePosition as _computePosition,
  autoUpdate,
  flip as _flip,
  shift as _shift,
  offset as _offset,
  arrow as _arrow,
  size as _size,
  type Placement,
} from '@floating-ui/dom';

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
