import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWizard } from "../SetupWizardContext";
import type { PlayerEntry, WizardAction } from "../types";

export function StepManageRosters() {
	const formId = useId();
	const { state, dispatch } = useWizard();
	const [activeTeamKey, setActiveTeamKey] = useState<string | null>(null);

	const activeTeam =
		activeTeamKey && state.selectedTeams.find((t) => t.key === activeTeamKey);

	if (state.selectedTeams.length === 0) {
		return (
			<div className="space-y-4">
				<h3 className="text-lg font-medium">Manage Rosters</h3>
				<p className="text-sm text-muted-foreground">
					No teams selected yet. Go back to Step 1 and select teams first.
				</p>
			</div>
		);
	}

	const currentKey = activeTeamKey || state.selectedTeams[0]?.key;

	return (
		<div className="space-y-6">
			<div>
				<h3 className="text-lg font-medium">Manage Rosters</h3>
				<p className="text-sm text-muted-foreground">
					Add players to each team. At least 1 player per team is recommended.
				</p>
			</div>

			<div className="flex flex-wrap gap-2">
				{state.selectedTeams.map((team) => {
					const playerCount = (state.rosters[team.key] || []).length;
					const isActive = team.key === currentKey;
					return (
						<button
							key={team.key}
							type="button"
							onClick={() => setActiveTeamKey(team.key)}
							className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
								isActive
									? "border-indigo-500/50 bg-indigo-500/15 text-indigo-200"
									: "border-slate-700/50 text-slate-300 hover:bg-slate-700/50"
							}`}
						>
							<span className="font-medium">{team.name}</span>
							<span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-700 px-1.5 text-xs text-slate-300">
								{playerCount}
							</span>
						</button>
					);
				})}
			</div>

			{currentKey && activeTeam && (
				<RosterEditor
					formId={formId}
					teamKey={currentKey}
					teamName={activeTeam.name}
					players={state.rosters[currentKey] || []}
					dispatch={dispatch}
				/>
			)}
		</div>
	);
}

function RosterEditor({
	formId,
	teamKey,
	teamName,
	players,
	dispatch,
}: {
	formId: string;
	teamKey: string;
	teamName: string;
	players: PlayerEntry[];
	dispatch: React.Dispatch<WizardAction>;
}) {
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [jerseyNumber, setJerseyNumber] = useState("");

	const handleAddPlayer = (e: React.FormEvent) => {
		e.preventDefault();
		if (!firstName.trim() || !lastName.trim()) return;

		dispatch({
			type: "ADD_PLAYER",
			teamKey,
			player: {
				firstName: firstName.trim(),
				lastName: lastName.trim(),
				jerseyNumber: jerseyNumber ? parseInt(jerseyNumber, 10) : undefined,
			},
		});

		setFirstName("");
		setLastName("");
		setJerseyNumber("");
	};

	return (
		<div className="space-y-4">
			<h4 className="text-sm font-medium text-muted-foreground">
				Roster for {teamName}
			</h4>

			{players.length === 0 && (
				<p className="text-sm text-muted-foreground">
					No players added yet. Add your first player below.
				</p>
			)}

			{players.length > 0 && (
				<div className="space-y-1">
					{players.map((player, idx) => (
						<div
							key={`${player.firstName}-${player.lastName}-${idx}`}
							className="flex items-center justify-between rounded-md border border-slate-700/50 px-3 py-2 text-sm"
						>
							<span>
								{player.firstName} {player.lastName}
								{player.jerseyNumber != null && (
									<span className="ml-2 text-xs text-muted-foreground">
										#{player.jerseyNumber}
									</span>
								)}
							</span>
							<button
								type="button"
								onClick={() =>
									dispatch({
										type: "REMOVE_PLAYER",
										teamKey,
										index: idx,
									})
								}
								className="text-xs text-red-400 hover:text-red-300"
							>
								Remove
							</button>
						</div>
					))}
				</div>
			)}

			<form
				onSubmit={handleAddPlayer}
				className="flex flex-wrap items-end gap-3"
			>
				<div className="space-y-1">
					<Label htmlFor={`${formId}-firstName`}>First Name</Label>
					<Input
						id={`${formId}-firstName`}
						value={firstName}
						onChange={(e) => setFirstName(e.target.value)}
						placeholder="Jane"
						required
					/>
				</div>
				<div className="space-y-1">
					<Label htmlFor={`${formId}-lastName`}>Last Name</Label>
					<Input
						id={`${formId}-lastName`}
						value={lastName}
						onChange={(e) => setLastName(e.target.value)}
						placeholder="Doe"
						required
					/>
				</div>
				<div className="space-y-1">
					<Label htmlFor={`${formId}-jersey`}>#</Label>
					<Input
						id={`${formId}-jersey`}
						value={jerseyNumber}
						onChange={(e) => setJerseyNumber(e.target.value)}
						placeholder="42"
						type="number"
						min="0"
						className="w-20"
					/>
				</div>
				<Button type="submit" size="sm">
					Add Player
				</Button>
			</form>
		</div>
	);
}
