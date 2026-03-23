// ActionsCell.tsx
import { Button } from "@/components/ui/button";

interface ActionsCellProps<T> {
	item: T;
	canEdit?: boolean;
	canDelete?: boolean;
	onEdit?: (item: T) => void;
	onDelete?: (item: T) => void;
}

export function ActionsCell<T>({
	item,
	canEdit,
	canDelete,
	onEdit,
	onDelete,
}: ActionsCellProps<T>) {
	return (
		<div className="flex items-center gap-2">
			{canEdit && (
				<Button
					type="button"
					variant="outline"
					size="sm"
					className="min-w-16 rounded-md"
					onClick={() => onEdit?.(item)}
				>
					Edit
				</Button>
			)}
			{canDelete && (
				<Button
					type="button"
					variant="outline"
					size="sm"
					className="min-w-16 rounded-md"
					onClick={() => onDelete?.(item)}
				>
					Delete
				</Button>
			)}
		</div>
	);
}
