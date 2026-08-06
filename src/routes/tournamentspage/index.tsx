import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { TournamentDialog } from "@/components/TournamentDialog";
import { TournamentTable } from "@/components/TournamentTable";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { api } from "../../../convex/_generated/api";
import type { Doc, Id } from "../../../convex/_generated/dataModel";

type Tournament = Doc<"tournaments">;

export const Route = createFileRoute("/tournamentspage/")({
	component: TournamentsPage,
});

function TournamentsPage() {
	const { isAdmin, isSignedIn, isSpectator } = useAuth();
	const deleteTournament = useMutation(api.tournaments.remove);

	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingTournament, setEditingTournament] = useState<
		Tournament | undefined
	>();
	const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
	const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
	const [deletingTournament, setDeletingTournament] = useState<
		Tournament | undefined
	>();
	const [isDeleting, setIsDeleting] = useState(false);

	const handleEdit = (tournament: Tournament) => {
		setEditingTournament(tournament);
		setDialogMode("edit");
		setDialogOpen(true);
	};

	const handleDelete = (tournament: Tournament) => {
		setDeletingTournament(tournament);
		setDeleteConfirmOpen(true);
	};

	const confirmDelete = async () => {
		if (!deletingTournament) return;
		setIsDeleting(true);
		try {
			await deleteTournament({
				id: deletingTournament._id as Id<"tournaments">,
			});
			toast.success("Tournament deleted");
			setDeleteConfirmOpen(false);
			setDeletingTournament(undefined);
		} catch {
			toast.error("Failed to delete tournament");
		} finally {
			setIsDeleting(false);
		}
	};

	const handleCreate = () => {
		setEditingTournament(undefined);
		setDialogMode("create");
		setDialogOpen(true);
	};

	return (
		<div className="container mx-auto px-6 py-8">
			<div className="flex items-center justify-between mb-8">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Tournaments</h1>
					<p className="text-muted-foreground mt-1">
						{isAdmin
							? "Create and manage your tournaments"
							: "Browse upcoming and active tournaments"}
					</p>
				</div>
				{isAdmin && (
					<Button onClick={handleCreate}>
						<Plus className="mr-2 h-4 w-4" />
						New Tournament
					</Button>
				)}
			</div>

			{isSignedIn && isSpectator && (
				<div className="mb-6 rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm text-blue-300">
					Viewing as spectator. Contact an admin to make changes to tournaments.
				</div>
			)}

			<TournamentTable
				initialOptions={{
					sorting: { field: "name", direction: "asc" },
					pagination: { pageIndex: 0, pageSize: 10 },
				}}
				isAdmin={isAdmin}
				onEdit={handleEdit}
				onDelete={handleDelete}
			/>

			<TournamentDialog
				mode={dialogMode}
				tournament={editingTournament}
				open={dialogOpen}
				onOpenChange={setDialogOpen}
				onSuccess={() => {
					setEditingTournament(undefined);
				}}
			/>

			<ConfirmDelete
				open={deleteConfirmOpen}
				onOpenChange={(val) => {
					setDeleteConfirmOpen(val);
					if (!val) setDeletingTournament(undefined);
				}}
				itemName={
					deletingTournament ? `${deletingTournament.name}` : "this tournament"
				}
				onConfirm={confirmDelete}
				isLoading={isDeleting}
			/>
		</div>
	);
}
