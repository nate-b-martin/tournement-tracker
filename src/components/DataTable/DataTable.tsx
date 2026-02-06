import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PaginationControls } from "../PaginationControls";
import type { ColumnDef, DataTableProps } from "./types";
function SortIndicator({
  field,
  currentSort,
}: {
  field: string;
  currentSort?: { field: string; direction: "asc" | "desc" };
}) {
  if (currentSort?.field !== field) return null;
  return (
    <span className="ml-1">{currentSort.direction === "asc" ? "▲" : "▼"}</span>
  );
}
export function DataTable<T extends { _id: string }>({
  data,
  columns,
  isLoading,
  totalCount,
  pagination,
  onPaginationChange,
  sorting,
  onSort,
  emptyMessage = "No items found",
  itemName,
  debugInfo,
  actions,
}: DataTableProps<T>) {
  const currentPage = pagination.pageIndex;
  const pageSize = pagination.pageSize;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const startIndex = totalCount === 0 ? 0 : currentPage * pageSize + 1;
  const endIndex = Math.min((currentPage + 1) * pageSize, totalCount);
  const hasNextPage = (currentPage + 1) * pageSize < totalCount;
  const hasPreviousPage = currentPage > 0;
  const handleHeaderClick = (column: ColumnDef<T>) => {
    if (!column.sortable || !onSort) return;
    onSort(column.field);
  };
  // Add actions column if enabled
  const allColumns =
    actions?.canEdit || actions?.canDelete
      ? [
          ...columns,
          {
            header: "Actions",
            field: "actions",
            sortable: false,
            cell: (item: T) => (
              <div className="flex gap-2">
                {actions.canEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => actions.onEdit?.(item)}
                  >
                    Edit
                  </Button>
                )}
                {actions.canDelete && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => actions.onDelete?.(item)}
                  >
                    Delete
                  </Button>
                )}
              </div>
            ),
          } as ColumnDef<T>,
        ]
      : columns;
  if (isLoading) {
    return <div className="p-4">Loading {itemName}...</div>;
  }
  return (
    <div className="container grid space-y-4 mt-3 max-h-1/2">
      {/* Summary */}
      <div className="text-sm text-gray-600 mb-4">
        <span>
          Showing {startIndex}—{endIndex} of {totalCount} {itemName}
        </span>
        {totalPages > 1 && (
          <span className="ml-4 text-gray-500">
            (Page {currentPage + 1} of {totalPages})
          </span>
        )}
      </div>
      {/* Table */}
      <div className="rounded-md border max-h-full overflow-y-auto">
        <Table className="text-table-default">
          <TableHeader>
            <TableRow>
              {allColumns.map((column) => (
                <TableHead
                  key={column.field}
                  className={`${column.sortable ? "cursor-pointer hover:bg-gray-50" : ""} ${column.className || ""}`}
                  onClick={() => handleHeaderClick(column)}
                >
                  <div className="flex items-center">
                    {column.header}
                    {column.sortable && (
                      <SortIndicator
                        field={column.field}
                        currentSort={sorting}
                      />
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow key={item._id}>
                {allColumns.map((column) => (
                  <TableCell
                    key={`${item._id}-${column.field}`}
                    className={column.className}
                  >
                    {column.cell(item)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalCount={totalCount}
        hasNextPage={hasNextPage}
        hasPreviousPage={hasPreviousPage}
        onPageChange={(page) =>
          onPaginationChange({ pageIndex: page, pageSize })
        }
        onPageSizeChange={(size) =>
          onPaginationChange({ pageIndex: 0, pageSize: size })
        }
      />
      {/* Empty state */}
      {data.length === 0 && (
        <div className="text-center py-8 text-gray-500">{emptyMessage}</div>
      )}
      {/* Debug info */}
      {debugInfo && (
        <div className="text-xs text-gray-500 mt-4 p-2 bg-gray-50 rounded">
          <div>Debug info:</div>
          {Object.entries(debugInfo).map(([key, value]) => (
            <div key={key}>
              {key}:{" "}
              {typeof value === "object"
                ? JSON.stringify(value)
                : String(value)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
