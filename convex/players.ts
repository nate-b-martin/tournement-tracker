import { query } from "./_generated/server";

export const count = query({
  args: {},
  handler: async (ctx): Promise<number> => {
    const players = await ctx.db.query("players").collect();
    return players.length;
  },
});
