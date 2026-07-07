import React from "react";
import Link from "next/link"; // Fixed: Import Link component from Next.js instead of lucide-react icon
import { Users } from "lucide-react";

export const GroupList = ({ groups }) => {
  if (!groups || groups.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-muted-foreground">No groups yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Create a group to start tracking shared expenses
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {groups.map((group) => {
        const balance = group.balance || 0;
        const hasBalance = balance !== 0;

        return (
          <Link
            href={`/groups/${group.id}`} // Fixed: Changed single quotes to backticks for template literal
            key={group.id}
            className="flex items-center justify-between hover:bg-muted p-2 rounded-md transition-colors"
          >
            {/* Fixed: Added missing className attribute */}
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-md">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{group.name}</p>
                <p className="text-xs text-muted-foreground">
                  {group.members?.length || 0} members
                </p>
              </div>
            </div>

            {hasBalance && (
              <span
                className={`text-sm font-medium ${
                  balance > 0 ? "text-green-600" : "text-red-600"
                }`} // Fixed: Changed single quotes to backticks for template literal
              >
                {balance > 0 ? "+" : ""}${Math.abs(balance).toFixed(2)}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
};

export default GroupList;
