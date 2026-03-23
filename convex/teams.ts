import { query } from "./_generated/server";
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
