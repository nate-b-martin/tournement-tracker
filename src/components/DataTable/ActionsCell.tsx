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
    <div className="flex gap-2">
      {canEdit && (
        <Button variant="outline" size="sm" onClick={() => onEdit?.(item)}>
          Edit
        </Button>
      )}
      {canDelete && (
        <Button variant="outline" size="sm" onClick={() => onDelete?.(item)}>
          Delete
        </Button>
      )}
    </div>
  );
}
