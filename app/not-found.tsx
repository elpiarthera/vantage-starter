import Link from "next/link";

export default function NotFound() {
	return (
		<html lang="en">
			<body className="min-h-screen bg-[#101a23] flex items-center justify-center">
				<div className="text-center">
					<h1 className="text-4xl font-bold text-white mb-4">404</h1>
					<p className="text-gray-400 mb-8">Page not found</p>
					<Link
						href="/"
						className="bg-[#0d7ff2] text-white px-6 py-3 rounded-md hover:bg-[#0b6dd1]"
					>
						Go Home
					</Link>
				</div>
			</body>
		</html>
	);
}
