import { NuqsAdapter } from "nuqs/adapters/next/app";

export default function DesignLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <NuqsAdapter>{children}</NuqsAdapter>;
}
