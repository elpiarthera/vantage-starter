"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
	const { theme, setTheme } = useTheme();

	return (
		<Button
			variant="ghost"
			size="icon"
			aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
			onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
			className="size-9 shrink-0"
		>
			<Sun
				className="size-4 rotate-0 scale-100 transition-transform duration-150 ease-out dark:-rotate-90 dark:scale-0"
				aria-hidden="true"
			/>
			<Moon
				className="absolute size-4 rotate-90 scale-0 transition-transform duration-150 ease-out dark:rotate-0 dark:scale-100"
				aria-hidden="true"
			/>
		</Button>
	);
}
