import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

function nextPowerOf2(n: number): number {
	let p = 1;
	while (p < n) p *= 2;
	return p;
}

const ListArgs = {
	pagination: v.optional(
		v.object({
			pageIndex: v.number(),
			pageSize: v.number(),
		}),
	),
	sorting: v.optional(
		v.object({
			field: v.string(),
			direction: v.union(v.literal("asc"), v.literal("desc")),
		}),
	),
	filtering: v.optional(
		v.object({
			status: v.optional(v.array(v.string())),
			round: v.optional(v.number()),
			tournamentId: v.optional(v.id("tournaments")),
		}),
	),
};

export const count = query({
	args: {
		tournamentId: v.optional(v.id("tournaments")),
	},
	handler: async (ctx, args) => {
		let games = await ctx.db.query("games").collect();
		if (args.tournamentId) {
			games = games.filter((g) => g.tournamentId === args.tournamentId);
		}
		return games.length;
	},
});

export const list = query({
	args: ListArgs,
	handler: async (ctx, args) => {
		let games = await ctx.db.query("games").collect();

		if (args.filtering?.tournamentId) {
			games = games.filter(
				(g) => g.tournamentId === args.filtering!.tournamentId,
			);
		}

		if (args.filtering?.status && args.filtering.status.length > 0) {
			games = games.filter((g) =>
				args.filtering!.status!.includes(g.status),
			);
		}

		if (args.filtering?.round !== undefined) {
			games = games.filter((g) => g.round === args.filtering!.round);
		}

		if (args.sorting) {
			games.sort((a, b) => {
				const { field, direction } = args.sorting!;
				let aValue: any = a[field as keyof typeof a];
				let bValue: any = b[field as keyof typeof b];

				if (aValue === undefined && bValue === undefined) return 0;
				if (aValue === undefined) return direction === "asc" ? 1 : -1;
				if (bValue === undefined) return direction === "asc" ? -1 : 1;

				if (aValue < bValue) return direction === "asc" ? -1 : 1;
				if (aValue > bValue) return direction === "asc" ? 1 : -1;
				return 0;
			});
		}

		const gamesWithTeams = await Promise.all(
			games.map(async (game) => {
				const [team1, team2, winner] = await Promise.all([
					game.team1Id ? ctx.db.get(game.team1Id) : null,
					game.team2Id ? ctx.db.get(game.team2Id) : null,
					game.winnerId ? ctx.db.get(game.winnerId) : null,
				]);
				return { ...game, team1, team2, winner };
			}),
		);

		const totalCount = gamesWithTeams.length;

		if (args.pagination) {
			const { pageIndex, pageSize } = args.pagination;
			const startIndex = pageIndex * pageSize;
			return {
				data: gamesWithTeams.slice(startIndex, startIndex + pageSize),
				totalCount,
				hasMore: (pageIndex + 1) * pageSize < totalCount,
			};
		}

		return { data: gamesWithTeams, totalCount, hasMore: false };
	},
});

export const getByTournament = query({
	args: { tournamentId: v.id("tournaments") },
	handler: async (ctx, args) => {
		const games = await ctx.db.query("games").collect();
		const tournamentGames = games.filter(
			(g) => g.tournamentId === args.tournamentId,
		);

		return await Promise.all(
			tournamentGames.map(async (game) => {
				const [team1, team2, winner] = await Promise.all([
					game.team1Id ? ctx.db.get(game.team1Id) : null,
					game.team2Id ? ctx.db.get(game.team2Id) : null,
					game.winnerId ? ctx.db.get(game.winnerId) : null,
				]);
				return { ...game, team1, team2, winner };
			}),
		);
	},
});

export const create = mutation({
	args: {
		tournamentId: v.id("tournaments"),
		round: v.number(),
		gameNumber: v.number(),
		team1Id: v.id("teams"),
		team2Id: v.id("teams"),
		scheduledTime: v.optional(v.number()),
		fieldId: v.optional(v.id("fields")),
		status: v.optional(
			v.union(
				v.literal("scheduled"),
				v.literal("in_progress"),
				v.literal("completed"),
				v.literal("postponed"),
				v.literal("cancelled"),
			),
		),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Unauthorized");

		return await ctx.db.insert("games", {
			...args,
			status: args.status ?? "scheduled",
		});
	},
});

