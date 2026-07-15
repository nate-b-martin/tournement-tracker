import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Type definitions for our query arguments
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
      teamId: v.optional(v.id("teams")),
    }),
  ),
};

export const count = query({
  args: {},
  handler: async (ctx): Promise<number> => {
    const players = await ctx.db.query("players").collect();
    return players.length;
  },
});

// Purpose: Fetches players with pagination, sorting, and filtering. This is the core function for data tables.
export const list = query({
  args: ListArgs,
  handler: async (ctx, args) => {
    // Get all players first (since we don't have indexes on teamId)
    let players = await ctx.db.query("players").collect();

    // Apply teamId filter
    if (args.filtering?.teamId) {
      players = players.filter(
        (player) => player.teamId === args.filtering!.teamId,
      );
    }

    // Apply text search filter
    if (args.filtering?.search) {
      const searchTerm = args.filtering.search.toLowerCase();
      players = players.filter(
        (player) =>
          player.firstName.toLowerCase().includes(searchTerm) ||
          player.lastName.toLowerCase().includes(searchTerm) ||
          (player.email && player.email.toLowerCase().includes(searchTerm)) ||
          (player.phone && player.phone.includes(searchTerm)),
      );
    }

    // Apply status filter
    if (args.filtering?.status && args.filtering.status.length > 0) {
      players = players.filter((player) =>
        args.filtering!.status!.includes(player.status),
      );
    }

    // Apply sorting
    if (args.sorting) {
      players.sort((a, b) => {
        const { field, direction } = args.sorting!;
        let aValue: any = a[field as keyof typeof a];
        let bValue: any = b[field as keyof typeof b];

        // Handle special cases
        if (field === "fullName") {
          aValue = `${a.firstName} ${a.lastName}`;
          bValue = `${b.firstName} ${b.lastName}`;
        }

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
    const totalCount = players.length;

    // Apply pagination
    if (args.pagination) {
      const { pageIndex, pageSize } = args.pagination;
      const startIndex = pageIndex * pageSize;
      players = players.slice(startIndex, startIndex + pageSize);
    }

    // Fetch team information for each player
    const playersWithTeams = await Promise.all(
      players.map(async (player) => {
        const team = player.teamId ? await ctx.db.get(player.teamId) : null;
        return {
          ...player,
          team,
        };
      }),
    );

    // Return both data and pagination info
    return {
      data: playersWithTeams,
      totalCount,
      hasMore: args.pagination
        ? (args.pagination.pageIndex + 1) * args.pagination.pageSize <
          totalCount
        : false,
    };
  },
});

export const getById = query({
  args: { id: v.id("players") },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.id);
    if (!player) {
      return null;
    }

    // Fetch team information
    const team = player.teamId ? await ctx.db.get(player.teamId) : null;

    return {
      ...player,
      team,
    };
  },
});

export const search = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    const searchTerm = args.query.toLowerCase();
    const players = await ctx.db.query("players").collect();

    const filteredPlayers = players.filter(
      (player) =>
        player.firstName.toLowerCase().includes(searchTerm) ||
        player.lastName.toLowerCase().includes(searchTerm) ||
        (player.email && player.email.toLowerCase().includes(searchTerm)),
    );

    // Fetch team information for search results
    const playersWithTeams = await Promise.all(
      filteredPlayers.map(async (player) => {
        const team = player.teamId ? await ctx.db.get(player.teamId) : null;
        return {
          ...player,
          team,
        };
      }),
    );

    return playersWithTeams;
  },
});

export const countByTeam = query({
	args: { teamId: v.id("teams") },
	handler: async (ctx, args) => {
		const players = await ctx.db.query("players").collect();
		return players.filter((p) => p.teamId === args.teamId).length;
	},
});

export const create = mutation({
  args: {
    teamId: v.optional(v.id("teams")),
    firstName: v.string(),
    lastName: v.string(),
    jerseyNumber: v.optional(v.number()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    birthDate: v.optional(v.number()),
    isCaptain: v.optional(v.boolean()),
    status: v.optional(
      v.union(v.literal("active"), v.literal("inactive"), v.literal("injured")),
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    return await ctx.db.insert("players", {
      ...args,
      userId: identity.subject,
      isCaptain: args.isCaptain ?? false,
      status: args.status ?? "active",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("players"),
    teamId: v.optional(v.id("teams")),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    jerseyNumber: v.optional(v.number()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    birthDate: v.optional(v.number()),
    isCaptain: v.optional(v.boolean()),
    status: v.optional(
      v.union(v.literal("active"), v.literal("inactive"), v.literal("injured")),
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
  args: { id: v.id("players") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    await ctx.db.delete(args.id);
  },
});

export const removeFromTeam = mutation({
  args: { id: v.id("players") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    await ctx.db.patch(args.id, {
      teamId: undefined,
      updatedAt: Date.now(),
    });
  },
});

export const bulkAssignToTeam = mutation({
  args: {
    playerIds: v.array(v.id("players")),
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    for (const playerId of args.playerIds) {
      await ctx.db.patch(playerId, {
        teamId: args.teamId,
        updatedAt: Date.now(),
      });
    }
  },
});
