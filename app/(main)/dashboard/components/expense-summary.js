import React from "react";
// Recharts components for the data visualization
import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
} from "recharts";
// Radix/Shadcn UI Card components (Adjust this import path based on your local directory structure)
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

// Fixed: Accept monthlySpending as a prop instead of importing the server function
export const ExpenseSummary = ({ monthlySpending = [] }) => {
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  // Fixed: Map safely over the incoming prop array
  const chartData =
    monthlySpending?.map((item) => {
      const date = new Date(item.month);
      return {
        name: monthNames[date.getMonth()],
        amount: item.total,
      };
    }) || [];

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  // Added: Define the missing totalSpent variable to prevent a runtime crash
  const totalSpent =
    monthlySpending?.reduce((sum, item) => sum + (item.total || 0), 0) || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expense summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Total this month</p>
            <h3 className="text-2xl font-bold mt-1">
              ${monthlySpending?.[currentMonth]?.total.toFixed(2) || "0.00"}
            </h3>
          </div>

          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Total this year</p>
            <h3 className="text-2xl font-bold mt-1">
              ${totalSpent?.toFixed(2) || "0.00"}
            </h3>
          </div>
        </div>

        <div className="h-64 mt-6">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                formatter={(value) => [`$${value.toFixed(2)}`, "Amount"]}
                labelFormatter={() => "Spending"}
              />
              <Bar dataKey="amount" fill="#36d7b7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">
          Monthly Spending for {currentYear}
        </p>
      </CardContent>
    </Card>
  );
};

export default ExpenseSummary;
