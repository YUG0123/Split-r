import { query } from "./_generated/server";
import { internal } from "./_generated/api";
export const getAllContacts = query({
  handler: async (ctx) => {
    const currentUser = await ctx.runQuery(internal.users.getCurrentUser);
    const expensesYoupaid = await ctx.db.query("expenses");
  },
});
