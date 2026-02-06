export interface ColumnDef<T> {
  header: string;
  field: string;
  sortable?: boolean;
  cell: (row: T) => React.ReactNode;
  className?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  isLoading: boolean;
  totalCount: number;
  pagination: {
    pageIndex: number;
    pageSize: number;
  };
  onPaginationChange: (pagination: {
    pageIndex: number;
    pageSize: number;
  }) => void;
  sorting?: {
    field: string;
    direction: "asc" | "desc";
  };
  onSort?: (field: string) => void;
  emptyMessage?: string;
  itemName?: string; // "players", "teams", etc. for summary text
  debugInfo?: Record<string, unknown>;
  actions?: {
    canEdit: boolean;
    canDelete: boolean;
    onEdit?: (item: T) => void;
    onDelete?: (item: T) => void;
  };
}