export const update = mutation({
	args: {
		id: v.id("games"),
		team1Score: v.optional(v.number()),
		team2Score: v.optional(v.number()),
		winnerId: v.optional(v.id("teams")),
		status: v.optional(
			v.union(
				v.literal("scheduled"),
				v.literal("in_progress"),
				v.literal("completed"),
				v.literal("postponed"),
				v.literal("cancelled"),
			),
		),
		scheduledTime: v.optional(v.number()),
		actualStartTime: v.optional(v.number()),
		actualEndTime: v.optional(v.number()),
		fieldId: v.optional(v.id("fields")),
		round: v.optional(v.number()),
		gameNumber: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Unauthorized");

		const { id, ...fields } = args;
		await ctx.db.patch(id, fields);
	},
});

export const remove = mutation({
	args: { id: v.id("games") },
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Unauthorized");

		const stats = await ctx.db.query("gameStats").collect();
		const gameStats = stats.filter((s) => s.gameId === args.id);
		for (const stat of gameStats) {
			await ctx.db.delete(stat._id);
		}

		await ctx.db.delete(args.id);
	},
});

function getBracketPositions(n: number): number[] {
	if (n === 2) return [1, 2];
	const half = n / 2;
	const left = getBracketPositions(half);
	const right = getBracketPositions(half);
	const result: number[] = [];
	for (let i = 0; i < half; i++) {
		result.push(left[i]);
		result.push(n + 1 - right[i]);
	}
	return result;
}

