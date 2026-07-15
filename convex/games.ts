import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

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
					ctx.db.get(game.team1Id),
					ctx.db.get(game.team2Id),
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
					ctx.db.get(game.team1Id),
					ctx.db.get(game.team2Id),
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
