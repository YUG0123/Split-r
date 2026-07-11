"use client";

import { api } from "@/convex/_generated/api";
import { useConvexQuery } from "@/components/ui/hooks/use-convex-query";
import React from "react";
import { useState } from "react";
const ParticipantSelector = ({ participants, onParticipantsChange }) => {
  const { data: currentUser } = useConvexQuery(api.users.getCurrentUserPublic);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { data: searchResults, isLoading } = useConvexQuery(
    api.users.searchUsers,
    { query: searchQuery },
  );

  const addParticipant = (user) => {
    if (participants.some((p) => p.id === user.id)) {
      return;
    }

    onParticipantsChange([...participants, user]);
    setOpen(false);
    setSearchQuery("");
  };

  return <div>ParticipantSelector</div>;
};

export default ParticipantSelector;
