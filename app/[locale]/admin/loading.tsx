import { Skeleton } from "@/components/ui/skeleton";

const HEADER_COLUMN_IDS = [
	"header-col-1",
	"header-col-2",
	"header-col-3",
	"header-col-4",
];
const ROW_IDS = ["row-1", "row-2", "row-3", "row-4", "row-5", "row-6"];
const ROW_CELL_IDS = ["cell-1", "cell-2", "cell-3", "cell-4"];

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
					{HEADER_COLUMN_IDS.map((id) => (
						<Skeleton key={id} className="h-4 w-24" />
					))}
				</div>
				{ROW_IDS.map((rowId) => (
					<div
						key={rowId}
						className="px-4 py-4 flex gap-4 border-b border-border last:border-0"
					>
						{ROW_CELL_IDS.map((cellId) => (
							<Skeleton key={`${rowId}-${cellId}`} className="h-4 w-24" />
						))}
					</div>
				))}
			</div>
		</div>
	);
}
