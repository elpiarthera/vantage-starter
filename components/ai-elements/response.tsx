"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

const Response = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }
>(({ className, children, ...props }, ref) => {
	const content =
		typeof children === "string" ? children : String(children || "");

	return (
		<div
			ref={ref}
			className={cn(
				"text-white prose prose-invert prose-headings:text-white prose-p:text-white prose-strong:text-white prose-em:text-gray-300 prose-code:text-blue-400 prose-pre:bg-[#223649] prose-pre:text-white max-w-none",
				className,
			)}
			{...props}
		>
			<ReactMarkdown
				components={{
					p: ({ children }: { children?: React.ReactNode }) => (
						<p className="mb-4 leading-relaxed">{children}</p>
					),
					h1: ({ children }: { children?: React.ReactNode }) => (
						<h1 className="text-2xl font-bold mb-4 mt-6">{children}</h1>
					),
					h2: ({ children }: { children?: React.ReactNode }) => (
						<h2 className="text-xl font-semibold mb-3 mt-5">{children}</h2>
					),
					h3: ({ children }: { children?: React.ReactNode }) => (
						<h3 className="text-lg font-semibold mb-2 mt-4">{children}</h3>
					),
					strong: ({ children }: { children?: React.ReactNode }) => (
						<strong className="font-semibold text-white">{children}</strong>
					),
					em: ({ children }: { children?: React.ReactNode }) => (
						<em className="italic text-gray-300">{children}</em>
					),
					ul: ({ children }: { children?: React.ReactNode }) => (
						<ul className="list-disc list-inside mb-4 space-y-2">{children}</ul>
					),
					ol: ({ children }: { children?: React.ReactNode }) => (
						<ol className="list-decimal list-inside mb-4 space-y-2">
							{children}
						</ol>
					),
					li: ({ children }: { children?: React.ReactNode }) => (
						<li className="leading-relaxed">{children}</li>
					),
					hr: () => <hr className="my-6 border-[#314d68]" />,
					code: ({ children }: { children?: React.ReactNode }) => (
						<code className="bg-[#223649] px-1.5 py-0.5 rounded text-blue-400 text-sm">
							{children}
						</code>
					),
					pre: ({ children }: { children?: React.ReactNode }) => (
						<pre className="bg-[#223649] p-4 rounded-lg overflow-x-auto mb-4">
							{children}
						</pre>
					),
				}}
			>
				{content}
			</ReactMarkdown>
		</div>
	);
});
Response.displayName = "Response";

export { Response };
