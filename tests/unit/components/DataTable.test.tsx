import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DataTable } from "@/components/DataTable/DataTable";
import type { ColumnDef } from "@/components/DataTable/types";

interface TestItem {
	_id: string;
	name: string;
	status: "active" | "inactive";
}

const columns: ColumnDef<TestItem>[] = [
	{
		header: "Name",
		field: "name",
		sortable: true,
		cell: (item) => item.name,
	},
	{
		header: "Status",
		field: "status",
		sortable: false,
		cell: (item) => item.status,
	},
];

const baseData: TestItem[] = [
	{ _id: "1", name: "Alpha", status: "active" },
	{ _id: "2", name: "Beta", status: "inactive" },
];

describe("DataTable", () => {
	it("calls onSort when clicking a sortable header", () => {
		const onSort = vi.fn();

		render(
			<DataTable
				data={baseData}
				columns={columns}
				isLoading={false}
				totalCount={2}
				pagination={{ pageIndex: 0, pageSize: 10 }}
				onPaginationChange={vi.fn()}
				sorting={{ field: "name", direction: "asc" }}
				onSort={onSort}
				itemName="players"
			/>,
		);

		fireEvent.click(screen.getByText("Name"));
		expect(onSort).toHaveBeenCalledWith("name");
	});

	it("renders empty message when no rows are available", () => {
		render(
			<DataTable
				data={[]}
				columns={columns}
				isLoading={false}
				totalCount={0}
				pagination={{ pageIndex: 0, pageSize: 10 }}
				onPaginationChange={vi.fn()}
				emptyMessage="No players found"
				itemName="players"
			/>,
		);

		expect(screen.getByText("No players found")).toBeTruthy();
	});

	it("renders loading state before the table", () => {
		render(
			<DataTable
				data={baseData}
				columns={columns}
				isLoading={true}
				totalCount={2}
				pagination={{ pageIndex: 0, pageSize: 10 }}
				onPaginationChange={vi.fn()}
				itemName="players"
			/>,
		);

		expect(screen.getByText("Loading players...")).toBeTruthy();
	});

	it("wires toolbar search and chips callbacks", () => {
		const onSearchChange = vi.fn();
		const onFilterClick = vi.fn();

		render(
			<DataTable
				data={baseData}
				columns={columns}
				isLoading={false}
				totalCount={2}
				pagination={{ pageIndex: 0, pageSize: 10 }}
				onPaginationChange={vi.fn()}
				itemName="players"
				toolbar={{
					search: {
						value: "",
						onChange: onSearchChange,
						placeholder: "Search players...",
					},
					filters: [
						{ label: "Active", active: true, onClick: onFilterClick },
					],
				}}
			/>,
		);

		fireEvent.change(screen.getByPlaceholderText("Search players..."), {
			target: { value: "Alpha" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Active" }));

		expect(onSearchChange).toHaveBeenCalledWith("Alpha");
		expect(onFilterClick).toHaveBeenCalledOnce();
	});

	it("renders actions column and routes row handlers", () => {
		const onEdit = vi.fn();
		const onDelete = vi.fn();

		render(
			<DataTable
				data={baseData}
				columns={columns}
				isLoading={false}
				totalCount={2}
				pagination={{ pageIndex: 0, pageSize: 10 }}
				onPaginationChange={vi.fn()}
				itemName="players"
				actions={{
					canEdit: true,
					canDelete: true,
					onEdit,
					onDelete,
				}}
			/>,
		);

		const editButtons = screen.getAllByRole("button", { name: "Edit" });
		const deleteButtons = screen.getAllByRole("button", { name: "Delete" });

		fireEvent.click(editButtons[0]);
		fireEvent.click(deleteButtons[0]);

		expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ _id: "1" }));
		expect(onDelete).toHaveBeenCalledWith(expect.objectContaining({ _id: "1" }));
	});
});
