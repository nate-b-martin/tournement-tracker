import { useQuery } from "convex/react";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "../../../../convex/_generated/api";
import type { Doc } from "../../../../convex/_generated/dataModel";
import { useWizard } from "../SetupWizardContext";
import type { TeamEntry } from "../types";

type Team = Doc<"teams">;

export function StepSelectTeams() {
	const formId = useId();
	const { state, dispatch } = useWizard();
	const allTeams = useQuery(api.teams.list, {});
	const [search, setSearch] = useState("");
	const [showNewTeamForm, setShowNewTeamForm] = useState(false);

	const [newName, setNewName] = useState("");
	const [newCoachName, setNewCoachName] = useState("");
	const [newCoachEmail, setNewCoachEmail] = useState("");
	const [newCoachPhone, setNewCoachPhone] = useState("");
	const [newCity, setNewCity] = useState("");

	const teams = allTeams?.teams || [];
	const existingSelectedIds = new Set(
		state.selectedTeams
			.filter(
				(
					t,
				): t is TeamEntry & {
					existingId: NonNullable<TeamEntry["existingId"]>;
				} => !t.isNew && !!t.existingId,
			)
			.map((t) => t.existingId),
	);

	const filteredTeams = search
		? teams.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()))
		: teams;

	const isTeamSelected = (teamId: string) =>
		existingSelectedIds.has(teamId as unknown as Id<"teams">);

	const toggleTeam = (team: Team) => {
		if (isTeamSelected(team._id)) {
			dispatch({
				type: "REMOVE_TEAM",
				key: team._id,
			});
		} else {
			const entry: TeamEntry = {
				key: team._id,
				existingId: team._id,
				isNew: false,
				name: team.name,
				coachName: team.coachName,
				coachEmail: team.coachEmail,
				coachPhone: team.coachPhone,
				city: team.city,
			};
			dispatch({ type: "ADD_NEW_TEAM", team: entry });
		}
	};

	const handleCreateNew = (e: React.FormEvent) => {
		e.preventDefault();
		if (
			!newName.trim() ||
			!newCoachName.trim() ||
			!newCoachEmail.trim() ||
			!newCoachPhone.trim()
		) {
			return;
		}
		const key = `new_${crypto.randomUUID()}`;
		const entry: TeamEntry = {
			key,
			isNew: true,
			name: newName.trim(),
			coachName: newCoachName.trim(),
			coachEmail: newCoachEmail.trim(),
			coachPhone: newCoachPhone.trim(),
			city: newCity.trim() || undefined,
		};
		dispatch({ type: "ADD_NEW_TEAM", team: entry });
		setNewName("");
		setNewCoachName("");
		setNewCoachEmail("");
		setNewCoachPhone("");
		setNewCity("");
		setShowNewTeamForm(false);
	};

	const removeSelectedTeam = (key: string) => {
		dispatch({ type: "REMOVE_TEAM", key });
	};

	return (
		<div className="space-y-6">
			<div>
				<h3 className="text-lg font-medium">Select Teams</h3>
				<p className="text-sm text-muted-foreground">
					Choose at least 2 teams for your season.
				</p>
			</div>

			<div className="flex flex-wrap gap-2">
				{state.selectedTeams.map((t) => (
					<button
						key={t.key}
						type="button"
						onClick={() => removeSelectedTeam(t.key)}
						className="inline-flex items-center gap-1 rounded-full bg-indigo-500/15 px-3 py-1 text-sm text-indigo-300 transition-colors hover:bg-indigo-500/25"
					>
						{t.name}
						<svg
							className="h-3 w-3"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							aria-hidden="true"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				))}
			</div>

			<div className="space-y-2">
				<Label htmlFor={`${formId}-search`}>Search teams</Label>
				<Input
					id={`${formId}-search`}
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					placeholder="Search by team name..."
				/>
			</div>

			<div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border p-2">
				{filteredTeams.length === 0 ? (
					<p className="py-4 text-center text-sm text-muted-foreground">
						{search
							? "No teams match your search."
							: "No teams yet. Create your first team!"}
					</p>
				) : (
					filteredTeams.map((team) => {
						const selected = isTeamSelected(team._id);
						return (
							<button
								key={team._id}
								type="button"
								onClick={() => toggleTeam(team)}
								className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors ${
									selected
										? "bg-indigo-500/20 text-indigo-200"
										: "text-slate-300 hover:bg-slate-700/50"
								}`}
							>
								<span
									className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
										selected
											? "border-indigo-500 bg-indigo-500"
											: "border-slate-600"
									}`}
								>
									{selected && (
										<svg
											className="h-3 w-3 text-white"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
											aria-hidden="true"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={3}
												d="M5 13l4 4L19 7"
											/>
										</svg>
									)}
								</span>
								<span className="font-medium">{team.name}</span>
								<span className="ml-auto text-xs text-slate-500">
									{team.coachName}
								</span>
							</button>
						);
					})
				)}
			</div>

			{!showNewTeamForm ? (
				<Button
					type="button"
					variant="outline"
					onClick={() => setShowNewTeamForm(true)}
				>
					+ Create New Team
				</Button>
			) : (
				<form
					onSubmit={handleCreateNew}
					className="space-y-3 rounded-lg border p-4"
				>
					<h4 className="text-sm font-medium">New Team</h4>
					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-1">
							<Label htmlFor={`${formId}-newName`}>Team Name *</Label>
							<Input
								id={`${formId}-newName`}
								value={newName}
								onChange={(e) => setNewName(e.target.value)}
								placeholder="Warriors"
								required
							/>
						</div>
						<div className="space-y-1">
							<Label htmlFor={`${formId}-newCity`}>City</Label>
							<Input
								id={`${formId}-newCity`}
								value={newCity}
								onChange={(e) => setNewCity(e.target.value)}
								placeholder="Springfield"
							/>
						</div>
					</div>
					<div className="grid grid-cols-3 gap-3">
						<div className="space-y-1">
							<Label htmlFor={`${formId}-newCoachName`}>Coach *</Label>
							<Input
								id={`${formId}-newCoachName`}
								value={newCoachName}
								onChange={(e) => setNewCoachName(e.target.value)}
								placeholder="Coach Smith"
								required
							/>
						</div>
						<div className="space-y-1">
							<Label htmlFor={`${formId}-newCoachEmail`}>Email *</Label>
							<Input
								id={`${formId}-newCoachEmail`}
								value={newCoachEmail}
								onChange={(e) => setNewCoachEmail(e.target.value)}
								placeholder="coach@example.com"
								type="email"
								required
							/>
						</div>
						<div className="space-y-1">
							<Label htmlFor={`${formId}-newCoachPhone`}>Phone *</Label>
							<Input
								id={`${formId}-newCoachPhone`}
								value={newCoachPhone}
								onChange={(e) => setNewCoachPhone(e.target.value)}
								placeholder="555-0123"
								required
							/>
						</div>
					</div>
					<div className="flex gap-2">
						<Button type="submit" size="sm">
							Add Team
						</Button>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={() => setShowNewTeamForm(false)}
						>
							Cancel
						</Button>
					</div>
				</form>
			)}
		</div>
	);
}
