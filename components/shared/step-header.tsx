"use client";

import { SignOutButton } from "@clerk/nextjs";
import { ArrowLeft, Home, LogOut, Settings, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Link } from "@/i18n/routing";
import { ROUTES } from "@/lib/routes";

interface StepHeaderProps {
	currentStep: number;
	title?: string; // Made title optional since we're removing it from navigation
	subtitle?: string;
	totalDuration?: string;
	backHref: string;
}

export function StepHeader({
	currentStep,
	title,
	subtitle,
	totalDuration,
	backHref,
}: StepHeaderProps) {
	const t = useTranslations("step_header");
	const progressValue = (currentStep / 6) * 100;

	return (
		<div className="shadow-md p-3 md:p-4 fixed top-0 w-full z-50 bg-card border-b border-border">
			<div className="max-w-6xl mx-auto flex items-center justify-between">
				<Link href={backHref}>
					<Button
						variant="ghost"
						className="text-foreground hover:bg-muted p-2 md:px-4"
						aria-label={t("back_button")}
					>
						<ArrowLeft className="h-4 w-4 md:mr-2" />
						<span className="hidden md:inline">{t("back_button")}</span>
					</Button>
				</Link>

				<div className="flex-1 max-w-md mx-4 md:mx-8">
					<Progress value={progressValue} className="h-2 mb-2 bg-muted" />
					<div className="flex justify-between text-xs text-muted-foreground">
						{[1, 2, 3, 4, 5, 6].map((num) => (
							<span key={num} className="flex items-center gap-1">
								<div
									className={`w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center text-xs ${
										num <= currentStep
											? "bg-primary text-primary-foreground"
											: "bg-muted text-muted-foreground"
									}`}
								>
									{num}
								</div>
								{num === currentStep && (
									<span className="hidden sm:inline">
										{num === 1 && "📝"}
										{num === 2 && "✍️"}
										{num === 3 && "🎨"}
										{num === 4 && "🎵"}
										{num === 5 && "✨"}
										{num === 6 && "🎬"}
									</span>
								)}
							</span>
						))}
					</div>
				</div>

				<div className="flex items-center gap-2">
					{totalDuration && (
						<span className="text-sm text-muted-foreground hidden md:inline">
							{t("total_duration")}:{" "}
							<span className="text-foreground">{totalDuration}</span>
						</span>
					)}
					<Link href={ROUTES.home}>
						<Button
							variant="ghost"
							className="text-foreground hover:bg-muted p-2 md:px-4"
							aria-label={t("home_button")}
						>
							<Home className="h-4 w-4 md:mr-2" />
							<span className="hidden md:inline">{t("home_button")}</span>
						</Button>
					</Link>

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								className="text-foreground hover:bg-muted p-2 md:px-4"
								aria-label={t("profile_button")}
							>
								<User className="h-4 w-4 md:mr-2" />
								<span className="hidden md:inline">{t("profile_button")}</span>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent
							align="end"
							className="w-48 bg-card border-border text-foreground"
						>
							<DropdownMenuItem
								asChild
								className="hover:bg-muted focus:bg-muted"
							>
								<Link
									href={ROUTES.dashboard}
									className="flex items-center gap-2 cursor-pointer"
								>
									<Settings className="h-4 w-4" />
									{t("dashboard_link")}
								</Link>
							</DropdownMenuItem>
							<DropdownMenuItem asChild>
								<SignOutButton redirectUrl="/sign-in">
									<button
										type="button"
										className="flex w-full items-center hover:bg-muted focus:bg-muted cursor-pointer px-2 py-1.5 text-sm"
									>
										<LogOut className="h-4 w-4 mr-2" />
										{t("sign_out_button")}
									</button>
								</SignOutButton>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>

			{title && (
				<div className="text-center mt-4">
					<h1 className="text-2xl md:text-3xl font-bold text-foreground">
						{title}
					</h1>
					{subtitle && (
						<p className="text-lg md:text-xl italic mt-2 text-primary">
							{subtitle}
						</p>
					)}
				</div>
			)}
		</div>
	);
}
