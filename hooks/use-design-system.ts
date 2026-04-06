"use client";

import { useQueryStates } from "nuqs";
import {
	type DesignSystemSearchParams,
	designSystemSearchParams,
} from "@/lib/design-system/search-params";

export function useDesignSystem() {
	return useQueryStates(designSystemSearchParams, {
		shallow: true,
		history: "replace",
	});
}

export type { DesignSystemSearchParams };
