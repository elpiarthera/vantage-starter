/**
 * SkipLink — WCAG 2.1 AA bypass block (criterion 2.4.1)
 *
 * Usage: place as the very first child of <body>.
 * The main content area must have id="main-content".
 *
 * Visually hidden until focused (keyboard users only).
 * Becomes visible on focus via the :focus-visible styles below.
 *
 * Server component: the label is resolved by the (server) layout via
 * `getTranslations` and passed as a prop. `useTranslations` cannot run here
 * because this component is rendered before `NextIntlClientProvider` mounts
 * (it must stay the very first DOM child of <body> per WCAG 2.4.1), so no
 * client i18n context is available at this position in the tree.
 */

type SkipLinkProps = {
	label: string;
};

export function SkipLink({ label }: SkipLinkProps) {
	return (
		<a
			href="#main-content"
			className="
        sr-only focus-visible:not-sr-only
        focus-visible:fixed focus-visible:top-4 focus-visible:left-4
        focus-visible:z-[9999]
        focus-visible:inline-flex focus-visible:items-center
        focus-visible:px-4 focus-visible:py-2
        focus-visible:rounded-lg
        focus-visible:bg-primary focus-visible:text-primary-foreground
        focus-visible:text-sm focus-visible:font-medium
        focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
        focus-visible:shadow-lg
        transition-none
      "
		>
			{label}
		</a>
	);
}
