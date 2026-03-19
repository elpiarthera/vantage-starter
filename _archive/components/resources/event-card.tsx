"use client";

import { motion } from "framer-motion";
import { Eye } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface EventCardProps {
	event: {
		id: string;
		name: string;
		image: string;
		venue: string;
		date: string;
		price: string;
		tags: string[];
		vibe: string;
	};
	onViewDetails: (eventId: string) => void;
}

export function EventCard({ event, onViewDetails }: EventCardProps) {
	const [isHovered, setIsHovered] = useState(false);

	return (
		<motion.div
			className="group relative overflow-hidden rounded-lg bg-card border border-border cursor-pointer"
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			whileHover={{ y: -4 }}
			transition={{ duration: 0.2 }}
		>
			{/* Event Image */}
			<div className="relative aspect-video overflow-hidden">
				<img
					src={event.image || "/placeholder.svg"}
					alt={event.name}
					className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
				/>

				{/* Hover Overlay with Eye Icon */}
				<motion.div
					initial={false}
					animate={{
						opacity: isHovered ? 1 : 0,
						y: isHovered ? 0 : 8,
					}}
					transition={{ duration: 0.2, ease: "easeOut" }}
					className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[2px]"
				>
					<Button
						size="lg"
						variant="ghost"
						onClick={() => onViewDetails(event.id)}
						className="h-12 w-12 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-xl text-white border border-white/10"
					>
						<Eye className="w-6 h-6" />
					</Button>
				</motion.div>
			</div>

			{/* Event Details */}
			<div className="p-4">
				<h3 className="font-semibold text-lg mb-1 line-clamp-1">
					{event.name}
				</h3>
				<p className="text-sm text-muted-foreground mb-2">{event.venue}</p>
				<p className="text-sm text-muted-foreground mb-3">{event.date}</p>

				{/* Tags */}
				<div className="flex flex-wrap gap-2 mb-3">
					{event.tags.map((tag) => (
						<Badge key={tag} variant="secondary" className="text-xs">
							{tag}
						</Badge>
					))}
				</div>

				{/* Vibe */}
				<p className="text-sm text-muted-foreground italic">{event.vibe}</p>
			</div>
		</motion.div>
	);
}
