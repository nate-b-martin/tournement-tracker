export interface ScheduleConfig {
	startDate: number;
	regularSeasonWeeks: number;
	gameDays: number[];
}

export function computeGameDays(config: ScheduleConfig): number[] {
	const { startDate, regularSeasonWeeks, gameDays } = config;
	const days: number[] = [];
	const MS_PER_DAY = 86400000;
	const MS_PER_WEEK = 7 * MS_PER_DAY;

	const startDayOfWeek = new Date(startDate).getDay();

	for (let week = 0; week < regularSeasonWeeks; week++) {
		const weekStart = startDate + week * MS_PER_WEEK;
		for (const dayOfWeek of gameDays) {
			let diff = dayOfWeek - startDayOfWeek;
			if (diff < 0) diff += 7;
			days.push(weekStart + diff * MS_PER_DAY);
		}
	}

	return days.sort((a, b) => a - b);
}

export interface RoundRobinPairing {
	homeTeamIndex: number;
	awayTeamIndex: number;
}

export function generateRoundRobinPairings(
	teamCount: number,
	scheduleType: "single_round_robin" | "double_round_robin",
): RoundRobinPairing[][] {
	const isOdd = teamCount % 2 !== 0;
	const n = isOdd ? teamCount + 1 : teamCount;
	const totalRounds =
		scheduleType === "single_round_robin" ? n - 1 : 2 * (n - 1);
	const rounds: RoundRobinPairing[][] = [];

	const teams: number[] = [];
	for (let i = 0; i < teamCount; i++) teams.push(i);
	if (isOdd) teams.push(-1);

	const gamesPerRound = n / 2;

	for (let round = 0; round < totalRounds; round++) {
		const roundGames: RoundRobinPairing[] = [];

		for (let g = 0; g < gamesPerRound; g++) {
			const home = teams[g];
			const away = teams[n - 1 - g];

			const shouldSwap =
				scheduleType === "double_round_robin"
					? round >= n - 1
						? round % 2 === 0
						: round % 2 !== 0
					: round % 2 !== 0;

			if (home >= 0 && away >= 0) {
				roundGames.push(
					shouldSwap
						? { homeTeamIndex: away, awayTeamIndex: home }
						: { homeTeamIndex: home, awayTeamIndex: away },
				);
			}
		}

		rounds.push(roundGames);

		if (round < totalRounds - 1) {
			const fixed = teams[0];
			const rotating = teams.slice(1);
			const last = rotating.pop();
			if (last !== undefined) {
				rotating.unshift(last);
			}
			teams[0] = fixed;
			for (let i = 1; i < n; i++) {
				teams[i] = rotating[i - 1];
			}
		}
	}

	return rounds;
}
