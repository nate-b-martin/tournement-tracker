import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const listBySeason = query({
  args: { seasonId: v.id("seasons") },
  handler: async (ctx, args) => {
    const seasonTeamsEntries = await ctx.db
      .query("seasonTeams")
      .withIndex("by_seasonId", (q) => q.eq("seasonId", args.seasonId))
      .collect();

    const teams = await Promise.all(
      seasonTeamsEntries.map(async (entry) => {
        const team = await ctx.db.get(entry.teamId);
        return team;
      }),
    );

    return teams.filter((t): t is NonNullable<typeof t> => t !== null);
  },
});

export const addTeams = mutation({
  args: {
    seasonId: v.id("seasons"),
    teamIds: v.array(v.id("teams")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    // Get existing seasonTeams for this season to check duplicates
    const existing = await ctx.db
      .query("seasonTeams")
      .withIndex("by_seasonId", (q) => q.eq("seasonId", args.seasonId))
      .collect();
    const existingTeamIds = new Set(existing.map((e) => e.teamId));

    for (const teamId of args.teamIds) {
      if (!existingTeamIds.has(teamId)) {
        await ctx.db.insert("seasonTeams", {
          seasonId: args.seasonId,
          teamId,
          createdAt: Date.now(),
        });
      }
    }
  },
});

export const removeTeam = mutation({
  args: {
    seasonId: v.id("seasons"),
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const existing = await ctx.db
      .query("seasonTeams")
      .withIndex("by_seasonId", (q) => q.eq("seasonId", args.seasonId))
      .collect();

    const entry = existing.find((e) => e.teamId === args.teamId);
    if (entry) {
      await ctx.db.delete(entry._id);
    }
  },
});
