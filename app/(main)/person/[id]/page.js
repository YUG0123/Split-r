"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { BarLoader } from "react-spinners";
import { ArrowLeft, ArrowLeftRight, PlusCircle } from "lucide-react";

// Convex API Import
import { api } from "@/convex/_generated/api";
import { useConvexQuery } from "@/components/ui/hooks/use-convex-query";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ExpenseList from "@/components/expense-list";
import SettlementsList from "@/components/settlements-list";

const PersonPage = () => {
  const params = useParams();
  const [activeTab, setActiveTab] = useState("expenses");
  const router = useRouter();

  // Load backend payload
  const { data, isLoading } = useConvexQuery(
    api.expenses.getExpensesBetweenUsers,
    { userId: params.id },
  );

  if (isLoading) {
    return (
      <div className="container mx-auto py-12">
        <BarLoader width={"100%"} color="#36d7b7" />
      </div>
    );
  }

  const otherUser = data?.otherUser;
  const expenses = data?.expenses || [];
  const settlements = data?.settlements || [];
  const balance = data?.balance || 0;

  // Guard against missing users before evaluating IDs or rendering layout
  if (!otherUser) {
    return (
      <div className="container mx-auto py-12 max-w-4xl text-center space-y-4">
        <p className="text-muted-foreground">User profile not found.</p>
        <Button variant="outline" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  // Standardized naming convention: userLookupMap
  const userLookupMap = { [otherUser.id || otherUser._id]: otherUser };

  return (
    <div className="container mx-auto py-6 max-w-4xl w-full">
      <div className="mb-6">
        <Button
          variant="outline"
          size="sm"
          className="mb-4"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-16 w-16">
              <AvatarImage src={otherUser?.imageUrl} />
              <AvatarFallback>
                {otherUser?.name?.charAt(0) || "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-4xl gradient-title">{otherUser?.name}</h1>
              <p className="text-muted-foreground">{otherUser?.email}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href={`/settlements/user/${params.id}`}>
                <ArrowLeftRight className="mr-2 h-4 w-4" />
                Settle up
              </Link>
            </Button>
            <Button asChild>
              <Link href={`/expenses/new`}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add expense
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <Card className="mb-6 w-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <div>
              {balance === 0 ? (
                <p>You are all settled up</p>
              ) : balance > 0 ? (
                <p>
                  <span className="font-medium">{otherUser?.name}</span> owes
                  you
                </p>
              ) : (
                <p>
                  You owe <span className="font-medium">{otherUser?.name}</span>
                </p>
              )}
            </div>
            <div
              className={`text-2xl font-bold ${balance > 0 ? "text-green-600" : balance < 0 ? "text-red-600" : ""}`}
            >
              ${Math.abs(balance).toFixed(2)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Wrapping layout in explicit block element to clear accidental grid rows */}
      <div className="w-full block clear-both mt-6">
        <Tabs
          defaultValue="expenses"
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4 w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="expenses">
              Expenses ({expenses.length})
            </TabsTrigger>
            <TabsTrigger value="settlements">
              Settlements ({settlements.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="expenses" className="space-y-4 w-full block">
            <ExpenseList
              expenses={expenses}
              showOtherPerson={false}
              showOtherPersonId={params.id}
              userLookupMap={userLookupMap}
            />
          </TabsContent>

          <TabsContent value="settlements" className="space-y-4 w-full block">
            <SettlementsList
              settlements={settlements}
              userLookupMap={userLookupMap}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PersonPage;
