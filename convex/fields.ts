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
  args: {
    tournamentId: v.optional(v.id("tournaments")),
  },
  handler: async (ctx, args): Promise<number> => {
    let fields = await ctx.db.query("fields").collect();
    if (args.tournamentId) {
      fields = fields.filter((f) => f.tournamentId === args.tournamentId);
    }
    return fields.length;
  },
});

export const list = query({
  args: ListArgs,
  handler: async (ctx, args) => {
    let fields = await ctx.db.query("fields").collect();

    if (args.filtering?.tournamentId) {
      fields = fields.filter(
        (f) => f.tournamentId === args.filtering!.tournamentId,
      );
    }

    if (args.filtering?.search) {
      const searchTerm = args.filtering.search.toLowerCase();
      fields = fields.filter(
        (f) =>
          f.name.toLowerCase().includes(searchTerm) ||
          (f.location && f.location.toLowerCase().includes(searchTerm)),
      );
    }

    if (args.filtering?.status && args.filtering.status.length > 0) {
      fields = fields.filter((f) =>
        args.filtering!.status!.includes(f.status),
      );
    }

    if (args.sorting) {
      fields.sort((a, b) => {
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

    const totalCount = fields.length;

    if (args.pagination) {
      const { pageIndex, pageSize } = args.pagination;
      const startIndex = pageIndex * pageSize;
      fields = fields.slice(startIndex, startIndex + pageSize);
    }

    return {
      data: fields,
      totalCount,
      hasMore: args.pagination
        ? (args.pagination.pageIndex + 1) * args.pagination.pageSize <
          totalCount
        : false,
    };
  },
});

export const getByTournament = query({
  args: { tournamentId: v.id("tournaments") },
  handler: async (ctx, args) => {
    const fields = await ctx.db.query("fields").collect();
    return fields.filter((f) => f.tournamentId === args.tournamentId);
  },
});

export const listByTournament = query({
  args: { tournamentId: v.id("tournaments") },
  handler: async (ctx, args) => {
    const fields = await ctx.db.query("fields").collect();
    return fields.filter((f) => f.tournamentId === args.tournamentId);
  },
});

export const create = mutation({
  args: {
    tournamentId: v.id("tournaments"),
    name: v.string(),
    location: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("available"),
        v.literal("maintenance"),
        v.literal("unavailable"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    return await ctx.db.insert("fields", {
      ...args,
      status: args.status ?? "available",
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("fields"),
    name: v.optional(v.string()),
    location: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("available"),
        v.literal("maintenance"),
        v.literal("unavailable"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const { id, ...fields } = args;
    await ctx.db.patch(id, fields);
  },
});

export const remove = mutation({
  args: { id: v.id("fields") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const games = await ctx.db.query("games").collect();
    const linkedGames = games.filter((g) => g.fieldId === args.id);
    if (linkedGames.length > 0) {
      throw new Error(
        `Cannot delete field: it is assigned to ${linkedGames.length} game(s). Remove the field from games first.`,
      );
    }

    await ctx.db.delete(args.id);
  },
});
