"use client";

import { useTranslations } from "next-intl";
import type * as React from "react";
import { useDesignSystem } from "@/hooks/use-design-system";
import {
	ICON_LIBRARIES,
	type IconLibraryName,
} from "@/lib/design-system/config";
import {
	Picker,
	PickerContent,
	PickerGroup,
	PickerRadioGroup,
	PickerRadioItem,
	PickerTrigger,
} from "./picker";

// Inline SVG logos for icon libraries (no external icon packages)
const logos: Record<string, React.ReactNode> = {
	lucide: (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="16"
			height="16"
			fill="none"
			stroke="currentColor"
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth="2"
			viewBox="0 0 24 24"
			aria-hidden="true"
		>
			<path d="M14 12a4 4 0 0 0-8 0 8 8 0 1 0 16 0 11.97 11.97 0 0 0-4-8.944" />
			<path d="M10 12a4 4 0 0 0 8 0 8 8 0 1 0-16 0 11.97 11.97 0 0 0 4.063 9" />
		</svg>
	),
	hugeicons: (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth="2"
			aria-hidden="true"
		>
			<path d="M2 9.5H22" />
			<path d="M20.5 9.5H3.5L4.23353 15.3682C4.59849 18.2879 4.78097 19.7477 5.77343 20.6239C6.76589 21.5 8.23708 21.5 11.1795 21.5H12.8205C15.7629 21.5 17.2341 21.5 18.2266 20.6239C19.219 19.7477 19.4015 18.2879 19.7665 15.3682L20.5 9.5Z" />
			<path d="M5 9C5 5.41015 8.13401 2.5 12 2.5C15.866 2.5 19 5.41015 19 9" />
		</svg>
	),
	phosphor: (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 32 32"
			width="16"
			height="16"
			aria-hidden="true"
		>
			<path
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="2"
				d="M9 5h9v16H9zm9 16v9a9 9 0 0 1-9-9M9 5l9 16m0 0h1a8 8 0 0 0 0-16h-1"
			/>
		</svg>
	),
	tabler: (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="16"
			height="16"
			viewBox="0 0 32 32"
			aria-hidden="true"
		>
			<path
				fill="currentColor"
				d="M31.288 7.107A8.83 8.83 0 0 0 24.893.712a55.9 55.9 0 0 0-17.786 0A8.83 8.83 0 0 0 .712 7.107a55.9 55.9 0 0 0 0 17.786 8.83 8.83 0 0 0 6.395 6.395c5.895.95 11.89.95 17.786 0a8.83 8.83 0 0 0 6.395-6.395c.95-5.895.95-11.89 0-17.786"
			/>
			<path
				fill="#fff"
				d="m17.884 9.076 1.5-2.488 6.97 6.977-2.492 1.494zm-7.96 3.127 7.814-.909 3.91 3.66-.974 7.287-9.582 2.159a3.06 3.06 0 0 1-2.17-.329l5.244-4.897c.91.407 2.003.142 2.587-.626.584-.77.488-1.818-.226-2.484s-1.84-.755-2.664-.21c-.823.543-1.107 1.562-.67 2.412l-5.245 4.89a2.53 2.53 0 0 1-.339-2.017z"
			/>
		</svg>
	),
	remixicon: (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			width="16"
			height="16"
			fill="currentColor"
			aria-hidden="true"
		>
			<path d="M12 2C17.5228 2 22 6.47715 22 12C22 15.3137 19.3137 18 16 18C12.6863 18 10 15.3137 10 12C10 11.4477 9.55228 11 9 11C8.44772 11 8 11.4477 8 12C8 16.4183 11.5817 20 16 20C16.8708 20 17.7084 19.8588 18.4932 19.6016C16.7458 21.0956 14.4792 22 12 22C6.6689 22 2.3127 17.8283 2.0166 12.5713C2.23647 9.45772 4.83048 7 8 7C11.3137 7 14 9.68629 14 13C14 13.5523 14.4477 14 15 14C15.5523 14 16 13.5523 16 13C16 8.58172 12.4183 5 8 5C6.50513 5 5.1062 5.41032 3.90918 6.12402C5.72712 3.62515 8.67334 2 12 2Z" />
		</svg>
	),
};

export function IconLibraryPicker() {
	const t = useTranslations("design_system");
	const [params, setParams] = useDesignSystem();
	const current =
		ICON_LIBRARIES[params.iconLibrary as IconLibraryName] ??
		ICON_LIBRARIES.lucide;

	return (
		<Picker>
			<PickerTrigger>
				<div className="flex flex-col justify-start text-left">
					<div className="text-xs text-muted-foreground">
						{t("icon_library")}
					</div>
					<div className="text-sm font-medium text-foreground">
						{current.title}
					</div>
				</div>
				<div className="pointer-events-none absolute top-1/2 right-4 flex size-4 -translate-y-1/2 items-center justify-center text-foreground select-none md:right-2.5">
					{logos[current.name]}
				</div>
			</PickerTrigger>
			<PickerContent>
				<PickerRadioGroup
					value={current.name}
					onValueChange={(value) =>
						setParams({ iconLibrary: value as IconLibraryName })
					}
				>
					<PickerGroup>
						{Object.values(ICON_LIBRARIES).map((lib) => (
							<PickerRadioItem key={lib.name} value={lib.name}>
								{lib.title}
							</PickerRadioItem>
						))}
					</PickerGroup>
				</PickerRadioGroup>
			</PickerContent>
		</Picker>
	);
}
