import { TemplateDetail } from "@/components/dashboard/templates/TemplateDetail";

export default function TemplateDetailPage({
	params,
}: {
	params: { id: string };
}) {
	return (
		<div className="container mx-auto px-4 md:px-6 py-6 md:py-10">
			<TemplateDetail templateId={params.id} />
		</div>
	);
}
