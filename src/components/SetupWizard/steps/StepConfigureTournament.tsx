import { useId } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useWizard } from "../SetupWizardContext";

export function StepConfigureTournament() {
	const formId = useId();
	const { state, dispatch } = useWizard();
	const { season, tournament } = state;

	const autoName = season.name ? `${season.name} Championship` : "";

	const setField = (field: string, value: string | number) => {
		dispatch({ type: "SET_TOURNAMENT", tournament: { [field]: value } });
	};

	return (
		<div className="space-y-6">
			<div>
				<h3 className="text-lg font-medium">Configure Tournament</h3>
				<p className="text-sm text-muted-foreground">
					Set up the tournament for this season.
				</p>
			</div>

			<div className="grid grid-cols-2 gap-4">
				<div className="space-y-2">
					<Label htmlFor={`${formId}-name`}>Tournament Name *</Label>
					<Input
						id={`${formId}-name`}
						value={tournament.name || autoName}
						onChange={(e) => setField("name", e.target.value)}
						placeholder={`${autoName || "Season"} Championship`}
						required
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor={`${formId}-sport`}>Sport</Label>
					<Input
						id={`${formId}-sport`}
						value={season.sport}
						disabled
						className="text-muted-foreground"
					/>
				</div>
			</div>

			<div className="grid grid-cols-2 gap-4">
				<div className="space-y-2">
					<Label htmlFor={`${formId}-location`}>Location *</Label>
					<Input
						id={`${formId}-location`}
						value={tournament.location}
						onChange={(e) => setField("location", e.target.value)}
						placeholder="City, State"
						required
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor={`${formId}-bracketType`}>Bracket Type</Label>
					<Select
						value={tournament.bracketType}
						onValueChange={(val) => setField("bracketType", val)}
					>
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
			</div>

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
							value={tournament.maxTeams.toString()}
							onChange={(e) =>
								setField("maxTeams", parseInt(e.target.value, 10) || 2)
							}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor={`${formId}-minTeams`}>Min Teams</Label>
						<Input
							id={`${formId}-minTeams`}
							type="number"
							min="2"
							value={tournament.minTeams.toString()}
							onChange={(e) =>
								setField("minTeams", parseInt(e.target.value, 10) || 2)
							}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor={`${formId}-fields`}>Fields Available</Label>
						<Input
							id={`${formId}-fields`}
							type="number"
							min="1"
							value={tournament.fieldsAvailable.toString()}
							onChange={(e) =>
								setField("fieldsAvailable", parseInt(e.target.value, 10) || 1)
							}
						/>
					</div>
				</div>
				<div className="mt-4 grid grid-cols-2 gap-4">
					<div className="space-y-2">
						<Label htmlFor={`${formId}-gameDuration`}>
							Game Duration (min)
						</Label>
						<Input
							id={`${formId}-gameDuration`}
							type="number"
							min="1"
							value={tournament.gameDuration.toString()}
							onChange={(e) =>
								setField("gameDuration", parseInt(e.target.value, 10) || 1)
							}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor={`${formId}-break`}>Break Between Games (min)</Label>
						<Input
							id={`${formId}-break`}
							type="number"
							min="0"
							value={tournament.breakBetweenGames.toString()}
							onChange={(e) =>
								setField("breakBetweenGames", parseInt(e.target.value, 10) || 0)
							}
						/>
					</div>
				</div>
			</fieldset>

			<div className="grid grid-cols-2 gap-4">
				<div className="space-y-2">
					<Label htmlFor={`${formId}-seedingType`}>Seeding Type</Label>
					<Select
						value={tournament.seedingType}
						onValueChange={(val) => setField("seedingType", val)}
					>
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
				<div className="space-y-2">
					<Label htmlFor={`${formId}-deadline`}>Registration Deadline</Label>
					<Input
						id={`${formId}-deadline`}
						type="date"
						value={
							tournament.registrationDeadline
								? new Date(tournament.registrationDeadline)
										.toISOString()
										.split("T")[0]
								: ""
						}
						onChange={(e) => {
							const value = e.target.value;
							setField(
								"registrationDeadline",
								value ? new Date(`${value}T00:00:00`).getTime() : undefined,
							);
						}}
					/>
				</div>
			</div>
		</div>
	);
}
