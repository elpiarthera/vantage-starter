"use client";

import { Waitlist } from "@clerk/nextjs";
import { useParams } from "next/navigation";

const frLocalization = {
	waitlist: {
		start: {
			title: "Rejoignez la liste d'attente",
			subtitle: "Inscrivez-vous pour être parmi les premiers à accéder.",
			formButton: "Rejoindre la liste",
			emailLabel: "Adresse e-mail",
			emailPlaceholder: "votre@email.com",
		},
		success: {
			title: "Vous êtes sur la liste !",
			subtitle: "Nous vous contacterons dès que votre accès sera disponible.",
		},
	},
};

export default function WaitlistPage() {
	const params = useParams();
	const locale = params?.locale as string;
	const isFR = locale === "fr";

	return (
		<div className="flex min-h-screen items-center justify-center bg-background px-4">
			<div className="w-full max-w-md">
				<Waitlist
					{...(isFR ? { localization: frLocalization } : {})}
					appearance={{
						variables: {
							colorPrimary: "oklch(0.72 0.16 75)",
							colorBackground: "oklch(0.13 0.02 240)",
							colorForeground: "oklch(0.97 0.01 240)",
							colorMutedForeground: "oklch(0.65 0.03 240)",
							colorInput: "oklch(0.18 0.02 240)",
							colorInputForeground: "oklch(0.97 0.01 240)",
							borderRadius: "8px",
							fontFamily: "Instrument Sans, system-ui, sans-serif",
						},
						elements: {
							card: "shadow-lg border border-[oklch(0.25_0.03_240)]",
							formButtonPrimary:
								"bg-[oklch(0.72_0.16_75)] hover:bg-[oklch(0.65_0.16_75)] text-white",
						},
					}}
				/>
			</div>
		</div>
	);
}
