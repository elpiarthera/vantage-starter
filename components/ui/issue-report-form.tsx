/**
 * Adapted from mcpcn (https://www.mcpcn.dev) — MIT License.
 * The upstream source ships no license header of its own; this attribution
 * notice is added here per this repo's licensing policy, it is not a
 * preserved original notice.
 *
 * Ported for VantageStarter: upstream hardcodes every field label
 * ("Name", "Email", "Team", "Impact & Urgency", "Submit", ...) as literal
 * JSX text — that fails this repo's i18n rule (`AGENTS.md`: "i18n
 * mandatory, never hardcode strings"). A `labels` prop was added, mirroring
 * the pattern already used for `components/ui/contact-form.tsx`'s `labels`
 * object: every visible string the block renders comes from this prop, with
 * English defaults so the block still works if a consumer skips it, and the
 * wiring in `components/report/IssueReportFormSection.tsx` supplies the
 * next-intl translated set. All colors already resolve to this repo's
 * OKLCH tokens (`bg-card`, `text-foreground`, `text-muted-foreground`,
 * `bg-muted`, `border-border`, `bg-background`, `bg-primary`,
 * `text-primary-foreground`), so no color remapping was needed.
 *
 * Wired into `app/[locale]/report/page.tsx` (Batch 4,
 * docs/mcpcn-block-mapping.md §4 "issue-report-form"). Replaces the current
 * process — a client messaging Laurent, who manually creates a task — with
 * a public form that files the report directly.
 */
"use client";

