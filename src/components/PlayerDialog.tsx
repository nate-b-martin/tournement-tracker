import { useMutation } from "convex/react";
import { useId, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";

type Player = Doc<"players"> & { team?: Doc<"teams"> | null };

interface PlayerDialogProps {
	mode: "create" | "edit";
	player?: Player;
	teamId?: Id<"teams">;
	teams: Array<{ _id: Id<"teams">; name: string }>;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
}

export function PlayerDialog({
	mode,
	player,
	teamId,
	teams,
	open,
	onOpenChange,
	onSuccess,
}: PlayerDialogProps) {
	const formId = useId();
	const createPlayer = useMutation(api.players.create);
	const updatePlayer = useMutation(api.players.update);

	const [firstName, setFirstName] = useState(player?.firstName || "");
	const [lastName, setLastName] = useState(player?.lastName || "");
	const [selectedTeamId, setSelectedTeamId] = useState<Id<"teams"> | "">(
		player?.teamId || teamId || "",
	);
	const [jerseyNumber, setJerseyNumber] = useState(
		player?.jerseyNumber?.toString() || "",
	);
	const [email, setEmail] = useState(player?.email || "");
	const [phone, setPhone] = useState(player?.phone || "");
	const [status, setStatus] = useState(player?.status || "active");
	const [isCaptain, setIsCaptain] = useState(player?.isCaptain || false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const resetForm = () => {
		setFirstName(player?.firstName || "");
		setLastName(player?.lastName || "");
		setSelectedTeamId(player?.teamId || teamId || "");
		setJerseyNumber(player?.jerseyNumber?.toString() || "");
		setEmail(player?.email || "");
		setPhone(player?.phone || "");
		setStatus(player?.status || "active");
		setIsCaptain(player?.isCaptain || false);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!firstName.trim() || !lastName.trim()) {
			toast.error("First name and last name are required");
			return;
		}
		if (!selectedTeamId) {
			toast.error("Please select a team");
			return;
		}

		setIsSubmitting(true);
		try {
			if (mode === "create") {
				await createPlayer({
					teamId: selectedTeamId as Id<"teams">,
					firstName: firstName.trim(),
					lastName: lastName.trim(),
					jerseyNumber: jerseyNumber ? parseInt(jerseyNumber, 10) : undefined,
					email: email.trim() || undefined,
					phone: phone.trim() || undefined,
					isCaptain,
					status: status as "active" | "inactive" | "injured",
				});
				toast.success("Player created successfully");
			} else if (player) {
				await updatePlayer({
					id: player._id,
					teamId: selectedTeamId ? (selectedTeamId as Id<"teams">) : undefined,
					firstName: firstName.trim(),
					lastName: lastName.trim(),
					jerseyNumber: jerseyNumber ? parseInt(jerseyNumber, 10) : undefined,
					email: email.trim() || undefined,
					phone: phone.trim() || undefined,
					isCaptain,
					status: status as "active" | "inactive" | "injured",
				});
				toast.success("Player updated successfully");
			}
			onOpenChange(false);
			onSuccess?.();
		} catch {
			toast.error(
				mode === "create"
					? "Failed to create player"
					: "Failed to update player",
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(val) => {
				onOpenChange(val);
				if (!val) resetForm();
			}}
		>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>
						{mode === "create" ? "Add Player" : "Edit Player"}
					</DialogTitle>
					<DialogDescription>
						{mode === "create"
							? "Add a new player to a team"
							: "Update player information"}
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor={`${formId}-firstName`}>First Name *</Label>
							<Input
								id={`${formId}-firstName`}
								value={firstName}
								onChange={(e) => setFirstName(e.target.value)}
								placeholder="John"
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor={`${formId}-lastName`}>Last Name *</Label>
							<Input
								id={`${formId}-lastName`}
								value={lastName}
								onChange={(e) => setLastName(e.target.value)}
								placeholder="Doe"
								required
							/>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor={`${formId}-team`}>Team *</Label>
						<Select
							value={selectedTeamId.toString()}
							onValueChange={(val) => setSelectedTeamId(val as Id<"teams">)}
							disabled={!!teamId}
						>
							<SelectTrigger id={`${formId}-team`}>
								<SelectValue placeholder="Select a team" />
							</SelectTrigger>
							<SelectContent>
								{teams.map((team) => (
									<SelectItem key={team._id} value={team._id}>
										{team.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor={`${formId}-jerseyNumber`}>Jersey #</Label>
							<Input
								id={`${formId}-jerseyNumber`}
								value={jerseyNumber}
								onChange={(e) => setJerseyNumber(e.target.value)}
								placeholder="42"
								type="number"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor={`${formId}-status`}>Status</Label>
							<Select value={status} onValueChange={setStatus}>
								<SelectTrigger id={`${formId}-status`}>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="active">Active</SelectItem>
									<SelectItem value="inactive">Inactive</SelectItem>
									<SelectItem value="injured">Injured</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor={`${formId}-email`}>Email</Label>
							<Input
								id={`${formId}-email`}
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="john@example.com"
								type="email"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor={`${formId}-phone`}>Phone</Label>
							<Input
								id={`${formId}-phone`}
								value={phone}
								onChange={(e) => setPhone(e.target.value)}
								placeholder="555-0123"
							/>
						</div>
					</div>

					<div className="flex items-center gap-2">
						<input
							type="checkbox"
							id={`${formId}-isCaptain`}
							checked={isCaptain}
							onChange={(e) => setIsCaptain(e.target.checked)}
							className="h-4 w-4 rounded border-gray-600"
						/>
						<Label
							htmlFor={`${formId}-isCaptain`}
							className="text-sm font-normal"
						>
							Team Captain
						</Label>
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting
								? "Saving..."
								: mode === "create"
									? "Create Player"
									: "Save Changes"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
