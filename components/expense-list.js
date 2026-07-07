import { getCategoryIcon } from "@/lib/expense-categories";
import React from "react";
import { format } from "date-fns";
import { useMutation } from "convex/react";
import { useConvexQuery } from "@/components/ui/hooks/use-convex-query";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "./ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";

const ExpenseList = ({
  expenses,
  showOtherPerson = true,
  isGroupExpense = false,
  otherPersonId = null,
  userLookupMap = {}, // Fixed typo spelling from userLoolupMap to userLookupMap
}) => {
  // Pointed safely to your working public query definition
  const { data: currentUser } = useConvexQuery(api.users.getCurrentUserPublic);
  const deleteExpense = useMutation(api.expenses.deleteExpense);

  if (!expenses || !expenses.length) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No expenses found
        </CardContent>
      </Card>
    );
  }

  const getUserDetails = (userId) => {
    return {
      name:
        userId === currentUser?._id
          ? "You"
          : userLookupMap[userId]?.name || "Other User", // Fixed evaluation map target key name
      imageUrl: null,
      id: userId,
    };
  };

  const canDeleteExpense = (expense) => {
    if (!currentUser) return false;
    return (
      expense.createdBy === currentUser._id ||
      expense.paidByUserId === currentUser._id
    );
  };

  const handleDeleteExpense = async (expense) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this expense? This action cannot be undone.",
    );
    if (!confirmed) {
      return;
    }
    try {
      await deleteExpense({ expenseId: expense._id });
      toast.success("Expense deleted successfully");
    } catch (error) {
      toast.error("Failed to delete expense: " + error.message);
    }
  };

  const getCategoryById = (id) => ({ id: id || "general" });

  return (
    <div className="flex flex-col gap-4 w-full">
      {expenses.map((expense) => {
        const payer = getUserDetails(expense.paidByUserId);
        const isCurrentUser = expense.paidByUserId === currentUser?._id;
        const category = getCategoryById(expense.category);

        const categoryIcon = getCategoryIcon(category.id);
        const showDeleteOption = canDeleteExpense(expense);

        return (
          <Card key={expense._id} className="w-full">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    {categoryIcon &&
                      React.createElement(categoryIcon, {
                        className: "h-5 w-5 text-primary",
                      })}
                  </div>

                  <div>
                    <h3 className="font-medium">{expense.description}</h3>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <span>
                        {format(new Date(expense.date), "MMM d, yyyy")}
                      </span>
                      {showOtherPerson && (
                        <>
                          <span>•</span>
                          <span>
                            {isCurrentUser
                              ? "You"
                              : payer?.name || "Other User"}{" "}
                            paid
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-medium">
                      ${expense.amount.toFixed(2)}
                    </div>
                    {isGroupExpense ? (
                      <Badge variant="outline" className="mt-1">
                        Group expense
                      </Badge>
                    ) : (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {isCurrentUser ? (
                          <span className="text-green-600 font-medium">
                            You paid
                          </span>
                        ) : (
                          <span className="text-red-600 font-medium">
                            {payer.name} paid
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {showDeleteOption && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDeleteExpense(expense)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete expense</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Splits Info Badges */}
              {expense.splits && expense.splits.length > 0 && (
                <div className="mt-3 text-sm flex gap-2 flex-wrap border-t pt-3">
                  {expense.splits.map((split, idx) => {
                    const splitUser = getUserDetails(split.userId);
                    const isSplitCurrentUser =
                      split.userId === currentUser?._id;

                    return (
                      <Badge
                        key={idx}
                        variant={split.paid ? "outline" : "secondary"}
                        className="flex items-center gap-1"
                      >
                        <Avatar className="h-4 w-4">
                          <AvatarFallback>
                            {splitUser.name?.charAt(0) || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <span>
                          {isSplitCurrentUser ? "You" : splitUser.name}: $
                          {split.amount.toFixed(2)}
                        </span>
                      </Badge>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ExpenseList;
