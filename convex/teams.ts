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
      search: v.optional(v.string()),
      status: v.optional(v.array(v.string())),
      tournamentId: v.optional(v.id("tournaments")),
    }),
  ),
};

export const count = query({
  args: {},
  handler: async (ctx): Promise<number> => {
    const teams = await ctx.db.query("teams").collect();
    return teams.length;
  },
});

export const list = query({
  args: ListArgs,
  handler: async (ctx, args) => {
    let teams = await ctx.db.query("teams").collect();

    // Apply tournamentId filter
    if (args.filtering?.tournamentId) {
      teams = teams.filter(
        (team) => team.tournamentId === args.filtering!.tournamentId,
      );
    }

    // Apply text search filter
    if (args.filtering?.search) {
      const searchTerm = args.filtering.search.toLowerCase();
      teams = teams.filter(
        (team) =>
          team.name.toLowerCase().includes(searchTerm) ||
          team.coachName.toLowerCase().includes(searchTerm) ||
          (team.coachEmail && team.coachEmail.toLowerCase().includes(searchTerm)) ||
          (team.organization &&
            team.organization.toLowerCase().includes(searchTerm)),
      );
    }

    // Apply status filter
    if (args.filtering?.status && args.filtering.status.length > 0) {
      teams = teams.filter((team) =>
        args.filtering!.status!.includes(team.status),
      );
    }

    // Apply sorting
    if (args.sorting) {
      teams.sort((a, b) => {
        const { field, direction } = args.sorting!;
        let aValue: any = a[field as keyof typeof a];
        let bValue: any = b[field as keyof typeof b];

        // Handle undefined values
        if (aValue === undefined && bValue === undefined) return 0;
        if (aValue === undefined) return direction === "asc" ? 1 : -1;
        if (bValue === undefined) return direction === "asc" ? -1 : 1;

        if (aValue < bValue) return direction === "asc" ? -1 : 1;
        if (aValue > bValue) return direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    // Get total count before pagination
    const totalCount = teams.length;

    // Fetch player counts for each team
    const allPlayers = await ctx.db.query("players").collect();
    const teamsWithCounts = teams.map((team) => {
      const playerCount = allPlayers.filter(
        (p) => p.teamId === team._id,
      ).length;
      return {
        ...team,
        playerCount,
      };
    });
    teams = teamsWithCounts;

    // Apply pagination
    if (args.pagination) {
      const { pageIndex, pageSize } = args.pagination;
      const startIndex = pageIndex * pageSize;
      teams = teams.slice(startIndex, startIndex + pageSize);
    }

    return {
      teams,
      totalCount,
    };
  },
});

export const create = mutation({
  args: {
    tournamentId: v.id("tournaments"),
    name: v.string(),
    description: v.optional(v.string()),
    coachName: v.string(),
    coachEmail: v.string(),
    coachPhone: v.string(),
    city: v.optional(v.string()),
    homeField: v.optional(v.string()),
    organization: v.optional(v.string()),
    teamAgeGroup: v.optional(v.string()),
    status: v.optional(
      v.union(v.literal("active"), v.literal("inactive"), v.literal("suspended")),
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    return await ctx.db.insert("teams", {
      ...args,
      status: args.status ?? "active",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("teams"),
    tournamentId: v.optional(v.id("tournaments")),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    coachName: v.optional(v.string()),
    coachEmail: v.optional(v.string()),
    coachPhone: v.optional(v.string()),
    city: v.optional(v.string()),
    homeField: v.optional(v.string()),
    organization: v.optional(v.string()),
    teamAgeGroup: v.optional(v.string()),
    status: v.optional(
      v.union(v.literal("active"), v.literal("inactive"), v.literal("suspended")),
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
  args: { id: v.id("teams") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    // Unlink all players on this team
    const players = await ctx.db.query("players").collect();

    const teamPlayers = players.filter((p) => p.teamId === args.id);
    for (const player of teamPlayers) {
      await ctx.db.patch(player._id, { teamId: undefined });
    }

    await ctx.db.delete(args.id);
  },
});