import { ChevronDown, ChevronUp, Paperclip, Send, X } from "lucide-react";
import type { ReactNode } from "react";
import { createContext, useContext, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

export interface IssueReportFormLabels {
	title: string;
	name: string;
	namePlaceholder: string;
	email: string;
	emailPlaceholder: string;
	category: string;
	categoryPlaceholder: string;
	subcategory: string;
	subcategoryPlaceholder: string;
	subcategoryPlaceholderDisabled: string;
	issueTitle: string;
	issueTitlePlaceholder: string;
	description: string;
	descriptionPlaceholder: string;
	impactUrgencySection: string;
	urgency: string;
	urgencyPlaceholder: string;
	submit: string;
	submitting: string;
	attach: string;
	removeAttachment: string;
}

export interface IssueReportFormProps {
	children?: ReactNode;
	labels?: IssueReportFormLabels;
	data?: {
		/** Category to subcategory mapping. */
		categories?: Record<string, string[]>;
		/** Urgency level options — `value` MUST match a key in
		 * `lib/issue-report/mapping.ts`'s `URGENCY_TO_PRIORITY`. */
		urgencies?: { value: string; label: string }[];
	};
	actions?: {
		/** Called when the form is submitted. */
		onSubmit?: (formData: IssueFormData) => void;
	};
	appearance?: {
		/**
		 * Whether to display the title.
		 * @default true
		 */
		showTitle?: boolean;
		/** Whether a submission is in flight — disables the submit button. */
		isSubmitting?: boolean;
	};
}

/**
 * Data structure representing an issue report submission — trimmed to
 * exactly the fields this bullet's TDD assertion and Convex action need
 * (category, urgency, and the report content). Upstream's fuller shape
 * (team/location/office/workstation/frequency/attemptedActions) is declared
 * out of scope here: `docs/mcpcn-block-mapping.md` §4 "issue-report-form"
 * names category, urgency, and attachments as the fields that matter for
 * this delivery's committed job (triaged task creation), not a full IT
 * helpdesk ticket shape.
 */
export interface IssueFormData {
	name?: string;
	email?: string;
	category?: string;
	subcategory?: string;
	issueTitle?: string;
	description?: string;
	urgency?: string;
	attachments?: File[];
}

const DEFAULT_ISSUE_FORM = {
	categories: {
		Access: ["Account", "Permissions", "Password Reset"],
		Hardware: ["Computer", "Monitor", "Keyboard", "Mouse", "Printer"],
		Network: ["Wi-Fi", "Ethernet", "VPN Access"],
		Software: ["Business App", "Email", "VPN", "Browser", "OS"],
	},
	urgencies: [
		{ label: "Immediate", value: "immediate" },
		{ label: "Today", value: "today" },
		{ label: "This week", value: "this-week" },
		{ label: "No rush", value: "no-rush" },
	],
} satisfies NonNullable<IssueReportFormProps["data"]>;

const DEFAULT_LABELS: IssueReportFormLabels = {
	title: "Report an Issue",
	name: "Name",
	namePlaceholder: "Your name",
	email: "Email",
	emailPlaceholder: "your@email.com",
	category: "Category",
	categoryPlaceholder: "Select",
	subcategory: "Subcategory",
	subcategoryPlaceholder: "Select",
	subcategoryPlaceholderDisabled: "Pick a category",
	issueTitle: "Issue Title",
	issueTitlePlaceholder: "Summarize your issue in a few words",
	description: "Description",
	descriptionPlaceholder: "Describe the issue in detail...",
	impactUrgencySection: "Urgency",
	urgency: "Urgency",
	urgencyPlaceholder: "Urgency",
	submit: "Submit",
	submitting: "Submitting...",
	attach: "Attach a file",
	removeAttachment: "Remove attachment",
};

const IssueReportFormContext = createContext<IssueReportFormProps | null>(null);

export const useIssueReportForm = () => {
	const context = useContext(IssueReportFormContext);
	if (!context) {
		throw new Error(
			"IssueReportForm components must be used within IssueReportForm",
		);
	}
	return context;
};

const SectionChevron = ({ open }: { open: boolean }) =>
	open ? (
		<ChevronUp className="size-4 text-muted-foreground" />
	) : (
		<ChevronDown className="size-4 text-muted-foreground" />
	);

interface IssueAttachmentsProps {
	files: File[];
	onRemove: (index: number) => void;
	removeLabel: string;
}

const IssueAttachments = ({
	files,
	onRemove,
	removeLabel,
}: IssueAttachmentsProps) => {
	if (files.length === 0) {
		return null;
	}
	return (
		<div className="mb-2 flex flex-wrap gap-1.5">
			{files.map((file, index) => (
				<div
					key={`${file.name}-${file.lastModified}-${file.size}`}
					className="flex items-center gap-1 rounded bg-muted px-2 py-1 text-xs"
				>
					<Paperclip className="size-3" />
					<span className="max-w-[100px] truncate">{file.name}</span>
					<button
						type="button"
						onClick={() => onRemove(index)}
						aria-label={removeLabel}
						className="text-muted-foreground hover:text-foreground"
					>
						<X className="size-3" />
					</button>
				</div>
			))}
		</div>
	);
};

const IssueReportFormView = ({
	data,
	actions,
	appearance,
	labels: labelsProp,
}: IssueReportFormProps) => {
	const labels = labelsProp ?? DEFAULT_LABELS;
	const resolved: NonNullable<IssueReportFormProps["data"]> =
		data ?? DEFAULT_ISSUE_FORM;
	const categories = resolved.categories ?? {};
	const urgencies = resolved.urgencies ?? [];
	const { onSubmit } = actions ?? {};
	const { showTitle = true, isSubmitting = false } = appearance ?? {};

	const [formData, setFormData] = useState<IssueFormData>({
		attachments: [],
		category: "",
		description: "",
		email: "",
		issueTitle: "",
		name: "",
		subcategory: "",
		urgency: "",
	});

	const fileInputRef = useRef<HTMLInputElement>(null);

	const subcategories = formData.category
		? (categories[formData.category] ?? [])
		: [];

	const updateField = <K extends keyof IssueFormData>(
		field: K,
		value: IssueFormData[K],
	) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const handleCategoryChange = (value: string | null) => {
		setFormData((prev) => ({
			...prev,
			category: value ?? "",
			subcategory: "",
		}));
	};

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = [...(e.target.files || [])];
		setFormData((prev) => ({
			...prev,
			attachments: [...(prev.attachments ?? []), ...files],
		}));
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	const removeFile = (index: number) => {
		setFormData((prev) => ({
			...prev,
			attachments: (prev.attachments ?? []).filter((_, i) => i !== index),
		}));
	};

	const handleSubmit = () => {
		onSubmit?.(formData);
	};

	return (
		<div className="w-full rounded-xl bg-card p-4">
			{showTitle && (
				<div className="mb-4 flex items-center gap-2">
					<h2 className="font-semibold text-foreground text-lg">
						{labels.title}
					</h2>
				</div>
			)}

			<div className="space-y-3">
				<div className="grid grid-cols-2 gap-2">
					<div>
						<Label
							htmlFor="issue-report-name"
							className="mb-1 block text-muted-foreground text-xs"
						>
							{labels.name}
						</Label>
						<Input
							id="issue-report-name"
							placeholder={labels.namePlaceholder}
							value={formData.name}
							onChange={(e) => updateField("name", e.target.value)}
							className="h-9 text-sm"
						/>
					</div>
					<div>
						<Label
							htmlFor="issue-report-email"
							className="mb-1 block text-muted-foreground text-xs"
						>
							{labels.email}
						</Label>
						<Input
							id="issue-report-email"
							type="email"
							placeholder={labels.emailPlaceholder}
							value={formData.email}
							onChange={(e) => updateField("email", e.target.value)}
							className="h-9 text-sm"
						/>
					</div>
				</div>

				<div className="grid grid-cols-2 gap-2">
					<div className="min-w-0">
						<Label className="mb-1 block text-muted-foreground text-xs">
							{labels.category}
						</Label>
						<Select
							value={formData.category}
							onValueChange={handleCategoryChange}
						>
							<SelectTrigger
								aria-label={labels.category}
								className="h-9 w-full text-sm"
							>
								<SelectValue placeholder={labels.categoryPlaceholder} />
							</SelectTrigger>
							<SelectContent>
								{Object.keys(categories).map((cat) => (
									<SelectItem key={cat} value={cat}>
										{cat}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="min-w-0">
						<Label className="mb-1 block text-muted-foreground text-xs">
							{labels.subcategory}
						</Label>
						<Select
							value={formData.subcategory}
							onValueChange={(v) => updateField("subcategory", v ?? "")}
							disabled={!formData.category}
						>
							<SelectTrigger
								aria-label={labels.subcategory}
								className="h-9 w-full text-sm"
							>
								<SelectValue
									placeholder={
										formData.category
											? labels.subcategoryPlaceholder
											: labels.subcategoryPlaceholderDisabled
									}
								/>
							</SelectTrigger>
							<SelectContent>
								{subcategories.map((sub) => (
									<SelectItem key={sub} value={sub}>
										{sub}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>

				<div>
					<Label
						htmlFor="issue-report-title"
						className="mb-1 block text-muted-foreground text-xs"
					>
						{labels.issueTitle}
					</Label>
					<Input
						id="issue-report-title"
						placeholder={labels.issueTitlePlaceholder}
						value={formData.issueTitle}
						onChange={(e) => updateField("issueTitle", e.target.value)}
						className="h-9 text-sm"
					/>
				</div>

				<div>
					<Label
						htmlFor="issue-report-description"
						className="mb-1 block text-muted-foreground text-xs"
					>
						{labels.description}
					</Label>
					<textarea
						id="issue-report-description"
						placeholder={labels.descriptionPlaceholder}
						value={formData.description}
						onChange={(e) => updateField("description", e.target.value)}
						className="min-h-[80px] w-full resize-none rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
					/>
				</div>

				<div className="overflow-hidden rounded-lg border">
					<div className="flex w-full items-center justify-between bg-muted/50 px-3 py-2 font-medium text-foreground text-sm">
						<span>{labels.impactUrgencySection}</span>
						<SectionChevron open={true} />
					</div>
					<div className="p-3">
						<div className="min-w-0">
							<Label className="mb-1 block text-muted-foreground text-xs">
								{labels.urgency}
							</Label>
							<Select
								value={formData.urgency}
								onValueChange={(v) => updateField("urgency", v ?? "")}
							>
								<SelectTrigger
									aria-label={labels.urgency}
									className="h-9 w-full text-sm"
								>
									<SelectValue placeholder={labels.urgencyPlaceholder} />
								</SelectTrigger>
								<SelectContent>
									{urgencies.map((urg) => (
										<SelectItem key={urg.value} value={urg.value}>
											{urg.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
				</div>

				<div>
					<input
						ref={fileInputRef}
						type="file"
						multiple
						onChange={handleFileSelect}
						className="hidden"
					/>
					<IssueAttachments
						files={formData.attachments ?? []}
						onRemove={removeFile}
						removeLabel={labels.removeAttachment}
					/>
				</div>

				<div
					className="flex flex-col gap-2 pt-2 sm:flex-row sm:items-center sm:justify-between"
					data-apps-sdk-actions=""
				>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={() => fileInputRef.current?.click()}
						className="h-9 w-full sm:w-auto"
					>
						<Paperclip className="mr-1.5 size-4" />
						{labels.attach}
					</Button>
					<Button
						type="button"
						onClick={handleSubmit}
						disabled={isSubmitting}
						size="sm"
						className="h-9 w-full sm:w-auto"
					>
						<Send className="mr-1.5 size-4" />
						{isSubmitting ? labels.submitting : labels.submit}
					</Button>
				</div>
			</div>
		</div>
	);
};

export const IssueReportFormContent = (props: IssueReportFormProps) => {
	const context = useIssueReportForm();
	return <IssueReportFormView {...context} {...props} />;
};

const IssueReportFormRoot = ({
	children,
	...props
}: IssueReportFormProps & { children: React.ReactNode }) => (
	<IssueReportFormContext.Provider value={props}>
		{children}
	</IssueReportFormContext.Provider>
);

export const IssueReportForm = IssueReportFormRoot;
