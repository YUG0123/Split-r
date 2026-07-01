"use client";
import React from "react";
import { Authenticated } from "convex/react";
const layout = ({ children }) => {
  return (
    <Authenticated>
      <div className="container mx-auto mt-24 mb-20">{children}</div>
    </Authenticated>
  );
};

export default layout;
