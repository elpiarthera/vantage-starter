"use client";

import { useAction } from "convex/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import {
	type IssueFormData,
	IssueReportForm,
	IssueReportFormContent,
	type IssueReportFormLabels,
} from "@/components/ui/issue-report-form";
import { api } from "@/convex/_generated/api";
import { isValidEmail } from "@/lib/validation/email";

/**
 * Client wiring for the public `/report` page (Batch 4,
 * docs/mcpcn-block-mapping.md §4 "issue-report-form"). The presentational
 * block lives in `components/ui/issue-report-form.tsx`; this component owns
 * validation, translated labels, and the Convex action call.
 *
 * The mapping from urgency -> priority and category -> assignee is NOT
 * duplicated here — `convex/issueReports.ts` derives both from
 * `lib/issue-report/mapping.ts` server-side. This component only forwards
 * the raw `urgency`/`category` string the form collected.
 */
export function IssueReportFormSection() {
	const t = useTranslations("report");
	const submitReport = useAction(api.issueReports.submit);
	const [status, setStatus] = useState<
		"idle" | "sending" | "sent" | "not_configured" | "error"
	>("idle");
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const labels: IssueReportFormLabels = {
		attach: t("attach"),
		category: t("category"),
		categoryPlaceholder: t("category_placeholder"),
		description: t("description"),
		descriptionPlaceholder: t("description_placeholder"),
		email: t("email"),
		emailPlaceholder: t("email_placeholder"),
		impactUrgencySection: t("urgency_section"),
		issueTitle: t("issue_title"),
		issueTitlePlaceholder: t("issue_title_placeholder"),
		name: t("name"),
		namePlaceholder: t("name_placeholder"),
		removeAttachment: t("remove_attachment"),
		submit: t("submit"),
		submitting: t("submitting"),
		subcategory: t("subcategory"),
		subcategoryPlaceholder: t("subcategory_placeholder"),
		subcategoryPlaceholderDisabled: t("subcategory_placeholder_disabled"),
		title: t("title"),
		urgency: t("urgency"),
		urgencyPlaceholder: t("urgency_placeholder"),
	};

	// Urgency labels are translated; urgency VALUES stay the literal
	// "immediate" | "today" | "this-week" | "no-rush" tokens — the same
	// tokens `lib/issue-report/mapping.ts`'s `URGENCY_TO_PRIORITY` keys on,
	// so translating the value itself would break the declared mapping.
	// Category keys are intentionally left untranslated for the same
	// reason: they are the literal keys `CATEGORY_TO_ASSIGNEE` looks up.
	const urgencies = [
		{ label: t("urgency_immediate"), value: "immediate" },
		{ label: t("urgency_today"), value: "today" },
		{ label: t("urgency_this_week"), value: "this-week" },
		{ label: t("urgency_no_rush"), value: "no-rush" },
	];

	const handleSubmit = async (values: IssueFormData) => {
		setErrorMessage(null);

		if (!values.email || !isValidEmail(values.email)) {
			setStatus("error");
			setErrorMessage(t("error_invalid_email"));
			return;
		}
		if (!values.category || !values.urgency) {
			setStatus("error");
			setErrorMessage(t("error_missing_fields"));
			return;
		}

		setStatus("sending");
		try {
			const result = await submitReport({
				name: values.name ?? "",
				email: values.email,
				category: values.category,
				subcategory: values.subcategory || undefined,
				issueTitle: values.issueTitle ?? "",
				description: values.description ?? "",
				urgency: values.urgency,
			});
			setStatus(result.delivered ? "sent" : "not_configured");
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

	if (status === "not_configured") {
		return (
			<div className="w-full max-w-xl rounded-xl bg-card p-8 text-center">
				<h2 className="font-semibold text-foreground text-xl">
					{t("not_configured_title")}
				</h2>
				<p className="mt-2 text-muted-foreground text-sm">
					{t("not_configured_description")}
				</p>
			</div>
		);
	}

	return (
		<div className="w-full max-w-xl">
			<IssueReportForm
				labels={labels}
				data={{ urgencies }}
				actions={{ onSubmit: handleSubmit }}
				appearance={{ isSubmitting: status === "sending" }}
			>
				<IssueReportFormContent />
			</IssueReportForm>
			{errorMessage ? (
				<p role="alert" className="mt-2 text-destructive text-sm">
					{errorMessage}
				</p>
			) : null}
		</div>
	);
}
