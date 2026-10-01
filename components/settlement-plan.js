"use client";

import React from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { api } from "@/convex/_generated/api";
import {
  useConvexQuery,
  useConvexMutation,
} from "@/components/ui/hooks/use-convex-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const SettlementPlan = ({ groupId }) => {
  const { data: plan, isLoading } = useConvexQuery(
    api.groups.getGroupSettlementPlan,
    { groupId },
  );
  const { mutate: recordSettlement, isLoading: isRecording } =
    useConvexMutation(api.settlements.createSettlement);

  if (isLoading) return null;

  if (!plan?.length) {
    return (
      <div className="text-center py-4 text-sm text-muted-foreground">
        No settlements needed — everyone's even.
      </div>
    );
  }

  const handleRecord = async (transaction) => {
    const result = await recordSettlement({
      amount: transaction.amount,
      note: "Suggested settlement",
      paidByUserId: transaction.from,
      receivedByUserId: transaction.to,
      groupId,
    });
    if (result) toast.success("Settlement recorded");
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        <Sparkles className="h-3 w-3" />
        Minimum transactions to settle everyone up
      </p>

      {plan.map((t, i) => (
        <div
          key={`${t.from}-${t.to}-${i}`}
          className="flex items-center justify-between gap-2 rounded-md border p-2"
        >
          <div className="flex items-center gap-2 text-sm min-w-0">
            <Avatar className="h-6 w-6 shrink-0">
              <AvatarFallback>{t.fromName?.charAt(0) ?? "?"}</AvatarFallback>
            </Avatar>
            <span className="truncate">{t.fromName}</span>
            <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground" />
            <Avatar className="h-6 w-6 shrink-0">
              <AvatarFallback>{t.toName?.charAt(0) ?? "?"}</AvatarFallback>
            </Avatar>
            <span className="truncate">{t.toName}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="font-medium">${t.amount.toFixed(2)}</span>
            <Button
              size="sm"
              variant="outline"
              disabled={isRecording}
              onClick={() => handleRecord(t)}
            >
              Mark paid
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SettlementPlan;
