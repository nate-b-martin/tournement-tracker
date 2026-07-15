import { useMutation } from "convex/react";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFields } from "@/hooks/useFields";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { ConfirmDelete } from "./ConfirmDelete";
import { FieldDialog } from "./FieldDialog";

type Field = Doc<"fields">;

interface FieldsListProps {
	tournamentId: Id<"tournaments">;
	isAdmin?: boolean;
}

const statusColors: Record<
	Field["status"],
	{ label: string; classes: string }
> = {
	available: {
		label: "Available",
		classes: "border-emerald-500/30 bg-emerald-500/15 text-emerald-300",
	},
	maintenance: {
		label: "Maintenance",
		classes: "border-amber-500/30 bg-amber-500/15 text-amber-300",
	},
	unavailable: {
		label: "Unavailable",
		classes: "border-red-500/30 bg-red-500/15 text-red-300",
	},
};

export function FieldsList({ tournamentId, isAdmin }: FieldsListProps) {
	const { fields, isLoading } = useFields({ tournamentId });
	const deleteField = useMutation(api.fields.remove);

	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingField, setEditingField] = useState<Field | undefined>();
	const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
	const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
	const [deletingField, setDeletingField] = useState<Field | undefined>();
	const [isDeleting, setIsDeleting] = useState(false);

	const handleAdd = () => {
		setEditingField(undefined);
		setDialogMode("create");
		setDialogOpen(true);
	};

	const handleEdit = (field: Field) => {
		setEditingField(field);
		setDialogMode("edit");
		setDialogOpen(true);
	};

	const handleDelete = (field: Field) => {
		setDeletingField(field);
		setDeleteConfirmOpen(true);
	};

	const confirmDelete = async () => {
		if (!deletingField) return;
		setIsDeleting(true);
		try {
			await deleteField({ id: deletingField._id });
			toast.success("Field deleted");
			setDeleteConfirmOpen(false);
			setDeletingField(undefined);
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to delete field",
			);
		} finally {
			setIsDeleting(false);
		}
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
			</div>
		);
	}

	return (
		<div>
			{isAdmin && (
				<div className="mb-4">
					<Button type="button" onClick={handleAdd}>
						<Plus className="mr-2 h-4 w-4" />
						Add Field
					</Button>
				</div>
			)}

			{fields.length === 0 ? (
				<div className="text-center py-12 text-muted-foreground">
					No fields set up for this tournament.
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{fields.map((field) => {
						const statusStyle = statusColors[field.status];
						return (
							<Card key={field._id}>
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
									<CardTitle className="text-lg font-semibold">
										{field.name}
									</CardTitle>
									<Badge variant="outline" className={statusStyle.classes}>
										{statusStyle.label}
									</Badge>
								</CardHeader>
								<CardContent>
									{field.location && (
										<p className="text-sm text-muted-foreground">
											{field.location}
										</p>
									)}
									{isAdmin && (
										<div className="flex gap-2 mt-4">
											<Button
												type="button"
												variant="outline"
												size="sm"
												onClick={() => handleEdit(field)}
											>
												Edit
											</Button>
											<Button
												type="button"
												variant="destructive"
												size="sm"
												onClick={() => handleDelete(field)}
											>
												Delete
											</Button>
										</div>
									)}
								</CardContent>
							</Card>
						);
					})}
				</div>
			)}

			<FieldDialog
				mode={dialogMode}
				field={editingField}
				tournamentId={tournamentId}
				open={dialogOpen}
				onOpenChange={setDialogOpen}
				onSuccess={() => {
					setEditingField(undefined);
				}}
			/>

			<ConfirmDelete
				open={deleteConfirmOpen}
				onOpenChange={(val) => {
					setDeleteConfirmOpen(val);
					if (!val) setDeletingField(undefined);
				}}
				itemName={deletingField ? `"${deletingField.name}"` : "this field"}
				onConfirm={confirmDelete}
				isLoading={isDeleting}
			/>
		</div>
	);
}
