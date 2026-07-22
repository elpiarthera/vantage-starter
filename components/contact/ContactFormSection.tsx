"use client";

import { useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import {
	ContactForm,
	ContactFormActions,
	ContactFormContactFields,
	ContactFormContent,
	type ContactFormData,
	ContactFormHeader,
	ContactFormMessageField,
	ContactFormNameFields,
} from "@/components/ui/contact-form";
import { api } from "@/convex/_generated/api";
import { isValidEmail } from "@/lib/validation/email";

/**
 * Client wiring for the public `/contact` page (Batch 4,
 * docs/mcpcn-block-mapping.md §4 "contact-form"). The presentational block
 * lives in `components/ui/contact-form.tsx`; this component owns validation
 * and the Convex mutation call.
 *
 * TDD assertion this file exists to satisfy: "an invalid email is refused
 * before the mutation runs — the rejection must happen ahead of the write,
 * not be cleaned up after it." `isValidEmail` gates `onSubmit` BEFORE
 * `submitContact` (the `useMutation` handle) is ever invoked — see the
 * early `return` below.
 */
export function ContactFormSection() {
	const t = useTranslations("contact");
	const submitContact = useMutation(api.contactSubmissions.create);
	const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
		"idle",
	);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const labels = {
		attach: t("attach"),
		attachmentError: t("error_generic"),
		countrySearchPlaceholder: t("country_search_placeholder"),
		countryStatusError: t("country_status_error"),
		countryStatusLoading: t("country_status_loading"),
		countryStatusNoMatch: t("country_status_no_match"),
		description: t("description"),
		email: t("email"),
		emailPlaceholder: t("email_placeholder"),
		firstName: t("first_name"),
		firstNamePlaceholder: t("first_name_placeholder"),
		lastName: t("last_name"),
		lastNamePlaceholder: t("last_name_placeholder"),
		message: t("message"),
		messagePlaceholder: t("message_placeholder"),
		phoneNumber: t("phone_number"),
		phonePlaceholder: t("phone_placeholder"),
		removeAttachment: t("remove_attachment"),
		sending: t("sending"),
		submit: t("submit"),
		title: t("title"),
	};

	const handleSubmit = async (values: ContactFormData) => {
		setErrorMessage(null);

		// Client-side gate: an invalid email is refused HERE, before
		// `submitContact` (the mutation) is ever called.
		if (!isValidEmail(values.email)) {
			setStatus("error");
			setErrorMessage(t("error_invalid_email"));
			return;
		}

		setStatus("sending");
		try {
			await submitContact({
				firstName: values.firstName,
				lastName: values.lastName,
				email: values.email,
				phoneNumber: values.phoneNumber || undefined,
				countryCode: values.countryCode || undefined,
				message: values.message,
				attachmentName: values.attachment?.name,
			});
			setStatus("sent");
		} catch {
			setStatus("error");
			setErrorMessage(t("error_generic"));
		}
	};

	if (status === "sent") {
		return (
			<div className="w-full max-w-xl rounded-xl bg-card p-8 text-center">
				<h2 className="font-semibold text-foreground text-xl">
					{t("success_title")}
				</h2>
				<p className="mt-2 text-muted-foreground text-sm">
					{t("success_description")}
				</p>
			</div>
		);
	}

	return (
		<div className="w-full max-w-xl">
			<ContactForm
				isLoading={status === "sending"}
				labels={labels}
				onSubmit={handleSubmit}
			>
				<ContactFormHeader className="mb-4" />
				<ContactFormContent>
					<ContactFormNameFields />
					<ContactFormContactFields />
					<ContactFormMessageField />
					{errorMessage ? (
						<p role="alert" className="text-destructive text-sm">
							{errorMessage}
						</p>
					) : null}
					<ContactFormActions />
				</ContactFormContent>
			</ContactForm>
		</div>
	);
}
