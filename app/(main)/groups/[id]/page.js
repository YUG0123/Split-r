"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { BarLoader } from "react-spinners";
import { ArrowLeft, ArrowLeftRight, PlusCircle, Users } from "lucide-react";

// Convex API Imports
import { api } from "@/convex/_generated/api";
import { useConvexQuery } from "@/components/ui/hooks/use-convex-query";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ExpenseList from "@/components/expense-list";
import SettlementsList from "@/components/settlements-list";
import GroupBalances from "@/components/group-balances";
import GroupMembers from "@/components/group-members"; // Added missing import for group members

const GroupPage = () => {
  const params = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("expenses");

  const { data, isLoading } = useConvexQuery(api.groups.getGroupExpenses, {
    groupId: params.id,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-12 w-full">
        <BarLoader width={"100%"} color="#36d7b7" />
      </div>
    );
  }

  const group = data?.group;
  const members = data?.members || [];
  const expenses = data?.expenses || [];
  const settlements = data?.settlements || [];
  const balances = data?.balances || [];
  const userLookupMap = data?.userLookupMap || {};

  return (
    <div className="container mx-auto py-6 max-w-4xl w-full block">
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
            <div className="bg-primary/10 p-4 rounded-md">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl gradient-title">{group?.name}</h1>
              <p className="text-muted-foreground">{group?.description}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {members.length} members
              </p>
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

      {/* Grid Layout Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 items-start w-full">
        {/* Main Column - Balances & Tabs */}
        <div className="lg:col-span-2 space-y-6 w-full">
          <Card className="w-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Group Balances</CardTitle>
            </CardHeader>
            <CardContent>
              <GroupBalances balances={balances} />
            </CardContent>
          </Card>

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
                showOtherPerson={true}
                isGroupExpense={true} // Swapped from string id to true as standard boolean flag
                userLookupMap={userLookupMap}
              />
            </TabsContent>

            <TabsContent value="settlements" className="space-y-4 w-full block">
              <SettlementsList
                settlements={settlements}
                isGroupSettlement={true}
                userLookupMap={userLookupMap}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar Column - Members List */}
        <div className="w-full">
          <Card className="w-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Group Members</CardTitle>
            </CardHeader>
            <CardContent>
              <GroupMembers members={members} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default GroupPage;
