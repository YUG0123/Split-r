"use client";
import React from "react";
import { Authenticated } from "convex/react";

const layout = ({ children }) => {
  return (
    <Authenticated>
      {/* Fixed: Added block, clear-both, and w-full to prevent horizontal flex layout leaks */}
      <div className="container mx-auto mt-24 mb-20 w-full block clear-both">
        {children}
      </div>
    </Authenticated>
  );
};

export default layout;
