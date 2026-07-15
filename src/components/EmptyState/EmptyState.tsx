import { PackageX } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
	title?: string;
	description?: string;
	itemName?: string;
	action?: {
		label: string;
		onClick: () => void;
	};
}

export function EmptyState({
	title = "No items found",
	description,
	itemName,
	action,
}: EmptyStateProps) {
	return (
		<div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-card-outline/80 bg-card/20 px-6 py-16 text-center">
			<PackageX className="mb-4 h-12 w-12 text-muted-foreground/50" />
			<h3 className="font-orbitron text-lg text-foreground/80">
				{itemName ? `No ${itemName} found` : title}
			</h3>
			{description && (
				<p className="mt-1 max-w-sm text-sm text-muted-foreground">
					{description}
				</p>
			)}
			{action && (
				<Button type="button" onClick={action.onClick} className="mt-4">
					{action.label}
				</Button>
			)}
		</div>
	);
}
