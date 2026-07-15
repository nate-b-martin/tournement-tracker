import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const listBySeason = query({
  args: { seasonId: v.id("seasons") },
  handler: async (ctx, args) => {
    const games = await ctx.db
      .query("seasonGames")
      .withIndex("by_seasonId", (q) => q.eq("seasonId", args.seasonId))
      .collect();

    const gamesWithTeams = await Promise.all(
      games.map(async (game) => {
        const homeTeam = await ctx.db.get(game.homeTeamId);
        const awayTeam = await ctx.db.get(game.awayTeamId);
        return {
          ...game,
          homeTeam,
          awayTeam,
        };
      }),
    );

    return gamesWithTeams;
  },
});

export const create = mutation({
  args: {
    seasonId: v.id("seasons"),
    homeTeamId: v.id("teams"),
    awayTeamId: v.id("teams"),
    scheduledDate: v.number(),
    location: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    return await ctx.db.insert("seasonGames", {
      ...args,
      status: "scheduled",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("seasonGames"),
    homeScore: v.optional(v.number()),
    awayScore: v.optional(v.number()),
    status: v.optional(
      v.union(v.literal("scheduled"), v.literal("completed")),
    ),
    scheduledDate: v.optional(v.number()),
    location: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const { id, ...fields } = args;
    await ctx.db.patch(id, {
      ...fields,
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("seasonGames") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    await ctx.db.delete(args.id);
  },
});
