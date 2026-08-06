import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const count = query({
  args: {},
  handler: async (ctx): Promise<number> => {
    const seasons = await ctx.db.query("seasons").collect();
    return seasons.length;
  },
});

export const list = query({
  args: {
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
        search: v.optional(v.string()),
        status: v.optional(v.array(v.string())),
        sport: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    let seasons = await ctx.db.query("seasons").collect();

    if (args.filtering?.search) {
      const term = args.filtering.search.toLowerCase();
      seasons = seasons.filter(
        (s) =>
          s.name.toLowerCase().includes(term) ||
          s.description?.toLowerCase().includes(term),
      );
    }

    if (args.filtering?.status?.length) {
      seasons = seasons.filter((s) =>
        args.filtering!.status!.includes(s.status),
      );
    }

    if (args.filtering?.sport) {
      seasons = seasons.filter((s) => s.sport === args.filtering!.sport);
    }

    if (args.sorting) {
      const { field, direction } = args.sorting;
      seasons.sort((a, b) => {
        const aVal = a[field as keyof typeof a];
        const bVal = b[field as keyof typeof b];
        if (aVal === undefined && bVal === undefined) return 0;
        if (aVal === undefined) return direction === "asc" ? 1 : -1;
        if (bVal === undefined) return direction === "asc" ? -1 : 1;
        return aVal < bVal
          ? direction === "asc"
            ? -1
            : 1
          : aVal > bVal
            ? direction === "asc"
              ? 1
              : -1
            : 0;
      });
    }

    const totalCount = seasons.length;

    if (args.pagination) {
      const { pageIndex, pageSize } = args.pagination;
      seasons = seasons.slice(
        pageIndex * pageSize,
        (pageIndex + 1) * pageSize,
      );
    }

    return { data: seasons, totalCount };
  },
});

export const getById = query({
  args: { id: v.id("seasons") },
  handler: async (ctx, args) => {
    const season = await ctx.db.get(args.id);
    if (!season) return null;

    const seasonTeams = await ctx.db
      .query("seasonTeams")
      .withIndex("by_seasonId", (q) => q.eq("seasonId", args.id))
      .collect();

    return {
      ...season,
      teamCount: seasonTeams.length,
    };
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    sport: v.string(),
    description: v.optional(v.string()),
    startDate: v.number(),
    endDate: v.number(),
    status: v.optional(
      v.union(v.literal("planning"), v.literal("active"), v.literal("complete")),
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    return await ctx.db.insert("seasons", {
      ...args,
      organizerId: identity.subject,
      status: args.status ?? "planning",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("seasons"),
    name: v.optional(v.string()),
    sport: v.optional(v.string()),
    description: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    status: v.optional(
      v.union(v.literal("planning"), v.literal("active"), v.literal("complete")),
    ),
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
  args: { id: v.id("seasons") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    // Delete all seasonTeams for this season
    const seasonTeamsEntries = await ctx.db
      .query("seasonTeams")
      .withIndex("by_seasonId", (q) => q.eq("seasonId", args.id))
      .collect();
    for (const entry of seasonTeamsEntries) {
      await ctx.db.delete(entry._id);
    }

    // Delete all seasonGames for this season
    const seasonGamesEntries = await ctx.db
      .query("seasonGames")
      .withIndex("by_seasonId", (q) => q.eq("seasonId", args.id))
      .collect();
    for (const entry of seasonGamesEntries) {
      await ctx.db.delete(entry._id);
    }

    // Unlink tournaments (set seasonId to undefined)
    const tournaments = await ctx.db.query("tournaments").collect();
    const linkedTournaments = tournaments.filter(
      (t) => t.seasonId === args.id,
    );
    for (const tournament of linkedTournaments) {
      await ctx.db.patch(tournament._id, {
        seasonId: undefined,
        updatedAt: Date.now(),
      });
    }

    await ctx.db.delete(args.id);
  },
});
