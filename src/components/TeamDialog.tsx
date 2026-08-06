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
import { Textarea } from "@/components/ui/textarea";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";

type Team = Doc<"teams">;

interface TeamDialogProps {
	mode: "create" | "edit";
	team?: Team;
	tournamentId?: Id<"tournaments">;
	tournaments: Array<{ _id: Id<"tournaments">; name: string }>;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
}

export function TeamDialog({
	mode,
	team,
	tournamentId,
	tournaments,
	open,
	onOpenChange,
	onSuccess,
}: TeamDialogProps) {
	const formId = useId();
	const createTeam = useMutation(api.teams.create);
	const updateTeam = useMutation(api.teams.update);

	const [name, setName] = useState(team?.name || "");
	const [selectedTournamentId, setSelectedTournamentId] = useState<
		Id<"tournaments"> | ""
	>(team?.tournamentId || tournamentId || "");
	const [coachName, setCoachName] = useState(team?.coachName || "");
	const [coachEmail, setCoachEmail] = useState(team?.coachEmail || "");
	const [coachPhone, setCoachPhone] = useState(team?.coachPhone || "");
	const [description, setDescription] = useState(team?.description || "");
	const [city, setCity] = useState(team?.city || "");
	const [homeField, setHomeField] = useState(team?.homeField || "");
	const [organization, setOrganization] = useState(team?.organization || "");
	const [teamAgeGroup, setTeamAgeGroup] = useState(team?.teamAgeGroup || "");
	const [status, setStatus] = useState(team?.status || "active");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const resetForm = () => {
		setName(team?.name || "");
		setSelectedTournamentId(team?.tournamentId || tournamentId || "");
		setCoachName(team?.coachName || "");
		setCoachEmail(team?.coachEmail || "");
		setCoachPhone(team?.coachPhone || "");
		setDescription(team?.description || "");
		setCity(team?.city || "");
		setHomeField(team?.homeField || "");
		setOrganization(team?.organization || "");
		setTeamAgeGroup(team?.teamAgeGroup || "");
		setStatus(team?.status || "active");
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) {
			toast.error("Team name is required");
			return;
		}
		if (!coachName.trim()) {
			toast.error("Coach name is required");
			return;
		}
		if (!coachEmail.trim()) {
			toast.error("Coach email is required");
			return;
		}
		if (!selectedTournamentId) {
			toast.error("Please select a tournament");
			return;
		}

		setIsSubmitting(true);
		try {
			if (mode === "create") {
				await createTeam({
					tournamentId: selectedTournamentId as Id<"tournaments">,
					name: name.trim(),
					coachName: coachName.trim(),
					coachEmail: coachEmail.trim(),
					coachPhone: coachPhone.trim(),
					description: description.trim() || undefined,
					city: city.trim() || undefined,
					homeField: homeField.trim() || undefined,
					organization: organization.trim() || undefined,
					teamAgeGroup: teamAgeGroup.trim() || undefined,
					status: status as "active" | "inactive" | "suspended",
				});
				toast.success("Team created successfully");
			} else if (team) {
				await updateTeam({
					id: team._id,
					name: name.trim(),
					coachName: coachName.trim(),
					coachEmail: coachEmail.trim(),
					coachPhone: coachPhone.trim(),
					description: description.trim() || undefined,
					city: city.trim() || undefined,
					homeField: homeField.trim() || undefined,
					organization: organization.trim() || undefined,
					teamAgeGroup: teamAgeGroup.trim() || undefined,
					status: status as "active" | "inactive" | "suspended",
				});
				toast.success("Team updated successfully");
			}
			onOpenChange(false);
			onSuccess?.();
		} catch {
			toast.error(
				mode === "create" ? "Failed to create team" : "Failed to update team",
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
			<DialogContent className="sm:max-w-[550px]">
				<DialogHeader>
					<DialogTitle>
						{mode === "create" ? "Add Team" : "Edit Team"}
					</DialogTitle>
					<DialogDescription>
						{mode === "create"
							? "Add a new team to a tournament"
							: "Update team information"}
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor={`${formId}-name`}>Team Name *</Label>
							<Input
								id={`${formId}-name`}
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="Warriors"
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor={`${formId}-tournament`}>Tournament *</Label>
							<Select
								value={selectedTournamentId.toString()}
								onValueChange={(val) =>
									setSelectedTournamentId(val as Id<"tournaments">)
								}
								disabled={!!tournamentId}
							>
								<SelectTrigger id={`${formId}-tournament`}>
									<SelectValue placeholder="Select a tournament" />
								</SelectTrigger>
								<SelectContent>
									{tournaments.map((t) => (
										<SelectItem key={t._id} value={t._id}>
											{t.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor={`${formId}-coachName`}>Coach Name *</Label>
							<Input
								id={`${formId}-coachName`}
								value={coachName}
								onChange={(e) => setCoachName(e.target.value)}
								placeholder="Coach Smith"
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor={`${formId}-coachEmail`}>Coach Email *</Label>
							<Input
								id={`${formId}-coachEmail`}
								value={coachEmail}
								onChange={(e) => setCoachEmail(e.target.value)}
								placeholder="coach@example.com"
								type="email"
								required
							/>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor={`${formId}-coachPhone`}>Coach Phone *</Label>
							<Input
								id={`${formId}-coachPhone`}
								value={coachPhone}
								onChange={(e) => setCoachPhone(e.target.value)}
								placeholder="555-0123"
								required
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
									<SelectItem value="suspended">Suspended</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					<fieldset className="rounded-lg border p-4">
						<legend className="px-2 text-sm font-medium text-muted-foreground">
							Optional Details
						</legend>
						<div className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor={`${formId}-description`}>Description</Label>
								<Textarea
									id={`${formId}-description`}
									value={description}
									onChange={(e) => setDescription(e.target.value)}
									placeholder="Team description..."
									rows={2}
								/>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor={`${formId}-city`}>City</Label>
									<Input
										id={`${formId}-city`}
										value={city}
										onChange={(e) => setCity(e.target.value)}
										placeholder="Springfield"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor={`${formId}-homeField`}>Home Field</Label>
									<Input
										id={`${formId}-homeField`}
										value={homeField}
										onChange={(e) => setHomeField(e.target.value)}
										placeholder="Memorial Stadium"
									/>
								</div>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor={`${formId}-organization`}>Organization</Label>
									<Input
										id={`${formId}-organization`}
										value={organization}
										onChange={(e) => setOrganization(e.target.value)}
										placeholder="Youth Sports League"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor={`${formId}-ageGroup`}>Age Group</Label>
									<Input
										id={`${formId}-ageGroup`}
										value={teamAgeGroup}
										onChange={(e) => setTeamAgeGroup(e.target.value)}
										placeholder="U14"
									/>
								</div>
							</div>
						</div>
					</fieldset>

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
									? "Create Team"
									: "Save Changes"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
