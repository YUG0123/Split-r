import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { query } from "./_generated/server";
import { getCurrentUser } from "./users";

export const createSettlement = mutation({
  args: {
    amount: v.number(),
    note: v.optional(v.string()),
    paidByUserId: v.id("users"),
    receivedByUserId: v.id("users"),
    groupId: v.optional(v.id("groups")),
    relatedExpenseIds: v.optional(v.array(v.id("expenses"))),
  },
  handler: async (ctx, args) => {
    const caller = await getCurrentUser(ctx);

    if (args.amount <= 0) throw new Error("Amount must be positive");
    if (args.paidByUserId === args.receivedByUserId) {
      throw new Error("Payer and receiver cannot be the same user");
    }
    if (
      caller._id !== args.paidByUserId &&
      caller._id !== args.receivedByUserId
    ) {
      throw new Error("You must be either the payer or the receiver");
    }

    if (args.groupId) {
      const group = await ctx.db.get(args.groupId);
      if (!group) throw new Error("Group not found");

      const isMember = (uid) =>
        (group.members ?? []).some((m) => m.userId === uid);
      if (!isMember(args.paidByUserId) || !isMember(args.receivedByUserId)) {
        throw new Error("Both parties must be members of the group");
      }
    }

    return await ctx.db.insert("settlements", {
      amount: args.amount,
      note: args.note,
      date: Date.now(),
      paidByUserId: args.paidByUserId,
      receivedByUserId: args.receivedByUserId,
      groupId: args.groupId,
      relatedExpenseIds: args.relatedExpenseIds,
      createdBy: caller._id,
    });
  },
});

export const getSettlementData = query({
  args: {
    entityType: v.string(),
    entityId: v.string(),
  },
  handler: async (ctx, args) => {
    const me = await getCurrentUser(ctx);

    if (args.entityType === "user") {
      const other = await ctx.db.get(args.entityId);
      if (!other) throw new Error("User not found");

      const myExpenses = await ctx.db
        .query("expenses")
        .withIndex("by_user_and_group", (q) =>
          q.eq("paidByUserId", me._id).eq("groupId", undefined),
        )
        .collect();

      const otherUserExpenses = await ctx.db
        .query("expenses")
        .withIndex("by_user_and_group", (q) =>
          q.eq("paidByUserId", other._id).eq("groupId", undefined),
        )
        .collect();

      const expenses = [...myExpenses, ...otherUserExpenses];

      let owed = 0;
      let owing = 0;

      for (const exp of expenses) {
        const involvesMe =
          exp.paidByUserId === me._id ||
          (exp.splits ?? []).some((s) => s.userId === me._id);
        const involvesThem =
          exp.paidByUserId === other._id ||
          (exp.splits ?? []).some((s) => s.userId === other._id);
        if (!involvesMe || !involvesThem) continue;

        if (exp.paidByUserId === me._id) {
          const split = (exp.splits ?? []).find(
            (s) => s.userId === other._id && !s.paid,
          );
          if (split) owed += split.amount;
        }

        if (exp.paidByUserId === other._id) {
          const split = (exp.splits ?? []).find(
            (s) => s.userId === me._id && !s.paid,
          );
          if (split) owing += split.amount;
        }
      }

      const mySettlements = await ctx.db
        .query("settlements")
        .withIndex("by_user_and_group", (q) =>
          q.eq("paidByUserId", me._id).eq("groupId", undefined),
        )
        .collect();

      const otherUserSettlements = await ctx.db
        .query("settlements")
        .withIndex("by_user_and_group", (q) =>
          q.eq("paidByUserId", other._id).eq("groupId", undefined),
        )
        .collect();

      const settlements = [...mySettlements, ...otherUserSettlements];

      let netSettlementDiff = 0;
      for (const st of settlements) {
        if (st.paidByUserId === me._id && st.receivedByUserId === other._id) {
          netSettlementDiff += st.amount;
        } else if (
          st.paidByUserId === other._id &&
          st.receivedByUserId === me._id
        ) {
          netSettlementDiff -= st.amount;
        }
      }

      let netBalance = owed - owing + netSettlementDiff;

      return {
        type: "user",
        counterpart: {
          userId: other._id,
          name: other.name,
          email: other.email,
          imageUrl: other.imageUrl,
        },
        youAreOwed: netBalance > 0 ? netBalance : 0,
        youOwe: netBalance < 0 ? Math.abs(netBalance) : 0,
        netBalance: netBalance,
      };
    } else if (args.entityType === "group") {
      const group = await ctx.db.get(args.entityId);
      if (!group) throw new Error("Group not found");

      const isMember = (group.members ?? []).some((m) => m.userId === me._id);
      if (!isMember) throw new Error("You are not a member of this group");

      const expenses = await ctx.db
        .query("expenses")
        .withIndex("by_group", (q) => q.eq("groupId", group._id))
        .collect();

      const balances = {};
      group.members.forEach((m) => {
        if (m.userId !== me._id) balances[m.userId] = { owed: 0, owing: 0 };
      });

      for (const exp of expenses) {
        if (exp.paidByUserId === me._id) {
          (exp.splits ?? []).forEach((split) => {
            if (split.userId !== me._id && !split.paid) {
              balances[split.userId].owed += split.amount;
            }
          });
        } else if (balances[exp.paidByUserId]) {
          const split = (exp.splits ?? []).find(
            (s) => s.userId === me._id && !s.paid,
          );
          if (split) balances[exp.paidByUserId].owing += split.amount;
        }
      }

      const settlements = await ctx.db
        .query("settlements")
        .filter((q) => q.eq(q.field("groupId"), group._id))
        .collect();

      for (const st of settlements) {
        if (st.paidByUserId === me._id && balances[st.receivedByUserId]) {
          let netGroupDiff =
            balances[st.receivedByUserId].owed -
            balances[st.receivedByUserId].owing +
            st.amount;
          balances[st.receivedByUserId].owed =
            netGroupDiff > 0 ? netGroupDiff : 0;
          balances[st.receivedByUserId].owing =
            netGroupDiff < 0 ? Math.abs(netGroupDiff) : 0;
        }
        if (st.receivedByUserId === me._id && balances[st.paidByUserId]) {
          let netGroupDiff =
            balances[st.paidByUserId].owed -
            balances[st.paidByUserId].owing -
            st.amount;
          balances[st.paidByUserId].owed = netGroupDiff > 0 ? netGroupDiff : 0;
          balances[st.paidByUserId].owing =
            netGroupDiff < 0 ? Math.abs(netGroupDiff) : 0;
        }
      }

      const members = await Promise.all(
        Object.keys(balances).map((id) => ctx.db.get(id)),
      );

      const list = Object.keys(balances).map((uid) => {
        const m = members.find((u) => u && u._id === uid);
        const { owed, owing } = balances[uid];
        return {
          userId: uid,
          name: m?.name || "Unknown",
          imageUrl: m?.imageUrl,
          youAreOwed: owed,
          youOwe: owing,
          netBalance: owed - owing,
        };
      });

      return {
        type: "group",
        group: {
          id: group._id,
          name: group.name,
          description: group.description,
        },
        balances: list,
      };
    }
    throw new Error("Invalid entity Type; expected 'user' or 'group'");
  },
});
