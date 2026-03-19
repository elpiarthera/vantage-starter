"use client";

import {
	SignInButton,
	SignOutButton,
	SignUpButton,
	useAuth,
} from "@clerk/nextjs";
import {
	CheckSquare,
	Clock,
	LogIn,
	LogOut,
	Palette,
	Settings,
	Sparkles,
	User,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "@/i18n/routing";

export default function GuidedFlowEntry() {
	const { isSignedIn, isLoaded } = useAuth();
	const t = useTranslations("landing_page");
	const tStepHeader = useTranslations("step_header");
	const tCommon = useTranslations("common");
	const locale = useLocale();

	// Determine the localized sign-in URL for redirect after sign-out
	// For default locale (en), it's just /sign-in
	// For others, it's /[locale]/sign-in
	const afterSignOutUrl = locale === "en" ? "/sign-in" : `/${locale}/sign-in`;

	return (
		<div className="relative flex size-full min-h-screen flex-col overflow-x-hidden bg-[#101a23] font-sans text-white">
			<div className="flex h-full grow flex-col">
				<header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#223649] px-4 py-3 md:px-10">
					<div className="flex items-center gap-2 text-white md:gap-4">
						<svg
							className="size-5 md:size-6"
							fill="none"
							viewBox="0 0 48 48"
							xmlns="http://www.w3.org/2000/svg"
							role="img"
							aria-label="VantageStarter Logo"
						>
							<title>VantageStarter Logo</title>
							<g clipPath="url(#clip0_6_319)">
								<path
									d="M8.57829 8.57829C5.52816 11.6284 3.451 15.5145 2.60947 19.7452C1.76794 23.9758 2.19984 28.361 3.85056 32.3462C5.50128 36.3314 8.29667 39.7376 11.8832 42.134C15.4698 44.5305 19.6865 45.8096 24 45.8096C28.3135 45.8096 32.5302 44.5305 36.1168 42.134C39.7033 39.7375 42.4987 36.3314 44.1494 32.3462C45.8002 28.361 46.2321 23.9758 45.3905 19.7452C44.549 15.5145 42.4718 11.6284 39.4217 8.57829L24 24L8.57829 8.57829Z"
									fill="#0d7ff2"
								></path>
							</g>
							<defs>
								<clipPath id="clip0_6_319">
									<rect fill="white" height="48" width="48"></rect>
								</clipPath>
							</defs>
						</svg>
						<h1 className="text-white text-lg font-bold md:text-xl">
							VantageStarter
						</h1>
					</div>
					<div className="flex items-center gap-2 md:gap-4">
						<LanguageSwitcher />

						{/* Show skeleton/nothing while Clerk is loading to prevent flash */}
						{!isLoaded ? null : isSignedIn ? (
							<>
								<button
									type="button"
									className="flex min-w-[60px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-md h-9 px-3 bg-[#223649] text-white text-xs font-bold transition-colors hover:bg-[#314d68] md:h-10 md:px-4 md:text-sm md:min-w-[84px]"
								>
									<span className="truncate hidden sm:inline">
										{t("help_tutorial_button")}
									</span>
									<span className="truncate sm:hidden">{t("help_button")}</span>
								</button>

								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button
											variant="ghost"
											className="flex min-w-[60px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-md h-9 px-3 bg-[#223649] text-white text-xs font-bold transition-colors hover:bg-[#314d68] md:h-10 md:px-4 md:text-sm md:min-w-[84px]"
										>
											<User className="h-3 w-3 mr-1 md:h-4 md:w-4 md:mr-2" />
											<span className="truncate hidden sm:inline">
												{tStepHeader("profile_button")}
											</span>
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent
										align="end"
										className="w-48 bg-[#182634] border-[#223649] text-white"
									>
										<DropdownMenuItem
											asChild
											className="hover:bg-[#223649] focus:bg-[#223649]"
										>
											<Link
												href="/dashboard"
												className="flex items-center gap-2 cursor-pointer"
											>
												<Settings className="h-4 w-4" />
												{tStepHeader("dashboard_link")}
											</Link>
										</DropdownMenuItem>
										<DropdownMenuItem asChild>
											<SignOutButton redirectUrl={afterSignOutUrl}>
												<button
													type="button"
													className="flex w-full items-center hover:bg-[#223649] focus:bg-[#223649] cursor-pointer px-2 py-1.5 text-sm"
												>
													<LogOut className="h-4 w-4 mr-2" />
													{tStepHeader("sign_out_button")}
												</button>
											</SignOutButton>
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</>
						) : (
							<>
								<SignInButton mode="modal">
									<Button
										variant="ghost"
										className="text-white hover:bg-[#223649] h-9 px-3 text-xs font-bold md:h-10 md:px-4 md:text-sm"
									>
										<LogIn className="h-3 w-3 mr-1 md:h-4 md:w-4 md:mr-2" />
										{tCommon("sign_in")}
									</Button>
								</SignInButton>
								<SignUpButton mode="modal">
									<Button className="bg-[#0d7ff2] hover:bg-[#0b6dd1] text-white h-9 px-3 text-xs font-bold md:h-10 md:px-4 md:text-sm">
										{tCommon("sign_up")}
									</Button>
								</SignUpButton>
							</>
						)}
					</div>
				</header>

				<main className="flex flex-1 justify-center py-6 px-4 md:py-10">
					<div className="flex w-full max-w-4xl flex-col items-center">
						<div className="w-full max-w-md">
							<p className="text-center text-sm font-medium text-gray-400">
								{t("step_progress", { current: 0, total: 6 })}
							</p>
							<div className="mt-2 h-2 w-full rounded-full bg-[#314d68]">
								<div
									className="h-2 rounded-full bg-[#0d7ff2]"
									style={{ width: "5%" }}
								></div>
							</div>
						</div>

						<h2 className="mt-8 text-center text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl lg:text-5xl md:mt-10">
							{t("main_title")}
						</h2>

						<div className="mt-8 w-full rounded-md border border-[#223649] bg-[#182634] p-6 md:mt-12 md:p-8">
							<h3 className="text-xl font-bold text-[#0d7ff2] md:text-2xl">
								{t("guided_director_title")}
							</h3>
							<p className="mt-2 text-base text-gray-300 md:text-lg">
								{t("guided_director_description")}
							</p>

							<div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:mt-8 md:gap-6">
								<div className="flex items-center gap-3 md:gap-4">
									<div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#223649] text-[#0d7ff2] md:h-12 md:w-12">
										<Clock className="h-5 w-5 md:h-6 md:w-6" />
									</div>
									<div>
										<h4 className="text-base font-bold text-white md:text-lg">
											{t("creation_time_title")}
										</h4>
										<p className="text-sm text-gray-400 md:text-base">
											{t("creation_time_description")}
										</p>
									</div>
								</div>
								<div className="flex items-center gap-3 md:gap-4">
									<div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#223649] text-[#0d7ff2] md:h-12 md:w-12">
										<CheckSquare className="h-5 w-5 md:h-6 md:w-6" />
									</div>
									<div>
										<h4 className="text-base font-bold text-white md:text-lg">
											{t("process_title")}
										</h4>
										<p className="text-sm text-gray-400 md:text-base">
											{t("process_description")}
										</p>
									</div>
								</div>
								<div className="flex items-center gap-3 md:gap-4">
									<div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#223649] text-[#0d7ff2] md:h-12 md:w-12">
										<Palette className="h-5 w-5 md:h-6 md:w-6" />
									</div>
									<div>
										<h4 className="text-base font-bold text-white md:text-lg">
											{t("customization_title")}
										</h4>
										<p className="text-sm text-gray-400 md:text-base">
											{t("customization_description")}
										</p>
									</div>
								</div>
								<div className="flex items-center gap-3 md:gap-4">
									<div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#223649] text-[#0d7ff2] md:h-12 md:w-12">
										<Sparkles className="h-5 w-5 md:h-6 md:w-6" />
									</div>
									<div>
										<h4 className="text-base font-bold text-white md:text-lg">
											{t("ai_assistance_title")}
										</h4>
										<p className="text-sm text-gray-400 md:text-base">
											{t("ai_assistance_description")}
										</p>
									</div>
								</div>
							</div>
						</div>

						<p className="mt-6 text-center text-sm text-gray-400 md:mt-8 md:text-base">
							{t("features_hint")}
						</p>
						<div className="mt-6 md:mt-8">
							<Link href="/guided/step-1">
								<Button className="flex min-w-[180px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-md h-12 px-6 bg-[#0d7ff2] text-white text-base font-bold tracking-wide shadow-lg transition-all hover:scale-105 hover:bg-[#0b6dd1] md:h-14 md:px-8 md:text-lg md:min-w-[200px]">
									<span className="truncate">{t("begin_film_button")}</span>
								</Button>
							</Link>
						</div>
					</div>
				</main>
			</div>
		</div>
	);
}
