import { query } from "./_generated/server";

export const count = query({
  args: {},
  handler: async (ctx): Promise<number> => {
    const teams = await ctx.db.query("teams").collect();
    return teams.length;
  },
});
