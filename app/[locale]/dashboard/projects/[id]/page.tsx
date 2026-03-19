import { ProjectDetail } from "@/components/dashboard/projects/ProjectDetail";

export default function ProjectDetailPage({
	params,
}: {
	params: { id: string };
}) {
	return (
		<div className="container mx-auto px-4 md:px-6 py-6 md:py-10">
			<ProjectDetail projectId={params.id} />
		</div>
	);
}