export const generateBracket = mutation({
	args: {
		tournamentId: v.id("tournaments"),
		seasonId: v.id("seasons"),
		playoffTeamsCount: v.number(),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Unauthorized");

		const profile = await ctx.db
			.query("userProfiles")
			.withIndex("by_userId", (q) => q.eq("userId", identity.subject))
			.first();
		if (
			!profile ||
			(profile.role !== "admin" && profile.role !== "organizer")
		) {
			throw new Error("Admin or organizer access required");
		}

		const tournament = await ctx.db.get(args.tournamentId);
		if (!tournament) throw new Error("Tournament not found");

		if (tournament.seasonId !== args.seasonId) {
			throw new Error("Tournament is not linked to this season");
		}

		const season = await ctx.db.get(args.seasonId);
		if (!season) throw new Error("Season not found");

		const existingTournamentGames = await ctx.db
			.query("games")
			.collect();
		const gamesToDelete = existingTournamentGames.filter(
			(g) => g.tournamentId === args.tournamentId,
		);
		const hasCompletedTournamentGames = gamesToDelete.some(
			(g) => g.status === "completed",
		);
		if (hasCompletedTournamentGames) {
			throw new Error(
				"Cannot regenerate bracket: tournament already has completed games.",
			);
		}

		const seasonGames = await ctx.db
			.query("seasonGames")
			.withIndex("by_seasonId", (q) => q.eq("seasonId", args.seasonId))
			.collect();

		const completedGames = seasonGames.filter(
			(g) => g.status === "completed",
		);
		if (completedGames.length === 0) {
			throw new Error(
				"No completed games yet. Standings cannot be determined.",
			);
		}

		const seasonTeamsEntries = await ctx.db
			.query("seasonTeams")
			.withIndex("by_seasonId", (q) => q.eq("seasonId", args.seasonId))
			.collect();

		if (seasonTeamsEntries.length < 2) {
			throw new Error("Season must have at least 2 teams");
		}

		const teamMap = new Map<
			string,
			{ name: string; wins: number; gamesPlayed: number; pointsFor: number }
		>();

		for (const entry of seasonTeamsEntries) {
			const team = await ctx.db.get(entry.teamId);
			if (team) {
				teamMap.set(entry.teamId, {
					name: team.name,
					wins: 0,
					gamesPlayed: 0,
					pointsFor: 0,
				});
			}
		}

		for (const game of completedGames) {
			const homeId = game.homeTeamId;
			const awayId = game.awayTeamId;
			const homeScore = game.homeScore ?? 0;
			const awayScore = game.awayScore ?? 0;

			const home = teamMap.get(homeId);
			const away = teamMap.get(awayId);
			if (home && away) {
				home.gamesPlayed++;
				away.gamesPlayed++;
				home.pointsFor += homeScore;
				away.pointsFor += awayScore;
				if (homeScore > awayScore) home.wins++;
				else if (awayScore > homeScore) away.wins++;
			}
		}

		const sortedTeams = [...teamMap.entries()]
			.map(([id, stats]) => ({
				teamId: id,
				...stats,
				winPct: stats.gamesPlayed > 0 ? stats.wins / stats.gamesPlayed : 0,
			}))
			.sort((a, b) => {
				if (b.winPct !== a.winPct) return b.winPct - a.winPct;
				return b.pointsFor - a.pointsFor;
			});

		let playoffCount = Math.min(
			args.playoffTeamsCount,
			sortedTeams.length,
		);
		if (playoffCount < 2) {
			throw new Error("At least 2 teams needed for playoffs");
		}

		const bracketSlots = nextPowerOf2(playoffCount);
		const byes = bracketSlots - playoffCount;
		const playoffTeams = sortedTeams.slice(0, playoffCount);

		for (const game of gamesToDelete) {
			const stats = await ctx.db.query("gameStats").collect();
			const gameStats = stats.filter((s) => s.gameId === game._id);
			for (const stat of gameStats) {
				await ctx.db.delete(stat._id);
			}
			await ctx.db.delete(game._id);
		}

		const MS_PER_DAY = 86400000;
		const seasonGameDays = season.gameDays?.length
			? season.gameDays
			: [1, 3];
		const startDayOfWeek = new Date(season.startDate).getDay();
		const playoffDates: number[] = [];
		const seasonEndDate = season.endDate;
		for (let w = 0; w < 2; w++) {
			const weekStart = seasonEndDate + w * 7 * MS_PER_DAY;
			for (const dayOfWeek of seasonGameDays) {
				let diff = dayOfWeek - startDayOfWeek;
				if (diff < 0) diff += 7;
				playoffDates.push(weekStart + diff * MS_PER_DAY);
			}
		}

		const totalRounds = Math.ceil(Math.log2(bracketSlots));
		const positions = getBracketPositions(bracketSlots);
		let gameNumber = 0;
		let dateIndex = 0;

		const rounds = totalRounds;
		const gamesPerRound: number[] = [];
		for (let r = 0; r < rounds; r++) {
			gamesPerRound.push(Math.pow(2, rounds - r - 1));
		}

		for (let round = 0; round < rounds; round++) {
			const gamesInRound = gamesPerRound[round];
			const roundNum = round + 1;

			for (let g = 0; g < gamesInRound; g++) {
				const posInRound = g;
				if (round === 0) {
					const idx1 = posInRound * 2;
					const idx2 = posInRound * 2 + 1;
					const seed1 = positions[idx1];
					const seed2 = positions[idx2];

					if (seed1 <= playoffTeams.length && seed2 <= playoffTeams.length) {
						const team1 = playoffTeams[seed1 - 1];
						const team2 = playoffTeams[seed2 - 1];
						await ctx.db.insert("games", {
							tournamentId: args.tournamentId,
							round: roundNum,
							gameNumber: gameNumber++,
							team1Id: team1.teamId as any,
							team2Id: team2.teamId as any,
							scheduledTime:
								playoffDates[dateIndex % playoffDates.length],
							status: "scheduled",
						});
						dateIndex++;
					} else if (seed1 <= playoffTeams.length) {
						// seed2 is a bye, seed1 auto-advances (no game)
					} else if (seed2 <= playoffTeams.length) {
						// seed1 is a bye, seed2 auto-advances (no game)
					}
				} else {
					await ctx.db.insert("games", {
						tournamentId: args.tournamentId,
						round: roundNum,
						gameNumber: gameNumber++,
						scheduledTime:
							playoffDates[dateIndex % playoffDates.length],
						status: "scheduled",
					});
					dateIndex++;
				}
			}
		}

		await ctx.db.patch(args.seasonId, {
			regularSeasonComplete: true,
			playoffTeamsCount: playoffCount,
			updatedAt: Date.now(),
		});

		return {
			gamesCreated: gameNumber,
			playoffTeams: playoffCount,
			bracketSlots,
			rounds: totalRounds,
		};
	},
});
