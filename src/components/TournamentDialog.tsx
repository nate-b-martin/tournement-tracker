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
import type { Doc } from "../../convex/_generated/dataModel";

type Tournament = Doc<"tournaments">;

function toDateInputValue(ms: number | undefined): string {
	if (!ms) return "";
	const d = new Date(ms);
	return d.toISOString().split("T")[0];
}

function fromDateInputValue(dateStr: string): number | undefined {
	if (!dateStr) return undefined;
	return new Date(`${dateStr}T00:00:00`).getTime();
}

interface TournamentDialogProps {
	mode: "create" | "edit";
	tournament?: Tournament;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
}

export function TournamentDialog({
	mode,
	tournament,
	open,
	onOpenChange,
	onSuccess,
}: TournamentDialogProps) {
	const formId = useId();
	const createTournament = useMutation(api.tournaments.create);
	const updateTournament = useMutation(api.tournaments.update);

	const [name, setName] = useState(tournament?.name || "");
	const [sport, setSport] = useState(tournament?.sport || "");
	const [location, setLocation] = useState(tournament?.location || "");
	const [startDate, setStartDate] = useState(
		toDateInputValue(tournament?.startDate),
	);
	const [endDate, setEndDate] = useState(toDateInputValue(tournament?.endDate));
	const [registrationDeadline, setRegistrationDeadline] = useState(
		toDateInputValue(tournament?.registrationDeadline),
	);
	const [maxTeams, setMaxTeams] = useState(
		tournament?.maxTeams?.toString() || "16",
	);
	const [minTeams, setMinTeams] = useState(
		tournament?.minTeams?.toString() || "4",
	);
	const [fieldsAvailable, setFieldsAvailable] = useState(
		tournament?.fieldsAvailable?.toString() || "4",
	);
	const [gameDuration, setGameDuration] = useState(
		tournament?.gameDuration?.toString() || "60",
	);
	const [breakBetweenGames, setBreakBetweenGames] = useState(
		tournament?.breakBetweenGames?.toString() || "15",
	);
	const [bracketType, setBracketType] = useState(
		tournament?.bracketType || "single_elimination",
	);
	const [seedingType, setSeedingType] = useState(
		tournament?.seedingType || "random",
	);
	const [status, setStatus] = useState(tournament?.status || "draft");
	const [gameFormatRules, setGameFormatRules] = useState(
		tournament?.gameFormatRules || "",
	);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const resetForm = () => {
		setName(tournament?.name || "");
		setSport(tournament?.sport || "");
		setLocation(tournament?.location || "");
		setStartDate(toDateInputValue(tournament?.startDate));
		setEndDate(toDateInputValue(tournament?.endDate));
		setRegistrationDeadline(toDateInputValue(tournament?.registrationDeadline));
		setMaxTeams(tournament?.maxTeams?.toString() || "16");
		setMinTeams(tournament?.minTeams?.toString() || "4");
		setFieldsAvailable(tournament?.fieldsAvailable?.toString() || "4");
		setGameDuration(tournament?.gameDuration?.toString() || "60");
		setBreakBetweenGames(tournament?.breakBetweenGames?.toString() || "15");
		setBracketType(tournament?.bracketType || "single_elimination");
		setSeedingType(tournament?.seedingType || "random");
		setStatus(tournament?.status || "draft");
		setGameFormatRules(tournament?.gameFormatRules || "");
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) {
			toast.error("Tournament name is required");
			return;
		}
		if (!sport.trim()) {
			toast.error("Sport is required");
			return;
		}
		if (!maxTeams || parseInt(maxTeams, 10) < 2) {
			toast.error("Maximum teams must be at least 2");
			return;
		}

		setIsSubmitting(true);
		try {
			const tournamentData = {
				name: name.trim(),
				sport: sport.trim(),
				location: location.trim() || "",
				startDate: fromDateInputValue(startDate),
				endDate: fromDateInputValue(endDate),
				registrationDeadline: fromDateInputValue(registrationDeadline),
				maxTeams: parseInt(maxTeams, 10) || 16,
				minTeams: parseInt(minTeams, 10) || 4,
				fieldsAvailable: parseInt(fieldsAvailable, 10) || 4,
				gameDuration: parseInt(gameDuration, 10) || 60,
				breakBetweenGames: parseInt(breakBetweenGames, 10) || 15,
				bracketType: bracketType as
					| "single_elimination"
					| "double_elimination"
					| "round_robin",
				seedingType: seedingType as "random" | "manual" | "ranking",
				gameFormatRules: gameFormatRules || undefined,
				status: status as
					| "draft"
					| "registration_open"
					| "registration_closed"
					| "active"
					| "complete",
			};

			if (mode === "create") {
				await createTournament(tournamentData);
				toast.success("Tournament created successfully");
			} else if (tournament) {
				await updateTournament({
					id: tournament._id,
					...tournamentData,
				});
				toast.success("Tournament updated successfully");
			}
			onOpenChange(false);
			onSuccess?.();
		} catch {
			toast.error(
				mode === "create"
					? "Failed to create tournament"
					: "Failed to update tournament",
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
			<DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>
						{mode === "create" ? "Create Tournament" : "Edit Tournament"}
					</DialogTitle>
					<DialogDescription>
						{mode === "create"
							? "Set up a new tournament"
							: "Update tournament settings"}
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor={`${formId}-name`}>Tournament Name *</Label>
							<Input
								id={`${formId}-name`}
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="Summer Championship"
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor={`${formId}-sport`}>Sport *</Label>
							<Input
								id={`${formId}-sport`}
								value={sport}
								onChange={(e) => setSport(e.target.value)}
								placeholder="Baseball"
								required
							/>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor={`${formId}-location`}>Location</Label>
							<Input
								id={`${formId}-location`}
								value={location}
								onChange={(e) => setLocation(e.target.value)}
								placeholder="City, State"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor={`${formId}-status`}>Status</Label>
							<Select value={status} onValueChange={setStatus}>
								<SelectTrigger id={`${formId}-status`}>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="draft">Draft</SelectItem>
									<SelectItem value="registration_open">
										Registration Open
									</SelectItem>
									<SelectItem value="registration_closed">
										Registration Closed
									</SelectItem>
									<SelectItem value="active">Active</SelectItem>
									<SelectItem value="complete">Complete</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					<fieldset className="rounded-lg border p-4">
						<legend className="px-2 text-sm font-medium text-muted-foreground">
							Dates
						</legend>
						<div className="grid grid-cols-3 gap-4">
							<div className="space-y-2">
								<Label htmlFor={`${formId}-startDate`}>Start Date</Label>
								<Input
									id={`${formId}-startDate`}
									type="date"
									value={startDate}
									onChange={(e) => setStartDate(e.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor={`${formId}-endDate`}>End Date</Label>
								<Input
									id={`${formId}-endDate`}
									type="date"
									value={endDate}
									onChange={(e) => setEndDate(e.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor={`${formId}-deadline`}>
									Registration Deadline
								</Label>
								<Input
									id={`${formId}-deadline`}
									type="date"
									value={registrationDeadline}
									onChange={(e) => setRegistrationDeadline(e.target.value)}
								/>
							</div>
						</div>
					</fieldset>

					<fieldset className="rounded-lg border p-4">
						<legend className="px-2 text-sm font-medium text-muted-foreground">
							Configuration
						</legend>
						<div className="grid grid-cols-3 gap-4">
							<div className="space-y-2">
								<Label htmlFor={`${formId}-maxTeams`}>Max Teams</Label>
								<Input
									id={`${formId}-maxTeams`}
									type="number"
									min="2"
									value={maxTeams}
									onChange={(e) => setMaxTeams(e.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor={`${formId}-minTeams`}>Min Teams</Label>
								<Input
									id={`${formId}-minTeams`}
									type="number"
									min="2"
									value={minTeams}
									onChange={(e) => setMinTeams(e.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor={`${formId}-fields`}>Fields</Label>
								<Input
									id={`${formId}-fields`}
									type="number"
									min="1"
									value={fieldsAvailable}
									onChange={(e) => setFieldsAvailable(e.target.value)}
								/>
							</div>
						</div>
						<div className="grid grid-cols-2 gap-4 mt-4">
							<div className="space-y-2">
								<Label htmlFor={`${formId}-gameDuration`}>
									Game Duration (min)
								</Label>
								<Input
									id={`${formId}-gameDuration`}
									type="number"
									min="1"
									value={gameDuration}
									onChange={(e) => setGameDuration(e.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor={`${formId}-break`}>
									Break Between Games (min)
								</Label>
								<Input
									id={`${formId}-break`}
									type="number"
									min="0"
									value={breakBetweenGames}
									onChange={(e) => setBreakBetweenGames(e.target.value)}
								/>
							</div>
						</div>
					</fieldset>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor={`${formId}-bracketType`}>Bracket Type</Label>
							<Select value={bracketType} onValueChange={setBracketType}>
								<SelectTrigger id={`${formId}-bracketType`}>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="single_elimination">
										Single Elimination
									</SelectItem>
									<SelectItem value="double_elimination">
										Double Elimination
									</SelectItem>
									<SelectItem value="round_robin">Round Robin</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label htmlFor={`${formId}-seedingType`}>Seeding Type</Label>
							<Select value={seedingType} onValueChange={setSeedingType}>
								<SelectTrigger id={`${formId}-seedingType`}>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="random">Random</SelectItem>
									<SelectItem value="manual">Manual</SelectItem>
									<SelectItem value="ranking">Ranking</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor={`${formId}-rules`}>Game Format Rules</Label>
						<Textarea
							id={`${formId}-rules`}
							value={gameFormatRules}
							onChange={(e) => setGameFormatRules(e.target.value)}
							placeholder="Describe the game format, rules, and special conditions..."
							rows={3}
						/>
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
									? "Create Tournament"
									: "Save Changes"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
