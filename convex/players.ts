import { query, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";

const MAX_PAGE_SIZE = 100;
const MAX_SEARCH_LENGTH = 100;

async function isViewerAdmin(ctx: QueryCtx): Promise<boolean> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return false;

  const viewerProfile = await ctx.db
    .query("userProfiles")
    .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
    .unique();

  return viewerProfile?.role === "admin";
}

function sanitizeSearchTerm(search?: string): string {
  return (search ?? "").trim().toLowerCase().slice(0, MAX_SEARCH_LENGTH);
}

function clampPagination(
  pagination?: { pageIndex: number; pageSize: number },
): { pageIndex: number; pageSize: number } | undefined {
  if (!pagination) return undefined;

  return {
    pageIndex: Math.max(0, pagination.pageIndex),
    pageSize: Math.min(Math.max(1, pagination.pageSize), MAX_PAGE_SIZE),
  };
}

function redactPlayer<T extends {
  userId?: string;
  email?: string;
  phone?: string;
  birthDate?: number;
}>(player: T, adminView: boolean): T {
  if (adminView) {
    return player;
  }

  return {
    ...player,
    userId: undefined,
    email: undefined,
    phone: undefined,
    birthDate: undefined,
  };
}

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
    const adminView = await isViewerAdmin(ctx);

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
      const searchTerm = sanitizeSearchTerm(args.filtering.search);
      if (!searchTerm) {
        players = [];
      }

      players = players.filter(
        (player) =>
          player.firstName.toLowerCase().includes(searchTerm) ||
          player.lastName.toLowerCase().includes(searchTerm) ||
          (adminView &&
            ((player.email && player.email.toLowerCase().includes(searchTerm)) ||
              (player.phone && player.phone.includes(searchTerm)))),
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
    const normalizedPagination = clampPagination(args.pagination);
    if (normalizedPagination) {
      const { pageIndex, pageSize } = normalizedPagination;
      const startIndex = pageIndex * pageSize;
      players = players.slice(startIndex, startIndex + pageSize);
    }

    // Fetch team information for each player
    const playersWithTeams = await Promise.all(
      players.map(async (player) => {
        const team = await ctx.db.get(player.teamId);
        return {
          ...redactPlayer(player, adminView),
          team,
        };
      }),
    );

    // Return both data and pagination info
    return {
      data: playersWithTeams,
      totalCount,
      hasMore: normalizedPagination
        ? (normalizedPagination.pageIndex + 1) * normalizedPagination.pageSize <
          totalCount
        : false,
    };
  },
});

export const getById = query({
  args: { id: v.id("players") },
  handler: async (ctx, args) => {
    const adminView = await isViewerAdmin(ctx);

    const player = await ctx.db.get(args.id);
    if (!player) {
      return null;
    }

    // Fetch team information
    const team = await ctx.db.get(player.teamId);

    return {
      ...redactPlayer(player, adminView),
      team,
    };
  },
});

export const search = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    const adminView = await isViewerAdmin(ctx);
    const searchTerm = sanitizeSearchTerm(args.query);
    if (!searchTerm) {
      return [];
    }

    const players = await ctx.db.query("players").collect();

    const filteredPlayers = players.filter(
      (player) =>
        player.firstName.toLowerCase().includes(searchTerm) ||
        player.lastName.toLowerCase().includes(searchTerm) ||
        (adminView && player.email && player.email.toLowerCase().includes(searchTerm)),
    );

    // Fetch team information for search results
    const playersWithTeams = await Promise.all(
      filteredPlayers.map(async (player) => {
        const team = await ctx.db.get(player.teamId);
        return {
          ...redactPlayer(player, adminView),
          team,
        };
      }),
    );

    return playersWithTeams.slice(0, 50);
  },
});
