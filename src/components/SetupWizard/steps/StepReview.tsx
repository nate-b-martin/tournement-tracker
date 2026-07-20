import { useWizard } from "../SetupWizardContext";

export function StepReview() {
	const { state } = useWizard();
	const { selectedTeams, rosters, season, tournament } = state;

	const totalPlayers = Object.values(rosters).reduce(
		(sum, p) => sum + p.length,
		0,
	);

	const formatDate = (ms: number) => {
		if (!ms) return "—";
		return new Date(ms).toLocaleDateString();
	};

	const bracketLabels: Record<string, string> = {
		single_elimination: "Single Elimination",
		double_elimination: "Double Elimination",
		round_robin: "Round Robin",
	};

	const seedingLabels: Record<string, string> = {
		random: "Random",
		manual: "Manual",
		ranking: "Ranking",
	};

	return (
		<div className="space-y-6">
			<div>
				<h3 className="text-lg font-medium">Review & Create</h3>
				<p className="text-sm text-muted-foreground">
					Review everything before creating your season setup.
				</p>
			</div>

			<SummaryCard title={`Teams (${selectedTeams.length})`}>
				{selectedTeams.length === 0 ? (
					<p className="text-sm text-muted-foreground">No teams selected.</p>
				) : (
					<ul className="space-y-1">
						{selectedTeams.map((team) => {
							const playerCount = (rosters[team.key] || []).length;
							return (
								<li
									key={team.key}
									className="flex items-center justify-between text-sm"
								>
									<span>
										{team.name}
										{team.isNew && (
											<span className="ml-2 text-xs text-emerald-400">
												(new)
											</span>
										)}
									</span>
									<span className="text-xs text-muted-foreground">
										{playerCount} player{playerCount !== 1 ? "s" : ""}
									</span>
								</li>
							);
						})}
					</ul>
				)}
			</SummaryCard>

			<SummaryCard title={`Players (${totalPlayers})`}>
				{totalPlayers === 0 && (
					<p className="text-sm text-muted-foreground">
						No players added. Teams will be created without players.
					</p>
				)}
				{totalPlayers > 0 && (
					<ul className="space-y-1">
						{selectedTeams.map((team) => {
							const players = rosters[team.key] || [];
							if (players.length === 0) return null;
							return (
								<li key={team.key} className="text-sm">
									<span className="font-medium text-muted-foreground">
										{team.name}:
									</span>{" "}
									{players
										.map((p) => `${p.firstName} ${p.lastName}`)
										.join(", ")}
								</li>
							);
						})}
					</ul>
				)}
			</SummaryCard>

			<SummaryCard title="Season">
				<dl className="space-y-1 text-sm">
					<div className="flex justify-between">
						<dt className="text-muted-foreground">Name</dt>
						<dd>{season.name || "—"}</dd>
					</div>
					<div className="flex justify-between">
						<dt className="text-muted-foreground">Sport</dt>
						<dd>{season.sport || "—"}</dd>
					</div>
					<div className="flex justify-between">
						<dt className="text-muted-foreground">Dates</dt>
						<dd>
							{season.startDate ? formatDate(season.startDate) : "—"} –{" "}
							{season.endDate ? formatDate(season.endDate) : "—"}
						</dd>
					</div>
					{season.description && (
						<div className="flex justify-between">
							<dt className="text-muted-foreground">Description</dt>
							<dd className="text-right max-w-[60%] truncate">
								{season.description}
							</dd>
						</div>
					)}
				</dl>
			</SummaryCard>

			<SummaryCard title="Tournament">
				<dl className="space-y-1 text-sm">
					<div className="flex justify-between">
						<dt className="text-muted-foreground">Name</dt>
						<dd>{tournament.name || "—"}</dd>
					</div>
					<div className="flex justify-between">
						<dt className="text-muted-foreground">Location</dt>
						<dd>{tournament.location || "—"}</dd>
					</div>
					<div className="flex justify-between">
						<dt className="text-muted-foreground">Bracket</dt>
						<dd>
							{bracketLabels[tournament.bracketType] || tournament.bracketType}
						</dd>
					</div>
					<div className="flex justify-between">
						<dt className="text-muted-foreground">Seeding</dt>
						<dd>
							{seedingLabels[tournament.seedingType] || tournament.seedingType}
						</dd>
					</div>
					<div className="flex justify-between">
						<dt className="text-muted-foreground">Teams</dt>
						<dd>
							{tournament.minTeams}–{tournament.maxTeams}
						</dd>
					</div>
					<div className="flex justify-between">
						<dt className="text-muted-foreground">Fields</dt>
						<dd>{tournament.fieldsAvailable}</dd>
					</div>
					<div className="flex justify-between">
						<dt className="text-muted-foreground">Game Duration</dt>
						<dd>{tournament.gameDuration} min</dd>
					</div>
					<div className="flex justify-between">
						<dt className="text-muted-foreground">Break</dt>
						<dd>{tournament.breakBetweenGames} min</dd>
					</div>
					{tournament.registrationDeadline && (
						<div className="flex justify-between">
							<dt className="text-muted-foreground">Reg. Deadline</dt>
							<dd>{formatDate(tournament.registrationDeadline)}</dd>
						</div>
					)}
				</dl>
			</SummaryCard>
		</div>
	);
}

function SummaryCard({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) {
	return (
		<div className="rounded-lg border border-slate-700/50 p-4">
			<h4 className="mb-2 text-sm font-medium text-muted-foreground">
				{title}
			</h4>
			{children}
		</div>
	);
}
