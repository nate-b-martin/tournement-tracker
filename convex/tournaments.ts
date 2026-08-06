import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const count = query({
  args: {},
  handler: async (ctx): Promise<number> => {
    const tournaments = await ctx.db.query("tournaments").collect();
    return tournaments.length;
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
    let tournaments = await ctx.db.query("tournaments").collect();

    if (args.filtering?.search) {
      const term = args.filtering.search.toLowerCase();
      tournaments = tournaments.filter(
        (t) =>
          t.name.toLowerCase().includes(term) ||
          t.description?.toLowerCase().includes(term) ||
          t.location?.toLowerCase().includes(term),
      );
    }

    if (args.filtering?.status?.length) {
      tournaments = tournaments.filter((t) =>
        args.filtering!.status!.includes(t.status),
      );
    }

    if (args.filtering?.sport) {
      tournaments = tournaments.filter(
        (t) => t.sport === args.filtering!.sport,
      );
    }

    if (args.sorting) {
      const { field, direction } = args.sorting;
      tournaments.sort((a, b) => {
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

    const totalCount = tournaments.length;

    if (args.pagination) {
      const { pageIndex, pageSize } = args.pagination;
      tournaments = tournaments.slice(
        pageIndex * pageSize,
        (pageIndex + 1) * pageSize,
      );
    }

    return { data: tournaments, totalCount };
  },
});

export const getById = query({
  args: { id: v.id("tournaments") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getBySeasonId = query({
  args: { seasonId: v.id("seasons") },
  handler: async (ctx, args) => {
    const tournaments = await ctx.db.query("tournaments").collect();
    return tournaments.find((t) => t.seasonId === args.seasonId) || null;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    sport: v.string(),
    location: v.string(),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    registrationDeadline: v.optional(v.number()),
    maxTeams: v.number(),
    minTeams: v.number(),
    bracketType: v.union(
      v.literal("single_elimination"),
      v.literal("double_elimination"),
      v.literal("round_robin"),
    ),
    fieldsAvailable: v.number(),
    gameDuration: v.number(),
    breakBetweenGames: v.number(),
    seedingType: v.union(
      v.literal("random"),
      v.literal("manual"),
      v.literal("ranking"),
    ),
    seasonId: v.optional(v.id("seasons")),
    gameFormatRules: v.optional(v.any()),
    status: v.optional(
      v.union(
        v.literal("draft"),
        v.literal("registration_open"),
        v.literal("registration_closed"),
        v.literal("active"),
        v.literal("complete"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    return await ctx.db.insert("tournaments", {
      ...args,
      organizerId: identity.subject,
      currentTeamCount: 0,
      status: args.status ?? "draft",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("tournaments"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    sport: v.optional(v.string()),
    location: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    registrationDeadline: v.optional(v.number()),
    maxTeams: v.optional(v.number()),
    minTeams: v.optional(v.number()),
    bracketType: v.optional(
      v.union(
        v.literal("single_elimination"),
        v.literal("double_elimination"),
        v.literal("round_robin"),
      ),
    ),
    fieldsAvailable: v.optional(v.number()),
    gameDuration: v.optional(v.number()),
    breakBetweenGames: v.optional(v.number()),
    seedingType: v.optional(
      v.union(v.literal("random"), v.literal("manual"), v.literal("ranking")),
    ),
    seasonId: v.optional(v.id("seasons")),
    gameFormatRules: v.optional(v.any()),
    status: v.optional(
      v.union(
        v.literal("draft"),
        v.literal("registration_open"),
        v.literal("registration_closed"),
        v.literal("active"),
        v.literal("complete"),
      ),
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
  args: { id: v.id("tournaments") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    await ctx.db.delete(args.id);
  },
});
