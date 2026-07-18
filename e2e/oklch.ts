/**
 * Shared OKLCH/OKLAB lightness parser.
 *
 * Percent-aware: `oklch(14.5% 0 0)` (raw CSS custom-property text) and
 * `oklch(0.145 0 0)` (getComputedStyle-resolved colour serialization) must
 * both yield the SAME fractional lightness, 0.145 — never two different
 * numbers depending on which surface handed us the string.
 *
 * Two DOM surfaces feed this parser in this repo, and they disagree on
 * form:
 *  - `getComputedStyle(el).getPropertyValue("--custom-prop")` returns the
 *    token's RAW TEXT as authored in CSS — which may be a percent
 *    (`14.5%`) or a bare fraction (`0.145`), depending on the token.
 *  - `getComputedStyle(el).backgroundColor` / `.color` (a RESOLVED colour
 *    property, not a custom property) is always serialized by the browser
 *    as a bare fraction (`0.3`), and Chromium may additionally re-write
 *    `oklch()` to `oklab()` on repaint.
 *
 * A parser that only strips `%` breaks the fractional form; a parser that
 * ignores `%` silently returns a value 100x too large (the Day-135 bug
 * class this file closes). Handle both, explicitly, in one place so no
 * spec can drift back into a single-surface assumption.
 */
export function lightnessOf(value: string): number {
	const match = value.match(/okla?[bc]h?\(\s*([\d.]+)(%?)/);
	if (!match) {
		throw new Error(`unparsable oklch/oklab value: ${value}`);
	}
	const [, rawNumber, percentSign] = match;
	const parsed = Number.parseFloat(rawNumber);
	return percentSign === "%" ? parsed / 100 : parsed;
}
