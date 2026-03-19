import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
	return (
		<div className="flex flex-col gap-6 p-4 md:p-6">
			{/* Page header */}
			<div className="flex flex-col gap-2">
				<Skeleton className="h-8 w-40" />
				<Skeleton className="h-4 w-56" />
			</div>

			{/* Toolbar */}
			<div className="flex items-center justify-between">
				<Skeleton className="h-9 w-64" />
				<Skeleton className="h-9 w-28" />
			</div>

			{/* Table */}
			<div className="rounded-xl border border-border bg-card overflow-hidden">
				<div className="border-b border-border px-4 py-3 flex gap-4">
					{Array.from({ length: 4 }).map((_, i) => (
						<Skeleton key={i} className="h-4 w-24" />
					))}
				</div>
				{Array.from({ length: 6 }).map((_, i) => (
					<div
						key={i}
						className="px-4 py-4 flex gap-4 border-b border-border last:border-0"
					>
						{Array.from({ length: 4 }).map((_, j) => (
							<Skeleton key={j} className="h-4 w-24" />
						))}
					</div>
				))}
			</div>
		</div>
	);
}
