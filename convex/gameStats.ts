import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getByGame = query({
	args: { gameId: v.id("games") },
	handler: async (ctx, args) => {
		const allStats = await ctx.db.query("gameStats").collect();
		const gameStats = allStats.filter((s) => s.gameId === args.gameId);

		return await Promise.all(
			gameStats.map(async (stat) => {
				const player = await ctx.db.get(stat.playerId);
				return { ...stat, player };
			}),
		);
	},
});

export const getByPlayer = query({
	args: { playerId: v.id("players") },
	handler: async (ctx, args) => {
		const allStats = await ctx.db.query("gameStats").collect();
		const playerStats = allStats.filter(
			(s) => s.playerId === args.playerId,
		);
		return await Promise.all(
			playerStats.map(async (stat) => {
				const game = await ctx.db.get(stat.gameId);
				return { ...stat, game };
			}),
		);
	},
});

export const upsert = mutation({
	args: {
		gameId: v.id("games"),
		playerId: v.id("players"),
		sportType: v.optional(v.string()),
		gamesPlayed: v.optional(v.number()),
		atBats: v.optional(v.number()),
		hits: v.optional(v.number()),
		singles: v.optional(v.number()),
		doubles: v.optional(v.number()),
		triples: v.optional(v.number()),
		homeRuns: v.optional(v.number()),
		rbi: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Unauthorized");

		const { gameId, playerId, ...stats } = args;
		const allStats = await ctx.db.query("gameStats").collect();
		const existing = allStats.find(
			(s) => s.gameId === gameId && s.playerId === playerId,
		);

		if (existing) {
			await ctx.db.patch(existing._id, stats);
			return existing._id;
		}

		return await ctx.db.insert("gameStats", {
			gameId,
			playerId,
			gamesPlayed: stats.gamesPlayed ?? 0,
			atBats: stats.atBats ?? 0,
			hits: stats.hits ?? 0,
			singles: stats.singles ?? 0,
			doubles: stats.doubles ?? 0,
			triples: stats.triples ?? 0,
			homeRuns: stats.homeRuns ?? 0,
			rbi: stats.rbi ?? 0,
			sportType: stats.sportType,
		});
	},
});
