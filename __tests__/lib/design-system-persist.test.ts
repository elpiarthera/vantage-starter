/**
 * Configurator persistence (Day defects #1) — the selection must be
 * readable from localStorage, and the provider must be able to tell whether
 * the current URL already carries an explicit override before rehydrating.
 *
 * This is the "consumed value" test the class of bug requires: it does not
 * just check that a setter ran, it reads back what a real consumer
 * (DesignSystemProvider) would read.
 */
import { DESIGN_SYSTEM_PARAM_KEYS } from "@/lib/design-system/config";
import {
	DESIGN_SYSTEM_STORAGE_KEY,
	hasDesignSystemUrlOverride,
	loadPersistedDesignSystemConfig,
	savePersistedDesignSystemConfig,
} from "@/lib/design-system/persist";
import type { DesignSystemSearchParams } from "@/lib/design-system/search-params";

const SAMPLE: DesignSystemSearchParams = {
	style: "lyra",
	baseColor: "zinc",
	theme: "blue",
	chartColor: "blue",
	iconLibrary: "lucide",
	font: "inter",
	fontHeading: "inherit",
	menuAccent: "bold",
	menuColor: "inverted",
	radius: "small",
	rtl: false,
};

describe("design system persistence", () => {
	beforeEach(() => {
		window.localStorage.clear();
	});

	it("returns null when nothing was ever saved", () => {
		expect(loadPersistedDesignSystemConfig()).toBeNull();
	});

	it("round-trips a saved config through the real storage a returning visit reads", () => {
		savePersistedDesignSystemConfig(SAMPLE);
		const raw = window.localStorage.getItem(DESIGN_SYSTEM_STORAGE_KEY);
		expect(raw).not.toBeNull();
		expect(loadPersistedDesignSystemConfig()).toEqual(SAMPLE);
	});

	it("tolerates corrupted storage instead of throwing", () => {
		window.localStorage.setItem(DESIGN_SYSTEM_STORAGE_KEY, "{not json");
		expect(loadPersistedDesignSystemConfig()).toBeNull();
	});

	it("detects no URL override on a bare navigation (the reported repro)", () => {
		expect(hasDesignSystemUrlOverride("", DESIGN_SYSTEM_PARAM_KEYS)).toBe(
			false,
		);
	});

	it("detects an explicit URL override and defers to it", () => {
		expect(
			hasDesignSystemUrlOverride("?style=lyra", DESIGN_SYSTEM_PARAM_KEYS),
		).toBe(true);
	});

	it("ignores unrelated query params (e.g. locale) as if there were no override", () => {
		expect(
			hasDesignSystemUrlOverride("?unrelated=1", DESIGN_SYSTEM_PARAM_KEYS),
		).toBe(false);
	});
});
