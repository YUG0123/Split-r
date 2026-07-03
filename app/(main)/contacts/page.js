"use client";

import React, { useState } from "react"; // Added useState hook import
import Link from "next/link";
import { Plus, Users, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useConvexQuery } from "@/components/ui/hooks/use-convex-query";
import { api } from "@/convex/_generated/api";
import { BarLoader } from "react-spinners";
import CreateGroupModal from "./_components/create-group-modal";
const ContactsPage = () => {
  // 1. Setup modal open/close state tracking
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);

  // 2. Load contacts database payload
  const { data, isLoading } = useConvexQuery(api.contacts.getAllContacts);

  if (isLoading) {
    return (
      <div className="container mx-auto py-12">
        <BarLoader width={"100%"} color="#36d7b7" />
      </div>
    );
  }

  const { users, groups } = data || { users: [], groups: [] };

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-5xl font-bold tracking-tight">Contacts</h1>
        {/* Fixed state setter spelling */}
        <Button onClick={() => setIsCreateGroupModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Group
        </Button>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* People Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center text-gray-800">
            <User className="mr-2 h-5 w-5" />
            People
          </h2>

          {users.length === 0 ? (
            <Card>
              <CardContent className="py-6 text-center text-muted-foreground">
                No contacts yet. Add an expense with someone to see them here.
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-3">
              {users.map((user) => (
                <Link
                  key={user.id}
                  href={`/person/${user.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <img
                    src={user.imageUrl}
                    alt={user.name}
                    className="w-10 h-10 rounded-full bg-gray-200"
                  />
                  <div>
                    <p className="font-semibold">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Groups Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center text-gray-800">
            <Users className="mr-2 h-5 w-5" />
            Groups
          </h2>

          {groups.length === 0 ? (
            <Card>
              <CardContent className="py-6 text-center text-muted-foreground">
                No groups created yet. Create a group to start splitting bills.
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-3">
              {groups.map((group) => (
                <Link
                  key={group.id}
                  href={`/groups/${group.id}`}
                  className="flex flex-col p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <p className="font-semibold text-lg">{group.name}</p>
                  <p className="text-sm text-gray-500 line-clamp-1">
                    {group.description || "No description provided."}
                  </p>
                  <span className="text-xs mt-2 text-green-600 font-medium bg-green-50 px-2 py-1 rounded-md w-max">
                    {group.memberCount} members
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. Mount Mountable Control Interface Modal at root level */}
      <CreateGroupModal
        isOpen={isCreateGroupModalOpen}
        onClose={() => setIsCreateGroupModalOpen(false)}
        onSuccess={(groupId) => routerServerGlobal.push("/groups/${groupId}")}
      />
    </div>
  );
};

export default ContactsPage;
