import { Button } from "./ui/button";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export const PaginationControls = ({
  currentPage,
  totalPages,
  pageSize,
  totalCount,
  hasNextPage,
  hasPreviousPage,
  onPageChange,
  onPageSizeChange,
}: PaginationControlsProps) => {
  // const handlePageChange = (newPageIndex: number) => {
  //   onPageChange(newPageIndex);
  // };

  return (
    <div className="flex items-center justify-between px-2 py-4">
      {/* Page size selector*/}
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-700">Show</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
        </select>
        <span className="text-sm text-gray-700">per page</span>
      </div>
      {/* Page Navigation*/}
      <div className="flex items-center space-x-2">
        <Button
          onClick={() => onPageChange(0)}
          disabled={!hasPreviousPage}
          className="px-3 py-1 border rounded text-sm disabled:opacity-50"
        >
          First
        </Button>
        <Button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!hasPreviousPage}
          className="px-3 py-1 border rounded text-sm disabled:opacity-50"
        >
          Previous
        </Button>
        <span className="text-sm text-gray-700">
          Page {currentPage + 1} of {totalPages}
        </span>
        <Button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!hasNextPage}
          className="px-3 py-1 border rounded text-sm disabled:opacity-50"
        >
          Next
        </Button>
        <Button
          onClick={() => onPageChange(totalPages - 1)}
          disabled={!hasNextPage}
          className="px-3 py-1 border rounded text-sm disabled:opacity-50"
        >
          Last
        </Button>
      </div>
    </div>
  );
};
