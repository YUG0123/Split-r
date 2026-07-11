import { v } from "convex/values";
import { query } from "./_generated/server";

export const getUsersWithOutstandingDebts = query({
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const result = [];

    // Fetch individual/non-group expenses and settlements
    const expenses = await ctx.db
      .query("expenses")
      .filter((q) => q.eq(q.field("groupId"), undefined))
      .collect();

    const settlements = await ctx.db
      .query("settlements")
      .filter((q) => q.eq(q.field("groupId"), undefined))
      .collect();

    const userCache = new Map();

    const getUser = async (id) => {
      if (!userCache.has(id)) userCache.set(id, await ctx.db.get(id));
      return userCache.get(id);
    };

    // Calculate balances for each user
    for (const user of users) {
      const ledger = new Map();

      // Process Expenses
      for (const exp of expenses) {
        // Case A: somebody else paid, and user appears in splits
        if (exp.paidByUserId !== user._id) {
          const split = exp.splits.find(
            (s) => s.userId === user._id && !s.paid,
          );
          if (!split) continue;

          const entry = ledger.get(exp.paidByUserId) ?? {
            amount: 0,
            since: exp.date,
          };
          entry.amount += split.amount; // user owes
          entry.since = Math.min(entry.since, exp.date);
          ledger.set(exp.paidByUserId, entry);
        } else {
          // Case B: user paid, others appear in splits
          for (const s of exp.splits) {
            if (s.userId === user._id || s.paid) continue;

            const entry = ledger.get(s.userId) ?? {
              amount: 0,
              since: exp.date,
            };
            entry.amount -= s.amount; // others owe user
            ledger.set(s.userId, entry);
          }
        }
      }

      // Process Settlements
      for (const st of settlements) {
        // User paid someone -> reduce positive amount owed to that someone
        if (st.paidByUserId === user._id) {
          const entry = ledger.get(st.receivedByUserId);
          if (entry) {
            entry.amount -= st.amount;
            if (entry.amount === 0) ledger.delete(st.receivedByUserId);
            else ledger.set(st.receivedByUserId, entry);
          }
        }
        // Someone paid the user -> reduce negative balance (they owed user)
        else if (st.receivedByUserId === user._id) {
          const entry = ledger.get(st.paidByUserId);
          if (entry) {
            entry.amount += st.amount;
            if (entry.amount === 0) ledger.delete(st.paidByUserId);
            else ledger.set(st.paidByUserId, entry);
          }
        }
      }

      // 🌟 Exactly as screenshot: Format debts where user owes money
      const debts = [];
      for (const [counterId, { amount, since }] of ledger) {
        if (amount > 0) {
          const counter = await getUser(counterId);
          debts.push({
            userId: counterId,
            name: counter?.name ?? "Unknown",
            amount,
            since,
          });
        }
      }

      // Push final structural object to result if they have unresolved debts
      if (debts.length > 0) {
        result.push({
          _id: user._id,
          name: user.name,
          email: user.email,
          debts,
        });
      }
    }

    return result;
  },
});

// 🌟 Completed: Fetching users alongside their total calculated expense summary
// Get users with expenses for AI insights
export const getUsersWithExpenses = query({
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const result = [];

    // Get current month start
    const now = new Date();
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setMonth(now.getMonth() - 1);
    const monthStart = oneMonthAgo.getTime();

    for (const user of users) {
      const paidExpenses = await ctx.db
        .query("expenses")
        .withIndex("by_date", (q) => q.gte("date", monthStart))
        .filter((q) => q.eq(q.field("paidByUserId"), user._id))
        .collect();

      const allRecentExpenses = await ctx.db
        .query("expenses")
        .withIndex("by_date", (q) => q.gte("date", monthStart))
        .collect();

      const splitExpenses = allRecentExpenses.filter((expense) =>
        expense.splits.some((split) => split.userId === user._id),
      );

      const userExpenses = [...new Set([...paidExpenses, ...splitExpenses])];

      if (userExpenses.length > 0) {
        result.push({
          _id: user._id,
          name: user.name,
          email: user.email,
        });
      }
    }

    return result;
  },
});

export const getUserMonthlyExpenses = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Get current month start
    const now = new Date();
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setMonth(now.getMonth() - 1);
    const monthStart = oneMonthAgo.getTime();

    // Get all expenses involving this user from the past month
    const allExpenses = await ctx.db
      .query("expenses")
      .withIndex("by_date", (q) => q.gte("date", monthStart))
      .collect();

    // Filter for expenses where this user is involved
    const userExpenses = allExpenses.filter((expense) => {
      const isInvolved =
        expense.paidByUserId === args.userId ||
        expense.splits.some((split) => split.userId === args.userId);
      return isInvolved;
    });

    return userExpenses.map((expense) => {
      const userSplit = expense.splits.find(
        (split) => split.userId === args.userId,
      );

      return {
        description: expense.description,
        category: expense.category,
        date: expense.date,
        amount: userSplit ? userSplit.amount : 0,
        isPayer: expense.paidByUserId === args.userId,
        isGroup: expense.groupId !== undefined,
      };
    });
  },
});
