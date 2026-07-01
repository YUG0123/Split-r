import { useUser } from "@clerk/nextjs";
import { useConvexAuth, useMutation } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "../../../convex/_generated/api"; 

export function useStoreUser() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const { user } = useUser();
  const [userId, setUserId] = useState(null);
  
  // 1. Point this directly to your 'store' mutation
  const storeUser = useMutation(api.users.store);

  useEffect(() => {
    if (!isAuthenticated) return;
    
    async function createUser() {
      // 2. Call it cleanly without passing manual parameters!
      // The backend extracts everything from the secure auth token.
      const id = await storeUser();
      setUserId(id);
    }
    
    createUser();
    return () => setUserId(null);
  }, [isAuthenticated, storeUser, user?.id]);

  return {
    isLoading: isLoading || (isAuthenticated && userId === null),
    isAuthenticated: isAuthenticated && userId !== null,
  };
}