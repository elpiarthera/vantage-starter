"use client";

/**
 * Placeholder for lit-ui web component registration.
 *
 * The Lit components in src/ use decorator syntax that webpack cannot compile
 * without a separate build step. Components requiring registration (lui-accordion,
 * ui-button) are replaced with styled native HTML elements in the landing page.
 * This file is kept for future use when a pre-built lit-ui bundle is available.
 */
export function WebComponentsLoader() {
	return null;
}
