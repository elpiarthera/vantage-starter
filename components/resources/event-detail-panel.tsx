"use client";

import { motion } from "framer-motion";
import { Calendar, Clock, MapPin, Share2, Ticket, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface EventDetailPanelProps {
	event: {
		id: string;
		name: string;
		image: string;
		venue: string;
		date: string;
		price: string;
		tags: string[];
		vibe: string;
		description?: string;
		venueAddress?: string;
	};
	onClose: () => void;
	onBookTickets?: (eventId: string) => void;
}

export function EventDetailPanel({
	event,
	onClose,
	onBookTickets,
}: EventDetailPanelProps) {
	return (
		<>
			{/* Backdrop */}
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				onClick={onClose}
				className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
			/>

			{/* Panel */}
			<motion.div
				initial={{ opacity: 0, x: 50 }}
				animate={{ opacity: 1, x: 0 }}
				exit={{ opacity: 0, x: 50 }}
				transition={{ type: "spring", stiffness: 300, damping: 30 }}
				className="fixed inset-y-0 right-0 w-full md:w-[500px] bg-background border-l border-border overflow-y-auto z-50"
			>
				{/* Event Image with Close Button Overlay */}
				<div className="relative w-full h-64 overflow-hidden bg-muted">
					<img
						src={event.image || "/placeholder.svg"}
						alt={event.name}
						className="w-full h-full object-cover object-top"
					/>
					{/* Close Button Overlay */}
					<Button
						variant="ghost"
						size="icon"
						onClick={onClose}
						className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm hover:bg-background/90"
					>
						<X className="w-5 h-5" />
					</Button>
				</div>

				{/* Event Details */}
				<div className="p-6 space-y-6">
					{/* Title */}
					<div>
						<h2 className="text-2xl font-semibold mb-2">{event.name}</h2>
						{/* Price Display */}
						<div className="text-lg font-semibold text-primary mb-3">
							{event.price}
						</div>
						<div className="flex flex-wrap gap-2 mb-4">
							{event.tags.map((tag) => (
								<Badge key={tag} variant="secondary">
									{tag}
								</Badge>
							))}
						</div>
					</div>

					{/* Venue Info */}
					<div className="space-y-3">
						<div className="flex items-start gap-3">
							<MapPin className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
							<div>
								<p className="font-medium">{event.venue}</p>
								{event.venueAddress && (
									<p className="text-sm text-muted-foreground">
										{event.venueAddress}
									</p>
								)}
							</div>
						</div>

						<div className="flex items-center gap-3">
							<Clock className="w-5 h-5 text-muted-foreground flex-shrink-0" />
							<p className="text-sm">{event.date}</p>
						</div>
					</div>

					{/* Vibe/Description */}
					<div>
						<h3 className="font-medium mb-2">Atmosphere</h3>
						<p className="text-sm text-muted-foreground italic">{event.vibe}</p>
						{event.description && (
							<p className="text-sm text-muted-foreground mt-2">
								{event.description}
							</p>
						)}
					</div>

					{/* Action Buttons */}
					<div className="space-y-3 pt-4">
						<Button
							size="lg"
							className="w-full gap-2"
							onClick={() => onBookTickets?.(event.id)}
						>
							<Ticket className="w-5 h-5" />
							Book Tickets
						</Button>

						<div className="grid grid-cols-2 gap-3">
							<Button variant="outline" className="gap-2 bg-transparent">
								<Calendar className="w-4 h-4" />
								Add to Calendar
							</Button>
							<Button variant="outline" className="gap-2 bg-transparent">
								<Share2 className="w-4 h-4" />
								Share
							</Button>
						</div>
					</div>
				</div>
			</motion.div>
		</>
	);
}
