import { useConvexQuery } from "@/hooks/use-convex-query";
import React from "react";

const GroupBalances = ({ balances }) => {
  //  Change line 7 to use your public endpoint version!
  const { data: currentUser } = useConvexQuery(api.users.getCurrentUserPublic);
  if (!balances?.length || !currentUser) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        No balance information available
      </div>
    );
  }

  const me = balances.find((b) => b.id === currentUser._id);

  if (!me) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        You're not part of this group
      </div>
    );
  }

  const userMap = Object.fromEntries(balances.map((b) => [b.id, b]));

  const owedByMembers = me.owedBy
    .map(({ from, amount }) => ({ ...userMap[from], amount }))
    .sort((a, b) => b.amount - a.amount);

  const owingToMembers = me.owes
    .map(({ to, amount }) => ({ ...userMap[to], amount }))
    .sort((a, b) => b.amount - a.amount);

  const isAllSettledUp =
    me.totalBalance === 0 &&
    owedByMembers.length === 0 &&
    owingToMembers.length === 0;

  return (
    <div className="space-y-4">
      <div className="text-center pb-4 border-b">
        <p className="text-sm text-muted-foreground mb-1">Your balance</p>
        <p
  className={`text-2xl font-bold ${
    me.totalBalance > 0
      ? "text-green-600"
      : me.totalBalance < 0
        ? "text-red-600"
        : ""
  }`}
>
          {me.totalBalance > 0
            ? `+$${me.totalBalance.toFixed(2)}`
            : me.totalBalance < 0
              ? `-$${Math.abs(me.totalBalance).toFixed(2)}`
              : "$0.00"}
        </P>
      </div>
    </div>
  );
};

export default GroupBalances;
