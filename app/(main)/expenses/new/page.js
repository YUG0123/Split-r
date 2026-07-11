"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ExpenseForm from "./components/expense-form";
const NewExpensePage = () => {
  const router = useRouter();
  return (
    <div>
      <div>
        <h1 className="container max-w-3xl mx-auto py-6">
          <div className="mb-6">
            <p className="text-muted-foreground mt-1">
              Record a new expense to split with others
            </p>
          </div>
          <Card>
            <CardContent>
              <Tabs defaultValue="individual" className="pb-3">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="individual">
                    Individual Expense
                  </TabsTrigger>
                  <TabsTrigger value="group">Group Expense</TabsTrigger>
                </TabsList>
                <TabsContent value="individual" className="mt-0">
                  <ExpenseForm
                    type="individual"
                    onSuccess={(id) => router.push("/person/${id}")}
                  />
                </TabsContent>
                <TabsContent value="group" className="mt-0">
                  <ExpenseForm
                    type="group"
                    onSuccess={(id) => router.push("/groups/${id}")}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </h1>
      </div>
    </div>
  );
};

export default NewExpensePage;
